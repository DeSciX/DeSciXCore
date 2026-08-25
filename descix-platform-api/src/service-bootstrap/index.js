/**
 * @descix/platform-api/service-bootstrap
 *
 * THE one owner of "a microservice serves its manifest and registers it at boot".
 *
 * Two facts, one source: the manifest OBJECT the service loaded. `GET /manifest` serves that
 * object, `/health` reports the version and the registration outcome from the same handle, and
 * boot-time `register_service` sends that same object. A service that re-implements either half
 * grows a mirror, and a mirror drifts silently — which is exactly how a service came to SERVE
 * one version while the mesh ADVERTISED another.
 *
 * Owner rationale (measured, not assumed):
 *   - `@descix/app-sdk` is the BROWSER/React SDK (AppShell.jsx, providers, hooks). A microservice
 *     must not depend on React. Disqualified.
 *   - `@descix/cloud-core` owns microservice CONFIG bootstrap, but `manifestMiddleware`,
 *     `validateManifest`, `buildManifestFromStatic` and `computeManifestHash` all live in
 *     `@descix/platform-api/manifest`, and platform-api ALREADY depends on cloud-core. Homing the
 *     combined bootstrap in cloud-core would require cloud-core -> platform-api for the manifest
 *     half: a dependency CYCLE. Disqualified by the arrow, not by taste.
 *   - `@descix/platform-api` already owns the manifest half and may consume cloud-core. It is the
 *     only home where both halves sit on the legal side of the arrow.
 *
 * AUTHORIZATION. Registration authorizes as a platform-runtime SERVICE ACCOUNT: an OIDC ID-token
 * minted from ADC (audience = the exact apifront URL being called), which Cloud verifies against
 * the per-env `PLATFORM_RUNTIME_SERVICE_ACCOUNTS` allow-list
 * (DeSciX_Cloud/microservice/services/serviceAccountAuth.js::verifyPlatformServiceAccountOidc,
 * reached via apiFront.js's PLATFORM_SA_ACCEPTED_COMMANDS gate). There is no provisioned secret
 * and there is NO session-token fallback path here: one surface, one credential. A host that
 * cannot mint an ID-token (local developer ADC) sets the named opt-out below.
 *
 * NEVER SILENT. Registration reports `ok | failed | skipped` on `/health.registration` and logs a
 * line at boot. `skipped` is reachable ONLY by an explicit `selfRegister: false` from a named
 * config key — never by a missing value, an unset env var, or a caught error.
 */

import { GoogleAuth } from 'google-auth-library';
import {
    computeManifestHash,
    computeManifestObjectHash,
    validateManifest,
} from '../manifest/index.js';
import { resolveServiceDomain } from '../naming/index.js';

/**
 * Mint an `Authorization: Bearer <id_token>` header for `audienceUrl` from Application Default
 * Credentials. On Cloud Run this mints for the runtime service account off the metadata server
 * with zero setup. Under local developer ADC (user credentials) ID-token minting is unsupported
 * without impersonation and this REJECTS — callers surface that as a named registration failure.
 *
 * The audience MUST be the exact URL the token authorizes, not a wildcard or an origin.
 *
 * @param {string} audienceUrl
 * @returns {Promise<{Authorization: string}>} PLAIN-OBJECT headers, safe to spread.
 * @throws when ADC cannot mint, or when the minted headers carry no Authorization value.
 */
export async function mintServiceIdentityHeaders(audienceUrl) {
    const client = await new GoogleAuth().getIdTokenClient(audienceUrl);
    return { Authorization: authorizationFrom(await client.getRequestHeaders()) };
}

/**
 * Read the Authorization value out of whatever shape google-auth-library handed back.
 *
 * This is the guard, extracted so it can be TESTED. google-auth-library v10 changed
 * `getRequestHeaders()` to return a WHATWG `Headers` INSTANCE where v9 returned a plain object.
 * A `Headers` instance has no enumerable own properties, so `Object.assign({}, minted)` copies
 * NOTHING — a service once POSTed with no Authorization header at all while logging success,
 * across five deployed revisions. That is the failure this function exists to prevent, and a
 * guard that is never exercised is not a guard.
 *
 * Read by SHAPE (does it have a `get` method?), never by version number, and never by assuming a
 * plain object. Refuse an unusable result rather than returning a header bag that silently
 * authenticates nothing.
 *
 * @param {Headers|Object} minted — the value returned by `client.getRequestHeaders()`
 * @returns {string} the Authorization header value
 * @throws {Error} when no Authorization value can be read, naming the shape that was seen
 */
export function authorizationFrom(minted) {
    const authorization = typeof minted?.get === 'function'
        ? minted.get('authorization')
        : (minted?.Authorization || minted?.authorization);
    if (!authorization) {
        const shape = typeof minted?.get === 'function'
            ? 'a Headers instance'
            : `a ${minted === null ? 'null' : typeof minted}`;
        throw new Error(
            `minted identity headers carried no Authorization value (saw ${shape}; ` +
            'google-auth-library shape change?)'
        );
    }
    return authorization;
}

/**
 * Create the service's manifest-serve + self-registration handle.
 *
 * @param {Object} options
 * @param {Object} options.manifest        The LOADED manifest object. Served, hashed and registered
 *                                         as-is; this handle never re-reads it from disk.
 * @param {boolean} options.selfRegister   REQUIRED, no default. `true` registers at boot; `false`
 *                                         yields `skipped` naming `selfRegisterConfigKey`. Anything
 *                                         else throws — a missing value is a misconfiguration, not
 *                                         an opt-out.
 * @param {string} [options.selfRegisterConfigKey='SERVICE_SELF_REGISTER'] Name of the config key the
 *                                         caller read `selfRegister` from, quoted in the skip reason
 *                                         and in refusals so an operator knows which key to set.
 * @param {string} [options.coreApiUrl]    The env-correct Cloud apifront URL. REQUIRED when
 *                                         `selfRegister` is true; no hardcoded default exists.
 * @param {string} [options.siteDomain]    The env-owned SITE_DOMAIN (e.g. 'dev.descix.net'). Used
 *                                         ONLY to NAME the derived domain — the authoritative
 *                                         derivation happens at registration, in the platform. When
 *                                         omitted, `handle.serviceDomain` is null and a refusal
 *                                         names the env half by its config key rather than guessing
 *                                         a host. It is deliberately NOT required: the platform,
 *                                         not the service, owns the domain.
 * @param {Function} [options.fetchImpl=fetch]                     Injectable for tests.
 * @param {Function} [options.identityHeaderProvider=mintServiceIdentityHeaders] Injectable for tests.
 * @param {Object} [options.logger=console]                        Injectable for tests.
 * @returns {{manifest: Object, serviceDomain: string|null, manifestHash: string, commandsHash: string,
 *            serveManifest: Function, registration: Object, register: Function,
 *            installOn: Function}}
 */
export function createServiceBootstrap(options = {}) {
    const {
        manifest,
        selfRegister,
        selfRegisterConfigKey = 'SERVICE_SELF_REGISTER',
        coreApiUrl = null,
        siteDomain = null,
        fetchImpl = fetch,
        identityHeaderProvider = mintServiceIdentityHeaders,
        logger = console,
    } = options;

    if (!manifest?.service?.name || !manifest?.service?.version) {
        throw new Error(
            '[service-bootstrap] `manifest` must be the loaded manifest object with ' +
            'service.name and service.version. Refusing to boot on a manifest I cannot identify.'
        );
    }

    const validation = validateManifest(manifest);
    if (!validation.valid) {
        throw new Error(
            `[service-bootstrap] manifest for '${manifest.service.name}' is invalid: ` +
            validation.errors.join('; ')
        );
    }

    // A SERVICE DOES NOT DECLARE ITS OWN DOMAIN. The platform derives it from app_id + env at
    // registration. This door refuses a manifest that still declares one, loud, with
    // code SERVICE_DOMAIN_IS_DERIVED — the refusal and the derivation have ONE owner
    // (naming/resolveServiceDomain), which Cloud's register_service calls too, so the two
    // registration doors cannot drift. An app-bound manifest with no domain and no siteDomain
    // resolves to null here: that is correct, not a gap — the platform supplies the value.
    let serviceDomain = null;
    if (siteDomain || manifest.service.domain != null) {
        serviceDomain = resolveServiceDomain({ manifest, site_domain: siteDomain }).domain;
    }

    if (typeof selfRegister !== 'boolean') {
        throw new Error(
            `[service-bootstrap] \`selfRegister\` must be an explicit boolean read from ` +
            `\`${selfRegisterConfigKey}\`; got ${JSON.stringify(selfRegister)}. There is no default: ` +
            `a service either registers itself at boot or is explicitly configured not to.`
        );
    }

    if (selfRegister && !coreApiUrl) {
        throw new Error(
            `[service-bootstrap] \`coreApiUrl\` is required when \`${selfRegisterConfigKey}\` is true ` +
            `— it is the apifront endpoint this service registers against and the OIDC audience the ` +
            `identity token is minted for. Set it in defaults-config-{env}.json, or set ` +
            `\`${selfRegisterConfigKey}\` to false. Refusing to fall back to any hardcoded URL.`
        );
    }

    const version = manifest.service.version;
    // A SNAPSHOT of the manifest as it is right now. `serveManifest` serves the LIVE object by
    // reference, so this hash is only true for as long as nobody mutates that object. It is NOT
    // frozen here: a one-line `Object.freeze` is SHALLOW, and would block `manifest.commands = {}`
    // — the mutation nobody makes — while leaving `manifest.service.version = 'x'` and
    // `manifest.commands.foo = {}` untouched, which are the only mutations that would actually
    // invalidate this hash. A guard that cannot fail on the real failure mode is worse than none,
    // because it reads as protection. The real protection is that there is ONE object: the
    // adoption test pins served === registered by identity, not by immutability. If deep-freezing
    // the caller's manifest is wanted, that is a deliberate deep walk, not a one-liner.
    const manifestHash = computeManifestObjectHash(manifest);
    const commandsHash = computeManifestHash(manifest);

    /** Live registration outcome, mirrored onto /health. Starts as the honest pre-boot state. */
    const registration = {
        status: 'pending',
        version,
        at: null,
        error: null,
    };

    function settle(status, { error = null, reason = null } = {}) {
        registration.status = status;
        registration.at = new Date().toISOString();
        registration.error = error;
        if (reason) registration.reason = reason;
        return registration;
    }

    /**
     * Register this manifest with the platform. Call AFTER the listener is up, so the mesh never
     * routes to a port that is not yet accepting connections.
     *
     * Never throws: the outcome is the contract, and it is reported loudly on /health and in the
     * log. It is never swallowed.
     *
     * @returns {Promise<Object>} the settled `registration` object
     */
    async function register() {
        const name = manifest.service.name;

        if (!selfRegister) {
            const reason = `${selfRegisterConfigKey}=false`;
            logger.log(
                `[service-bootstrap] ${name} v${version}: registration SKIPPED (${reason}). ` +
                `The mesh will keep serving whatever manifest it already holds for '${name}'.`
            );
            return settle('skipped', { reason });
        }

        logger.log(
            `[service-bootstrap] ${name} v${version}: registering with ${coreApiUrl} ` +
            `(commands=${Object.keys(manifest.commands || {}).length}, ` +
            `manifest_hash=${manifestHash.slice(0, 16)}, commands_hash=${commandsHash.slice(0, 16)})`
        );

        try {
            const headers = { 'Content-Type': 'application/json' };
            Object.assign(headers, await identityHeaderProvider(coreApiUrl));

            const response = await fetchImpl(coreApiUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({ command: 'register_service', params: { manifest } }),
            });

            let body;
            try {
                body = await response.json();
            } catch (parseErr) {
                throw new Error(
                    `register_service returned a non-JSON response (HTTP ${response.status}): ${parseErr.message}`
                );
            }

            if (body?.status !== 'OK') {
                throw new Error(
                    body?.message || `register_service failed (HTTP ${response.status})`
                );
            }

            logger.log(
                `[service-bootstrap] ${name} v${version}: registration OK — ` +
                `${body?.message?.message || body?.message || 'registered'}`
            );
            return settle('ok');
        } catch (err) {
            // LOUD, and never swallowed: the mesh is now advertising a manifest that is not the one
            // this process serves, and every caller reading /health can see that.
            logger.error(
                `[service-bootstrap] ${name} v${version}: registration FAILED — ${err.message}. ` +
                `The mesh still advertises the PREVIOUS manifest for '${name}'; commands added or ` +
                `changed in this version are NOT reachable through the mesh until this succeeds.`
            );
            return settle('failed', { error: err.message });
        }
    }

    /** Express handler for `GET /manifest`, serving the loaded object. */
    function serveManifest(req, res) {
        res.json(manifest);
    }

    /**
     * Mount `GET /manifest` on an Express app.
     * @param {Object} app
     * @returns {Object} this handle, for chaining
     */
    function installOn(app) {
        app.get('/manifest', serveManifest);
        return handle;
    }

    const handle = {
        manifest,
        serviceDomain,
        manifestHash,
        commandsHash,
        registration,
        serveManifest,
        installOn,
        register,
    };
    return handle;
}
