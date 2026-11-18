/**
 * The account-admin contract every store owner implements and the orchestrator (./index.js) consumes:
 * the refusal code table, the error, the outcome tables, the store-owner method lists, and the receipt
 * value rules (credential redaction, a JSON-safe encoding of store values, a canonical hash). Pure: no
 * Firestore, no file, no network. Store owners in Cloud and Powch import these from
 * @descix/platform-api; none re-enumerates them.
 */
import crypto from 'node:crypto';

/** Why an account-admin act refused or a store owner failed. A consumer branches on the code, never the message. */
export const AccountAdminRefusal = Object.freeze({
    ACCOUNT_RULE_INVALID: 'ACCOUNT_RULE_INVALID',
    ACCOUNT_TARGET_INVALID: 'ACCOUNT_TARGET_INVALID',
    ACCOUNT_NOT_IN_RULE: 'ACCOUNT_NOT_IN_RULE',
    ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
    ACCOUNT_EMAIL_KEYED_LEGACY: 'ACCOUNT_EMAIL_KEYED_LEGACY',
    ACCOUNT_OWNS_PRODUCTS: 'ACCOUNT_OWNS_PRODUCTS',
    ACCOUNT_HOLDS_ROLES: 'ACCOUNT_HOLDS_ROLES',
    ACCOUNT_PAID_PURCHASES: 'ACCOUNT_PAID_PURCHASES',
    ACCOUNT_WALLET_VALUE_UNMEASURED: 'ACCOUNT_WALLET_VALUE_UNMEASURED',
    ACCOUNT_WALLET_HOLDS_VALUE: 'ACCOUNT_WALLET_HOLDS_VALUE',
    ACCOUNT_REFERRAL_DEPENDENTS: 'ACCOUNT_REFERRAL_DEPENDENTS',
    ACCOUNT_KYC_OR_STRIPE_ON_FILE: 'ACCOUNT_KYC_OR_STRIPE_ON_FILE',
    ACCOUNT_PENDING_TRANSFERS: 'ACCOUNT_PENDING_TRANSFERS',
    /** Documents exist under the USERS doc that no store owner's footprint covers (deleting it would orphan them). */
    ACCOUNT_STORE_UNOWNED: 'ACCOUNT_STORE_UNOWNED',
    /** A footprint read reached ACCOUNT_READ_LIMIT: the footprint is not provably complete. */
    ACCOUNT_FOOTPRINT_UNBOUNDED: 'ACCOUNT_FOOTPRINT_UNBOUNDED',
    /** The store changed since the plan, or the plan is unknown, used or expired. */
    ACCOUNT_PLAN_STALE: 'ACCOUNT_PLAN_STALE',
    ACCOUNT_CONFIRMATION_MISMATCH: 'ACCOUNT_CONFIRMATION_MISMATCH',
    ACCOUNT_STORE_READ_FAILED: 'ACCOUNT_STORE_READ_FAILED',
    ACCOUNT_STORE_WRITE_FAILED: 'ACCOUNT_STORE_WRITE_FAILED',
    /** A receipt that is missing, malformed, for another env/target, or that a save did not label. */
    ACCOUNT_RECEIPT_INVALID: 'ACCOUNT_RECEIPT_INVALID',
    ACCOUNT_MERGE_SAME_RECORD: 'ACCOUNT_MERGE_SAME_RECORD',
    ACCOUNT_MERGE_EMAIL_MISMATCH: 'ACCOUNT_MERGE_EMAIL_MISMATCH',
    ACCOUNT_MERGE_TARGET_NOT_PASSKEY: 'ACCOUNT_MERGE_TARGET_NOT_PASSKEY',
    ACCOUNT_MERGE_ALREADY_MIGRATED: 'ACCOUNT_MERGE_ALREADY_MIGRATED',
    /** The record to merge is not a legacy record: it has a passkey credential or the powch provider. */
    ACCOUNT_MERGE_SOURCE_NOT_LEGACY: 'ACCOUNT_MERGE_SOURCE_NOT_LEGACY',
    /** A merge would put more into one of a store's documents than that store's size bound allows (named in the detail). */
    ACCOUNT_MERGE_EXCEEDS_STORE_LIMIT: 'ACCOUNT_MERGE_EXCEEDS_STORE_LIMIT',
    /** A merge whose record to merge or surviving account carries the delete stamp (a delete of it is under way). */
    ACCOUNT_MERGE_DELETE_IN_PROGRESS: 'ACCOUNT_MERGE_DELETE_IN_PROGRESS',
    /** A USERS doc whose `admin_delete` field is present but is not a stamp this tool writes ({ planHash: string, startedAt }). */
    ACCOUNT_STAMP_MALFORMED: 'ACCOUNT_STAMP_MALFORMED',
});

const CODES = new Set(Object.values(AccountAdminRefusal));

/** The brand every AccountAdminError carries, global so a second copy of this package recognises the first's errors. */
const ACCOUNT_ADMIN_ERROR = Symbol.for('@descix/platform-api/AccountAdminError');

/**
 * A refusal or a store failure. `code` is an AccountAdminRefusal value; `details` (optional) is extra
 * structured data (e.g. the plan's blockers when a commit is refused for them). `instanceof` holds across
 * two installed copies of @descix/platform-api (Cloud's and Powch's node_modules vs the orchestrator's);
 * a plain Error carrying a code is not one.
 */
export class AccountAdminError extends Error {
    constructor(code, message, { cause, details } = {}) {
        if (!CODES.has(code)) throw new Error(`AccountAdminError: unknown code ${code}`);
        super(message, cause ? { cause } : undefined);
        this.name = 'AccountAdminError';
        this.code = code;
        if (details !== undefined) this.details = details;
        Object.defineProperty(this, ACCOUNT_ADMIN_ERROR, { value: true });
    }

    static [Symbol.hasInstance](value) {
        return value?.[ACCOUNT_ADMIN_ERROR] === true;
    }
}

/** A blocker a footprint reports: { code, detail }, the code from AccountAdminRefusal. */
export function accountAdminBlocker(code, detail) {
    if (!CODES.has(code)) throw new Error(`accountAdminBlocker: unknown code ${code}`);
    return Object.freeze({ code, detail: String(detail) });
}

/** The endings of a delete commit that reached its first write. Decided from a read-back only. */
export const DELETE_OUTCOME = Object.freeze({ DELETED: 'DELETED', NOT_DELETED: 'NOT_DELETED', PARTIAL: 'PARTIAL', UNVERIFIED: 'UNVERIFIED' });
/** The endings of a merge commit that reached its first write. */
export const MERGE_OUTCOME = Object.freeze({ MERGED: 'MERGED', NOT_MERGED: 'NOT_MERGED', PARTIAL: 'PARTIAL', UNVERIFIED: 'UNVERIFIED' });
/** The endings of a merge rollback that reached its first write. */
export const MERGE_ROLLBACK_OUTCOME = Object.freeze({ ROLLED_BACK: 'ROLLED_BACK', NOT_ROLLED_BACK: 'NOT_ROLLED_BACK', PARTIAL: 'PARTIAL', UNVERIFIED: 'UNVERIFIED' });
/** The endings of a restore of a PARTIAL delete that reached its first write. */
export const RESTORE_OUTCOME = Object.freeze({ RESTORED: 'RESTORED', NOT_RESTORED: 'NOT_RESTORED', PARTIAL: 'PARTIAL', UNVERIFIED: 'UNVERIFIED' });

/** The most documents one footprint read returns; a read that reaches it is ACCOUNT_FOOTPRINT_UNBOUNDED. */
export const ACCOUNT_READ_LIMIT = 500;

/**
 * Every store owner implements these:
 *  - footprintForUser(user) -> { entries, leftovers, blockers } (footprintViolation is the shape rule);
 *  - deleteForUser(user, { expectPaths, expectData }) -> { deleted, remaining }: refuses ACCOUNT_PLAN_STALE,
 *    before any write, unless its current footprint is the plan's, paths AND data (assertDeletePlanCurrent);
 *    an `irrecoverable` owner re-reads each document, compares its data and deletes it INSIDE ONE transaction
 *    (assertDocumentAsPlanned);
 *  - storeTarget() -> { databaseId: string, projectId?: string } (sync or async): the database of the
 *    Firestore client this owner ACTUALLY reads and writes through, read from the client itself.
 * Optional:
 *  - `credentialKeys: string[]`: a credential of the store the redactCredentials name rule cannot see
 *    (e.g. ['device_code']), passed to receiptData too; the orchestrator and the conformance check enforce it;
 *  - `credentialIdCollections: string[]`: collection ids whose document id IS a credential (a session token, a
 *    device code, an auth code): every entry of such a collection carries `pathIsSecret: true` and a secretPath;
 *  - `irrecoverable: true`: a store whose delete cannot be undone by anyone else (the Powch vault: client-
 *    encrypted wallet material); deleted AFTER every other dependent and immediately before the User owner;
 *  - restoreForUser(user, entries) -> { restored: [path], remaining: [path] }: re-creates, from a delete
 *    receipt's entries, those currently absent, never overwriting an existing document (restoreDelete); it
 *    refuses ACCOUNT_RECEIPT_INVALID, writing nothing, an entry its footprintForUser(user) would not list once
 *    written (another account's document, another store's path).
 * A footprint entry may carry `walletMaterial: true` (it holds or derives a wallet: a vault, an xPub, a
 * wallet index row), with `unmeasuredNote` (what that material may hold that nobody measured; shown in the
 * plan's notMeasured), `volatile: true` (an entry the owner deletes BY QUERY at delete time, e.g. sessions:
 * its set may change between plan and delete without making the plan stale; never restored) and
 * `pathIsSecret: true` (its `path` is secretPath(collection, id): the document id is a credential; the owner
 * keeps the real path privately and resolves it at delete time by re-reading its own footprint; never restored).
 */
export const STORE_OWNER_METHODS = Object.freeze(['footprintForUser', 'deleteForUser', 'storeTarget']);
/** Optional store-owner method: re-create a PARTIAL delete's absent entries (restoreDelete). */
export const STORE_OWNER_RESTORE_METHOD = 'restoreForUser';
/**
 * A store owner that moves anything on merge implements ALL of these (or none). validateRollbackMoves(moves,
 * pair) throws ACCOUNT_RECEIPT_INVALID, writing nothing, for any receipt move this owner would not have made
 * for that pair; rollbackMerge calls it on EVERY owner before the first rollback write.
 */
export const STORE_OWNER_MERGE_METHODS = Object.freeze(['footprintForMerge', 'mergeForUser', 'rollbackMergeForUser', 'validateRollbackMoves']);
/**
 * The User owner (`name: 'user'`) implements the store-owner methods, the merge methods, and these.
 * preflightDelete(user, { expectPaths, expectData, coveredNested }) re-checks the User owner's own part of a
 * delete plan (its paths and data, its blockers, no document under the USERS doc outside `coveredNested`) and
 * writes nothing. stampDelete(user, { planHash, startedAt, expectData }) writes the USERS doc's `admin_delete`
 * stamp in one transaction that refuses a changed doc; clearDeleteStamp(user, { planHash }) removes the stamp
 * only while it names that plan. It implements no restoreForUser.
 */
export const USER_OWNER_METHODS = Object.freeze(['account', 'accountsByEmailPrefixes', 'readMergeFields', 'preflightDelete', 'stampDelete', 'clearDeleteStamp']);

/**
 * The credential name rule: a key is a credential when, case-insensitively, the whole key or its last
 * `_`/`-` segment(s) is token, secret, password, passphrase, passwd, private_key/privatekey, mnemonic, seed,
 * signature, api_key/apikey, code or otp (access_token, client_secret, device_code, user_code, totp_otp), or,
 * camelCase, it ends in one of those capitalised after a lowercase letter or digit (accessToken, apiKey,
 * privateKey, deviceCode).
 */
const CREDENTIAL_KEY = /(^|[_-])(token|secret|password|passphrase|passwd|private[_-]?key|mnemonic|seed|signature|api[_-]?key|code|otp)$/i;
const CREDENTIAL_KEY_CAMEL = /[a-z0-9](Token|Secret|Password|Passphrase|Passwd|PrivateKey|Mnemonic|Seed|Signature|ApiKey|Apikey|Code|Otp)$/;
export const REDACTED = '[redacted]';

/** A credential-key predicate: the name rule, plus the exact extra key names a store owner declares. */
function credentialKey(keys) {
    if (keys !== undefined && (!Array.isArray(keys) || keys.some((k) => typeof k !== 'string' || !k))) {
        throw new Error(`account-admin redaction: keys must be an array of key names (got ${JSON.stringify(keys)})`);
    }
    const extra = new Set(keys ?? []);
    return (k) => CREDENTIAL_KEY.test(k) || CREDENTIAL_KEY_CAMEL.test(k) || extra.has(k);
}

/**
 * A copy of a store value with every live credential replaced by "[redacted]": any key the credential name
 * rule (CREDENTIAL_KEY above) names, and any key in `keys` (a store's own credential that the name rule
 * cannot see), at any depth. The one redaction rule every owner's receipt data passes through.
 * @param {unknown} value
 * @param {{ keys?: string[] }} [opts]
 */
export function redactCredentials(value, { keys } = {}) {
    const isCredential = credentialKey(keys);
    const walk = (v) => {
        if (Array.isArray(v)) return v.map(walk);
        if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
            const out = {};
            for (const [k, x] of Object.entries(v)) out[k] = isCredential(k) && x != null ? REDACTED : walk(x);
            return out;
        }
        return v;
    };
    return walk(value);
}

const NANOS_PER_SECOND = 1e9;
const isTimestampParts = (s, n) => Number.isSafeInteger(s) && Number.isInteger(n) && n >= 0 && n < NANOS_PER_SECOND;

/**
 * A store value as plain JSON: a Firestore Timestamp (anything with toDate()) becomes
 * { __timestamp: { seconds, nanoseconds } } (exact: Firestore keeps nanoseconds), a Date the same from its
 * milliseconds, bytes become { __bytes: '<base64>' }, a DocumentReference becomes { __ref: '<path>' }, a Map
 * becomes an object; everything else is copied. A timestamp-like value without integer seconds/nanoseconds is
 * refused, never rounded. A receipt holds only this encoding; an owner restoring a timestamp decodes it with
 * decodeStoreTimestamp and its own Timestamp class.
 */
export function encodeStoreValue(value) {
    if (value === undefined) return null;
    if (value === null || typeof value !== 'object') return value;
    if (typeof value.toDate === 'function') {
        const { seconds, nanoseconds } = value;
        if (!isTimestampParts(seconds, nanoseconds)) {
            throw new TypeError(`encodeStoreValue: a timestamp value without integer seconds/nanoseconds (got ${JSON.stringify({ seconds, nanoseconds })}); it is not encoded through toDate(), which drops sub-millisecond precision`);
        }
        return { __timestamp: { seconds, nanoseconds } };
    }
    if (value instanceof Date) {
        const ms = value.getTime();
        if (!Number.isFinite(ms)) throw new TypeError('encodeStoreValue: an invalid Date');
        const seconds = Math.floor(ms / 1000);
        return { __timestamp: { seconds, nanoseconds: (ms - seconds * 1000) * 1e6 } };
    }
    if (value instanceof Uint8Array) return { __bytes: Buffer.from(value).toString('base64') };
    if (typeof value.path === 'string' && value.firestore) return { __ref: value.path };
    if (value instanceof Map) return encodeStoreValue(Object.fromEntries(value));
    if (Array.isArray(value)) return value.map(encodeStoreValue);
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = encodeStoreValue(v);
    return out;
}

/**
 * The Timestamp an encodeStoreValue `{ __timestamp: { seconds, nanoseconds } }` encodes, built with the CALLER's
 * Timestamp class (each owner writes with its own Firestore client's class): exact to the nanosecond. Throws on
 * anything else (another shape, extra keys, out-of-range parts, no Timestamp class); never guesses.
 * @param {unknown} value
 * @param {new (seconds: number, nanoseconds: number) => unknown} Timestamp
 */
export function decodeStoreTimestamp(value, Timestamp) {
    if (typeof Timestamp !== 'function') throw new TypeError('decodeStoreTimestamp: pass the store client\'s Timestamp class');
    const t = value !== null && typeof value === 'object' && !Array.isArray(value) ? value.__timestamp : undefined;
    const ok = t !== null && typeof t === 'object' && !Array.isArray(t)
        && Object.keys(value).length === 1
        && Object.keys(t).sort().join(',') === 'nanoseconds,seconds'
        && isTimestampParts(t.seconds, t.nanoseconds);
    if (!ok) throw new TypeError(`decodeStoreTimestamp: ${JSON.stringify(value ?? null)?.slice(0, 200)} is not an encoded timestamp { __timestamp: { seconds, nanoseconds } }`);
    return new Timestamp(t.seconds, t.nanoseconds);
}

/**
 * A stored document as a footprint entry's `data`: encoded (encodeStoreValue), then redacted
 * (redactCredentials, with the store's extra credential `keys`).
 * @param {unknown} raw
 * @param {{ keys?: string[] }} [opts]
 */
export function receiptData(raw, { keys } = {}) {
    return redactCredentials(encodeStoreValue(raw), { keys });
}

const isPlainObject = (v) => v !== null && typeof v === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(v));

/**
 * The dotted path of the first value in `value` that is not plain JSON (null, boolean, string, finite
 * number, array, plain object): a Timestamp, Date, BigInt, undefined, Map, class instance, NaN. Null when
 * the whole value is plain JSON. A receipt, a footprint entry's `data`, a move's from/to and a wallet
 * reading's `details` are plain JSON.
 * @param {unknown} value
 * @param {string} [at] - the label of `value` itself
 * @returns {string|null}
 */
export function nonJsonValuePath(value, at = '') {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return null;
    if (typeof value === 'number') return Number.isFinite(value) ? null : at || '(value)';
    if (Array.isArray(value)) {
        for (const [i, v] of value.entries()) {
            const bad = nonJsonValuePath(v, `${at}[${i}]`);
            if (bad) return bad;
        }
        return null;
    }
    if (isPlainObject(value)) {
        for (const [k, v] of Object.entries(value)) {
            const bad = nonJsonValuePath(v, at ? `${at}.${k}` : k);
            if (bad) return bad;
        }
        return null;
    }
    return at || '(value)';
}

/**
 * The dotted path of every credential key (the redactCredentials rule, with the same extra `keys`) that
 * holds a value other than null or "[redacted]": an empty array means `value` is redacted.
 * @param {unknown} value
 * @param {{ keys?: string[] }} [opts]
 * @returns {string[]}
 */
export function unredactedCredentialPaths(value, { keys } = {}) {
    const isCredential = credentialKey(keys);
    const walk = (v, at) => {
        if (Array.isArray(v)) return v.flatMap((x, i) => walk(x, `${at}[${i}]`));
        if (!v || typeof v !== 'object') return [];
        return Object.entries(v).flatMap(([k, x]) => {
            const here = at ? `${at}.${k}` : k;
            if (isCredential(k) && x != null && x !== REDACTED) return [here];
            return walk(x, here);
        });
    };
    return walk(value, '');
}

/**
 * Every string value held under a credential key (the redactCredentials rule, with the same extra `keys`), at
 * any depth, of a RAW store value: what a receipt redacts. The conformance check uses it to refuse a path that
 * names one of them.
 * @param {unknown} value
 * @param {{ keys?: string[] }} [opts]
 * @returns {string[]}
 */
export function credentialValues(value, { keys } = {}) {
    const isCredential = credentialKey(keys);
    const out = [];
    const strings = (v) => {
        if (typeof v === 'string' && v) out.push(v);
        else if (Array.isArray(v)) v.forEach(strings);
        else if (v && typeof v === 'object') Object.values(v).forEach(strings);
    };
    const walk = (v) => {
        if (Array.isArray(v)) return v.forEach(walk);
        if (!v || typeof v !== 'object') return undefined;
        for (const [k, x] of Object.entries(v)) (isCredential(k) ? strings : walk)(x);
        return undefined;
    };
    walk(value);
    return [...new Set(out)];
}

const SECRET_SEGMENT = /^redacted-[0-9a-f]{16}$/;

/**
 * THE public path of a document whose id is a credential (a session token, a device code, an auth code):
 * `<collection>/redacted-<first 16 hex of sha256(id)>`. A plan, receipt, log or error names such a document only
 * this way; the owner keeps the real path privately. One implementation for every owner.
 * @param {string} collection - the collection path (e.g. 'UserCache/<id>/Sessions', 'DeviceLoginRequests')
 * @param {string} id - the document id (the credential)
 */
export function secretPath(collection, id) {
    if (typeof collection !== 'string' || !collection || collection.startsWith('/') || collection.endsWith('/') || collection.split('/').length % 2 !== 1) {
        throw new TypeError(`secretPath: a collection path is required (got ${JSON.stringify(collection)})`);
    }
    if (typeof id !== 'string' || !id) throw new TypeError('secretPath: the document id is required');
    return `${collection}/redacted-${crypto.createHash('sha256').update(id).digest('hex').slice(0, 16)}`;
}

/** True when `path`'s document id is a secretPath digest. */
export const isSecretPath = (path) => typeof path === 'string' && SECRET_SEGMENT.test(path.split('/').pop());

/**
 * THE hash of one footprint entry's `data` (the receipt form: encoded, redacted): what a plan records per entry
 * as `dataHash` and what an owner compares the document's current data against before deleting it.
 * @param {unknown} data
 */
export function entryDataHash(data) {
    return accountAdminHash({ data: data ?? null });
}

/**
 * THE expectations a delete hands one owner for its footprint entries: `expectPaths` (every entry's path) and
 * `expectData` ({ [path]: entryDataHash(data) } of every non-volatile entry). The orchestrator builds each
 * owner's from the plan; the conformance check builds them the same way.
 * @param {Array<{ path: string, data: unknown, volatile?: boolean }>} entries
 */
export function deleteExpectations(entries) {
    return {
        expectPaths: entries.map((e) => e.path),
        expectData: Object.fromEntries(entries.filter((e) => e.volatile !== true).map((e) => [e.path, entryDataHash(e.data ?? null)])),
    };
}

const HASH = /^[0-9a-f]{64}$/;
const stale = (what, why) => new AccountAdminError(AccountAdminRefusal.ACCOUNT_PLAN_STALE, `${what}: ${why}; nothing was written. Plan again.`);

/**
 * Refuse (ACCOUNT_PLAN_STALE, before any write) unless an owner's CURRENT footprint entries are the plan's:
 * `expectPaths` (an array of the plan's paths) and `expectData` ({ [path]: dataHash } of every non-volatile
 * planned entry) are required; the current non-volatile paths are exactly expectData's keys, each in
 * expectPaths, and each entry's entryDataHash(data) equals its planned hash. Volatile entries (deleted by query)
 * are exempt. THE plan-freshness rule of a delete; every owner applies it to the footprint it re-reads.
 * @param {string} what - the owner (and act) named in the refusal
 * @param {Array<{ path: string, data: unknown, volatile?: boolean }>} entries - the owner's current footprint entries
 * @param {{ expectPaths?: string[], expectData?: Object<string, string> }} plan
 */
export function assertDeletePlanCurrent(what, entries, { expectPaths, expectData } = {}) {
    if (!Array.isArray(expectPaths) || expectPaths.some((p) => typeof p !== 'string' || !p)) throw stale(what, 'expectPaths (the plan\'s paths) is required');
    if (!expectData || typeof expectData !== 'object' || Array.isArray(expectData) || Object.values(expectData).some((h) => typeof h !== 'string' || !HASH.test(h))) {
        throw stale(what, 'expectData ({ [path]: dataHash } of the plan\'s entries) is required');
    }
    const planned = new Set(Object.keys(expectData));
    const outside = [...planned].filter((p) => !expectPaths.includes(p));
    if (outside.length) throw stale(what, `expectData names ${outside.slice(0, 5).join(', ')}, which expectPaths does not`);
    const now = entries.filter((e) => e.volatile !== true);
    const added = now.map((e) => e.path).filter((p) => !planned.has(p));
    const gone = [...planned].filter((p) => !now.some((e) => e.path === p));
    if (added.length || gone.length) {
        throw stale(what, `the store changed since the plan (${added.length} new path(s), ${gone.length} gone: ${[...added, ...gone].slice(0, 5).join(', ')})`);
    }
    const changed = now.filter((e) => entryDataHash(e.data) !== expectData[e.path]).map((e) => e.path);
    if (changed.length) throw stale(what, `${changed.length} document(s) changed since the plan (${changed.slice(0, 5).join(', ')})`);
}

/**
 * Refuse (ACCOUNT_PLAN_STALE) unless ONE document's current data is the plan's: `data` is the entry form
 * (receiptData of the snapshot, as the owner's footprint builds it; null when the document is absent) read
 * INSIDE the transaction that deletes it. An `irrecoverable` owner calls it for every document it deletes.
 * @param {string} what
 * @param {string} path - the entry's public path (a secretPath for a credential id)
 * @param {unknown} data
 * @param {Object<string, string>} expectData
 */
export function assertDocumentAsPlanned(what, path, data, expectData) {
    const want = expectData?.[path];
    if (typeof want !== 'string' || !HASH.test(want)) throw stale(what, `${path} has no planned dataHash in expectData`);
    if (entryDataHash(data) !== want) throw stale(what, `${path} changed since the plan (read in the transaction that would delete it)`);
}

const nonEmptyString = (v) => typeof v === 'string' && v.length > 0;
/** A merge move's identity: path, field and (for a map entry) key. */
export const moveKey = (m) => `${m.path}#${m.field}${m.key === undefined ? '' : `#${m.key}`}`;

/**
 * Why `fp` is not a footprint of the contract, or null when it is. THE shape rule the orchestrator
 * enforces on every owner's answer and assertAccountStoreOwnerConforms checks:
 *  - { entries, leftovers, blockers }, all arrays;
 *  - `walletMaterial`, `volatile` and `pathIsSecret`, when an entry carries them, are booleans; a
 *    `pathIsSecret` entry's path is a secretPath digest; an `unmeasuredNote` is a non-empty string on a
 *    walletMaterial entry;
 *  - a delete entry is { path, kind, summary, data }: `data` plain JSON (nonJsonValuePath) with no
 *    un-redacted credential (unredactedCredentialPaths, with the owner's `credentialKeys`) — build it with
 *    receiptData(raw, { keys: owner.credentialKeys });
 *  - a merge entry (merge: true) is { path, field, key?, from, to, summary }: from/to plain JSON (null = absent);
 *  - no path (delete) or move (merge) listed twice; every leftover { what, why } strings;
 *  - every blocker built by accountAdminBlocker(code, detail): frozen, code in AccountAdminRefusal.
 * @param {unknown} fp
 *  - an entry of a collection the owner declares in `credentialIdCollections` is pathIsSecret.
 * @param {{ merge?: boolean, credentialKeys?: string[], credentialIdCollections?: string[] }} [opts]
 * @returns {string|null}
 */
export function footprintViolation(fp, { merge = false, credentialKeys, credentialIdCollections } = {}) {
    for (const k of ['entries', 'leftovers', 'blockers']) {
        if (!Array.isArray(fp?.[k])) return `no ${k} array${merge && Array.isArray(fp?.moves) ? ' (it answered `moves`; the contract key is `entries`)' : ''}`;
    }
    const seen = new Set();
    for (const e of fp.entries) {
        if (!nonEmptyString(e?.path)) return `an entry has no path (${JSON.stringify(e)?.slice(0, 200)})`;
        if (merge && !nonEmptyString(e.field)) return `move ${e.path} has no field`;
        const id = merge ? moveKey(e) : e.path;
        if (seen.has(id)) return `${id} is listed twice`;
        seen.add(id);
        if (typeof e.summary !== 'string') return `entry ${id} has no summary string`;
        for (const flag of ['walletMaterial', 'volatile', 'pathIsSecret']) {
            if (flag in e && typeof e[flag] !== 'boolean') return `entry ${id} ${flag} is ${JSON.stringify(e[flag])}, not a boolean`;
        }
        if (e.pathIsSecret === true && !isSecretPath(e.path)) return `entry ${id} is pathIsSecret but its path is not a secretPath(collection, id) digest`;
        if (!merge && e.pathIsSecret !== true && (credentialIdCollections ?? []).includes(e.path.split('/').slice(-2)[0])) {
            return `entry ${id} is in ${e.path.split('/').slice(-2)[0]}, a collection whose document id is a credential (credentialIdCollections): its path must be secretPath(collection, id) with pathIsSecret: true`;
        }
        if ('unmeasuredNote' in e) {
            if (!nonEmptyString(e.unmeasuredNote) || !e.unmeasuredNote.trim()) return `entry ${id} unmeasuredNote is ${JSON.stringify(e.unmeasuredNote)}, not a non-empty string`;
            if (e.walletMaterial !== true) return `entry ${id} carries an unmeasuredNote but is not walletMaterial`;
        }
        if (merge) {
            if (e.key !== undefined && !nonEmptyString(e.key)) return `move ${id} has a key that is not a non-empty string`;
            for (const side of ['from', 'to']) {
                if (!(side in e)) return `move ${id} has no ${side} (null = absent)`;
                const bad = nonJsonValuePath(e[side]);
                if (bad) return `move ${id} ${side}${bad === '(value)' ? '' : `.${bad}`} is not plain JSON (encode it with encodeStoreValue)`;
            }
        } else {
            if (!nonEmptyString(e.kind)) return `entry ${id} has no kind`;
            if (!('data' in e)) return `entry ${id} has no data (the receipt copy, receiptData(raw))`;
            const bad = nonJsonValuePath(e.data);
            if (bad) return `entry ${id} data${bad === '(value)' ? '' : `.${bad}`} is not plain JSON (build data with receiptData)`;
            const creds = unredactedCredentialPaths(e.data, { keys: credentialKeys });
            if (creds.length) return `entry ${id} carries un-redacted credential(s) ${creds.map((c) => `data.${c}`).join(', ')} (build data with receiptData)`;
        }
    }
    for (const l of fp.leftovers) {
        if (!nonEmptyString(l?.what) || !nonEmptyString(l?.why)) return `a leftover is not { what, why } strings (${JSON.stringify(l)?.slice(0, 200)})`;
    }
    for (const b of fp.blockers) {
        if (!CODES.has(b?.code)) return `blocker code ${JSON.stringify(b?.code)} is not in AccountAdminRefusal`;
        if (typeof b.detail !== 'string') return `blocker ${b.code} has no detail string`;
        if (!Object.isFrozen(b)) return `blocker ${b.code} was not built by accountAdminBlocker(code, detail)`;
    }
    return null;
}

/** JSON with object keys sorted at every depth: equal values give equal strings. */
export function canonicalJson(value) {
    if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
    if (value && typeof value === 'object') {
        return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',')}}`;
    }
    return JSON.stringify(value === undefined ? null : value);
}

/** sha256 hex of canonicalJson(value). */
export function accountAdminHash(value) {
    return crypto.createHash('sha256').update(canonicalJson(value)).digest('hex');
}

/**
 * THE hash of a delete plan: the account id and every non-volatile entry's owner, path, kind and data
 * (a volatile entry is deleted by query, so its set never makes a plan stale). A delete receipt carries
 * it as `planHash`; restoreDelete recomputes it from the receipt's entries to refuse an edited receipt.
 * @param {string} accountId
 * @param {Array<{ owner: string, path: string, kind: string|null, data: unknown, volatile?: boolean }>} entries
 */
export function deletePlanHash(accountId, entries) {
    const stable = entries.filter((e) => e.volatile !== true).map((e) => [e.owner, e.path, e.kind ?? null, e.data ?? null]);
    return accountAdminHash({ kind: 'delete', accountId, entries: stable.sort((a, b) => (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0)) });
}

/**
 * THE hash of a merge plan: both account ids and every move's owner, identity, from and to. A merge receipt
 * carries it as `planHash`; rollbackMerge recomputes it from the receipt's moves to refuse an edited receipt.
 * @param {string} fromAccountId
 * @param {string} intoAccountId
 * @param {Array<{ owner: string, path: string, field: string, key?: string, from: unknown, to: unknown }>} moves
 */
export function mergePlanHash(fromAccountId, intoAccountId, moves) {
    const rows = moves.map((m) => [m.owner, moveKey(m), m.from ?? null, m.to ?? null]);
    return accountAdminHash({ kind: 'merge', from: fromAccountId, into: intoAccountId, moves: rows.sort((a, b) => (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0)) });
}
