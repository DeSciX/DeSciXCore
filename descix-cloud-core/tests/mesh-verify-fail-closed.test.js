/**
 * Mesh-context verification FAILS CLOSED on a managed cloud runtime.
 *
 * MEASURED 2026-09-29 (PROD): an unsigned public POST to https://egpt.descix.net/api/<command>
 * reached the podcast service's dispatch, because every app decided for itself whether to mount
 * the verifier ("mount if MESH_CTX_VERIFY_MODE is set"). An app that never set the key served
 * its mutating commands to anyone, as the developer identity.
 *
 * The rule, at ONE owner (CloudConfig, which every cloud-core consumer boots through):
 *   - a mesh SERVICE (the default role) on a managed runtime (GAE_ENV / GAE_SERVICE / K_SERVICE)
 *     REFUSES BOOT unless MESH_CTX_VERIFY_MODE === 'enforce';
 *   - the verification key is a PLATFORM fact owned by cloud-core per DEPLOY_ENV — an app that
 *     carries its own MESH_CTX_PUBLIC_KEY / MESH_CTX_KEY_ID refuses boot;
 *   - the /api mount is owned by cloud-core (mountMeshApi), so app code carries no
 *     "mount if configured" branch;
 *   - the mesh SIGNER (Cloud apifront, meshRole 'signer') proves at boot that its private key
 *     derives the published trust anchor for its env.
 *
 * Every test drives the real bootstrap (createCloudConfig + initialize) over a temp service
 * root, offline: GOOGLE_CLOUD_PROJECT resolves the project, no CONFIG_SECRET_NAME means no
 * Secret Manager call. Trust anchors are replaced with a test keypair through the test-only
 * seam, which refuses outside a test process.
 *
 * Run: `node --test tests/mesh-verify-fail-closed.test.js` from descix-cloud-core/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import * as config from '../src/config.js';
import * as mesh from '../src/meshContext.js';
import * as root from '../src/index.js';

const { CloudConfigFatalError } = config;

const RUNTIME_KEYS = ['GAE_ENV', 'GAE_SERVICE', 'K_SERVICE'];
const BOOTSTRAP_KEYS = ['DEPLOY_ENV', 'DEBUG_LOCAL', 'CONFIG_SECRET_NAME', 'CONFIG_SECRET_VERSION', 'GOOGLE_CLOUD_PROJECT'];

function genKeypair() {
    return crypto.generateKeyPairSync('ec', {
        namedCurve: 'prime256v1',
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
}

const TEST_KEY = genKeypair();
const OTHER_KEY = genKeypair();
const TEST_ANCHORS = Object.freeze({
    dev: Object.freeze({ keyId: 'mesh-test-1', publicKeyPem: TEST_KEY.publicKey }),
});

function requireOwner(name, mod = config) {
    assert.equal(
        typeof mod[name], 'function',
        `the canonical owner does not export ${name}() — mesh verification has no owner`
    );
    return mod[name];
}

/**
 * Boot a CloudConfig over a temp service root.
 * @param {object} t          node:test context (for cleanup)
 * @param {object} opts
 * @param {object} opts.env        process.env shape (runtime markers, DEPLOY_ENV)
 * @param {object} opts.defaults   defaults-config.json content (merged over a minimal base)
 * @param {object} [opts.envLayer] defaults-config-{DEPLOY_ENV}.json content
 * @param {string} [opts.meshRole] createCloudConfig meshRole
 * @param {boolean} [opts.anchors=true] install TEST_ANCHORS
 */
async function mkConfig(t, { env, defaults = {}, envLayer = null, meshRole, anchors = true }) {
    const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'cloud-core-meshclosed-'));
    await fsp.writeFile(
        path.join(dir, 'defaults-config.json'),
        JSON.stringify({ DEBUG_LOCAL: null, LOCAL_PORT: 4999, FIRESTORE_DATABASE_ID: 'test-db', ...defaults }, null, 2)
    );
    if (envLayer && env.DEPLOY_ENV) {
        await fsp.writeFile(
            path.join(dir, `defaults-config-${env.DEPLOY_ENV}.json`),
            JSON.stringify(envLayer, null, 2)
        );
    }

    const touched = [...RUNTIME_KEYS, ...BOOTSTRAP_KEYS];
    const prev = Object.fromEntries(touched.map(k => [k, process.env[k]]));
    t.after(async () => {
        config._resetCloudConfigForTests();
        for (const k of touched) {
            if (prev[k] === undefined) delete process.env[k];
            else process.env[k] = prev[k];
        }
        await fsp.rm(dir, { recursive: true, force: true });
    });

    for (const k of touched) delete process.env[k];
    process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
    for (const [k, v] of Object.entries(env)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
    }

    config._resetCloudConfigForTests();
    // Absent seam => no anchor concept at all (the pre-owner tree); the behavioral assertions
    // below then measure what that tree actually does instead of failing on a missing export.
    if (anchors && typeof config._overrideMeshTrustAnchorsForTests === 'function') {
        config._overrideMeshTrustAnchorsForTests(TEST_ANCHORS);
    }
    const opts = { rootPath: dir };
    if (meshRole !== undefined) opts.meshRole = meshRole;
    return config.createCloudConfig(opts);
}

function assertFatalNaming(err, ...needles) {
    assert.ok(err instanceof CloudConfigFatalError, `expected CloudConfigFatalError, got ${err?.name}: ${err?.message}`);
    for (const n of needles) {
        assert.ok(err.message.includes(n), `refusal must name ${JSON.stringify(n)}; got: ${err.message}`);
    }
    return true;
}

/**
 * A minimal Express-shaped host: records app.use(path, ...handlers) and serves the chain over
 * real HTTP, with the two response methods the verifier uses (status, json). Dependency-free so
 * the suite runs in an isolated worktree.
 */
function miniApp() {
    const layers = [];
    const app = {
        layers,
        use(mountPath, ...handlers) { layers.push({ mountPath, handlers }); return app; },
    };
    const server = http.createServer((req, res) => {
        let raw = '';
        req.on('data', c => { raw += c; });
        req.on('end', () => {
            try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
            res.status = (code) => { res.statusCode = code; return res; };
            res.json = (obj) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(obj)); return res; };
            const chain = layers
                .filter(l => req.url === l.mountPath || req.url.startsWith(`${l.mountPath}/`))
                .flatMap(l => l.handlers);
            let i = 0;
            const next = (err) => {
                if (err) return res.status(500).json({ error: String(err) });
                const h = chain[i++];
                if (!h) return res.status(404).json({ error: 'no route' });
                h(req, res, next);
            };
            next();
        });
    });
    return { app, server };
}

async function listen(server) {
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    return `http://127.0.0.1:${server.address().port}`;
}

async function post(base, urlPath, body, headers = {}) {
    const r = await fetch(`${base}${urlPath}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify(body),
    });
    return { status: r.status, body: await r.json() };
}

/** The application's own router: records that it ran, echoes the verification stamp. */
function probeRouter(hits) {
    return (req, res) => {
        hits.push(req.url);
        res.status(200).json({ reached: true, meshContextVerified: req.meshContextVerified });
    };
}

// ── managed runtime refuses to boot a mesh service that does not enforce ─────────────────────

test('managed runtime + MESH_CTX_VERIFY_MODE unset REFUSES BOOT', async (t) => {
    const cfg = await mkConfig(t, { env: { DEPLOY_ENV: 'dev', K_SERVICE: 'egpt-dev' } });
    await assert.rejects(() => cfg.initialize(), (err) => assertFatalNaming(err, 'MESH_CTX_VERIFY_MODE', 'enforce'));
});

test('managed runtime + MESH_CTX_VERIFY_MODE empty REFUSES BOOT', async (t) => {
    const cfg = await mkConfig(t, {
        env: { DEPLOY_ENV: 'dev', K_SERVICE: 'egpt-dev' },
        defaults: { MESH_CTX_VERIFY_MODE: '' },
    });
    await assert.rejects(() => cfg.initialize(), (err) => assertFatalNaming(err, 'MESH_CTX_VERIFY_MODE', 'enforce'));
});

test('managed runtime + MESH_CTX_VERIFY_MODE=warn REFUSES BOOT', async (t) => {
    const cfg = await mkConfig(t, {
        env: { DEPLOY_ENV: 'dev', GAE_ENV: 'standard', GAE_SERVICE: 'dev' },
        defaults: { MESH_CTX_VERIFY_MODE: 'warn' },
    });
    await assert.rejects(() => cfg.initialize(), (err) => assertFatalNaming(err, 'MESH_CTX_VERIFY_MODE', 'enforce', 'warn'));
});

test('managed runtime + enforce in an env with NO platform trust anchor REFUSES BOOT', async (t) => {
    const cfg = await mkConfig(t, {
        env: { DEPLOY_ENV: 'preview', K_SERVICE: 'egpt-preview' },
        defaults: { MESH_CTX_VERIFY_MODE: 'enforce' },
    });
    await assert.rejects(() => cfg.initialize(), (err) => assertFatalNaming(err, 'preview'));
});

// ── managed runtime + enforce: boots, and the OWNER's mount rejects unsigned, passes signed ──

test('managed runtime + enforce BOOTS; unsigned /api gets 401 MESH_CTX_MISSING; signed passes', async (t) => {
    const cfg = await mkConfig(t, {
        env: { DEPLOY_ENV: 'dev', K_SERVICE: 'egpt-dev' },
        defaults: { MESH_CTX_VERIFY_MODE: 'enforce' },
    });
    await cfg.initialize();

    // The key the service verifies with is the platform's, not a value the app configured.
    assert.equal(cfg.MESH_CTX_KEY_ID, 'mesh-test-1');
    assert.equal(cfg.MESH_CTX_PUBLIC_KEY, TEST_KEY.publicKey);

    const mountMeshApi = requireOwner('mountMeshApi', root);
    const hits = [];
    const router = probeRouter(hits);
    const { app, server } = miniApp();
    mountMeshApi(app, router);
    t.after(() => server.close());

    assert.equal(app.layers.length, 1, 'the owner mounts exactly one layer');
    assert.equal(app.layers[0].mountPath, '/api', 'the owner mounts on the mesh-proxied surface');
    assert.equal(app.layers[0].handlers.length, 2, 'gate then router');
    assert.equal(app.layers[0].handlers[1], router, 'the application router runs AFTER the gate');

    const base = await listen(server);

    const unsigned = await post(base, '/api/podcast_create_show', { title: 'x' });
    assert.equal(unsigned.status, 401, `unsigned /api must be refused; got ${unsigned.status} ${JSON.stringify(unsigned.body)}`);
    assert.equal(unsigned.body.code, 'MESH_CTX_MISSING');

    const forged = await post(base, '/api/podcast_create_show', { title: 'x', _descix: { user: { id: 'victim' }, signedAt: Date.now() } });
    assert.equal(forged.status, 401, 'a forged, unsigned _descix must be refused');
    assert.equal(forged.body.code, 'MESH_CTX_UNSIGNED');
    assert.deepEqual(hits, [], 'the application router must never run for an unverified request');

    const { signedContext, headers } = mesh.buildOutboundMeshHeaders(
        { user: { id: 'u1', email: 'u1@example.org', wallet_address: '0xabc' }, entitlements: [], serviceId: 'egpt' },
        { privateKeyPem: TEST_KEY.privateKey, keyId: 'mesh-test-1' }
    );
    const signed = await post(base, '/api/podcast_list_episodes', { _descix: signedContext }, headers);
    assert.equal(signed.status, 200, `a platform-signed request must pass; got ${signed.status} ${JSON.stringify(signed.body)}`);
    assert.equal(signed.body.meshContextVerified, true);
    assert.deepEqual(hits, ['/api/podcast_list_episodes']);

    // Signed by a key that is NOT the platform anchor: refused.
    const wrongKey = mesh.buildOutboundMeshHeaders(
        { user: { id: 'u1' }, entitlements: [], serviceId: 'egpt' },
        { privateKeyPem: OTHER_KEY.privateKey, keyId: 'mesh-test-1' }
    );
    const impostor = await post(base, '/api/podcast_list_episodes', { _descix: wrongKey.signedContext }, wrongKey.headers);
    assert.equal(impostor.status, 401);
    assert.equal(impostor.body.code, 'MESH_CTX_INVALID');
});

// ── local development stays free ─────────────────────────────────────────────────────────────

test('local dev (no K_SERVICE) with the mode unset BOOTS UNVERIFIED', async (t) => {
    const cfg = await mkConfig(t, { env: { DEPLOY_ENV: 'dev' } });
    await cfg.initialize();

    const mountMeshApi = requireOwner('mountMeshApi', root);
    const hits = [];
    const { app, server } = miniApp();
    mountMeshApi(app, probeRouter(hits));
    t.after(() => server.close());
    const base = await listen(server);

    const r = await post(base, '/api/podcast_list_episodes', {});
    assert.equal(r.status, 200, 'local dev with no mode is unverified, not refused');
    assert.equal(r.body.meshContextVerified, false, 'the request is stamped UNVERIFIED, never silently trusted');
    assert.deepEqual(hits, ['/api/podcast_list_episodes']);
});

test('local dev with warn BOOTS and observes (unsigned proceeds, stamped unverified)', async (t) => {
    const cfg = await mkConfig(t, { env: { DEPLOY_ENV: 'dev' }, defaults: { MESH_CTX_VERIFY_MODE: 'warn' } });
    await cfg.initialize();
    const mountMeshApi = requireOwner('mountMeshApi', root);
    const hits = [];
    const { app, server } = miniApp();
    mountMeshApi(app, probeRouter(hits));
    t.after(() => server.close());
    const base = await listen(server);
    const r = await post(base, '/api/x', {});
    assert.equal(r.status, 200);
    assert.equal(r.body.meshContextVerified, false);
});

test('an unknown MESH_CTX_VERIFY_MODE value REFUSES BOOT even locally', async (t) => {
    const cfg = await mkConfig(t, { env: { DEPLOY_ENV: 'dev' }, defaults: { MESH_CTX_VERIFY_MODE: 'enforced' } });
    await assert.rejects(() => cfg.initialize(), (err) => assertFatalNaming(err, 'MESH_CTX_VERIFY_MODE', 'enforced'));
});

test('mountMeshApi before the bootstrap resolved the posture fails loud', async (t) => {
    await mkConfig(t, { env: { DEPLOY_ENV: 'dev' } });
    const mountMeshApi = requireOwner('mountMeshApi', root);
    const { app } = miniApp();
    assert.throws(() => mountMeshApi(app, () => {}), /initializeCloudConfig/);
    assert.equal(app.layers.length, 0, 'nothing is mounted when the posture is unknown');
});

// ── the verification key is a PLATFORM fact: an app copy refuses boot ───────────────────────

test('an app carrying MESH_CTX_PUBLIC_KEY in defaults-config.json REFUSES BOOT', async (t) => {
    await assert.rejects(
        () => mkConfig(t, {
            env: { DEPLOY_ENV: 'dev' },
            defaults: { MESH_CTX_VERIFY_MODE: 'enforce', MESH_CTX_PUBLIC_KEY: TEST_KEY.publicKey },
        }),
        (err) => assertFatalNaming(err, 'MESH_CTX_PUBLIC_KEY', 'defaults-config.json', '@descix/cloud-core')
    );
});

test('an app carrying MESH_CTX_KEY_ID in its per-env layer REFUSES BOOT', async (t) => {
    await assert.rejects(
        () => mkConfig(t, {
            env: { DEPLOY_ENV: 'dev' },
            envLayer: { MESH_CTX_KEY_ID: 'mesh-dev-1' },
        }),
        (err) => assertFatalNaming(err, 'MESH_CTX_KEY_ID', 'defaults-config-dev.json', '@descix/cloud-core')
    );
});

// ── the signer (Cloud apifront) proves its key matches the published anchor ─────────────────

test('signer on a managed runtime with a key that DERIVES the anchor boots, keyId from the owner', async (t) => {
    const cfg = await mkConfig(t, {
        env: { DEPLOY_ENV: 'dev', K_SERVICE: 'apifront-http-dev' },
        defaults: { MESH_CTX_SIGNING_KEY: TEST_KEY.privateKey },
        meshRole: 'signer',
    });
    await cfg.initialize();
    assert.equal(cfg.MESH_CTX_KEY_ID, 'mesh-test-1');
});

test('signer whose private key does NOT derive the anchor REFUSES BOOT', async (t) => {
    const cfg = await mkConfig(t, {
        env: { DEPLOY_ENV: 'dev', K_SERVICE: 'apifront-http-dev' },
        defaults: { MESH_CTX_SIGNING_KEY: OTHER_KEY.privateKey },
        meshRole: 'signer',
    });
    await assert.rejects(() => cfg.initialize(), (err) => assertFatalNaming(err, 'MESH_CTX_SIGNING_KEY', 'mesh-test-1'));
});

test('signer on a managed runtime with NO signing key REFUSES BOOT', async (t) => {
    const cfg = await mkConfig(t, {
        env: { DEPLOY_ENV: 'dev', K_SERVICE: 'apifront-http-dev' },
        meshRole: 'signer',
    });
    await assert.rejects(() => cfg.initialize(), (err) => assertFatalNaming(err, 'MESH_CTX_SIGNING_KEY'));
});

test('an unknown meshRole is refused at createCloudConfig', async (t) => {
    await assert.rejects(
        () => mkConfig(t, { env: { DEPLOY_ENV: 'dev' }, meshRole: 'gateway' }),
        /meshRole/
    );
});

// ── the shipped anchors are the keys the platform is MEASURED to sign with ───────────────────

test('shipped trust anchors: dev/demo/prod, valid EC keys, fingerprints of the deployed signer keys', () => {
    assert.ok(mesh.MESH_TRUST_ANCHORS, 'meshContext.js must export MESH_TRUST_ANCHORS');
    const fp = (pem) => crypto.createHash('sha256')
        .update(crypto.createPublicKey(pem).export({ type: 'spki', format: 'der' }))
        .digest('hex');
    // SPKI sha256 of the public keys Cloud's defaults-config-{env}.json carried, measured
    // against deployed traffic on 2026-09-29: PROD apifront-signed lab_join accepted by an
    // enforcing egpt-godsworld-prod; DEV apifront-signed calls accepted by an enforcing unk-beast-dev.
    const expected = {
        dev: ['mesh-dev-1', '25c0880ad168bff7'],
        demo: ['mesh-demo-1', 'fcebdbac81ea1a1ec96398dafcec95ca226d6c002f3f0c715e9cffa6accc0377'],
        prod: ['mesh-prod-1', '7c4c596fe892a558f00a0d73980b2fd4435f189bbd09b9f85c5f7a9362f81cf8'],
    };
    assert.deepEqual(Object.keys(mesh.MESH_TRUST_ANCHORS).sort(), ['demo', 'dev', 'prod']);
    for (const [env, [keyId, fpPrefix]] of Object.entries(expected)) {
        const a = mesh.MESH_TRUST_ANCHORS[env];
        assert.equal(a.keyId, keyId, `${env} key id`);
        assert.ok(fp(a.publicKeyPem).startsWith(fpPrefix), `${env} anchor fingerprint`);
    }
});
