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

import { createHash } from 'crypto';
import { GoogleAuth } from 'google-auth-library';
import { computeManifestHash, validateManifest } from '../manifest/index.js';

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
    const minted = await client.getRequestHeaders();
    // google-auth-library v10 returns a WHATWG `Headers` INSTANCE; v9 returned a plain object.
    // `Object.assign({}, headersInstance)` copies NOTHING (no enumerable own properties) — that
    // shape change once made a service POST with no Authorization header while logging success.
    // Read by shape, and refuse an unusable result rather than returning it.
    const authorization = typeof minted?.get === 'function'
        ? minted.get('authorization')
        : (minted?.Authorization || minted?.authorization);
    if (!authorization) {
        throw new Error(
            'minted identity headers carried no Authorization value (google-auth-library shape change?)'
        );
    }
    return { Authorization: authorization };
}

/**
 * SHA-256 over the whole manifest object, key-order-independent. Distinct from
 * `computeManifestHash`, which hashes ONLY `manifest.commands` (change detection for the command
 * set). This one answers "is the object served at /manifest the object /health reports from".
 *
 * @param {Object} manifest
 * @returns {string} hex digest
 */
export function computeManifestObjectHash(manifest) {
    const canonical = JSON.stringify(manifest, Object.keys(flatten(manifest)).sort());
    return createHash('sha256').update(canonical).digest('hex');
}

/** Collect every key name appearing anywhere in the object, for a stable JSON.stringify replacer. */
function flatten(value, acc = {}) {
    if (Array.isArray(value)) {
        for (const v of value) flatten(v, acc);
    } else if (value && typeof value === 'object') {
        for (const [k, v] of Object.entries(value)) {
            acc[k] = true;
            flatten(v, acc);
        }
    }
    return acc;
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
 * @param {Function} [options.fetchImpl=fetch]                     Injectable for tests.
 * @param {Function} [options.identityHeaderProvider=mintServiceIdentityHeaders] Injectable for tests.
 * @param {Object} [options.logger=console]                        Injectable for tests.
 * @returns {{manifest: Object, manifestHash: string, commandsHash: string,
 *            serveManifest: Function, registration: Object, register: Function,
 *            installOn: Function}}
 */
export function createServiceBootstrap(options = {}) {
    const {
        manifest,
        selfRegister,
        selfRegisterConfigKey = 'SERVICE_SELF_REGISTER',
        coreApiUrl = null,
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
        manifestHash,
        commandsHash,
        registration,
        serveManifest,
        installOn,
        register,
    };
    return handle;
}
