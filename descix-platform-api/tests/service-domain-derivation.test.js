#!/usr/bin/env node
/**
 * ws-c4-platform P1 — the platform DERIVES a service's domain; a service never declares it.
 *
 * Interface (fabric `interface-ws-c4-I1-domain`, binding literal):
 *   "A service does NOT declare its own domain. The platform derives it at registration as
 *    <app_id>.<env>.descix.net, where app_id is the DeSciX app id (composed
 *    {community_id}-{short_name}). A manifest that still declares service.domain is REFUSED with
 *    error code SERVICE_DOMAIN_IS_DERIVED, naming the value that would have been derived.
 *    SCOPE: this derivation governs APP-BOUND services (those declaring service.app_id and
 *    service.community_id, the App-Owner registration branch). PLATFORM services registered
 *    through the Admin branch without an app binding keep an explicitly configured domain and are
 *    outside the derivation."
 *
 * `<env>.descix.net` is NOT re-derived from an env token here. The platform already owns exactly
 * one env->host fact: SITE_DOMAIN (dev.descix.net / demo.descix.net / descix.net). Re-deriving a
 * host from an env string is the hand-mirror that was already removed once from
 * GCSPaths.appPublicUrl ("env === 'prod' ? 'descix.net' : env+'.descix.net'"). So the owner takes
 * `site_domain` as an input, exactly as composeUserDocServeUrl does, and the composition is
 * `{app_id}.{site_domain}`.
 *
 * Run: node --test tests/service-domain-derivation.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
    SERVICE_DOMAIN_IS_DERIVED,
    composeServiceDomain,
    isAppBoundService,
    resolveServiceDomain,
    SERVICE_NOT_ROUTABLE,
    requireServiceOrigin,
} from '../src/naming/index.js';

import { createServiceBootstrap } from '../src/service-bootstrap/index.js';

const quietLogger = { log() {}, error() {}, warn() {} };

/** An APP-BOUND manifest, post-change shape: NO service.domain. */
function appBoundManifest(extra = {}) {
    return {
        service: {
            name: 'daita-ssgpod',
            version: '1.0.0',
            description: 'ssgpod',
            healthEndpoint: '/health',
            debugPort: 3015,
            app_id: 'daita-ssgpod',
            community_id: 'daita',
            ...extra,
        },
        commands: { do_a_thing: { description: 'does a thing', handler: 'x.y' } },
    };
}

/** An ADMIN-branch PLATFORM manifest: no app binding, explicit domain. Outside the derivation. */
function platformManifest(extra = {}) {
    return {
        service: {
            name: 'cloud',
            version: '2.0.0',
            description: 'platform core',
            domain: 'api.descix.net',
            healthEndpoint: '/api/health',
            ...extra,
        },
        commands: { core_thing: { description: 'a core thing', handler: 'x.y' } },
    };
}

describe('composeServiceDomain — the ONE derivation', () => {
    it('composes {app_id}.{site_domain}', () => {
        assert.equal(
            composeServiceDomain({ app_id: 'daita-ssgpod', site_domain: 'dev.descix.net' }),
            'daita-ssgpod.dev.descix.net'
        );
        assert.equal(
            composeServiceDomain({ app_id: 'daita-ssgpod', site_domain: 'descix.net' }),
            'daita-ssgpod.descix.net'
        );
        assert.equal(
            composeServiceDomain({ app_id: 'powch', site_domain: 'dev.descix.net' }),
            'powch.dev.descix.net'
        );
    });

    it('fails loud on a missing app_id or site_domain — no hardcoded fallback', () => {
        assert.throws(() => composeServiceDomain({ site_domain: 'dev.descix.net' }), /app_id is required/);
        assert.throws(() => composeServiceDomain({ app_id: 'a' }), /site_domain is required/);
    });
});

describe('isAppBoundService — the SCOPE test is manifest shape, not a name list', () => {
    it('app_id AND community_id => app-bound', () => {
        assert.equal(isAppBoundService({ app_id: 'daita-ssgpod', community_id: 'daita' }), true);
    });
    it('either one missing => NOT app-bound (Admin branch)', () => {
        assert.equal(isAppBoundService({ app_id: 'daita-ssgpod' }), false);
        assert.equal(isAppBoundService({ community_id: 'daita' }), false);
        assert.equal(isAppBoundService({ name: 'cloud' }), false);
    });
});

describe('resolveServiceDomain — app-bound branch DERIVES', () => {
    it('derives the domain for an app-bound manifest carrying no domain', () => {
        const r = resolveServiceDomain({ manifest: appBoundManifest(), site_domain: 'dev.descix.net' });
        assert.deepEqual(r, { domain: 'daita-ssgpod.dev.descix.net', app_bound: true, derived: true });
    });

    it('REFUSES a declared service.domain with code SERVICE_DOMAIN_IS_DERIVED, naming the derived value', () => {
        let err;
        try {
            resolveServiceDomain({
                manifest: appBoundManifest({ domain: 'daita-ssgpod.descix.net' }),
                site_domain: 'dev.descix.net',
            });
        } catch (e) { err = e; }
        assert.ok(err, 'expected a refusal');
        assert.equal(err.code, SERVICE_DOMAIN_IS_DERIVED);
        assert.equal(err.declared_domain, 'daita-ssgpod.descix.net');
        assert.equal(err.derived_domain, 'daita-ssgpod.dev.descix.net');
        // The message must NAME the value that would have been derived.
        assert.match(err.message, /daita-ssgpod\.dev\.descix\.net/);
        assert.match(err.message, /SERVICE_DOMAIN_IS_DERIVED/);
    });

    it('refuses a declared domain even when it happens to EQUAL the derived value (declaration is the defect)', () => {
        assert.throws(
            () => resolveServiceDomain({
                manifest: appBoundManifest({ domain: 'daita-ssgpod.dev.descix.net' }),
                site_domain: 'dev.descix.net',
            }),
            (e) => e.code === SERVICE_DOMAIN_IS_DERIVED
        );
    });

    it('refuses the declaration WITHOUT needing site_domain (the declaration is knowable without env)', () => {
        let err;
        try {
            resolveServiceDomain({ manifest: appBoundManifest({ domain: 'x.descix.net' }) });
        } catch (e) { err = e; }
        assert.ok(err);
        assert.equal(err.code, SERVICE_DOMAIN_IS_DERIVED);
        assert.match(err.message, /daita-ssgpod\.\{SITE_DOMAIN\}/);
    });

    it('fails loud when an app-bound manifest needs derivation but site_domain is absent', () => {
        assert.throws(
            () => resolveServiceDomain({ manifest: appBoundManifest() }),
            /site_domain is required/
        );
    });
});

describe('resolveServiceDomain — Admin/platform branch keeps its explicit domain', () => {
    it('a service with NO app binding keeps its declared domain and is NOT refused', () => {
        const r = resolveServiceDomain({ manifest: platformManifest(), site_domain: 'dev.descix.net' });
        assert.deepEqual(r, { domain: 'api.descix.net', app_bound: false, derived: false });
    });

    it('an unbound service with no domain at all fails loud (nothing to route to)', () => {
        const m = platformManifest();
        delete m.service.domain;
        assert.throws(() => resolveServiceDomain({ manifest: m }), /must declare service\.domain/);
    });
});

describe('createServiceBootstrap — the SDK door refuses a declared domain', () => {
    it('REFUSES an app-bound manifest that declares service.domain, naming the derived value', () => {
        let err;
        try {
            createServiceBootstrap({
                manifest: appBoundManifest({ domain: 'daita-ssgpod.descix.net' }),
                selfRegister: false,
                siteDomain: 'dev.descix.net',
                logger: quietLogger,
            });
        } catch (e) { err = e; }
        assert.ok(err, 'expected the bootstrap to refuse');
        assert.equal(err.code, SERVICE_DOMAIN_IS_DERIVED);
        assert.match(err.message, /daita-ssgpod\.dev\.descix\.net/);
    });

    it('ACCEPTS an app-bound manifest with NO domain — validateManifest must no longer require one', () => {
        const b = createServiceBootstrap({
            manifest: appBoundManifest(),
            selfRegister: false,
            siteDomain: 'dev.descix.net',
            logger: quietLogger,
        });
        assert.equal(b.serviceDomain, 'daita-ssgpod.dev.descix.net');
    });

    it('ACCEPTS an app-bound manifest with no domain when siteDomain is NOT supplied (derivation is the platform\'s job at registration)', () => {
        const b = createServiceBootstrap({
            manifest: appBoundManifest(),
            selfRegister: false,
            logger: quietLogger,
        });
        assert.equal(b.serviceDomain, null);
    });

    it('an ADMIN-branch platform manifest with an explicit domain still boots (negative control on the refusal)', () => {
        const b = createServiceBootstrap({
            manifest: platformManifest(),
            selfRegister: false,
            siteDomain: 'dev.descix.net',
            logger: quietLogger,
        });
        assert.equal(b.serviceDomain, 'api.descix.net');
    });
});

describe('requireServiceOrigin — the ONE owner of "is this stored manifest routable"', () => {
    it('returns the origin for a stored manifest that carries a domain', () => {
        assert.equal(
            requireServiceOrigin({ name: 'daita-ssgpod', domain: 'daita-ssgpod.dev.descix.net' }),
            'https://daita-ssgpod.dev.descix.net'
        );
    });

    it('REFUSES a domain-less stored manifest instead of composing https://undefined/api', () => {
        let err;
        try {
            requireServiceOrigin({ name: 'daita-ssgpod', app_id: 'daita-ssgpod', community_id: 'daita' });
        } catch (e) {
            err = e;
        }
        assert.ok(err, 'expected a refusal');
        assert.equal(err.code, SERVICE_NOT_ROUTABLE);
        assert.equal(err.service_name, 'daita-ssgpod');
        assert.match(err.message, /carries no service\.domain/);
        assert.match(err.message, /bypassed the register_service door/);
        assert.match(err.message, /Refusing to compose 'https:\/\/undefined\/api'/);
    });

    it('refuses a non-string domain — the shape is the test, not truthiness alone', () => {
        assert.throws(() => requireServiceOrigin({ name: 's', domain: 123 }), { code: SERVICE_NOT_ROUTABLE });
        assert.throws(() => requireServiceOrigin({ name: 's', domain: '' }), { code: SERVICE_NOT_ROUTABLE });
        assert.throws(() => requireServiceOrigin(undefined), { code: SERVICE_NOT_ROUTABLE });
    });
});

describe('P1-R (3) what a NEWLY SCAFFOLDED service now generates at `npm run register`', () => {
    /** The manifest `descix app scaffold` writes: context injected, NO domain. */
    function scaffoldedManifest() {
        return {
            service: {
                name: 'my-new-service',
                version: '1.0.0',
                description: 'scaffolded',
                healthEndpoint: '/health',
                debugPort: 3099,
                app_id: 'my-new-service',
                community_id: 'daita',
            },
            commands: { my_new_service_ping: { handler: 'sampleCommands.ping', description: 'ping', mutating: false } },
        };
    }

    it('POSTs register_service to CORE_API_URL with the manifest — no Firestore, no declared domain', async () => {
        const calls = [];
        const bootstrap = createServiceBootstrap({
            manifest: scaffoldedManifest(),
            selfRegister: true,
            selfRegisterConfigKey: 'npm run register',
            coreApiUrl: 'https://dev.descix.net/apifront',
            siteDomain: 'dev.descix.net',
            logger: quietLogger,
            identityHeaderProvider: async (aud) => ({ Authorization: `Bearer id-token-for:${aud}` }),
            fetchImpl: async (url, init) => {
                calls.push({ url, init });
                return { status: 200, json: async () => ({ status: 'OK', message: 'registered' }) };
            },
        });

        const result = await bootstrap.register();
        assert.equal(result.status, 'ok', result.error || '');
        assert.equal(calls.length, 1);
        assert.equal(calls[0].url, 'https://dev.descix.net/apifront');
        assert.equal(calls[0].init.headers.Authorization, 'Bearer id-token-for:https://dev.descix.net/apifront');

        const body = JSON.parse(calls[0].init.body);
        assert.equal(body.command, 'register_service');
        assert.equal(body.params.manifest.service.name, 'my-new-service');
        assert.equal(
            body.params.manifest.service.domain,
            undefined,
            'the scaffolded service sends NO domain — register_service derives and stamps it'
        );
    });

    it('the scaffold NAMES the domain the platform will derive, without declaring it', () => {
        const bootstrap = createServiceBootstrap({
            manifest: scaffoldedManifest(),
            selfRegister: false,
            siteDomain: 'dev.descix.net',
            logger: quietLogger,
        });
        assert.equal(bootstrap.serviceDomain, 'my-new-service.dev.descix.net');
        assert.equal(bootstrap.manifest.service.domain, undefined, 'naming it must not write it onto the manifest');
    });

    it('NEGATIVE CONTROL: a scaffold that reintroduced a declared domain is REFUSED at this door', () => {
        const m = scaffoldedManifest();
        m.service.domain = 'my-new-service.descix.net';
        assert.throws(
            () => createServiceBootstrap({ manifest: m, selfRegister: false, siteDomain: 'dev.descix.net', logger: quietLogger }),
            (e) => e.message.includes(SERVICE_DOMAIN_IS_DERIVED) || /SERVICE_DOMAIN_IS_DERIVED/.test(e.message)
        );
    });
});
