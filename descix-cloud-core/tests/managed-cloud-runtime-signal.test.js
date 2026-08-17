/**
 * WS-APPENGINE-DEV-HTTPS-LISTENER — "where am I running?" is a RUNTIME signal, never
 * the environment NAME.
 *
 * Proves:
 *  (a) isManagedCloudRuntime is TRUE only when the platform itself injected a runtime
 *      marker (GAE_ENV / GAE_SERVICE for App Engine, K_SERVICE for Cloud Run + CF gen2),
 *      and is INDEPENDENT of DEPLOY_ENV. `DEPLOY_ENV=dev` on App Engine is a deployed
 *      cloud service (CEO-D-2026-07-07-DEV-IS-CLOUD), not a developer laptop.
 *  (b) DEBUG_LOCAL — the ONE explicit local-only signal, and the same signal that
 *      produces the self-signed TLS material in expressOptions — resolves FALSE for a
 *      deployed dev/demo/prod service and TRUE only when a developer sets it. This is
 *      the predicate every service's app.js branches on to choose HTTPS vs HTTP; the
 *      old `isDebug || DEBUG_LOCAL` form made deployed DEV open a TLS socket that App
 *      Engine's plain-HTTP nginx could not talk to (/_ah/start never 200s -> SIGTERM loop).
 *  (c) DEBUG_LOCAL=true on a managed cloud runtime FAILS LOUD at bootstrap with
 *      CloudConfigFatalError, instead of crash-looping behind an unrelated-looking
 *      proxy error. Guards the recurring leak path (a .env / dev-overrides.json riding
 *      into a deploy bundle — BEAST, 2026-07-03).
 *
 * Design mirrors per-env-defaults.test.js: temp-dir rootPath, private bootstrap methods
 * exercised directly, no network / Secret Manager. Runtime markers are set on
 * process.env and restored in t.after.
 *
 * Run: `node --test tests/managed-cloud-runtime-signal.test.js` from descix-cloud-core/.
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

const RUNTIME_KEYS = ['GAE_ENV', 'GAE_SERVICE', 'K_SERVICE'];
const BOOTSTRAP_KEYS = ['DEPLOY_ENV', 'DEBUG_LOCAL'];

/**
 * Build a CloudConfig over a temp service root with the given process.env shape.
 * `env` values of undefined delete the variable. Everything touched is restored.
 */
async function mkConfig(t, env) {
    const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'cloud-core-runtime-'));
    // Minimal env-invariant defaults — mirrors a real service root.
    await fsp.writeFile(
        path.join(dir, 'defaults-config.json'),
        JSON.stringify({ DEBUG_LOCAL: null, DEBUG_PROXY: null, LOCAL_PORT: 4000 }, null, 2)
    );

    const touched = [...RUNTIME_KEYS, ...BOOTSTRAP_KEYS];
    const prev = Object.fromEntries(touched.map(k => [k, process.env[k]]));
    t.after(async () => {
        _resetCloudConfigForTests();
        for (const k of touched) {
            if (prev[k] === undefined) delete process.env[k];
            else process.env[k] = prev[k];
        }
        await fsp.rm(dir, { recursive: true, force: true });
    });

    for (const k of touched) delete process.env[k];
    for (const [k, v] of Object.entries(env)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
    }

    _resetCloudConfigForTests();
    return createCloudConfig({ rootPath: dir });
}

test('(a) App Engine DEV: platform marker set, env named dev — deployed, NOT local', async (t) => {
    const cfg = await mkConfig(t, { DEPLOY_ENV: 'dev', GAE_ENV: 'standard', GAE_SERVICE: 'dev' });

    assert.equal(cfg.DEPLOY_ENV, 'dev');
    assert.equal(cfg.isManagedCloudRuntime, true, 'GAE_ENV must mark a managed cloud runtime');
    assert.ok(!cfg.DEBUG_LOCAL, 'a deployed dev service is NOT a developer machine -> HTTP listener');
    // The old defect: isDebug is TRUE here (it keys on the environment NAME). It must
    // therefore never be what the listener branches on.
    assert.equal(cfg.isDebug, true, 'isDebug still means "verbose dev environment" — unchanged');
    assert.doesNotThrow(() => cfg._assertLocalDebugNotOnCloud());
});

test('(a) Cloud Run marker (K_SERVICE) also counts as a managed cloud runtime', async (t) => {
    const cfg = await mkConfig(t, { DEPLOY_ENV: 'dev', K_SERVICE: 'apifront-http-dev' });
    assert.equal(cfg.isManagedCloudRuntime, true);
    assert.ok(!cfg.DEBUG_LOCAL);
});

test('(a) developer machine: no platform marker, whatever the env name says', async (t) => {
    const cfg = await mkConfig(t, { DEPLOY_ENV: 'dev', DEBUG_LOCAL: 'true' });
    assert.equal(cfg.isManagedCloudRuntime, false, 'no GAE_ENV/K_SERVICE -> not deployed');
    assert.equal(cfg.DEBUG_LOCAL, true, 'explicit local signal -> self-signed HTTPS listener');
    assert.doesNotThrow(() => cfg._assertLocalDebugNotOnCloud());
});

test('(b) deployed demo and prod are unchanged — no local signal, HTTP listener', async (t) => {
    for (const env of ['demo', 'prod']) {
        const cfg = await mkConfig(t, { DEPLOY_ENV: env, GAE_ENV: 'standard', GAE_SERVICE: env });
        assert.ok(!cfg.DEBUG_LOCAL, `${env}: no local signal`);
        assert.equal(cfg.isManagedCloudRuntime, true, `${env}: deployed`);
        assert.equal(cfg.isDebug, false, `${env}: isDebug false, as before`);
    }
});

test('(b) DEBUG_LOCAL=false is honoured verbatim on a laptop (no env-name inference)', async (t) => {
    const cfg = await mkConfig(t, { DEPLOY_ENV: 'dev', DEBUG_LOCAL: 'false' });
    assert.equal(cfg.DEBUG_LOCAL, false);
    assert.equal(cfg.isManagedCloudRuntime, false);
});

test('(c) FAIL LOUD: DEBUG_LOCAL leaked into an App Engine deployment', async (t) => {
    const cfg = await mkConfig(t, { DEPLOY_ENV: 'dev', GAE_ENV: 'standard', DEBUG_LOCAL: 'true' });
    assert.throws(
        () => cfg._assertLocalDebugNotOnCloud(),
        (err) => {
            assert.ok(err instanceof CloudConfigFatalError, 'must be the non-retryable fatal class');
            assert.match(err.message, /DEBUG_LOCAL=true on a managed cloud runtime/);
            assert.match(err.message, /GAE_ENV=standard/, 'must name the marker that proved it is deployed');
            return true;
        }
    );
});

test('(c) FAIL LOUD: DEBUG_LOCAL leaked into a Cloud Run deployment', async (t) => {
    const cfg = await mkConfig(t, { DEPLOY_ENV: 'demo', K_SERVICE: 'apifront-http-demo', DEBUG_LOCAL: 'true' });
    assert.throws(
        () => cfg._assertLocalDebugNotOnCloud(),
        (err) => {
            assert.match(err.message, /K_SERVICE=apifront-http-demo/);
            return true;
        }
    );
});
