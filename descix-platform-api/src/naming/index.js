/**
 * @descix/platform-api/naming — Canonical token <-> community <-> app id derivation.
 *
 * Authority: CEO-D-2026-06-08-CANONICAL-TOKEN-COMMUNITY-APP-MODEL (MustKnow §1).
 *
 *   1. token <-> chain contract        1:1 (one symbol = one contract)
 *   2. community <-> token (per env)   community_id == lowercased(token_symbol)
 *   3. community IS its default app    app_id == community_id == lowercased(token_symbol)
 *   4. sub-apps                        {community_app_id}-{short_name}; short_name has NO '-'
 *   5. identifiers env-invariant; materialization (Firestore records) is per-env
 *   6. an app whose community is not materialized in that env is an INVALID ORPHAN
 *
 * LEAF MODULE — DEPENDENCY-FREE BY DESIGN. Imports nothing so both the HTTP-only CLI
 * and the cloud command handlers can share the SAME derivation logic. Do not add imports.
 *
 * `-` is the RESERVED separator. App IDs stay OPAQUE to routing — routing reads
 * community_id from Products metadata, it never parses an app_id. These helpers exist
 * to COMPOSE/VALIDATE ids at create time, not to decompose them at request time.
 */

// Token symbols are 1-7 uppercase alphanumerics (matches check_token_symbol_available).
export const TOKEN_SYMBOL_RE = /^[A-Z0-9]{1,7}$/;

// A sub-app short name: lowercase letters/digits/underscore. NO hyphen (reserved separator),
// no spaces, no other punctuation. Must start with a letter or digit.
export const APP_SHORT_NAME_RE = /^[a-z0-9][a-z0-9_]*$/;

/**
 * Canonical community_id / default app_id from a token symbol.
 * community_id == app_id == lowercased(token_symbol).
 *
 * @param {string} token_symbol
 * @returns {string} normalized id (lowercased, alphanumerics only)
 * @throws if the symbol is not 1-7 alphanumerics
 */
export function communityIdFromTokenSymbol(token_symbol) {
    if (!token_symbol || typeof token_symbol !== 'string') {
        throw new Error('token_symbol is required');
    }
    const symbolUpper = token_symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!TOKEN_SYMBOL_RE.test(symbolUpper)) {
        throw new Error('token_symbol must be 1-7 alphanumeric characters');
    }
    return symbolUpper.toLowerCase();
}

/**
 * Validate a sub-app short name. The short name is the part AFTER the community prefix.
 * It must not contain '-' (the reserved separator), spaces, or other punctuation.
 *
 * @param {string} short_name
 * @throws with an explicit, actionable message on any violation
 */
export function assertValidAppShortName(short_name) {
    if (!short_name || typeof short_name !== 'string') {
        throw new Error('app short name is required');
    }
    if (short_name.includes('-')) {
        throw new Error(
            `Invalid app short name '${short_name}': '-' is the reserved community/app separator. ` +
            `Pick a SHORT name with no hyphens (e.g. 'frqtl'); the unique app_id is composed as {community}-{short}.`
        );
    }
    if (!APP_SHORT_NAME_RE.test(short_name)) {
        throw new Error(
            `Invalid app short name '${short_name}': use lowercase letters, digits, and underscore only ` +
            `(must start with a letter or digit, no spaces or punctuation). Keep it SHORT.`
        );
    }
    return short_name;
}

/**
 * Compose the canonical unique app_id for a sub-app: {community_app_id}-{short_name}.
 * The community_app_id is the community's DEFAULT app id (== community_id == token_symbol).
 *
 * If short_name already equals community_id (the default-app case) the bare community_id
 * is returned unchanged — the default app is NOT prefixed, it IS the community.
 *
 * @param {string} community_id  the community's default app id (== community_id)
 * @param {string} short_name    sub-app short name (validated; no '-')
 * @returns {string} the unique app_id
 */
export function composeAppId(community_id, short_name) {
    if (!community_id || typeof community_id !== 'string') {
        throw new Error('community_id is required to compose an app_id');
    }
    const community = community_id.toLowerCase();
    const short = String(short_name).toLowerCase();
    // Default-app case: the community itself.
    if (short === community) {
        return community;
    }
    // Tolerate a caller that already passed the fully-prefixed id.
    if (short === `${community}-`.toLowerCase() || short.startsWith(`${community}-`)) {
        // already composed — validate the tail short-name has no further '-'
        const tail = short.slice(community.length + 1);
        assertValidAppShortName(tail);
        return `${community}-${tail}`;
    }
    assertValidAppShortName(short);
    return `${community}-${short}`;
}

// A caller-identity (passkey uid / canonical attribution id) tail is an OPAQUE, identity-derived
// value — NOT a human-picked short name. It legitimately carries the sanitized-credentialId /
// base64url / email-fallback alphabet (uppercase, '-', '_', '@', '.'), which APP_SHORT_NAME_RE
// deliberately forbids for hand-picked names. It must stay VERBATIM (never lowercased/rewritten)
// so distinct case-sensitive credential IDs can never collide onto one namespace — the injectivity
// is what makes "the name IS the authorization" a real self-scope guarantee, not a convention.
// The only hard constraints are Firestore-doc-id safety: no '/', no whitespace, not '.'/'..',
// non-empty, bounded length. Routing NEVER parses an app_id (it reads community_id from Products),
// so the reserved '-' separator inside the tail does not affect routing.
const USER_APP_TAIL_MAX = 256; // Firestore doc-id budget is 1500 bytes; `{community}-` + tail stays well under.

/**
 * Compose the canonical, self-scoping app_id for a MEMBER's own per-community app (doc home):
 *   {community_id}-{uid}
 * where `uid` is the caller's canonical attribution id (User.canonicalAttributionId(user) —
 * the passkey uid = sanitizeCredentialId(credentialId), or the normalized-email fallback).
 *
 * Authority: CEO-D-2026-07-18-PER-USER-APP. This is the "naming IS the authorization" primitive:
 * because the tail is derived purely from the authenticated caller's own identity, a member can
 * only ever address their OWN app — never another user's namespace. Handlers MUST pass the
 * server-resolved uid here, never a client-supplied value.
 *
 * Distinct from composeAppId: that composes HUMAN-picked sub-app short names (APP_SHORT_NAME_RE,
 * no '-'); this composes an OPAQUE identity tail kept verbatim. A user-app is UNLISTED and
 * site-less by design, so it needs no DNS-label / subdomain compliance.
 *
 * @param {string} community_id  the community's default app id (== community_id == token symbol)
 * @param {string} uid           the caller's canonical attribution id (server-resolved, verbatim)
 * @returns {string} the self-scoped user app_id `{community}-{uid}`
 * @throws if uid is missing or not a safe Firestore-doc-id fragment
 */
export function composeUserAppId(community_id, uid) {
    if (!community_id || typeof community_id !== 'string') {
        throw new Error('community_id is required to compose a user app_id');
    }
    if (!uid || typeof uid !== 'string') {
        throw new Error('uid (canonical attribution id) is required to compose a user app_id');
    }
    if (uid.includes('/')) {
        throw new Error(`Invalid uid '${uid}': '/' is not allowed in a Firestore doc id.`);
    }
    if (/\s/.test(uid)) {
        throw new Error(`Invalid uid '${uid}': whitespace is not allowed.`);
    }
    if (uid === '.' || uid === '..') {
        throw new Error(`Invalid uid '${uid}': '.' and '..' are reserved doc ids.`);
    }
    if (uid.length > USER_APP_TAIL_MAX) {
        throw new Error(`Invalid uid: exceeds ${USER_APP_TAIL_MAX} chars (got ${uid.length}).`);
    }
    // community prefix is normalized (it IS a token-derived id); the uid tail is preserved verbatim.
    return `${community_id.toLowerCase()}-${uid}`;
}

/**
 * Compose the canonical, DETERMINISTIC serve URL for a user-owned document, from the app subdomain
 * and the object's storage path — DERIVE, DON'T STORE (CEO ruling 2026-07-18). The URL is a pure
 * function of (app_id, site_domain, content_path), so any read surface (pull, list) can recompute
 * it without persisting a serve_url field.
 *
 *   https://{app_id}.{site_domain}/{content_path}
 *
 * where site_domain already encodes the env ({env}.descix.net in dev/demo, descix.net in prod) and
 * content_path is the object key AFTER the `{env}/{app_id}/` prefix (e.g. `files/{drive_doc_id}`).
 * Co-located with composeUserAppId because app_id here is a per-user app id ({community}-{uid}).
 *
 * NOTE (serving prerequisites — see the ws-drive-contributor-ingest deliverable gap report): this
 * composes the canonical URL SHAPE; whether it resolves depends on DNS-label validity of app_id and
 * on the edge-router serving the content_path's bucket/channel. The caller passes site_domain
 * (utils.SITE_DOMAIN) so this module stays dependency-free.
 *
 * @param {{ app_id: string, site_domain: string, content_path: string }} args
 * @returns {string} the deterministic serve URL
 */
export function composeUserDocServeUrl({ app_id, site_domain, content_path } = {}) {
    if (!app_id || typeof app_id !== 'string') throw new Error('app_id is required for a user doc serve URL');
    if (!site_domain || typeof site_domain !== 'string') throw new Error('site_domain is required for a user doc serve URL');
    if (!content_path || typeof content_path !== 'string') throw new Error('content_path is required for a user doc serve URL');
    const rel = content_path.replace(/^\/+/, '');
    return `https://${app_id}.${site_domain}/${rel}`;
}
