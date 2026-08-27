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
 * Compose the canonical, DETERMINISTIC serve URL for an OPTED-IN-PUBLIC user document
 * (CEO-D-2026-07-18 serve_url ruling). DERIVE, DON'T STORE: a pure function of
 * (community_id, site_domain, app_id, file_id), so any read surface (pull, list, publish) recomputes
 * it without persisting a serve_url field.
 *
 *   https://{community_id}.{site_domain}/assets/userdocs/{app_id}/{file_id}
 *
 * Serves via the COMMUNITY subdomain (DNS-able — the per-user-app subdomain was abandoned because a
 * per-user app_id is not a valid DNS label) and the existing public `/assets/` edge channel. The
 * public copy lives at `{env}/{community_id}/assets/userdocs/{app_id}/{file_id}` in the public
 * bucket. site_domain (utils.SITE_DOMAIN, e.g. `dev.descix.net`) is passed in to keep this module
 * dependency-free. Only opted-in docs are published; private docs have NO public serve_url.
 *
 * @param {{ community_id: string, site_domain: string, app_id: string, file_id: string }} args
 * @returns {string} the deterministic public serve URL
 */
export function composeUserDocServeUrl({ community_id, site_domain, app_id, file_id } = {}) {
    if (!community_id || typeof community_id !== 'string') throw new Error('community_id is required for a user doc serve URL');
    if (!site_domain || typeof site_domain !== 'string') throw new Error('site_domain is required for a user doc serve URL');
    if (!app_id || typeof app_id !== 'string') throw new Error('app_id is required for a user doc serve URL');
    if (!file_id || typeof file_id !== 'string') throw new Error('file_id is required for a user doc serve URL');
    return `https://${community_id}.${site_domain}/assets/userdocs/${app_id}/${file_id}`;
}

// ─── Service domain (ws-c4-platform P1) ──────────────────────────────────────

/**
 * Error code carried by every refusal of a manifest that declares its own service domain.
 * ONE constant, imported by both doors (the SDK bootstrap and Cloud's register_service) so the
 * code cannot drift between them.
 */
export const SERVICE_DOMAIN_IS_DERIVED = 'SERVICE_DOMAIN_IS_DERIVED';

// A service domain's first label must be a real DNS label: lowercase alphanumerics and '-',
// starting and ending alphanumeric, <= 63 octets. This is what stops an OPAQUE identity-derived
// id (composeUserAppId's `{community}-{uid}` tail, which legitimately carries '@', '.', '_' and
// uppercase) from ever being composed into a host that cannot resolve.
const DNS_LABEL_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * Compose the canonical service domain: `{app_id}.{site_domain}`.
 *
 * THE ENV IS NOT RE-DERIVED HERE. The platform owns exactly one env->host fact — SITE_DOMAIN
 * (`dev.descix.net`, `demo.descix.net`, `descix.net` for prod) — and it is passed in, exactly as
 * composeUserDocServeUrl takes it, so this module stays dependency-free. Re-deriving a host from
 * an env token (`env === 'prod' ? 'descix.net' : env + '.descix.net'`) is a hand-mirror of
 * SITE_DOMAIN; it was already removed once from GCSPaths.appPublicUrl for that reason, and it is
 * the reason a per-service copy had to special-case 'prod' at every call site.
 *
 * @param {{ app_id: string, site_domain: string }} args
 * @returns {string} e.g. `daita-ssgpod.dev.descix.net`
 * @throws when either input is missing, or app_id is not a usable DNS label. No fallback.
 */
export function composeServiceDomain({ app_id, site_domain } = {}) {
    if (!app_id || typeof app_id !== 'string') {
        throw new Error('app_id is required to derive a service domain');
    }
    if (!site_domain || typeof site_domain !== 'string') {
        throw new Error(
            'site_domain is required to derive a service domain — it is the env-owned SITE_DOMAIN ' +
            'config value (dev.descix.net / demo.descix.net / descix.net). There is no fallback.'
        );
    }
    const label = app_id.toLowerCase();
    if (!DNS_LABEL_RE.test(label)) {
        throw new Error(
            `Cannot derive a service domain from app_id '${app_id}': it is not a valid DNS label ` +
            `(lowercase alphanumerics and '-', starting and ending alphanumeric, <= 63 chars). ` +
            `A per-user app id is deliberately not DNS-able and can never host a service.`
        );
    }
    return `${label}.${site_domain}`;
}

/**
 * Is this manifest's service APP-BOUND? The scope test is the manifest's SHAPE — it declares both
 * `app_id` and `community_id` — which is the same predicate `register_service` uses to pick the
 * App-Owner registration branch over the Admin branch. It is deliberately not a name list.
 *
 * @param {Object} service — a manifest's `service` block
 * @returns {boolean}
 */
export function isAppBoundService(service) {
    return !!(service?.app_id && service?.community_id);
}

/**
 * THE resolver both registration doors consume. A service does NOT declare its own domain; the
 * platform derives it from `app_id` + env.
 *
 * APP-BOUND (declares app_id + community_id, the App-Owner branch): the domain is DERIVED. A
 * manifest that still declares `service.domain` is REFUSED with `code = SERVICE_DOMAIN_IS_DERIVED`,
 * naming the value that would have been derived. The refusal fires on the DECLARATION itself, so
 * it does not need `site_domain` — a service that declares a domain is wrong whether or not this
 * call site knows the env. It is refused even when the declared value happens to EQUAL the derived
 * one: the defect is the declaration, and a manifest that is right today drifts the moment it is
 * deployed to another env (that is exactly how a dev service came to advertise its PROD domain and
 * proxy dev traffic into the prod database).
 *
 * ADMIN BRANCH (no app binding): a PLATFORM service keeps its explicitly configured domain and is
 * outside the derivation.
 *
 * @param {{ manifest: Object, site_domain?: string }} args
 * @returns {{ domain: string, app_bound: boolean, derived: boolean }}
 * @throws {Error & {code?: string, declared_domain?: string, derived_domain?: string}}
 */
export function resolveServiceDomain({ manifest, site_domain = null } = {}) {
    const service = manifest?.service;
    if (!service?.name) {
        throw new Error('resolveServiceDomain: manifest.service.name is required');
    }

    if (!isAppBoundService(service)) {
        if (!service.domain) {
            throw new Error(
                `Service '${service.name}' declares neither an app binding (service.app_id + ` +
                `service.community_id) nor service.domain. An app-bound service has its domain ` +
                `DERIVED; a platform service registered through the Admin branch must declare ` +
                `service.domain explicitly. There is nothing to route to.`
            );
        }
        return { domain: service.domain, app_bound: false, derived: false };
    }

    const declared = service.domain;
    if (declared !== undefined && declared !== null) {
        // Name the value that WOULD have been derived. When this call site has no site_domain the
        // env half is named by its config key rather than guessed — the refusal is about the
        // declaration, and it must not invent a host to make its message look complete.
        const derived = site_domain
            ? composeServiceDomain({ app_id: service.app_id, site_domain })
            : `${String(service.app_id).toLowerCase()}.{SITE_DOMAIN}`;
        const err = new Error(
            `${SERVICE_DOMAIN_IS_DERIVED}: service '${service.name}' declares ` +
            `service.domain='${declared}'. A service does not declare its own domain — the platform ` +
            `derives it from app_id + env at registration. Delete "domain" from the manifest's ` +
            `service block. Derived value: '${derived}'.`
        );
        err.code = SERVICE_DOMAIN_IS_DERIVED;
        err.declared_domain = declared;
        err.derived_domain = derived;
        throw err;
    }

    return {
        domain: composeServiceDomain({ app_id: service.app_id, site_domain }),
        app_bound: true,
        derived: true,
    };
}

/** A stored manifest carries no domain: there is nothing to route to. */
export const SERVICE_NOT_ROUTABLE = 'SERVICE_NOT_ROUTABLE';

/**
 * THE one owner of "is this REGISTERED service routable, and where?".
 *
 * `resolveServiceDomain` answers the REGISTRATION question (what domain should this manifest get).
 * This answers the READ question every consumer of a STORED manifest asks: the origin to send a
 * request to. Both live here because "where a service lives" is one fact with one home.
 *
 * REFUSES rather than composing a URL out of a missing value. `https://${service.domain}/api` on a
 * domain-less manifest yields the literal string `https://undefined/api` — a syntactically valid
 * URL that resolves to a host named "undefined", so nothing throws, the registry happily routes
 * there, and the failure surfaces as an unexplained network error at request time. That is the
 * silence this refusal exists to break: a manifest reaches this state only by BYPASSING
 * `register_service` (a direct Firestore write), so the message names that as the cause.
 *
 * @param {Object} service — a stored manifest's `service` block
 * @returns {string} the routable origin, e.g. `https://daita-ssgpod.dev.descix.net`
 * @throws {Error & {code: string}} code `SERVICE_NOT_ROUTABLE`
 */
export function requireServiceOrigin(service) {
    const name = service?.name || '(unnamed)';
    if (!service?.domain || typeof service.domain !== 'string') {
        const err = new Error(
            `${SERVICE_NOT_ROUTABLE}: registered service '${name}' carries no service.domain, so ` +
            `there is no host to route to. The platform DERIVES the domain at registration — a ` +
            `stored manifest without one was written by a path that bypassed the register_service ` +
            `door (a direct Firestore write). Re-register '${name}' through register_service. ` +
            `Refusing to compose 'https://undefined/api'.`
        );
        err.code = SERVICE_NOT_ROUTABLE;
        err.service_name = name;
        throw err;
    }
    return `https://${service.domain}`;
}
