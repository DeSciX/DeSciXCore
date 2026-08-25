/**
 * @descix/platform-api/service-bootstrap — contract tests.
 *
 * Covers the three things that made the hand-rolled copies drift: the served object and the
 * registered object are ONE object; the registration outcome is reported, never swallowed; and
 * `skipped` is reachable only from an explicit named opt-out.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    createServiceBootstrap,
    authorizationFrom,
} from '../src/service-bootstrap/index.js';
// The hash is owned by the manifest module, beside computeManifestHash — one place to look for
// "hash a manifest". service-bootstrap consumes it; it does not implement it.
import { computeManifestObjectHash } from '../src/manifest/index.js';

const MANIFEST = () => ({
    service: { name: 'testsvc', version: '3.11.0', domain: 'testsvc.dev.descix.net', debugPort: 3011 },
    commands: {
        cmd_one: { handler: 'a.b', description: 'first command' },
        cmd_two: { handler: 'a.c', description: 'second command' },
    },
});

const quietLogger = { log() {}, error() {} };
const stubIdentity = async () => ({ Authorization: 'Bearer stub-oidc-id-token' });

function stubFetch(responder) {
    const calls = [];
    const impl = async (url, init) => {
        calls.push({ url, init, body: JSON.parse(init.body) });
        return responder(url, init);
    };
    impl.calls = calls;
    return impl;
}

const okResponse = () => ({
    status: 200,
    json: async () => ({ status: 'OK', message: "Service 'testsvc' registered: 2 commands" }),
});

describe('createServiceBootstrap — construction refusals (no silent defaults)', () => {
    test('refuses a manifest it cannot identify', () => {
        assert.throws(
            () => createServiceBootstrap({ manifest: { service: {} }, selfRegister: false }),
            /must be the loaded manifest object/
        );
    });

    test('refuses an invalid manifest, naming the validation errors', () => {
        const m = MANIFEST();
        m.commands.cmd_one.description = '';
        assert.throws(
            () => createServiceBootstrap({ manifest: m, selfRegister: false }),
            /is invalid: .*missing description/
        );
    });

    test('refuses a missing selfRegister — there is no default', () => {
        assert.throws(
            () => createServiceBootstrap({ manifest: MANIFEST() }),
            /must be an explicit boolean read from `SERVICE_SELF_REGISTER`/
        );
    });

    test('refuses selfRegister:true without coreApiUrl, naming the opt-out key', () => {
        assert.throws(
            () => createServiceBootstrap({ manifest: MANIFEST(), selfRegister: true }),
            /`coreApiUrl` is required when `SERVICE_SELF_REGISTER` is true/
        );
    });

    test('the refusal quotes the CALLER\'s config key, not a hardcoded one', () => {
        assert.throws(
            () => createServiceBootstrap({
                manifest: MANIFEST(),
                selfRegister: true,
                selfRegisterConfigKey: 'BEAST_SELF_REGISTER',
            }),
            /`BEAST_SELF_REGISTER`/
        );
    });
});

describe('createServiceBootstrap — one object, served and registered', () => {
    test('serveManifest serves the SAME object the handle hashes', async () => {
        const b = createServiceBootstrap({ manifest: MANIFEST(), selfRegister: false, logger: quietLogger });
        let served = null;
        b.serveManifest({}, { json: (o) => { served = o; } });
        assert.equal(served, b.manifest, 'served object must be identical, not a copy');
        assert.equal(computeManifestObjectHash(served), b.manifestHash);
    });

    test('the registered payload is that same manifest', async () => {
        const fetchImpl = stubFetch(okResponse);
        const b = createServiceBootstrap({
            manifest: MANIFEST(), selfRegister: true, coreApiUrl: 'https://stub/apifront',
            fetchImpl, identityHeaderProvider: stubIdentity, logger: quietLogger,
        });
        await b.register();
        const sent = fetchImpl.calls[0].body;
        assert.equal(sent.command, 'register_service');
        assert.equal(computeManifestObjectHash(sent.params.manifest), b.manifestHash);
        assert.equal(sent.params.manifest.service.version, '3.11.0');
    });

    test('installOn mounts GET /manifest', () => {
        const routes = [];
        const b = createServiceBootstrap({ manifest: MANIFEST(), selfRegister: false, logger: quietLogger });
        b.installOn({ get: (p, h) => routes.push([p, h]) });
        assert.equal(routes.length, 1);
        assert.equal(routes[0][0], '/manifest');
        assert.equal(routes[0][1], b.serveManifest);
    });
});

describe('createServiceBootstrap — registration outcome is never swallowed', () => {
    test('starts pending, so /health cannot claim success before register() ran', () => {
        const b = createServiceBootstrap({ manifest: MANIFEST(), selfRegister: false, logger: quietLogger });
        assert.equal(b.registration.status, 'pending');
        assert.equal(b.registration.version, '3.11.0');
    });

    test('success => ok, with the version and a timestamp, and it authorizes as the platform SA', async () => {
        const fetchImpl = stubFetch(okResponse);
        const b = createServiceBootstrap({
            manifest: MANIFEST(), selfRegister: true, coreApiUrl: 'https://stub/apifront',
            fetchImpl, identityHeaderProvider: stubIdentity, logger: quietLogger,
        });
        const reg = await b.register();
        assert.equal(reg.status, 'ok');
        assert.equal(reg.version, '3.11.0');
        assert.equal(reg.error, null);
        assert.ok(reg.at);
        assert.equal(fetchImpl.calls[0].init.headers.Authorization, 'Bearer stub-oidc-id-token');
    });

    test('NEGATIVE CONTROL — a platform-side refusal => failed, carrying the error text', async () => {
        const b = createServiceBootstrap({
            manifest: MANIFEST(), selfRegister: true, coreApiUrl: 'https://stub/apifront',
            fetchImpl: stubFetch(() => ({
                status: 200,
                json: async () => ({ status: 'ERROR', message: 'Authentication required' }),
            })),
            identityHeaderProvider: stubIdentity, logger: quietLogger,
        });
        const reg = await b.register();
        assert.equal(reg.status, 'failed');
        assert.equal(reg.error, 'Authentication required');
    });

    test('NEGATIVE CONTROL — a transport error => failed, not a throw', async () => {
        const b = createServiceBootstrap({
            manifest: MANIFEST(), selfRegister: true, coreApiUrl: 'https://stub/apifront',
            fetchImpl: async () => { throw new Error('ECONNREFUSED stub'); },
            identityHeaderProvider: stubIdentity, logger: quietLogger,
        });
        const reg = await b.register();
        assert.equal(reg.status, 'failed');
        assert.match(reg.error, /ECONNREFUSED stub/);
    });

    test('NEGATIVE CONTROL — an unmintable identity => failed, naming the mint failure', async () => {
        const b = createServiceBootstrap({
            manifest: MANIFEST(), selfRegister: true, coreApiUrl: 'https://stub/apifront',
            fetchImpl: stubFetch(okResponse),
            identityHeaderProvider: async () => { throw new Error('local ADC cannot mint an ID token'); },
            logger: quietLogger,
        });
        const reg = await b.register();
        assert.equal(reg.status, 'failed');
        assert.match(reg.error, /local ADC cannot mint an ID token/);
        // No session-token fallback exists: one surface, one credential.
    });

    test('NEGATIVE CONTROL — a non-JSON response => failed, naming the parse failure', async () => {
        const b = createServiceBootstrap({
            manifest: MANIFEST(), selfRegister: true, coreApiUrl: 'https://stub/apifront',
            fetchImpl: stubFetch(() => ({
                status: 502,
                json: async () => { throw new Error('Unexpected token < in JSON'); },
            })),
            identityHeaderProvider: stubIdentity, logger: quietLogger,
        });
        const reg = await b.register();
        assert.equal(reg.status, 'failed');
        assert.match(reg.error, /non-JSON response \(HTTP 502\)/);
    });

    test('a failure LOGS loudly — it is not merely recorded', async () => {
        const errors = [];
        const b = createServiceBootstrap({
            manifest: MANIFEST(), selfRegister: true, coreApiUrl: 'https://stub/apifront',
            fetchImpl: async () => { throw new Error('boom'); },
            identityHeaderProvider: stubIdentity,
            logger: { log() {}, error: (m) => errors.push(m) },
        });
        await b.register();
        assert.equal(errors.length, 1);
        assert.match(errors[0], /registration FAILED — boom/);
        assert.match(errors[0], /mesh still advertises the PREVIOUS manifest/);
    });

    test('selfRegister:false => skipped, naming the config key that caused it', async () => {
        const fetchImpl = stubFetch(okResponse);
        const b = createServiceBootstrap({
            manifest: MANIFEST(), selfRegister: false, selfRegisterConfigKey: 'BEAST_SELF_REGISTER',
            fetchImpl, identityHeaderProvider: stubIdentity, logger: quietLogger,
        });
        const reg = await b.register();
        assert.equal(reg.status, 'skipped');
        assert.equal(reg.reason, 'BEAST_SELF_REGISTER=false');
        assert.equal(fetchImpl.calls.length, 0, 'skipped must make no call');
    });
});

describe('computeManifestObjectHash (owned by ../src/manifest/index.js)', () => {
    test('is key-order independent', () => {
        const a = { service: { name: 'x', version: '1' }, commands: { c: { d: 1, e: 2 } } };
        const b = { commands: { c: { e: 2, d: 1 } }, service: { version: '1', name: 'x' } };
        assert.equal(computeManifestObjectHash(a), computeManifestObjectHash(b));
    });

    test('changes when any value changes (negative control)', () => {
        const a = { service: { name: 'x', version: '1' }, commands: {} };
        const b = { service: { name: 'x', version: '2' }, commands: {} };
        assert.notEqual(computeManifestObjectHash(a), computeManifestObjectHash(b));
    });
});


describe('authorizationFrom — the v9/v10 shape guard, exercised', () => {
    /**
     * The pre-v10 reader, preserved as a FIXTURE. This is the code that shipped, and the code
     * that POSTed unauthenticated across five deployed revisions once google-auth-library v10
     * started returning a Headers instance. The battery below is run against it to prove the
     * battery can actually catch the bug — a test that passes on the broken implementation is
     * measuring nothing.
     */
    function plainObjectOnly(minted) {
        const authorization = minted?.Authorization || minted?.authorization;
        if (!authorization) throw new Error('no Authorization value');
        return authorization;
    }

    test('a real WHATWG Headers instance yields the value', () => {
        const h = new Headers({ authorization: 'Bearer from-headers-instance' });
        assert.equal(authorizationFrom(h), 'Bearer from-headers-instance');
    });

    test('NEGATIVE CONTROL — the pre-v10 reader FAILS that exact case', () => {
        const h = new Headers({ authorization: 'Bearer from-headers-instance' });
        // This is the measured defect: no enumerable own properties, so the plain-object read
        // finds nothing. If this ever stops throwing, the fixture no longer exhibits the failure
        // and the test above has stopped proving anything.
        assert.throws(() => plainObjectOnly(h), /no Authorization value/);
        assert.equal(Object.keys(h).length, 0, 'a Headers instance must have no enumerable own keys');
    });

    test('a v9 plain object with capitalised Authorization yields the value', () => {
        assert.equal(authorizationFrom({ Authorization: 'Bearer v9-caps' }), 'Bearer v9-caps');
    });

    test('a plain object with lowercase authorization yields the value', () => {
        assert.equal(authorizationFrom({ authorization: 'Bearer v9-lower' }), 'Bearer v9-lower');
    });

    test('an EMPTY Headers instance throws, naming the shape it saw', () => {
        assert.throws(() => authorizationFrom(new Headers()),
            /carried no Authorization value \(saw a Headers instance/);
    });

    test('an empty plain object throws, naming the shape it saw', () => {
        assert.throws(() => authorizationFrom({}), /carried no Authorization value \(saw a object/);
    });

    test('an object carrying only other headers throws — it does not return a wrong value', () => {
        assert.throws(() => authorizationFrom({ 'content-type': 'application/json' }),
            /carried no Authorization value/);
    });

    test('null and undefined throw rather than yielding undefined', () => {
        assert.throws(() => authorizationFrom(null), /saw a null/);
        assert.throws(() => authorizationFrom(undefined), /saw a undefined/);
    });

    test('a Headers instance carrying only other headers throws', () => {
        assert.throws(() => authorizationFrom(new Headers({ 'content-type': 'application/json' })),
            /saw a Headers instance/);
    });
});
