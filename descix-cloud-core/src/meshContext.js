/**
 * @descix/cloud-core — Signed `_descix` Mesh Context (WS-MESH-SIGNED-CTX)
 *
 * THE CANONICAL OWNER of the signed mesh contract. Core (apifront) imports the
 * signer; every downstream microservice imports the verifier middleware. No
 * service reimplements signing or verification (canonical-contracts mandate).
 *
 * Background: when Core proxies a command to a downstream service
 * (serviceManifestManager.js::proxyToExternalService) it injects a `_descix`
 * envelope as a plain body field with a static `X-DeSciX-Service:'core'` header —
 * no cryptographic proof of origin. Since services are publicly reachable, a
 * forged `_descix` POSTed directly impersonates any user. This module signs that
 * envelope: a PEM keypair with `crypto.createSign/createVerify('SHA256')` and a
 * base64 signature.
 *
 * Design: DeSciX/V2_docs/design/proposed/mesh-signed-ctx-design-2026-07-03.md
 *
 * This module also owns the two facts every verifier needs and no app may carry: the
 * per-environment TRUST ANCHOR (key id + public key the platform signs under) and the /api GATE
 * built from a resolved posture. WHEN a service must verify is decided in ONE place,
 * CloudConfig._assertMeshPosture (config.js); an app mounts through mountMeshApi (meshApi.js).
 */

import crypto from 'crypto';
import { randomUUID } from 'crypto';

/**
 * Typed field list of the canonical signed `_descix` envelope. This is THE
 * contract — the conformance test asserts normalizeMeshContext() produces
 * exactly this key set, so a hand-edit that adds/removes an envelope field
 * without updating this list fails CI.
 *
 * `signedAt` and `nonce` are anti-replay fields that live INSIDE the signed bag
 * so they cannot be altered in transit.
 */
export const MESH_CTX_FIELDS = Object.freeze([
    'user',          // { id, email, wallet_address } | null
    'entitlements',  // string[]
    'serviceId',     // string — target service name
    'timestamp',     // number — ms epoch (retained from the legacy envelope)
    'signedAt',      // number — ms epoch, authoritative replay clock
    'nonce',         // string — uuid, dedupe hook for future hardening
]);

/** Header names carrying the signature alongside the body-borne `_descix` bag. */
export const MESH_CTX_HEADERS = Object.freeze({
    SIGNATURE: 'x-descix-ctx-signature',
    KEY_ID: 'x-descix-ctx-key-id',
    SIGNED_AT: 'x-descix-ctx-signed-at',
});

/** Default replay window (ms). A signature older/newer than this is rejected. */
export const DEFAULT_MAX_SKEW_MS = 5 * 60 * 1000;

/**
 * THE platform's mesh trust anchors, one per DEPLOY_ENV: the key id apifront signs under and the
 * PUBLIC key every downstream verifier checks against. Public keys only — the private halves are
 * MESH_CTX_SIGNING_KEY in descix_config_{env}, read by the signer and nothing else.
 *
 * One owner for a platform fact. These values used to be hand-copied into every app's
 * defaults-config*.json (and into Cloud's, from which the deploy lane layered them into every
 * bundle); a rotation would have silently broken every copy nobody re-made. CloudConfig now
 * REFUSES a consumer config that carries MESH_CTX_KEY_ID or MESH_CTX_PUBLIC_KEY, and resolves
 * both from this table by DEPLOY_ENV. The signer proves at boot that its private key derives the
 * anchor for its env, so a mismatch is a boot refusal at apifront rather than a 401 at every
 * verifier. Rotation = change this table, publish, redeploy signer and services.
 *
 * Measured 2026-09-29: PROD apifront-signed traffic is accepted by an enforcing service
 * verifying under mesh-prod-1; DEV apifront-signed traffic by one verifying under mesh-dev-1.
 * No demo apifront is deployed, so mesh-demo-1 is unmeasured.
 */
export const MESH_TRUST_ANCHORS = Object.freeze({
    dev: Object.freeze({
        keyId: 'mesh-dev-1',
        publicKeyPem: '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEDWrDg8Q7eOROcPT8u1JQJvTRo7nX\niQWPVTq/WNE532byWXvDpfQw+pDSJbO4X3AEme1hqVFEJW5DTG2HPtjonA==\n-----END PUBLIC KEY-----\n',
    }),
    demo: Object.freeze({
        keyId: 'mesh-demo-1',
        publicKeyPem: '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEOEGp/NoqaeGeFlFbb0bOhkBs55zC\n68kksLmxyB7MapEIDpyeNyQtVqwXzYFsECG9j30V+RR8TknGvZyKxhSuvA==\n-----END PUBLIC KEY-----\n',
    }),
    prod: Object.freeze({
        keyId: 'mesh-prod-1',
        publicKeyPem: '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEWcMImLkyCip9NUAcrX23ktnQaOby\nBaFVq7VBpZi7cWj9yv5k2PT00djUIQ0UWP3Mluq7ZSTYx8nGSuuXXrAL8Q==\n-----END PUBLIC KEY-----\n',
    }),
});

/** Config keys that name a platform trust fact. A consumer config carrying either is refused. */
export const MESH_TRUST_CONFIG_KEYS = Object.freeze(['MESH_CTX_KEY_ID', 'MESH_CTX_PUBLIC_KEY']);

/** The verification modes a verifier accepts. On a managed runtime only 'enforce' boots. */
export const MESH_VERIFY_MODES = Object.freeze(['warn', 'enforce']);

/**
 * The trust anchor for an environment, or null when the platform publishes none for it.
 * @param {string} deployEnv
 * @param {object} [anchors=MESH_TRUST_ANCHORS]
 * @returns {{keyId: string, publicKeyPem: string}|null}
 */
export function resolveMeshTrustAnchor(deployEnv, anchors = MESH_TRUST_ANCHORS) {
    if (!deployEnv || !Object.prototype.hasOwnProperty.call(anchors, deployEnv)) return null;
    return anchors[deployEnv];
}

/**
 * TRUE when `privateKeyPem` is the private half of `publicKeyPem` (compared as SPKI DER).
 * Throws a MeshContextError when either key cannot be parsed — an unparseable key is a
 * misconfiguration, not a mismatch.
 */
export function privateKeyMatchesPublicKey(privateKeyPem, publicKeyPem) {
    let derived;
    let published;
    try {
        derived = crypto.createPublicKey(crypto.createPrivateKey(privateKeyPem)).export({ type: 'spki', format: 'der' });
        published = crypto.createPublicKey(publicKeyPem).export({ type: 'spki', format: 'der' });
    } catch (err) {
        throw new MeshContextError(`Mesh key could not be parsed: ${err.message}`, 'MESH_CTX_BAD_KEY');
    }
    return derived.length === published.length && crypto.timingSafeEqual(derived, published);
}

/** Typed error for all signer/verifier failures. */
export class MeshContextError extends Error {
    constructor(message, code = 'MESH_CTX_ERROR') {
        super(message);
        this.name = 'MeshContextError';
        this.code = code;
    }
}

/** Only the user sub-fields that are part of the canonical contract. */
function normalizeUser(user) {
    if (!user) return null;
    return {
        id: user.id ?? null,
        email: user.email ?? null,
        // Canonical snake_case — matches the platform User model and every
        // production consumer. NEVER `walletAddress`.
        wallet_address: user.wallet_address ?? null,
    };
}

/**
 * Return the full canonical envelope from a partial. Fills every MESH_CTX_FIELDS
 * key; drops anything not in the contract. This is the single normalizer both
 * the producer (Core) and consumers ferry — no other module may re-enumerate
 * the field list by hand.
 *
 * @param {object} partial
 * @returns {{user, entitlements, serviceId, timestamp, signedAt, nonce}}
 */
export function normalizeMeshContext(partial = {}) {
    const now = Date.now();
    return {
        user: normalizeUser(partial.user),
        entitlements: Array.isArray(partial.entitlements) ? partial.entitlements : [],
        serviceId: partial.serviceId ?? null,
        timestamp: typeof partial.timestamp === 'number' ? partial.timestamp : now,
        signedAt: typeof partial.signedAt === 'number' ? partial.signedAt : now,
        nonce: typeof partial.nonce === 'string' && partial.nonce ? partial.nonce : randomUUID(),
    };
}

/**
 * Deterministic canonical serialization used by BOTH sign and verify, so the
 * signed bytes are identical by construction across processes/runtimes (no
 * reliance on V8 insertion-order). Keys are sorted recursively.
 *
 * @param {object} bag - a normalized mesh-context bag
 * @returns {string}
 */
export function serializeMeshContext(bag) {
    const normalized = normalizeMeshContext(bag);
    return JSON.stringify(normalized, canonicalReplacer(normalized));
}

/** Build a replacer that emits object keys in sorted order at every depth. */
function canonicalReplacer() {
    return function (key, value) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return Object.keys(value)
                .sort()
                .reduce((acc, k) => {
                    acc[k] = value[k];
                    return acc;
                }, {});
        }
        return value;
    };
}

/**
 * Sign a mesh-context bag. Returns the signature metadata; the bag itself
 * travels in the request body as `_descix` exactly as today. Throws (fail-loud,
 * anti-pattern #7 — no unsigned fallback) if no private key is configured.
 *
 * @param {object} bag - partial or full mesh-context (will be normalized)
 * @param {{privateKeyPem: string, keyId: string}} opts
 * @returns {{ signedContext: object, signature: string, keyId: string, signedAt: number }}
 */
export function signMeshContext(bag, { privateKeyPem, keyId } = {}) {
    if (!privateKeyPem) {
        throw new MeshContextError(
            'Cannot sign mesh context: MESH_CTX_SIGNING_KEY is not configured',
            'MESH_CTX_NO_SIGNING_KEY'
        );
    }
    if (!keyId) {
        throw new MeshContextError(
            'Cannot sign mesh context: MESH_CTX_KEY_ID is not configured',
            'MESH_CTX_NO_KEY_ID'
        );
    }
    // Stamp signedAt/nonce at sign time so they are inside the signed bytes.
    const signedContext = normalizeMeshContext({ ...bag, signedAt: Date.now(), nonce: undefined });
    let signature;
    try {
        const signer = crypto.createSign('SHA256');
        signer.update(serializeMeshContext(signedContext));
        signer.end();
        signature = signer.sign(privateKeyPem, 'base64');
    } catch (err) {
        throw new MeshContextError(`Mesh context signing failed: ${err.message}`, 'MESH_CTX_SIGN_FAILED');
    }
    return { signedContext, signature, keyId, signedAt: signedContext.signedAt };
}

/**
 * Convenience for the OUTBOUND proxy leg (apifront). Signs the bag and returns
 * both the canonical signed `_descix` (to place in the request body) and the
 * header map (to spread into the outbound request headers). Keeps ALL mesh
 * signing in the one canonical owner — the proxy just ferries the results.
 *
 * @param {object} bag - partial mesh-context (user/entitlements/serviceId/timestamp)
 * @param {{privateKeyPem: string, keyId: string}} opts
 * @returns {{ signedContext: object, headers: Record<string,string> }}
 */
export function buildOutboundMeshHeaders(bag, { privateKeyPem, keyId } = {}) {
    const { signedContext, signature, signedAt } = signMeshContext(bag, { privateKeyPem, keyId });
    return {
        signedContext,
        headers: {
            [MESH_CTX_HEADERS.SIGNATURE]: signature,
            [MESH_CTX_HEADERS.KEY_ID]: keyId,
            [MESH_CTX_HEADERS.SIGNED_AT]: String(signedAt),
        },
    };
}

/**
 * Low-level verification of a bag + signature against a public key. Pure — no
 * Express. Returns a result object; never throws on a bad signature (only on a
 * genuinely malformed public key, surfaced as valid:false).
 *
 * @param {object} bag - the `_descix` bag from the request body
 * @param {string} signature - base64 signature from the X-DeSciX-Ctx-Signature header
 * @param {{publicKeyPem: string, keyId: string, presentedKeyId: string, maxSkewMs: number}} opts
 * @returns {{ valid: boolean, reason?: string, code?: string }}
 */
export function verifyMeshContext(bag, signature, { publicKeyPem, keyId, presentedKeyId, maxSkewMs = DEFAULT_MAX_SKEW_MS } = {}) {
    if (!publicKeyPem) return { valid: false, reason: 'No public key configured for verifier', code: 'MESH_CTX_NO_PUBLIC_KEY' };
    if (!bag) return { valid: false, reason: 'Missing _descix context', code: 'MESH_CTX_MISSING' };
    if (!signature) return { valid: false, reason: 'Missing mesh context signature', code: 'MESH_CTX_UNSIGNED' };
    if (presentedKeyId && keyId && presentedKeyId !== keyId) {
        return { valid: false, reason: `Unknown key id '${presentedKeyId}' (expected '${keyId}')`, code: 'MESH_CTX_KEYID_MISMATCH' };
    }

    // Replay window — authoritative clock is the SIGNED signedAt inside the bag.
    const signedAt = typeof bag.signedAt === 'number' ? bag.signedAt : null;
    if (signedAt === null) {
        return { valid: false, reason: 'Mesh context has no signedAt', code: 'MESH_CTX_NO_SIGNED_AT' };
    }
    const skew = Math.abs(Date.now() - signedAt);
    if (skew > maxSkewMs) {
        return { valid: false, reason: `Mesh context outside replay window (${skew}ms > ${maxSkewMs}ms)`, code: 'MESH_CTX_EXPIRED' };
    }

    let ok = false;
    try {
        const verifier = crypto.createVerify('SHA256');
        verifier.update(serializeMeshContext(bag));
        verifier.end();
        ok = verifier.verify(publicKeyPem, signature, 'base64');
    } catch (err) {
        return { valid: false, reason: `Signature verification error: ${err.message}`, code: 'MESH_CTX_VERIFY_ERROR' };
    }
    if (!ok) return { valid: false, reason: 'Invalid mesh context signature', code: 'MESH_CTX_INVALID' };
    return { valid: true };
}

/**
 * Build an Express middleware that verifies the signed `_descix` on inbound
 * proxied requests. The low-level primitive: an app does not call this — it mounts
 * through mountMeshApi (meshApi.js), which builds the verifier from the posture
 * CloudConfig resolved at boot.
 *
 *   - mode 'enforce': missing/invalid/expired signature → 401, handler not run.
 *   - mode 'warn'   : logs the failure, stamps req.meshContextVerified=false, next().
 *
 * Hard-fails at mount (fail-loud, no silent default) if mode or publicKeyPem is
 * unresolved.
 *
 * @param {{ mode: 'warn'|'enforce', publicKeyPem: string, keyId: string, maxSkewMs?: number, logger?: object }} opts
 * @returns {import('express').RequestHandler}
 */
export function createMeshContextVerifier({ mode, publicKeyPem, keyId, maxSkewMs = DEFAULT_MAX_SKEW_MS, logger = console } = {}) {
    if (mode !== 'warn' && mode !== 'enforce') {
        throw new MeshContextError(
            `createMeshContextVerifier requires mode 'warn' or 'enforce' (got ${JSON.stringify(mode)}). Set MESH_CTX_VERIFY_MODE.`,
            'MESH_CTX_BAD_MODE'
        );
    }
    if (!publicKeyPem) {
        throw new MeshContextError(
            'createMeshContextVerifier requires publicKeyPem (the platform trust anchor for this DEPLOY_ENV — MESH_TRUST_ANCHORS).',
            'MESH_CTX_NO_PUBLIC_KEY'
        );
    }
    if (!keyId) {
        throw new MeshContextError(
            'createMeshContextVerifier requires keyId (the platform trust anchor for this DEPLOY_ENV — MESH_TRUST_ANCHORS).',
            'MESH_CTX_NO_KEY_ID'
        );
    }

    return function meshContextVerifier(req, res, next) {
        const bag = req.body?._descix;
        const signature = req.headers[MESH_CTX_HEADERS.SIGNATURE];
        const presentedKeyId = req.headers[MESH_CTX_HEADERS.KEY_ID];
        const result = verifyMeshContext(bag, signature, { publicKeyPem, keyId, presentedKeyId, maxSkewMs });

        req.meshContextVerified = result.valid;
        if (result.valid) return next();

        if (mode === 'enforce') {
            logger.warn?.(`[meshContext] REJECT (${result.code}): ${result.reason}`);
            return res.status(401).json({
                success: false,
                error: `Mesh context verification failed: ${result.reason}`,
                code: result.code,
            });
        }
        // warn mode — observe, do not break
        logger.warn?.(`[meshContext] WARN (${result.code}): ${result.reason} — proceeding (warn mode)`);
        return next();
    };
}

/**
 * Build the /api gate from a posture CloudConfig resolved at boot (config.meshPosture).
 *
 *   posture.verify === true  -> the signed-context verifier in posture.mode, under the anchor.
 *   posture.verify === false -> a LOCAL-ONLY pass-through: stamps req.meshContextVerified=false
 *                               on every request so a handler can never mistake an unverified
 *                               bag for a verified one, and says so at mount. CloudConfig never
 *                               resolves verify:false for a mesh service on a managed runtime.
 *
 * @param {{verify: boolean, mode?: string, keyId?: string, publicKeyPem?: string, reason?: string}} posture
 * @param {{logger?: object}} [opts]
 * @returns {import('express').RequestHandler}
 */
export function createMeshApiGate(posture, { logger = console } = {}) {
    if (!posture || typeof posture.verify !== 'boolean') {
        throw new MeshContextError(
            'createMeshApiGate requires the posture CloudConfig resolved at boot (config.meshPosture). ' +
            'Mount through mountMeshApi after initializeCloudConfig() has resolved.',
            'MESH_CTX_NO_POSTURE'
        );
    }
    if (posture.verify) {
        logger.log?.(`[meshContext] /api VERIFIED (mode=${posture.mode}, keyId=${posture.keyId})`);
        return createMeshContextVerifier({
            mode: posture.mode,
            publicKeyPem: posture.publicKeyPem,
            keyId: posture.keyId,
            logger,
        });
    }
    logger.warn?.(`[meshContext] /api UNVERIFIED — ${posture.reason}. Every request is stamped meshContextVerified=false.`);
    return function meshContextUnverified(req, res, next) {
        req.meshContextVerified = false;
        next();
    };
}

export default {
    MESH_CTX_FIELDS,
    MESH_CTX_HEADERS,
    DEFAULT_MAX_SKEW_MS,
    MeshContextError,
    normalizeMeshContext,
    serializeMeshContext,
    signMeshContext,
    buildOutboundMeshHeaders,
    verifyMeshContext,
    createMeshContextVerifier,
    MESH_TRUST_ANCHORS,
    MESH_TRUST_CONFIG_KEYS,
    MESH_VERIFY_MODES,
    resolveMeshTrustAnchor,
    privateKeyMatchesPublicKey,
    createMeshApiGate,
};
