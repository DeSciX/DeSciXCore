/**
 * Mesh startup self-test — a service REFUSES TO REGISTER unless its own /api answers an unsigned
 * call with the mesh guard's 401.
 *
 * THE HOLE (row DeSciX/DeSciXCore#3): the fail-closed signature guard lives in mountMeshApi, so a
 * service that never calls mountMeshApi booted with no signature check and still registered into
 * the mesh. The self-test sits in createServiceBootstrap().register() — the one door every
 * registering service passes through — so there is no mount to forget.
 *
 * Every case drives a REAL local HTTP server (the self-call is never mocked). Only the remote
 * register_service door is stubbed, because that is the platform, not the service under test.
 * The guarded servers use the real createMeshContextVerifier in enforce mode.
 *
 * Run: `node --test tests/mesh-self-test.test.js` from descix-cloud-core/.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';

import { createServiceBootstrap, MESH_SELF_TEST_COMMAND } from '../src/service-bootstrap/index.js';
import { createMeshContextVerifier } from '../src/meshContext.js';
import { MESH_API_PATH } from '../src/meshApi.js';

const MANIFEST = () => ({
    service: { name: 'selftestsvc', version: '1.0.0' },
    commands: { do_thing: { handler: 'a.b', description: 'does a thing' } },
});

const quietLogger = { log() {}, warn() {}, error() {} };
const stubIdentity = async () => ({ Authorization: 'Bearer stub' });
const okRegister = () => ({ status: 200, json: async () => ({ status: 'OK', message: 'registered' }) });

function stubRegisterDoor() {
    const calls = [];
    const impl = async (url, init) => { calls.push({ url, init }); return okRegister(); };
    impl.calls = calls;
    return impl;
}

function listen(server) {
    return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}`)));
}

/** A service that DID mount the guard: real verifier, enforce mode, JSON body parsed. */
async function guardedService() {
    const { publicKey } = crypto.generateKeyPairSync('ec', {
        namedCurve: 'prime256v1',
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const verify = createMeshContextVerifier({ mode: 'enforce', publicKeyPem: publicKey, keyId: 'k1', logger: quietLogger });
    const hits = [];
    const server = http.createServer((req, res) => {
        let raw = '';
        req.on('data', (c) => { raw += c; });
        req.on('end', () => {
            req.body = raw ? JSON.parse(raw) : {};
            const resShim = Object.assign(res, {
                status(code) { res.statusCode = code; return res; },
                json(o) { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(o)); },
            });
            if (!req.url.startsWith(MESH_API_PATH)) { res.statusCode = 404; return res.end(); }
            verify(req, resShim, () => { hits.push(req.url); res.statusCode = 200; res.end('{"reached":"handler"}'); });
        });
    });
    return { server, origin: await listen(server), hits };
}

/** A service that NEVER mounted the guard: its /api answers anyone. */
async function unguardedService(status = 200) {
    const hits = [];
    const server = http.createServer((req, res) => {
        hits.push(req.url);
        res.statusCode = status;
        res.setHeader('content-type', 'application/json');
        res.end('{"reached":"handler"}');
    });
    return { server, origin: await listen(server), hits };
}

function bootstrap(meshSelfUrl, fetchImpl, extra = {}) {
    return createServiceBootstrap({
        manifest: MANIFEST(), selfRegister: true, coreApiUrl: 'https://stub/apifront', meshSelfUrl,
        fetchImpl, identityHeaderProvider: stubIdentity, logger: quietLogger, ...extra,
    });
}

describe('mesh self-test at registration', () => {
    test('POSITIVE CONTROL: a service with the guard mounted (self-call -> 401) registers', async () => {
        const svc = await guardedService();
        try {
            const door = stubRegisterDoor();
            const result = await bootstrap(svc.origin, door).register();
            assert.equal(result.status, 'ok', result.error || '');
            assert.equal(door.calls.length, 1, 'register_service was called exactly once');
            assert.deepEqual(svc.hits, [], 'the unsigned probe never reached the handler');
        } finally { svc.server.close(); }
    });

    test('THE HOLE: a service that never mounted the guard (self-call -> 2xx) is REFUSED, naming mountMeshApi', async () => {
        const svc = await unguardedService(200);
        try {
            const door = stubRegisterDoor();
            const result = await bootstrap(svc.origin, door).register();
            assert.equal(result.status, 'failed');
            assert.match(result.error, /mountMeshApi/);
            assert.match(result.error, /HTTP 200/);
            assert.equal(door.calls.length, 0, 'register_service must NOT be called');
            assert.equal(svc.hits[0], `${MESH_API_PATH}/${MESH_SELF_TEST_COMMAND}`, 'probe goes to a reserved non-command');
        } finally { svc.server.close(); }
    });

    test('a non-401 non-2xx (an un-mounted express app answers 404) is REFUSED', async () => {
        const svc = await unguardedService(404);
        try {
            const door = stubRegisterDoor();
            const result = await bootstrap(svc.origin, door).register();
            assert.equal(result.status, 'failed');
            assert.match(result.error, /HTTP 404/);
            assert.match(result.error, /mountMeshApi/);
            assert.equal(door.calls.length, 0);
        } finally { svc.server.close(); }
    });

    test('a 401 that is NOT the mesh guard (no MESH_CTX_ code) is REFUSED', async () => {
        const server = http.createServer((req, res) => { res.statusCode = 401; res.end('{"error":"app auth"}'); });
        const origin = await listen(server);
        try {
            const door = stubRegisterDoor();
            const result = await bootstrap(origin, door).register();
            assert.equal(result.status, 'failed');
            assert.match(result.error, /not the mesh guard/);
            assert.equal(door.calls.length, 0);
        } finally { server.close(); }
    });

    test('the service cannot reach itself (connection refused) -> REFUSED, naming unreachability', async () => {
        const server = http.createServer();
        const origin = await listen(server);
        await new Promise((r) => server.close(r)); // port now closed
        const door = stubRegisterDoor();
        const result = await bootstrap(origin, door).register();
        assert.equal(result.status, 'failed');
        assert.match(result.error, /could not reach itself/);
        assert.equal(door.calls.length, 0);
    });

    test('a listener that never answers (timeout) -> REFUSED', async () => {
        const server = http.createServer(() => { /* never respond */ });
        const origin = await listen(server);
        try {
            const door = stubRegisterDoor();
            const result = await bootstrap(origin, door, { meshSelfTestTimeoutMs: 150 }).register();
            assert.equal(result.status, 'failed');
            assert.match(result.error, /could not reach itself/);
            assert.equal(door.calls.length, 0);
        } finally { server.closeAllConnections(); server.close(); }
    });

    test('meshSelfUrl is REQUIRED when selfRegister is true (no default, no skip)', () => {
        assert.throws(
            () => createServiceBootstrap({
                manifest: MANIFEST(), selfRegister: true, coreApiUrl: 'https://stub/apifront', logger: quietLogger,
            }),
            /meshSelfUrl/
        );
    });

    test('selfRegister:false registers nothing, so no self-test runs (the named opt-out never enters the mesh)', async () => {
        const door = stubRegisterDoor();
        const result = await createServiceBootstrap({
            manifest: MANIFEST(), selfRegister: false, fetchImpl: door, logger: quietLogger,
        }).register();
        assert.equal(result.status, 'skipped');
        assert.equal(door.calls.length, 0);
    });
});
