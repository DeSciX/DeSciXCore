/**
 * Two silent degradations in local dev, made loud (2026-09-16).
 *
 * 1. A workspace `env.environment` other than the literal `DEV` used to be a NO-OP in
 *    `_tryLoadWorkspaceConfig`: DEPLOY_ENV stayed unset, the port auto-detect never ran, and the
 *    service later died with "DEPLOY_ENV not set" — a true message that named the wrong cause.
 *    Measured after `descix config set-env local` wrote `environment: "LOCAL"`.
 * 2. A dev service that resolved no port went on to `listen(undefined)` and logged
 *    "HTTPS service running on port undefined" while bound to nothing.
 *
 * Both are now CloudConfigFatalError at construction, naming the cause. These tests are
 * no-network: they construct CloudConfig over temp dirs and never call initialize().
 *
 * Run: `node --test tests/workspace-env-token-and-port.test.js` from descix-cloud-core/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';

import { createCloudConfig, CloudConfigFatalError, _resetCloudConfigForTests } from '../src/config.js';

const BASE = { FIRESTORE_DATABASE_ID: 'descix-dev', GOOGLE_PROJECT_ID: 'test-project' };
const ENV_KEYS = ['DEPLOY_ENV', 'PORT', 'LOCAL_PORT'];

/** Snapshot the env keys this module reads, clear them, and restore after the test. */
function isolateEnv(t) {
    const saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
    for (const k of ENV_KEYS) delete process.env[k];
    t.after(() => {
        _resetCloudConfigForTests();
        for (const k of ENV_KEYS) {
            if (saved[k] === undefined) delete process.env[k];
            else process.env[k] = saved[k];
        }
    });
}

/** A temp workspace root with one platform service at <root>/svc. */
async function mkWorkspace(t, { environment, port = 4321 }) {
    const root = await fsp.realpath(await fsp.mkdtemp(path.join(os.tmpdir(), 'cloud-core-ws-')));
    const app = path.join(root, 'svc');
    await fsp.mkdir(path.join(root, '.descix'), { recursive: true });
    await fsp.mkdir(app, { recursive: true });
    await fsp.writeFile(path.join(root, '.descix', 'workspace.json'), JSON.stringify({
        version: '2.1', type: 'workspace', workspaceRoot: root,
        env: { environment, platform: { appId: 'svc', localPath: 'svc', microservice: { port } }, products: [] },
    }, null, 2));
    await fsp.writeFile(path.join(app, 'defaults-config.json'), JSON.stringify(BASE, null, 2));
    t.after(async () => { await fsp.rm(root, { recursive: true, force: true }); });
    return { root, app };
}

// ------------------------------------------------------------------ env token

test('a workspace whose env.environment is not DEV is refused BY NAME (it used to be a silent no-op)', async (t) => {
    isolateEnv(t);
    const { app } = await mkWorkspace(t, { environment: 'LOCAL' });
    assert.throws(() => createCloudConfig({ rootPath: app }), (err) => {
        assert.ok(err instanceof CloudConfigFatalError, `expected CloudConfigFatalError, got ${err?.constructor?.name}: ${err?.message}`);
        assert.match(err.message, /env\.environment is "LOCAL"/);
        assert.match(err.message, /descix config init --env dev/);
        return true;
    });
});

test('control: a DEV workspace derives DEPLOY_ENV, the dev secret name, and the port from the matched entry', async (t) => {
    isolateEnv(t);
    const { app } = await mkWorkspace(t, { environment: 'DEV', port: 4321 });
    const cfg = createCloudConfig({ rootPath: app });
    assert.equal(cfg.DEPLOY_ENV, 'dev');
    assert.equal(cfg.CONFIG_SECRET_NAME, 'descix_config_dev');
    assert.equal(String(cfg.PORT), '4321');
});

test('an explicit DEPLOY_ENV still wins and the workspace token is not consulted (deployed posture)', async (t) => {
    isolateEnv(t);
    const { app } = await mkWorkspace(t, { environment: 'LOCAL', port: 4321 });
    process.env.DEPLOY_ENV = 'dev';
    process.env.PORT = '8080';
    const cfg = createCloudConfig({ rootPath: app });
    assert.equal(cfg.DEPLOY_ENV, 'dev');
    assert.equal(String(cfg.PORT), '8080');
});

// ------------------------------------------------------------------ port

test('a dev service that resolves no port is refused naming its app dir (it used to listen(undefined))', async (t) => {
    isolateEnv(t);
    // No workspace anywhere above: DEPLOY_ENV comes from the environment, nothing names a port.
    const root = await fsp.realpath(await fsp.mkdtemp(path.join(os.tmpdir(), 'cloud-core-noport-')));
    await fsp.writeFile(path.join(root, 'defaults-config.json'), JSON.stringify(BASE, null, 2));
    t.after(async () => { await fsp.rm(root, { recursive: true, force: true }); });
    process.env.DEPLOY_ENV = 'dev';
    assert.throws(() => createCloudConfig({ rootPath: root }), (err) => {
        assert.ok(err instanceof CloudConfigFatalError, `expected CloudConfigFatalError, got ${err?.constructor?.name}: ${err?.message}`);
        assert.match(err.message, /no port for this dev service/);
        assert.ok(err.message.includes(root), 'names the app dir it matched nothing for');
        return true;
    });
});

test('control: LOCAL_PORT satisfies the same service', async (t) => {
    isolateEnv(t);
    const root = await fsp.realpath(await fsp.mkdtemp(path.join(os.tmpdir(), 'cloud-core-localport-')));
    await fsp.writeFile(path.join(root, 'defaults-config.json'), JSON.stringify(BASE, null, 2));
    t.after(async () => { await fsp.rm(root, { recursive: true, force: true }); });
    process.env.DEPLOY_ENV = 'dev';
    process.env.LOCAL_PORT = '4444';
    const cfg = createCloudConfig({ rootPath: root });
    assert.equal(String(cfg.PORT), '4444');
});

test('a non-dev service with no port is NOT refused here (Cloud Run always sets PORT; this guard is local-only)', async (t) => {
    isolateEnv(t);
    const root = await fsp.realpath(await fsp.mkdtemp(path.join(os.tmpdir(), 'cloud-core-prodport-')));
    await fsp.writeFile(path.join(root, 'defaults-config.json'), JSON.stringify(BASE, null, 2));
    t.after(async () => { await fsp.rm(root, { recursive: true, force: true }); });
    process.env.DEPLOY_ENV = 'prod';
    assert.doesNotThrow(() => createCloudConfig({ rootPath: root }));
});
