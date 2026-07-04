/**
 * WS-CONFIG-ARCH Phase 1 — per-env defaults layer + CORE_API_URL precedence.
 *
 * Proves:
 *  (a) defaults-config-{env}.json WINS over the env-invariant defaults-config.json
 *      (first-write-wins: env layer loads first in the constructor). With
 *      DEPLOY_ENV=prod, CORE_API_URL resolves to the PROD value, NOT the dev
 *      localhost value — the fix for the prod airdrop ECONNREFUSED 127.0.0.1:4000.
 *  (b) When CORE_API_URL is absent from ALL sources, a service that declares it via
 *      createCloudConfig({ additionalRequiredKeys: ['CORE_API_URL'] }) hard-fails at
 *      _assertRequiredKeys with CloudConfigFatalError (no hardcoded fallback —
 *      anti-pattern #7 / feedback_no_hardcoded_fallbacks).
 *  (c) Regression: the env layer is a no-op when DEPLOY_ENV is unset (no hardcoded
 *      env guess), and when no per-env file exists the base defaults-config.json
 *      still supplies values.
 *
 * Design mirrors required-keys-anti-regression.test.js: construct CloudConfig with a
 * temp-dir rootPath and exercise the private bootstrap methods directly (no network /
 * Secret Manager). DEPLOY_ENV is provided via process.env, restored in t.after.
 *
 * Run: `node --test tests/per-env-defaults.test.js` from descix-cloud-core/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';

import {
    createCloudConfig,
    CloudConfigFatalError,
    _resetCloudConfigForTests,
} from '../src/config.js';

/**
 * Write a base defaults-config.json plus optional per-env files into a temp dir.
 * envFiles: { dev: {...}, demo: {...}, prod: {...} } — each written as
 * defaults-config-<env>.json. Restores process.env.DEPLOY_ENV after the test.
 */
async function mkConfigDir(t, base, envFiles = {}) {
    const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'cloud-core-per-env-'));
    await fsp.writeFile(path.join(dir, 'defaults-config.json'), JSON.stringify(base, null, 2));
    for (const [env, payload] of Object.entries(envFiles)) {
        await fsp.writeFile(path.join(dir, `defaults-config-${env}.json`), JSON.stringify(payload, null, 2));
    }
    const prevDeployEnv = process.env.DEPLOY_ENV;
    t.after(async () => {
        _resetCloudConfigForTests();
        if (prevDeployEnv === undefined) delete process.env.DEPLOY_ENV;
        else process.env.DEPLOY_ENV = prevDeployEnv;
        await fsp.rm(dir, { recursive: true, force: true });
    });
    return dir;
}

test('(a) prod env layer WINS — CORE_API_URL resolves to prod value, NOT localhost', async (t) => {
    // Base file carries the dev localhost value (simulating the OLD bug state).
    // The prod env layer must override it because it loads first (first-write-wins).
    const base = { CORE_API_URL: 'https://localhost:4000/apifront' };
    const envFiles = {
        dev: { CORE_API_URL: 'https://localhost:4000/apifront' },
        demo: { CORE_API_URL: 'https://demo.descix.net/apifront' },
        prod: { CORE_API_URL: 'https://descix.net/apifront' },
    };
    process.env.DEPLOY_ENV = 'prod';
    const dir = await mkConfigDir(t, base, envFiles);

    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir });

    assert.equal(
        cfg.CORE_API_URL,
        'https://descix.net/apifront',
        'prod must resolve to the prod apifront, not the base localhost value',
    );
    assert.doesNotMatch(
        cfg.CORE_API_URL,
        /localhost|127\.0\.0\.1/,
        'prod CORE_API_URL must NOT be a localhost/loopback address (the ECONNREFUSED root cause)',
    );
});

test('(a2) demo env layer resolves to demo value', async (t) => {
    const base = { CORE_API_URL: 'https://localhost:4000/apifront' };
    const envFiles = { demo: { CORE_API_URL: 'https://demo.descix.net/apifront' } };
    process.env.DEPLOY_ENV = 'demo';
    const dir = await mkConfigDir(t, base, envFiles);

    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir });
    assert.equal(cfg.CORE_API_URL, 'https://demo.descix.net/apifront');
});

test('(b) missing CORE_API_URL in ALL sources hard-fails for a service that requires it', async (t) => {
    // No CORE_API_URL anywhere; prod env file omits it; base omits it.
    const base = { CORE_API_URL: null };
    const envFiles = { prod: { /* no CORE_API_URL */ } };
    process.env.DEPLOY_ENV = 'prod';
    const dir = await mkConfigDir(t, base, envFiles);

    _resetCloudConfigForTests();
    // Powch declares CORE_API_URL as a per-service required key.
    const cfg = createCloudConfig({ rootPath: dir, additionalRequiredKeys: ['CORE_API_URL'] });

    assert.throws(
        () => cfg._assertRequiredKeys(),
        (err) => {
            assert.ok(err instanceof CloudConfigFatalError, `expected CloudConfigFatalError, got ${err.constructor.name}`);
            assert.match(err.message, /CORE_API_URL/, 'message must name the missing required key');
            assert.match(err.message, /required keys are unset after bootstrap/);
            return true;
        },
    );
});

test('(b2) additionalRequiredKeys does NOT throw when the value IS provided by the env layer', async (t) => {
    // Provide the full shared-schema required set in the base so the ONLY variable
    // under test is the per-service CORE_API_URL (supplied by the prod env layer).
    const base = {
        INTELLIGENCE_LEVELS: { "2": { label: "Standard", model: "gemini-3.1-flash-lite" } },
        DEFAULT_AI_MODEL: "gemini-3.1-flash-lite",
        DEFAULT_INTELLIGENCE_LEVEL: "2",
        PINECONE_INDEX_NAME: "descix-prod",
        PINECONE_API_KEY: "test-pc-key",
        PLATFORM_DEFAULT_CHAIN: "polygon",
        FIRESTORE_DATABASE_ID: "(default)",
        GOOGLE_PROJECT_ID: "descix",
        GEMINI_API_KEY: "test-gemini-key",
        STORAGE_BUCKET: "test-bucket",
        CORE_API_URL: null,
    };
    const envFiles = { prod: { CORE_API_URL: 'https://descix.net/apifront' } };
    process.env.DEPLOY_ENV = 'prod';
    const dir = await mkConfigDir(t, base, envFiles);

    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir, additionalRequiredKeys: ['CORE_API_URL'] });
    assert.doesNotThrow(() => cfg._assertRequiredKeys());
    assert.equal(cfg.CORE_API_URL, 'https://descix.net/apifront');
});

test('(c) env layer is a no-op when DEPLOY_ENV is unset (no hardcoded env guess)', async (t) => {
    const base = { CORE_API_URL: 'https://localhost:4000/apifront' };
    const envFiles = { prod: { CORE_API_URL: 'https://descix.net/apifront' } };
    delete process.env.DEPLOY_ENV; // restored by mkConfigDir t.after
    const dir = await mkConfigDir(t, base, envFiles);

    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir });
    // With no DEPLOY_ENV, _loadEnvDefaults short-circuits; base value applies.
    assert.equal(cfg.CORE_API_URL, 'https://localhost:4000/apifront');
});

test('(c2) base defaults-config.json still supplies values when no per-env file exists', async (t) => {
    const base = { CORE_API_URL: 'https://localhost:4000/apifront' };
    process.env.DEPLOY_ENV = 'prod'; // but no defaults-config-prod.json written
    const dir = await mkConfigDir(t, base, {});

    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir });
    assert.equal(cfg.CORE_API_URL, 'https://localhost:4000/apifront');
});
