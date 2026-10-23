/**
 * Local-only config keys (config-schema.json local_only_keys) — e.g. LOCAL_VERIFICATION_CODE_SINK.
 *
 * A local-only key is admitted ONLY from dev-overrides.json on a developer machine
 * (isManagedCloudRuntime === false). Every other layer refuses it at boot naming the key and the
 * layer; a managed cloud runtime (GAE_ENV / GAE_SERVICE / K_SERVICE, injected by the platform)
 * holding one refuses the boot naming the key, never the value.
 *
 * Every boot runs the REAL createCloudConfig + initialize() in a CHILD process
 * (tests/helpers/local-only-keys-boot.mjs), never against this process's config singleton.
 *
 * Run: `node --test tests/local-only-keys.test.js` from descix-cloud-core/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { LOCAL_ONLY_CONFIG_KEYS } from '../src/config.js';

const require = createRequire(import.meta.url);
const schema = require('../config-schema.json');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHILD = path.join(HERE, 'helpers', 'local-only-keys-boot.mjs');
const KEY = 'LOCAL_VERIFICATION_CODE_SINK';
const SINK = '/fixture/sink/SENTINEL-SINK-PATH-7c2d.jsonl';

const STRIP = ['GAE_ENV', 'GAE_SERVICE', 'K_SERVICE', 'DEPLOY_ENV', 'DEBUG_LOCAL', 'CONFIG_SECRET_NAME',
    'CONFIG_SECRET_VERSION', 'GEMINI_API_KEY', 'MESH_CTX_VERIFY_MODE', 'PORT', 'LOCAL_PORT', KEY];

/** Boot a service root in a child process. files: { name: object }, env: extra process env. */
async function boot(t, { files = {}, blob = {}, env = {} } = {}) {
    const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'cloud-core-localonly-'));
    t.after(() => fsp.rm(dir, { recursive: true, force: true }));
    const all = { 'defaults-config.json': { FIRESTORE_DATABASE_ID: 'fixture-db', LOCAL_PORT: 4999 }, ...files };
    for (const [name, body] of Object.entries(all)) {
        await fsp.writeFile(path.join(dir, name), JSON.stringify(body));
    }
    const childEnv = { ...process.env };
    for (const k of STRIP) delete childEnv[k];
    Object.assign(childEnv, {
        DEPLOY_ENV: 'dev', CONFIG_SECRET_NAME: 'descix_config_fixture', CONFIG_SECRET_VERSION: 'latest',
        GOOGLE_CLOUD_PROJECT: 'fixture-project',
    }, env);
    const stdout = execFileSync(process.execPath, [CHILD, dir, JSON.stringify(blob)], { env: childEnv, encoding: 'utf8' });
    const line = stdout.split('\n').find((l) => l.startsWith('@@RESULT '));
    assert.ok(line, `the child printed no result:\n${stdout}`);
    return JSON.parse(line.slice('@@RESULT '.length));
}

function assertRefused(r, ...mustName) {
    assert.equal(r.ok, false, `boot must refuse, got ${JSON.stringify(r)}`);
    assert.equal(r.name, 'CloudConfigFatalError');
    for (const s of mustName) assert.ok(r.message.includes(s), `message must name ${s}: ${r.message}`);
    assert.ok(!r.message.includes(SINK), 'the refusal must not echo the value');
}

test('schema: LOCAL_VERIFICATION_CODE_SINK is local-only, and no local-only key is read from process.env', () => {
    assert.deepEqual([...LOCAL_ONLY_CONFIG_KEYS], schema.local_only_keys.keys);
    assert.ok(LOCAL_ONLY_CONFIG_KEYS.includes(KEY));
    for (const k of LOCAL_ONLY_CONFIG_KEYS) {
        assert.ok(!schema.bootstrap_keys.keys.includes(k), `${k} must not be a bootstrap key`);
        assert.ok(!schema.dev_override_keys.keys.includes(k), `${k} must not be a dev_override key`);
    }
});

test('developer machine + dev-overrides.json key: the boot admits it', async (t) => {
    const r = await boot(t, { files: { 'dev-overrides.json': { [KEY]: SINK } } });
    assert.deepEqual(r, { ok: true, sink: SINK, managed: false });
});

test('developer machine without the key: no sink', async (t) => {
    const r = await boot(t, { files: { 'dev-overrides.json': {} } });
    assert.deepEqual(r, { ok: true, sink: null, managed: false });
});

for (const marker of [{ K_SERVICE: 'descix-dev' }, { GAE_ENV: 'standard', GAE_SERVICE: 'dev' }]) {
    test(`managed runtime (${Object.keys(marker).join('+')}) + dev-overrides.json key: boot REFUSED naming the key`, async (t) => {
        // Mesh posture is satisfied (enforce), so the local-only check is the only refusal left.
        const r = await boot(t, {
            files: { 'dev-overrides.json': { [KEY]: SINK }, 'defaults-config-dev.json': { MESH_CTX_VERIFY_MODE: 'enforce' } },
            env: marker,
        });
        assertRefused(r, KEY, 'managed cloud runtime', Object.keys(marker)[0]);
    });
}

test('managed runtime without the key boots past the local-only check (control)', async (t) => {
    // Mesh posture then demands enforce on a managed runtime; set it so the boot completes.
    const r = await boot(t, {
        files: { 'dev-overrides.json': {}, 'defaults-config-dev.json': { MESH_CTX_VERIFY_MODE: 'enforce' } },
        env: { K_SERVICE: 'descix-dev' },
    });
    assert.deepEqual(r, { ok: true, sink: null, managed: true });
});

test('key in defaults-config.json: boot REFUSED naming the key and the file', async (t) => {
    const r = await boot(t, { files: { 'defaults-config.json': { FIRESTORE_DATABASE_ID: 'fixture-db', LOCAL_PORT: 4999, [KEY]: SINK } } });
    assertRefused(r, KEY, 'defaults-config.json');
});

test('key in defaults-config-dev.json: boot REFUSED naming the key and the file', async (t) => {
    const r = await boot(t, { files: { 'defaults-config-dev.json': { [KEY]: SINK } } });
    assertRefused(r, KEY, 'defaults-config-dev.json');
});

test('key in the Secret Manager config blob: boot REFUSED naming the key and the secret', async (t) => {
    const r = await boot(t, { blob: { [KEY]: SINK } });
    assertRefused(r, KEY, 'descix_config_fixture');
});

test('a null placeholder in a defaults file is not a source', async (t) => {
    const r = await boot(t, { files: { 'defaults-config.json': { FIRESTORE_DATABASE_ID: 'fixture-db', LOCAL_PORT: 4999, [KEY]: null } } });
    assert.deepEqual(r, { ok: true, sink: null, managed: false });
});

test('process.env cannot set the key (no free-standing env flag)', async (t) => {
    const r = await boot(t, { files: { 'dev-overrides.json': {} }, env: { [KEY]: SINK } });
    assert.deepEqual(r, { ok: true, sink: null, managed: false });
});
