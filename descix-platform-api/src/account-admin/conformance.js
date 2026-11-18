/**
 * THE conformance check of an account-admin store owner (contract.js): drift between the User owner here
 * and the Cloud and Powch owners is a test failure in the owner's own repo, never a discovery at the
 * operator's first click. It drives the owner only through its contract methods, against a store the
 * caller seeded, and judges collateral writes through the caller's snapshot of that store. Pure of
 * Firestore: the caller's test owns the fake (or emulator) the owner was built on.
 */
import {
    AccountAdminRefusal as R,
    AccountAdminError,
    STORE_OWNER_METHODS,
    STORE_OWNER_MERGE_METHODS,
    STORE_OWNER_RESTORE_METHOD,
    USER_OWNER_METHODS,
    canonicalJson,
    credentialValues,
    deleteExpectations,
    entryDataHash,
    footprintViolation,
    isSecretPath,
    moveKey,
} from './contract.js';

const CLAUSES = Object.freeze({
    fixture: 'the fixture can exhibit every clause',
    a: 'name, methods and flags',
    b: 'footprintForUser returns { entries, leftovers, blockers } of the contract, read-only and deterministic',
    c: 'deleteForUser refuses a stale plan (paths or data) before any write and deletes exactly expectPaths, nothing else; every bystander untouched',
    d: 'a failed read throws ACCOUNT_STORE_READ_FAILED',
    e: 'footprintForMerge / mergeForUser / validateRollbackMoves / rollbackMergeForUser round trip',
    f: 'storeTarget() reports the database of the client the caller injected (clientTarget)',
    g: 'no bystander (one sharing the email and wallet, one the wallet only, one the email only) shares a footprint path',
    h: 'a delete while a blocker is present is refused before any write',
    i: 'a merge rollback never overwrites a value changed since the merge',
    j: 'every footprint read is bounded',
    k: 'restoreForUser re-creates absent receipt entries and never overwrites a document',
    l: 'a document changed after the footprint makes deleteForUser refuse ACCOUNT_PLAN_STALE, deleting nothing',
    m: 'restoreForUser refuses an entry that is not this account\'s document, writing nothing',
    n: 'no entry path names a credential: a document id that is a credential is a secretPath',
});
const ORDER = Object.freeze(Object.keys(CLAUSES).filter((c) => c !== 'fixture'));
/** A document path no footprint lists: a stale expectPaths or an edited receipt move names it. */
const NOT_PLANNED = 'AccountAdminConformance/not-planned';

/** Thrown by assertAccountStoreOwnerConforms; `clause` is one of CLAUSES' keys. */
export class AccountStoreOwnerNonConformance extends Error {
    constructor(ownerName, clause, why) {
        super(`store owner '${ownerName}' does not conform to the account-admin store-owner contract, clause (${clause}) ${CLAUSES[clause]}: ${why}`);
        this.name = 'AccountStoreOwnerNonConformance';
        this.owner = ownerName;
        this.clause = clause;
    }
}

const sortedUnique = (xs) => [...new Set(xs)].sort();
const describe = (e) => `${e?.name ?? 'Error'}${e?.code ? ` ${e.code}` : ''}: ${e?.message ?? e}`;
const nonEmptyString = (v) => typeof v === 'string' && v.length > 0;
const asText = (v) => (typeof v === 'string' ? v : canonicalJson(v));
const asDoc = (v) => (v === undefined ? undefined : typeof v === 'string' ? JSON.parse(v) : v);

/** The plan an orchestrator hands deleteForUser for a footprint (deleteExpectations). */
const planOf = (fp) => deleteExpectations(fp.entries);

/**
 * Verify, by CALLING it against the caller's seeded store, that `owner` implements the store-owner
 * contract. Clauses, in the order run (the delete clauses, then restore, last: they delete the fixture):
 *  (a) `name`, footprintForUser, deleteForUser, storeTarget; all merge methods or none (the User owner, name
 *      'user', also the merge methods and USER_OWNER_METHODS); `credentialKeys` an array of key names,
 *      `credentialIdCollections` an array of collection ids, `irrecoverable` a boolean and restoreForUser a
 *      function, when present;
 *  (f) storeTarget() answers { databaseId: non-empty string, projectId?: non-empty string } EQUAL to
 *      `clientTarget`, which the caller read from the client it injected (a storeTarget that reports another
 *      database than its client's is RED);
 *  (b) footprintForUser(user) is a footprint of the contract (footprintViolation), two reads answer the same,
 *      and the snapshot is unchanged by them;
 *  (g) footprintForUser(user) lists no path the footprint of any of the three `bystanders` lists;
 *  (n) no entry path has a segment equal to a credential value its document holds (credentialValues of the
 *      snapshot's raw document: what the receipt redacts); every entry of a `credentialIdCollections`
 *      collection, and only of a declared one, is `pathIsSecret` with a secretPath;
 *  (j) with `countUnboundedReads`, no footprint read is unbounded; without it SKIPPED;
 *  (d) with `withFailingReads`, footprintForUser (and footprintForMerge) throw ACCOUNT_STORE_READ_FAILED;
 *      without the hook SKIPPED, never passed;
 *  (e) merge owners: footprintForMerge(pair) is a merge footprint of the contract; mergeForUser with a stale or
 *      missing expectPaths throws ACCOUNT_PLAN_STALE and writes nothing; with the plan's paths it returns
 *      { moved, remaining } covering every move and footprintForMerge lists none of the moved;
 *      validateRollbackMoves accepts the receipt's moves and refuses an edited one (ACCOUNT_RECEIPT_INVALID,
 *      nothing written), as does rollbackMergeForUser; rollbackMergeForUser(moves, pair) returns
 *      { restored, remaining } covering every move and footprintForMerge lists every move again;
 *  (i) merge owners with `changeAfterMerge(move)`: after a merge and a change of the first moved value,
 *      rollback reports that move remaining and leaves the changed value; without the hook SKIPPED;
 *  (h) with `withBlocker(fn)`: inside it the user's footprint shows a blocker and deleteForUser with that
 *      footprint's plan throws that blocker's code, the snapshot unchanged; without the hook SKIPPED;
 *  (l) with `changeAfterFootprint(path)`: after a footprint, the caller changes the data (never the path) of its
 *      first non-volatile entry; deleteForUser with the footprint's plan throws ACCOUNT_PLAN_STALE and the
 *      snapshot is unchanged by it. REQUIRED for an `irrecoverable` owner (a missing hook is RED); SKIPPED
 *      otherwise without the hook;
 *  (c) deleteForUser with a stale or missing expectPaths, a missing expectData, or a planned data hash other
 *      than the document's throws ACCOUNT_PLAN_STALE, the snapshot unchanged; with the footprint's plan it
 *      returns { deleted, remaining } covering exactly its paths, a fresh footprint agrees, the snapshot
 *      changed in exactly `deleted` (no collateral write) and every bystander's footprint is unchanged;
 *  (m) owners with restoreForUser: an entry re-pathed outside the store, and a bystander's own entry, each
 *      handed with the user's deleted entries, throw ACCOUNT_RECEIPT_INVALID and change nothing;
 *  (k) owners with restoreForUser: restoreForUser(user, the deleted entries as a receipt holds them) returns
 *      { restored, remaining } covering them, a fresh footprint lists every restored one, the snapshot changed
 *      only at restored paths, and a second call (nothing absent) changes nothing.
 *
 * @param {object} owner - the store owner under test
 * @param {{
 *   user: { user_id: string, verified_email: string, wallet_address: string },
 *   bystanders: Array<{ user_id: string, verified_email: string|null, wallet_address: string|null }>,
 *   snapshot: () => Map<string, unknown> | Promise<Map<string, unknown>>,
 *   clientTarget: { databaseId: string, projectId?: string },
 *   pair?: { from: object, into: object },
 *   withFailingReads?: (fn: () => Promise<unknown>) => Promise<unknown>,
 *   withBlocker?: (fn: () => Promise<unknown>) => Promise<unknown>,
 *   changeAfterMerge?: (move: { path: string, field: string, key?: string, from: unknown, to: unknown }) => Promise<void>,
 *   changeAfterFootprint?: (path: string) => Promise<void>,
 *   countUnboundedReads?: () => number,
 *   emptyFootprint?: boolean,
 * }} fixture - `user`: an account whose footprint has at least one entry and no blocker (or none at all with
 *   `emptyFootprint: true`, then checked); `bystanders`: THREE other accounts, in this order: [0] the SAME
 *   verified_email and wallet_address as `user`, [1] the same wallet_address and another verified_email, [2] the
 *   same verified_email and another wallet_address; each with at least one footprint entry of its own (unless
 *   emptyFootprint); `snapshot()`: the whole seeded store as Map<path, value>, keyed by the paths footprints
 *   name (a credential-id document by its secretPath), values the RAW documents; `clientTarget`: the
 *   { databaseId, projectId? } the caller read from the Firestore client it injected into the owner; `pair`:
 *   required for a merge owner, a pair with at least one move and no blocker; `withFailingReads(fn)`: every
 *   read of the store throws while fn runs; `withBlocker(fn)`: the store holds something that blocks deleting
 *   `user` while fn runs; `changeAfterMerge(move)`: writes a different value at the move's path/field(/key);
 *   `changeAfterFootprint(path)`: writes different data (same path) at the entry's document;
 *   `countUnboundedReads()`: how many reads without a limit the store has served so far.
 * @returns {Promise<{ owner: string, checks: Array<{ clause: string, title: string, status: 'passed'|'skipped', reason?: string }> }>}
 * @throws {AccountStoreOwnerNonConformance} naming the clause that failed
 */
export async function assertAccountStoreOwnerConforms(owner, fixture = {}) {
    const {
        user, bystanders, snapshot, clientTarget, pair, withFailingReads, withBlocker, changeAfterMerge, changeAfterFootprint, countUnboundedReads, emptyFootprint = false,
    } = fixture;
    const name = typeof owner?.name === 'string' && owner.name ? owner.name : '(unnamed)';
    const fail = (clause, why) => new AccountStoreOwnerNonConformance(name, clause, why);
    const checks = [];
    const passed = (clause) => checks.push({ clause, title: CLAUSES[clause], status: 'passed' });
    const skipped = (clause, reason) => checks.push({ clause, title: CLAUSES[clause], status: 'skipped', reason });

    /** Call an owner method; a throw is the clause's failure. */
    const call = async (clause, label, fn) => {
        try {
            return await fn();
        } catch (e) {
            throw fail(clause, `${label} threw (${describe(e)})`);
        }
    };
    /** The call must throw an AccountAdminError with a code in `codes`. */
    const refuses = async (clause, label, codes, fn) => {
        const want = [codes].flat();
        let result;
        try {
            result = await fn();
        } catch (e) {
            if (!(e instanceof AccountAdminError)) throw fail(clause, `${label} threw ${describe(e)}, not an AccountAdminError (import it from @descix/platform-api/account-admin)`);
            if (!want.includes(e.code)) throw fail(clause, `${label} threw ${e.code}, not ${want.join(' or ')}`);
            return;
        }
        throw fail(clause, `${label} answered (${JSON.stringify(result)?.slice(0, 200)}) instead of throwing ${want.join(' or ')}`);
    };

    // (a) name, methods and flags
    if (!owner || typeof owner !== 'object') throw fail('a', 'the owner is not an object');
    if (!nonEmptyString(owner.name)) throw fail('a', `no name (got ${JSON.stringify(owner.name)})`);
    const lacking = STORE_OWNER_METHODS.filter((m) => typeof owner[m] !== 'function');
    if (lacking.length) throw fail('a', `lacks ${lacking.join(', ')} (every owner implements ${STORE_OWNER_METHODS.join(', ')})`);
    const mergeHas = STORE_OWNER_MERGE_METHODS.filter((m) => typeof owner[m] === 'function');
    if (mergeHas.length && mergeHas.length !== STORE_OWNER_MERGE_METHODS.length) {
        throw fail('a', `implements ${mergeHas.join(', ')} but not ${STORE_OWNER_MERGE_METHODS.filter((m) => !mergeHas.includes(m)).join(', ')}; a merge owner implements all of ${STORE_OWNER_MERGE_METHODS.join(', ')} or none`);
    }
    if (owner.name === 'user') {
        const userLacks = [...STORE_OWNER_MERGE_METHODS, ...USER_OWNER_METHODS].filter((m) => typeof owner[m] !== 'function');
        if (userLacks.length) throw fail('a', `is named 'user' (the User owner) but lacks ${userLacks.join(', ')}`);
    }
    if (owner.credentialKeys !== undefined && (!Array.isArray(owner.credentialKeys) || owner.credentialKeys.some((k) => !nonEmptyString(k)))) {
        throw fail('a', `credentialKeys is not an array of key names (got ${JSON.stringify(owner.credentialKeys)})`);
    }
    if (owner.credentialIdCollections !== undefined && (!Array.isArray(owner.credentialIdCollections) || owner.credentialIdCollections.some((k) => !nonEmptyString(k) || k.includes('/')))) {
        throw fail('a', `credentialIdCollections is not an array of collection ids (got ${JSON.stringify(owner.credentialIdCollections)})`);
    }
    if (owner.irrecoverable !== undefined && typeof owner.irrecoverable !== 'boolean') throw fail('a', `irrecoverable is ${JSON.stringify(owner.irrecoverable)}, not a boolean`);
    if (owner[STORE_OWNER_RESTORE_METHOD] !== undefined && typeof owner[STORE_OWNER_RESTORE_METHOD] !== 'function') throw fail('a', `${STORE_OWNER_RESTORE_METHOD} is not a function`);
    const merges = mergeHas.length === STORE_OWNER_MERGE_METHODS.length;
    const restores = typeof owner[STORE_OWNER_RESTORE_METHOD] === 'function';
    passed('a');

    // the fixture
    const handle = (h) => h && typeof h === 'object' && nonEmptyString(h.user_id);
    if (!handle(user)) throw fail('fixture', 'a user { user_id, verified_email, wallet_address } is required');
    if (Object.prototype.hasOwnProperty.call(fixture, 'bystander')) {
        throw fail('fixture', '`bystander` is not an option: pass `bystanders: [sameEmailAndWallet, sameWalletOnly, sameEmailOnly]` (three other accounts)');
    }
    if (!nonEmptyString(user.verified_email) || !nonEmptyString(user.wallet_address)) throw fail('fixture', 'the user has a non-empty verified_email and wallet_address (a bystander shares one or both)');
    if (!Array.isArray(bystanders) || bystanders.length !== 3 || !bystanders.every(handle)) {
        throw fail('fixture', 'bystanders: [sameEmailAndWallet, sameWalletOnly, sameEmailOnly] (three other accounts { user_id, verified_email, wallet_address }) is required');
    }
    const ids = new Set([user.user_id, ...bystanders.map((b) => b.user_id)]);
    if (ids.size !== 4) throw fail('fixture', 'the user and the three bystanders are four different accounts (four user_ids)');
    const [both, walletOnly, emailOnly] = bystanders;
    const sameEmail = (b) => b.verified_email === user.verified_email;
    const sameWallet = (b) => b.wallet_address === user.wallet_address;
    if (!sameEmail(both) || !sameWallet(both)) throw fail('fixture', 'bystanders[0] shares the user\'s verified_email and wallet_address');
    if (!sameWallet(walletOnly) || sameEmail(walletOnly)) throw fail('fixture', 'bystanders[1] shares the user\'s wallet_address and NOT its verified_email');
    if (!sameEmail(emailOnly) || sameWallet(emailOnly)) throw fail('fixture', 'bystanders[2] shares the user\'s verified_email and NOT its wallet_address');
    if (typeof snapshot !== 'function') throw fail('fixture', 'snapshot() -> Map<path, value> of the seeded store is required (collateral writes are judged from it)');
    if (!clientTarget || !nonEmptyString(clientTarget.databaseId) || (clientTarget.projectId !== undefined && !nonEmptyString(clientTarget.projectId))) {
        throw fail('fixture', 'clientTarget { databaseId, projectId? }, read by the caller from the Firestore client it injected into the owner, is required (storeTarget() is judged against it)');
    }
    if (merges && (!nonEmptyString(pair?.from?.user_id) || !nonEmptyString(pair?.into?.user_id))) {
        throw fail('fixture', 'a merge owner is checked with a pair { from, into } whose merge footprint has a move');
    }
    const rawSnap = async () => {
        const m = await snapshot();
        if (!(m instanceof Map)) throw fail('fixture', `snapshot() answered ${Object.prototype.toString.call(m)}, not a Map`);
        return m;
    };
    const snap = async () => new Map([...(await rawSnap())].map(([p, v]) => [p, asText(v)]));
    /** Paths whose presence or value differs between two snapshots. */
    const diff = (x, y) => sortedUnique([...x.keys(), ...y.keys()].filter((p) => x.get(p) !== y.get(p)));

    // (f) the database the owner's client targets
    const t = await call('f', 'storeTarget()', () => owner.storeTarget());
    if (!t || !nonEmptyString(t.databaseId)) throw fail('f', `storeTarget() answered ${JSON.stringify(t ?? null)?.slice(0, 200)}, not { databaseId: string }`);
    if (t.projectId !== undefined && !nonEmptyString(t.projectId)) throw fail('f', `storeTarget().projectId is ${JSON.stringify(t.projectId)}, not a non-empty string`);
    if (t.databaseId !== clientTarget.databaseId) throw fail('f', `storeTarget() reports database '${t.databaseId}', but the client the caller injected targets '${clientTarget.databaseId}'`);
    if (t.projectId !== undefined && clientTarget.projectId !== undefined && t.projectId !== clientTarget.projectId) {
        throw fail('f', `storeTarget() reports project '${t.projectId}', but the client the caller injected targets '${clientTarget.projectId}'`);
    }
    passed('f');

    // (b) the delete footprint
    const checkFootprint = (clause, label, fp, { merge = false } = {}) => {
        const why = footprintViolation(fp, { merge, credentialKeys: owner.credentialKeys });
        if (why) throw fail(clause, `${label}: ${why}`);
        return fp;
    };
    const footprintOf = (clause, who, label) => call(clause, label, () => owner.footprintForUser(who));
    const footprint = (clause) => footprintOf(clause, user, 'footprintForUser(user)');
    const sameFootprint = (a, b) => canonicalJson({ e: a.entries, l: a.leftovers, b: a.blockers }) === canonicalJson({ e: b.entries, l: b.leftovers, b: b.blockers });
    const samePaths = (a, b) => canonicalJson(sortedUnique(a.entries.map((e) => e.path))) === canonicalJson(sortedUnique(b.entries.map((e) => e.path)));

    const s0 = await snap();
    const fp1 = checkFootprint('b', 'footprintForUser(user)', await footprint('b'));
    const fp2 = checkFootprint('b', 'footprintForUser(user)', await footprint('b'));
    if (!sameFootprint(fp1, fp2)) throw fail('b', 'two reads with no write between them answered different footprints (read twice); a footprint is read-only and deterministic');
    const wrote = diff(s0, await snap());
    if (wrote.length) throw fail('b', `reading the footprint changed the store at ${wrote.join(', ')}`);
    const paths = fp1.entries.map((e) => e.path);
    if (emptyFootprint && paths.length) throw fail('fixture', `emptyFootprint is declared but the footprint lists ${paths.length} entr(ies)`);
    if (!emptyFootprint && !paths.length) throw fail('fixture', 'the user\'s footprint has no entry, so deleteForUser cannot be shown exact; seed one (or declare emptyFootprint: true for an owner that never lists any)');
    if (fp1.blockers.length) throw fail('fixture', `the user's footprint carries blocker(s) ${fp1.blockers.map((b) => b.code).join(', ')}; seed a user this owner would delete`);
    passed('b');

    // (g) three bystanders sharing the email and/or the wallet
    const labels = ['bystanders[0] (same email and wallet)', 'bystanders[1] (same wallet only)', 'bystanders[2] (same email only)'];
    const bystanderFps = [];
    for (const [i, b] of bystanders.entries()) {
        const bfp = checkFootprint('g', `footprintForUser(${labels[i]})`, await footprintOf('g', b, `footprintForUser(${labels[i]})`));
        if (!emptyFootprint && !bfp.entries.length) throw fail('fixture', `the footprint of ${labels[i]} has no entry; seed one so an owner that reaches it can be caught`);
        const theirs = new Set(bfp.entries.map((e) => e.path));
        const shared = paths.filter((p) => theirs.has(p));
        if (shared.length) throw fail('g', `footprintForUser(user) lists ${shared.join(', ')}, which the footprint of ${labels[i]} also lists: a footprint is read by the account id, never by its email or wallet`);
        bystanderFps.push(bfp);
    }
    passed('g');

    // (n) no path names a credential
    {
        const declared = new Set(owner.credentialIdCollections ?? []);
        const raw = await rawSnap();
        for (const e of fp1.entries) {
            const collectionId = e.path.split('/').slice(-2)[0];
            if (declared.has(collectionId) && (e.pathIsSecret !== true || !isSecretPath(e.path))) {
                throw fail('n', `an entry of ${collectionId}, declared in credentialIdCollections, is not a secretPath with pathIsSecret: true`);
            }
            if (e.pathIsSecret === true && !declared.has(collectionId)) {
                throw fail('n', `an entry of ${collectionId} is pathIsSecret, but credentialIdCollections does not declare ${collectionId}`);
            }
            const secrets = credentialValues(asDoc(raw.get(e.path)), { keys: owner.credentialKeys });
            const named = e.path.split('/').some((seg) => secrets.includes(seg));
            if (named) {
                throw fail('n', `an entry path in ${e.path.split('/').slice(0, -1).join('/')} has a segment equal to a credential its document holds (redacted in its data): the document id is a credential; declare ${collectionId} in credentialIdCollections and name it secretPath(collection, id)`);
            }
        }
        passed('n');
    }

    // (j) bounded reads
    if (typeof countUnboundedReads !== 'function') {
        skipped('j', 'no countUnboundedReads hook: the caller gave no way to count reads without a limit');
    } else {
        const reads = [['footprintForUser(user)', () => owner.footprintForUser(user)]];
        if (merges) reads.push(['footprintForMerge(pair)', () => owner.footprintForMerge(pair)]);
        for (const [label, fn] of reads) {
            const n0 = countUnboundedReads();
            await call('j', label, fn);
            const n = countUnboundedReads() - n0;
            if (n) throw fail('j', `${label} made ${n} read(s) without a limit; every read carries .limit(ACCOUNT_READ_LIMIT)`);
        }
        passed('j');
    }

    // (d) a failed read
    if (typeof withFailingReads !== 'function') {
        skipped('d', 'no withFailingReads hook: the caller gave no way to make its store fail');
    } else {
        const underFailure = [['footprintForUser(user)', () => owner.footprintForUser(user)]];
        if (merges) underFailure.push(['footprintForMerge(pair)', () => owner.footprintForMerge(pair)]);
        for (const [label, fn] of underFailure) {
            let answer;
            try {
                answer = await withFailingReads(fn);
            } catch (e) {
                if (!(e instanceof AccountAdminError) || e.code !== R.ACCOUNT_STORE_READ_FAILED) {
                    throw fail('d', `${label} under failing reads threw ${describe(e)}, not an AccountAdminError ACCOUNT_STORE_READ_FAILED`);
                }
                continue;
            }
            throw fail('d', `${label} answered a footprint while every read failed (${JSON.stringify(answer)?.slice(0, 200)}); a failed read is never an empty footprint`);
        }
        passed('d');
    }

    // (e) the merge round trip, then (i) a rollback over a changed value
    if (!merges) {
        skipped('e', 'not a merge owner (no merge methods): on a merge its footprintForUser entries and leftovers are listed as staying on the from-record');
        skipped('i', 'not a merge owner');
    } else {
        const mergeFootprint = async (clause, label) => checkFootprint(clause, label, await call(clause, label, () => owner.footprintForMerge(pair)), { merge: true });
        const sameMerge = (a, b) => canonicalJson(a.entries) === canonicalJson(b.entries);
        const m1 = await mergeFootprint('e', 'footprintForMerge(pair)');
        if (!m1.entries.length) throw fail('fixture', 'the pair\'s merge footprint has no move; seed one so the merge round trip can fail');
        if (m1.blockers.length) throw fail('fixture', `the pair's merge footprint carries blocker(s) ${m1.blockers.map((b) => b.code).join(', ')}`);
        if (!sameMerge(m1, await mergeFootprint('e', 'footprintForMerge(pair), read twice'))) throw fail('e', 'two merge-footprint reads with no write between them differ');
        const movePaths = sortedUnique(m1.entries.map((m) => m.path));
        for (const [label, opts] of [['mergeForUser(pair, a stale expectPaths)', { expectPaths: [...movePaths.slice(1), NOT_PLANNED] }], ['mergeForUser(pair, no expectPaths)', {}]]) {
            const before = await snap();
            await refuses('e', label, R.ACCOUNT_PLAN_STALE, () => owner.mergeForUser(pair, opts));
            const changed = diff(before, await snap());
            if (changed.length) throw fail('e', `${label} refused but changed the store at ${changed.join(', ')}: it wrote before refusing`);
        }
        const all = sortedUnique(m1.entries.map(moveKey));
        const covers = (label, r, a, b) => {
            if (!Array.isArray(r?.[a]) || !Array.isArray(r?.[b])) throw fail('e', `${label} returned ${JSON.stringify(r)?.slice(0, 200)}, not { ${a}, ${b} }`);
            for (const m of [...r[a], ...r[b]]) if (!nonEmptyString(m?.path) || !nonEmptyString(m?.field)) throw fail('e', `${label}: ${a}/${b} items are { path, field, key? } (got ${JSON.stringify(m)?.slice(0, 200)})`);
            const got = sortedUnique([...r[a], ...r[b]].map(moveKey));
            if (canonicalJson(got) !== canonicalJson(all)) throw fail('e', `${label}: ${a} + ${b} cover ${got.join(', ') || 'nothing'}, not the planned moves ${all.join(', ')}`);
            return new Set(r[a].map(moveKey));
        };
        const merge = async (clause) => covers('mergeForUser(pair, { expectPaths })', await call(clause, 'mergeForUser(pair, { expectPaths })', () => owner.mergeForUser(pair, { expectPaths: movePaths })), 'moved', 'remaining');
        const moved = await merge('e');
        const after = await mergeFootprint('e', 'footprintForMerge(pair) after mergeForUser');
        const still = after.entries.map(moveKey).filter((k) => moved.has(k));
        if (still.length) throw fail('e', `footprintForMerge still lists ${still.join(', ')} after mergeForUser reported it moved`);
        const receiptMoves = () => JSON.parse(JSON.stringify(m1.entries.map(({ summary, ...m }) => m)));
        await call('e', 'validateRollbackMoves(the receipt\'s moves, pair)', () => owner.validateRollbackMoves(receiptMoves(), pair));
        const edited = receiptMoves();
        edited[0].path = NOT_PLANNED;
        for (const [label, fn] of [['validateRollbackMoves(an edited move, pair)', () => owner.validateRollbackMoves(edited, pair)], ['rollbackMergeForUser(an edited move, pair)', () => owner.rollbackMergeForUser(edited, pair)]]) {
            const before = await snap();
            await refuses('e', label, R.ACCOUNT_RECEIPT_INVALID, fn);
            const changed = diff(before, await snap());
            if (changed.length) throw fail('e', `${label} refused but changed the store at ${changed.join(', ')}: every move is validated before the first write`);
        }
        covers('rollbackMergeForUser(moves, pair)', await call('e', 'rollbackMergeForUser(moves, pair)', () => owner.rollbackMergeForUser(receiptMoves(), pair)), 'restored', 'remaining');
        const again = new Set((await mergeFootprint('e', 'footprintForMerge(pair) after rollbackMergeForUser')).entries.map(moveKey));
        const missing = all.filter((k) => !again.has(k));
        if (missing.length) throw fail('e', `${missing.join(', ')} not listed again after rollbackMergeForUser: the rollback did not restore it`);
        passed('e');

        if (typeof changeAfterMerge !== 'function') {
            skipped('i', 'no changeAfterMerge hook: the caller gave no way to change a moved value after the merge');
        } else {
            const valueAt = (s, m) => {
                const doc = asDoc(s.get(m.path));
                if (doc === undefined) return undefined;
                const v = doc?.[m.field];
                return canonicalJson(m.key === undefined ? (v ?? null) : (v?.[m.key] ?? null));
            };
            const moved2 = await merge('i');
            const target = m1.entries.find((m) => moved2.has(moveKey(m)));
            if (!target) throw fail('fixture', 'the merge moved nothing, so no moved value can be changed');
            await call('i', `changeAfterMerge(${moveKey(target)})`, () => changeAfterMerge(JSON.parse(JSON.stringify(target))));
            const s1 = await snap();
            if (valueAt(s1, target) === canonicalJson(target.to ?? null)) throw fail('fixture', `changeAfterMerge(${moveKey(target)}) left the moved value as the merge wrote it`);
            const r = await call('i', 'rollbackMergeForUser(moves, pair)', () => owner.rollbackMergeForUser(receiptMoves(), pair));
            covers('rollbackMergeForUser(moves, pair) after a change', r, 'restored', 'remaining');
            if (r.restored.some((m) => moveKey(m) === moveKey(target))) throw fail('i', `rollbackMergeForUser reported ${moveKey(target)} restored, but its value had changed since the merge`);
            if (valueAt(await snap(), target) !== valueAt(s1, target)) throw fail('i', `rollbackMergeForUser overwrote ${moveKey(target)}, a value changed since the merge`);
            passed('i');
        }
    }

    // (h) a delete with a blocker present
    if (typeof withBlocker !== 'function') {
        skipped('h', 'no withBlocker hook: the caller gave no way to make deleting the user blocked');
    } else {
        await withBlocker(async () => {
            const fp = checkFootprint('h', 'footprintForUser(user) with a blocker', await footprint('h'));
            if (!fp.blockers.length) throw fail('fixture', 'withBlocker set nothing the user\'s footprint reports as a blocker');
            const before = await snap();
            await refuses('h', 'deleteForUser(user, the plan) with a blocker present', fp.blockers.map((b) => b.code), () => owner.deleteForUser(user, planOf(fp)));
            const changed = diff(before, await snap());
            if (changed.length) throw fail('h', `deleteForUser refused for a blocker but changed the store at ${changed.join(', ')}`);
        });
        passed('h');
    }

    // (l) a document changed after the footprint
    if (emptyFootprint) {
        skipped('l', 'emptyFootprint: no document to change');
    } else if (typeof changeAfterFootprint !== 'function') {
        if (owner.irrecoverable === true) throw fail('l', 'an irrecoverable owner is checked with changeAfterFootprint(path): its in-transaction data comparison is the only thing between a stale plan and a delete nobody can undo');
        skipped('l', 'no changeAfterFootprint hook: the caller gave no way to change a document after the footprint');
    } else {
        const fp = checkFootprint('l', 'footprintForUser(user)', await footprint('l'));
        const target = fp.entries.find((e) => e.volatile !== true);
        if (!target) throw fail('fixture', 'every entry of the user\'s footprint is volatile; no document can be shown stale');
        const before = await snap();
        await call('l', `changeAfterFootprint(${target.path})`, () => changeAfterFootprint(target.path));
        const s1 = await snap();
        if (s1.get(target.path) === before.get(target.path)) throw fail('fixture', `changeAfterFootprint(${target.path}) left the document as it was`);
        if (!samePaths(fp, checkFootprint('l', 'footprintForUser(user) after the change', await footprint('l')))) throw fail('fixture', 'changeAfterFootprint changed which documents the footprint lists; it changes one document\'s data');
        await refuses('l', 'deleteForUser(user, the plan of the footprint before the change)', R.ACCOUNT_PLAN_STALE, () => owner.deleteForUser(user, planOf(fp)));
        const changed = diff(s1, await snap());
        if (changed.length) throw fail('l', `deleteForUser refused a stale plan but changed the store at ${changed.join(', ')}`);
        passed('l');
    }

    // (c) delete exactly, nothing else (last but restore: it deletes the fixture)
    const fpNow = checkFootprint('c', 'footprintForUser(user)', await footprint('c'));
    if (!samePaths(fp1, fpNow)) throw fail('fixture', 'the documents of the user\'s footprint changed during the earlier clauses; check delete against an unchanged set');
    const plan = planOf(fpNow);
    const dataKeys = Object.keys(plan.expectData);
    const staleVariants = [
        ['deleteForUser(user, a stale expectPaths)', {
            expectPaths: [...paths.slice(1), NOT_PLANNED],
            expectData: { ...Object.fromEntries(Object.entries(plan.expectData).filter(([p]) => p !== paths[0])), [NOT_PLANNED]: entryDataHash(null) },
        }],
        ['deleteForUser(user, no expectPaths)', {}],
    ];
    if (dataKeys.length) {
        staleVariants.push(['deleteForUser(user, { expectPaths } without expectData)', { expectPaths: plan.expectPaths }]);
        staleVariants.push(['deleteForUser(user, a planned data hash other than the document\'s)', { expectPaths: plan.expectPaths, expectData: { ...plan.expectData, [dataKeys[0]]: entryDataHash({ conformance: 'not the planned data' }) } }]);
    }
    for (const [label, opts] of staleVariants) {
        const before = await snap();
        await refuses('c', label, R.ACCOUNT_PLAN_STALE, () => owner.deleteForUser(user, opts));
        const changed = diff(before, await snap());
        if (changed.length) throw fail('c', `${label} refused but changed the store at ${changed.join(', ')}: it wrote before refusing`);
    }
    const sBefore = await snap();
    const r = await call('c', 'deleteForUser(user, { expectPaths, expectData })', () => owner.deleteForUser(user, planOf(fpNow)));
    if (!Array.isArray(r?.deleted) || !Array.isArray(r?.remaining) || [...r.deleted, ...r.remaining].some((p) => typeof p !== 'string')) {
        throw fail('c', `deleteForUser returned ${JSON.stringify(r)?.slice(0, 200)}, not { deleted: string[], remaining: string[] }`);
    }
    const covered = [...r.deleted, ...r.remaining];
    if (new Set(covered).size !== covered.length || canonicalJson(sortedUnique(covered)) !== canonicalJson(sortedUnique(paths))) {
        throw fail('c', `deleted + remaining (${covered.join(', ') || 'nothing'}) are not exactly expectPaths (${paths.join(', ') || 'nothing'}), each once`);
    }
    const left = new Set((await footprint('c')).entries.map((e) => e.path));
    const lied = r.deleted.filter((p) => left.has(p));
    if (lied.length) throw fail('c', `a fresh footprint still lists ${lied.join(', ')} that deleteForUser reported deleted`);
    const vanished = r.remaining.filter((p) => !left.has(p));
    if (vanished.length) throw fail('c', `deleteForUser reported ${vanished.join(', ')} remaining but a fresh footprint does not list it`);
    const sAfter = await snap();
    const changed = diff(sBefore, sAfter);
    const collateral = changed.filter((p) => !r.deleted.includes(p));
    if (collateral.length) throw fail('c', `deleteForUser changed ${collateral.join(', ')}, which is not a path it deleted (a collateral write)`);
    const unseen = r.deleted.filter((p) => !changed.includes(p));
    if (unseen.length) throw fail('c', `deleteForUser reported ${unseen.join(', ')} deleted, but the store snapshot shows no change there`);
    for (const [i, b] of bystanders.entries()) {
        const after = checkFootprint('c', `footprintForUser(${labels[i]}) after the delete`, await footprintOf('c', b, `footprintForUser(${labels[i]})`));
        if (!sameFootprint(bystanderFps[i], after)) throw fail('c', `deleting the user changed the footprint of ${labels[i]}`);
    }
    passed('c');

    // (m), (k) restore
    if (!restores) {
        skipped('m', `no ${STORE_OWNER_RESTORE_METHOD}`);
        skipped('k', `no ${STORE_OWNER_RESTORE_METHOD}: a restoreDelete reports this owner's absent entries as not restorable`);
    } else {
        const asReceipt = (es) => JSON.parse(JSON.stringify(es.filter((e) => e.volatile !== true && e.pathIsSecret !== true)));
        const receiptEntries = asReceipt(fpNow.entries.filter((e) => r.deleted.includes(e.path)));
        if (!receiptEntries.length) throw fail('fixture', 'the delete removed no restorable entry, so restore cannot be shown');

        // (m) a path that is not this account's: refused before any write
        const foreign = [['an entry re-pathed outside the store', { ...receiptEntries[0], path: NOT_PLANNED }]];
        const theirs = asReceipt(bystanderFps[0].entries)[0];
        if (theirs) foreign.push([`${labels[0]}'s own entry`, theirs]);
        for (const [label, entry] of foreign) {
            const before = await snap();
            await refuses('m', `${STORE_OWNER_RESTORE_METHOD}(user, the user's entries and ${label})`, R.ACCOUNT_RECEIPT_INVALID, () => owner[STORE_OWNER_RESTORE_METHOD](user, [...JSON.parse(JSON.stringify(receiptEntries)), entry]));
            const moved = diff(before, await snap());
            if (moved.length) throw fail('m', `${STORE_OWNER_RESTORE_METHOD} refused ${label} but changed the store at ${moved.join(', ')}: every entry is checked before the first write`);
        }
        passed('m');

        // (k) create-only
        const s1 = await snap();
        const rr = await call('k', `${STORE_OWNER_RESTORE_METHOD}(user, entries)`, () => owner[STORE_OWNER_RESTORE_METHOD](user, receiptEntries));
        if (!Array.isArray(rr?.restored) || !Array.isArray(rr?.remaining) || [...rr.restored, ...rr.remaining].some((p) => typeof p !== 'string')) {
            throw fail('k', `${STORE_OWNER_RESTORE_METHOD} returned ${JSON.stringify(rr)?.slice(0, 200)}, not { restored: string[], remaining: string[] }`);
        }
        const want = sortedUnique(receiptEntries.map((e) => e.path));
        if (canonicalJson(sortedUnique([...rr.restored, ...rr.remaining])) !== canonicalJson(want)) throw fail('k', `restored + remaining do not cover the entries ${want.join(', ')}`);
        const back = new Set((await footprint('k')).entries.map((e) => e.path));
        const notBack = rr.restored.filter((p) => !back.has(p));
        if (notBack.length) throw fail('k', `reported ${notBack.join(', ')} restored, but a fresh footprint does not list it`);
        const s2 = await snap();
        const outside = diff(s1, s2).filter((p) => !rr.restored.includes(p));
        if (outside.length) throw fail('k', `${STORE_OWNER_RESTORE_METHOD} changed ${outside.join(', ')}, which it did not restore`);
        await call('k', `${STORE_OWNER_RESTORE_METHOD}(user, entries) again`, () => owner[STORE_OWNER_RESTORE_METHOD](user, receiptEntries));
        const overwrote = diff(s2, await snap());
        if (overwrote.length) throw fail('k', `a second ${STORE_OWNER_RESTORE_METHOD} with every document present changed ${overwrote.join(', ')}: it overwrote an existing document`);
        passed('k');
    }

    checks.sort((x, y) => ORDER.indexOf(x.clause) - ORDER.indexOf(y.clause));
    return Object.freeze({ owner: owner.name, checks: Object.freeze(checks) });
}
