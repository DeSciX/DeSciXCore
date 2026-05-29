/**
 * WS-PROD-CUTOVER — elevated-secret + DEPLOY_ENV token resolution.
 *
 * Guards CEO-D-2026-05-29-PROD-IS-CANONICAL-ENV-TOKEN: 'prod' is the only canonical
 * prod DEPLOY_ENV token; the legacy 'production' alias has been purged from
 * descix-cloud-core/src/config.js.
 *
 * Coverage:
 *  - _getElevatedSecretVersion() maps the canonical 'prod' token to the LIVE alias
 *    on the shared elevated_credentials_descix secret (no PROD alias exists).
 *  - dev/demo derive their per-env alias from the token (DEV/DEMO).
 *  - The legacy 'production' token no longer maps to LIVE — it would (incorrectly)
 *    derive 'PRODUCTION', proving the alias has been removed, not merely aliased.
 *
 * Run: node --test tests/prod-elevated-secret-resolution.test.js  (from descix-cloud-core/)
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';

import { createCloudConfig, _resetCloudConfigForTests } from '../src/config.js';

async function mkConfig(t) {
    const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'cloud-core-prod-secret-'));
    await fsp.writeFile(
        path.join(dir, 'defaults-config.json'),
        JSON.stringify({ GOOGLE_PROJECT_ID: 'test', FIRESTORE_DATABASE_ID: 'descix-dev' }, null, 2),
    );
    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir });
    t.after(async () => {
        _resetCloudConfigForTests();
        await fsp.rm(dir, { recursive: true, force: true });
    });
    return cfg;
}

test('prod token → LIVE alias on shared elevated secret', async (t) => {
    const cfg = await mkConfig(t);
    cfg.DEPLOY_ENV = 'prod';
    cfg.CONFIG_SECRET_VERSION = 'latest';
    assert.equal(cfg._getElevatedSecretVersion(), 'LIVE');
});

test('dev/demo derive their per-env alias from the token', async (t) => {
    const cfg = await mkConfig(t);
    cfg.CONFIG_SECRET_VERSION = 'latest';

    cfg.DEPLOY_ENV = 'dev';
    assert.equal(cfg._getElevatedSecretVersion(), 'DEV');

    cfg.DEPLOY_ENV = 'demo';
    assert.equal(cfg._getElevatedSecretVersion(), 'DEMO');
});

test('legacy "production" token no longer maps to LIVE (alias purged)', async (t) => {
    const cfg = await mkConfig(t);
    cfg.DEPLOY_ENV = 'production';
    cfg.CONFIG_SECRET_VERSION = 'latest';
    // Before the purge this returned 'LIVE'. After the purge the legacy token is no
    // longer special-cased, so it derives the (non-existent) 'PRODUCTION' alias —
    // proving 'production' is dead and 'prod' is the sole canonical prod token.
    assert.notEqual(cfg._getElevatedSecretVersion(), 'LIVE',
        'legacy "production" must no longer resolve to LIVE');
    assert.equal(cfg._getElevatedSecretVersion(), 'PRODUCTION');
});

test('explicit non-latest CONFIG_SECRET_VERSION is passed through unchanged', async (t) => {
    const cfg = await mkConfig(t);
    cfg.DEPLOY_ENV = 'prod';
    cfg.CONFIG_SECRET_VERSION = 'PREVIEW';
    assert.equal(cfg._getElevatedSecretVersion(), 'PREVIEW');
});
