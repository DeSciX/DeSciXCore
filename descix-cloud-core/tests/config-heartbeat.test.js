/**
 * Anti-regression: heartbeat default-configs getter (WS-CONFIG-BOOTSTRAP-FIX item #11).
 *
 * Coverage:
 *  2.B.1 (dev file-watcher):
 *   - When DEPLOY_ENV='dev' and we edit defaults-config.json, the singleton's
 *     property updates within ~500ms.
 *   - 'config:reloaded' event fires with the changed keys list.
 *   - The watcher is NOT armed when DEPLOY_ENV !== 'dev'.
 *
 *  2.B.3 (boot-time SHA + drift check):
 *   - After boot, editing defaults-config.json + calling checkDefaultsDrift()
 *     emits the canonical WARN log line containing 'on-disk SHA changed since boot'.
 *   - checkDefaultsDrift() is a no-op (no log) when content is unchanged.
 *   - sampleDriftCheck() fires checkDefaultsDrift() every Nth call.
 *
 * Run: `node --test tests/config-heartbeat.test.js` from descix-cloud-core/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';

import {
    createCloudConfig,
    _resetCloudConfigForTests,
} from '../src/config.js';

function fullDefaults(overrides = {}) {
    return {
        INTELLIGENCE_LEVELS: { "2": { label: "Standard", model: "gemini-3.1-flash-lite" } },
        DEFAULT_AI_MODEL: "gemini-3.1-flash-lite",
        DEFAULT_INTELLIGENCE_LEVEL: "2",
        PINECONE_INDEX_NAME: "descix-dev",
        PINECONE_API_KEY: "test-pc-key",
        PINECONE_NAMESPACE_MODE: "community_id",
        PLATFORM_DEFAULT_CHAIN: "polygon",
        FIRESTORE_DATABASE_ID: "descix-dev",
        GOOGLE_PROJECT_ID: "test-project",
        GEMINI_API_KEY: "test-gemini-key",
        STORAGE_BUCKET: "test-bucket",
        ...overrides,
    };
}

async function mkConfigDir(t, defaults) {
    const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'cloud-core-heartbeat-'));
    await fsp.writeFile(
        path.join(dir, 'defaults-config.json'),
        JSON.stringify(defaults, null, 2),
    );
    t.after(async () => {
        _resetCloudConfigForTests();
        await fsp.rm(dir, { recursive: true, force: true });
    });
    return dir;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Capture console output (log + warn) for assertion. Restores on `t.after`.
 */
function captureConsole(t) {
    const out = [];
    const origLog = console.log;
    const origWarn = console.warn;
    console.log = (...args) => out.push({ stream: 'log', msg: args.join(' ') });
    console.warn = (...args) => out.push({ stream: 'warn', msg: args.join(' ') });
    t.after(() => {
        console.log = origLog;
        console.warn = origWarn;
    });
    return out;
}

test('2.B.3: checkDefaultsDrift logs canonical WARN when on-disk SHA changes after boot', async (t) => {
    const dir = await mkConfigDir(t, fullDefaults());
    _resetCloudConfigForTests();

    const cfg = createCloudConfig({ rootPath: dir });
    // Boot SHA must be set after _loadDefaults completes in the constructor.
    const bootSha = cfg.__defaults_config_sha;
    assert.ok(bootSha, 'boot SHA must be captured by _loadDefaults');

    // Mutate the file on disk (simulate operator editing defaults-config.json mid-flight)
    const updated = fullDefaults({ DEFAULT_AI_MODEL: 'gemini-fake-mutation' });
    await fsp.writeFile(path.join(dir, 'defaults-config.json'), JSON.stringify(updated, null, 2));

    const out = captureConsole(t);
    cfg.checkDefaultsDrift();

    const driftWarn = out.find(e => e.stream === 'warn' && /on-disk SHA changed since boot/.test(e.msg));
    assert.ok(driftWarn, `expected drift WARN. captured: ${JSON.stringify(out)}`);
    assert.match(driftWarn.msg, /restart to pick up changes/);
});

test('2.B.3: checkDefaultsDrift is a no-op when content is unchanged', async (t) => {
    const dir = await mkConfigDir(t, fullDefaults());
    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir });

    const out = captureConsole(t);
    cfg.checkDefaultsDrift();
    const driftWarn = out.find(e => /on-disk SHA changed since boot/.test(e.msg));
    assert.equal(driftWarn, undefined, 'no drift warning expected when content unchanged');
});

test('2.B.3: sampleDriftCheck triggers checkDefaultsDrift every Nth call', async (t) => {
    const dir = await mkConfigDir(t, fullDefaults());
    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir });

    // Mutate file so any checkDefaultsDrift will trigger a warn.
    await fsp.writeFile(
        path.join(dir, 'defaults-config.json'),
        JSON.stringify(fullDefaults({ DEFAULT_AI_MODEL: 'gemini-fake' }), null, 2),
    );

    // Force the sampling N to a small value so the test runs fast.
    cfg.__drift_sample_n = 5;
    cfg.__drift_check_counter = 0;

    const out = captureConsole(t);
    // 4 calls — no drift check yet (counter rolls 1→2→3→4)
    for (let i = 0; i < 4; i++) cfg.sampleDriftCheck();
    let warns = out.filter(e => /on-disk SHA changed since boot/.test(e.msg));
    assert.equal(warns.length, 0, `expected no warns yet, got: ${warns.length}`);

    // 5th call — counter rolls to 0, drift check fires
    cfg.sampleDriftCheck();
    warns = out.filter(e => /on-disk SHA changed since boot/.test(e.msg));
    assert.equal(warns.length, 1, `expected exactly 1 warn after 5th sample, got: ${warns.length}`);
});

test('2.B.1: dev file-watcher hot-reloads changed keys + emits config:reloaded', async (t) => {
    const dir = await mkConfigDir(t, fullDefaults());
    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir });

    // Force dev mode + arm the watcher directly (we are not running full initialize()).
    cfg.DEPLOY_ENV = 'dev';
    // Speed up debounce for the test.
    cfg.__watch_debounce_ms = 50;
    cfg._startConfigWatcher();
    assert.ok(cfg.__watcher, 'watcher must be armed in dev mode');
    t.after(() => {
        if (cfg.__watcher) {
            cfg.__watcher.close();
            cfg.__watcher = null;
        }
    });

    const originalModel = cfg.DEFAULT_AI_MODEL;
    assert.equal(originalModel, 'gemini-3.1-flash-lite');

    // Subscribe to event
    let eventPayload = null;
    cfg.on('config:reloaded', (p) => { eventPayload = p; });

    // Mutate file on disk
    await fsp.writeFile(
        path.join(dir, 'defaults-config.json'),
        JSON.stringify(fullDefaults({ DEFAULT_AI_MODEL: 'gemini-hot-reload-target' }), null, 2),
    );

    // Wait for debounce + read (debounce=50ms set above, so 500ms is plenty).
    const deadline = Date.now() + 1500;
    while (Date.now() < deadline) {
        if (cfg.DEFAULT_AI_MODEL === 'gemini-hot-reload-target') break;
        await sleep(25);
    }

    assert.equal(cfg.DEFAULT_AI_MODEL, 'gemini-hot-reload-target', 'singleton must reflect on-disk change after watcher fires');
    assert.ok(eventPayload, 'config:reloaded event must fire');
    assert.ok(Array.isArray(eventPayload.changedKeys), 'event payload must include changedKeys array');
    assert.ok(eventPayload.changedKeys.includes('DEFAULT_AI_MODEL'), `changedKeys must include DEFAULT_AI_MODEL, got: ${JSON.stringify(eventPayload.changedKeys)}`);
});

test('2.B.1: watcher is NOT armed when DEPLOY_ENV !== dev', async (t) => {
    const dir = await mkConfigDir(t, fullDefaults());
    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir });

    // Default DEPLOY_ENV is undefined here (no .env loaded with tests).
    cfg.DEPLOY_ENV = 'production';
    cfg._startConfigWatcher();
    assert.equal(cfg.__watcher, null, 'watcher must NOT be armed outside dev');
});
