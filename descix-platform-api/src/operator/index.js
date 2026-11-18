/**
 * @descix/platform-api/operator — the guards every in-process operator tool shares (the Powch passkey
 * re-key, the account admin's delete and merge): which environments an operator run may name, that the
 * Firestore client it booted targets that environment's database, and THE operator email rule.
 *
 * The rule is the one owner of "which accounts may an operator tool touch": a structured
 * { localPart, plusAddressing, domains } matched against an account's `verified_email` only (the
 * unverified `email` field is never consulted). Required, validated, fail closed: there is no default
 * rule and no unfiltered listing.
 *
 * Pure: no Firestore, no file, no network. A consumer words a guard refusal in its own code table and
 * keeps this error as the cause.
 */

/** The environments an operator run names. */
export const OPERATOR_ENVS = Object.freeze(['dev', 'demo', 'prod']);

/** Why an operator guard refused. Nothing was read or written on any of them. */
export const OperatorGuardRefusal = Object.freeze({
    /** The email rule is missing, empty or malformed (fail closed: no rule, no run). */
    RULE_INVALID: 'OPERATOR_RULE_INVALID',
    /** The env is not one of OPERATOR_ENVS. */
    ENV_INVALID: 'OPERATOR_ENV_INVALID',
    /** The target names no project/database/secret, or its database is not the env's. */
    TARGET_INVALID: 'OPERATOR_TARGET_INVALID',
});

export class OperatorGuardError extends Error {
    constructor(code, message) {
        if (!Object.values(OperatorGuardRefusal).includes(code)) throw new Error(`OperatorGuardError: unknown code ${code}`);
        super(message);
        this.name = 'OperatorGuardError';
        this.code = code;
    }
}

const LOCAL_PART = /^[a-z0-9._%-]+$/;
const TAGGED_LOCAL_PART = /^[a-z0-9._%-]+(\+[a-z0-9._%-]+)?$/;
/** A plus-tag: the local part's characters and further '+' (operator+a+b); never whitespace or a control character. */
const TAG = /^[a-z0-9._%+-]+$/;
const DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;
const RULE_KEYS = Object.freeze(['localPart', 'plusAddressing', 'domains']);

/**
 * The operator email rule, validated; fail closed. Shape (all three keys required, lowercase, nothing
 * defaulted):
 *   { localPart: 'operator', plusAddressing: true, domains: ['example.org', 'example.net', 'example.com'] }
 * names exactly `operator@<domain>` and, with plusAddressing, `operator+<tag>@<domain>` (a non-empty tag of
 * [a-z0-9._%+-], so never whitespace or a control character) for a domain in the set, compared exactly
 * (no subdomain, no suffix). With plusAddressing false the local part may itself carry one tag ('operator+x')
 * and names only that address.
 * @param {unknown} rule
 * @returns {Readonly<{ localPart: string, plusAddressing: boolean, domains: readonly string[] }>}
 * @throws {OperatorGuardError} OPERATOR_RULE_INVALID
 */
export function normalizeOperatorEmailRule(rule) {
    const bad = (why) => new OperatorGuardError(OperatorGuardRefusal.RULE_INVALID, `The operator email rule ${why}; there is no default rule and nothing is listed or written without one. Shape: { localPart: 'operator', plusAddressing: true, domains: ['example.org'] }`);
    if (rule === null || typeof rule !== 'object' || Array.isArray(rule)) throw bad('is required');
    const extra = Object.keys(rule).filter((k) => !RULE_KEYS.includes(k));
    if (extra.length) throw bad(`has unknown keys ${extra.join(', ')}`);
    const { localPart, plusAddressing, domains } = rule;
    if (typeof plusAddressing !== 'boolean') throw bad('needs plusAddressing true or false');
    if (typeof localPart !== 'string' || !(plusAddressing ? LOCAL_PART : TAGGED_LOCAL_PART).test(localPart)) {
        throw bad(`needs a lowercase localPart${plusAddressing ? ' without a + tag' : ''} (got ${JSON.stringify(localPart)})`);
    }
    if (!Array.isArray(domains) || domains.length === 0) throw bad('needs a non-empty domains list');
    const bogus = domains.filter((d) => typeof d !== 'string' || !DOMAIN.test(d));
    if (bogus.length) throw bad(`has domains that are not lowercase host names: ${JSON.stringify(bogus)}`);
    return Object.freeze({ localPart, plusAddressing, domains: Object.freeze([...new Set(domains)]) });
}

/**
 * Whether the rule names `address`. The address is compared as the platform stores it, trimmed and
 * lowercased (normalizeEmail), so OPERATOR+x@EXAMPLE.ORG is operator+x@example.org. A non-string is never named.
 * @param {ReturnType<typeof normalizeOperatorEmailRule>} rule - a normalized rule
 * @param {string|null|undefined} address
 */
export function operatorEmailAllowed(rule, address) {
    if (!rule || !Object.isFrozen(rule) || !Array.isArray(rule.domains)) {
        throw new OperatorGuardError(OperatorGuardRefusal.RULE_INVALID, 'operatorEmailAllowed needs a rule from normalizeOperatorEmailRule');
    }
    if (typeof address !== 'string') return false;
    const parts = address.trim().toLowerCase().split('@');
    if (parts.length !== 2) return false;
    const [local, domain] = parts;
    if (!rule.domains.includes(domain)) return false;
    if (local === rule.localPart) return true;
    const tagged = `${rule.localPart}+`;
    return rule.plusAddressing && local.startsWith(tagged) && TAG.test(local.slice(tagged.length));
}

/**
 * The rule naming exactly one address (a CLI's --email): its local part, tag included, and its domain.
 * @param {string} address
 * @throws {OperatorGuardError} OPERATOR_RULE_INVALID
 */
export function operatorEmailRuleForAddress(address) {
    const parts = typeof address === 'string' ? address.trim().toLowerCase().split('@') : [];
    if (parts.length !== 2) {
        throw new OperatorGuardError(OperatorGuardRefusal.RULE_INVALID, `${JSON.stringify(address)} is not one email address; name the account's own address`);
    }
    return normalizeOperatorEmailRule({ localPart: parts[0], plusAddressing: false, domains: [parts[1]] });
}

/**
 * The range-read prefixes that reach every address the rule can name: '<localPart>@' and, with
 * plusAddressing, '<localPart>+'. A reader range-reads by them and then filters with operatorEmailAllowed
 * (a prefix also reaches addresses the rule does not name, e.g. another domain).
 * @param {ReturnType<typeof normalizeOperatorEmailRule>} rule
 * @returns {string[]}
 */
export function operatorEmailRulePrefixes(rule) {
    if (!rule || !Object.isFrozen(rule) || typeof rule.localPart !== 'string') {
        throw new OperatorGuardError(OperatorGuardRefusal.RULE_INVALID, 'operatorEmailRulePrefixes needs a rule from normalizeOperatorEmailRule');
    }
    return [`${rule.localPart}@`, ...(rule.plusAddressing ? [`${rule.localPart}+`] : [])];
}

/**
 * Refuse unless `env` is an operator env and the Firestore client this run reads and writes through
 * (`target`, what the booted service actually targets, overrides included) is the database the env names
 * (`expectedDatabaseId`, from the service's own per-env config, e.g. FIRESTORE_DATABASE_ID of its
 * defaults-config-<env>.json).
 * @param {{ env: string, target: { projectId: string, databaseId: string, secretName: string }, expectedDatabaseId: string }} args
 * @throws {OperatorGuardError} OPERATOR_ENV_INVALID | OPERATOR_TARGET_INVALID
 */
export function assertOperatorTarget({ env, target, expectedDatabaseId } = {}) {
    if (!OPERATOR_ENVS.includes(env)) {
        throw new OperatorGuardError(OperatorGuardRefusal.ENV_INVALID, `env is required and has no default (got ${JSON.stringify(env)}). Name one of: ${OPERATOR_ENVS.join(', ')}.`);
    }
    for (const k of ['projectId', 'databaseId', 'secretName']) {
        if (typeof target?.[k] !== 'string' || !target[k]) {
            throw new OperatorGuardError(OperatorGuardRefusal.TARGET_INVALID, `The run's target has no ${k}; refusing to read or write anywhere unnamed`);
        }
    }
    if (typeof expectedDatabaseId !== 'string' || !expectedDatabaseId) {
        throw new OperatorGuardError(OperatorGuardRefusal.TARGET_INVALID, `No configured Firestore database is known for env ${env}; refusing to guess`);
    }
    if (target.databaseId !== expectedDatabaseId) {
        throw new OperatorGuardError(OperatorGuardRefusal.TARGET_INVALID, `The Firestore client targets database '${target.databaseId}', but env ${env} is '${expectedDatabaseId}'. An override (environment variable or dev-overrides.json) is redirecting this run. Nothing was read or written.`);
    }
}
