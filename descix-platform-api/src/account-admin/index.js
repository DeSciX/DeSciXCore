/**
 * THE operator account admin: DELETE a test account (and restore the absent entries of a PARTIAL delete),
 * MERGE a legacy record into its passkey account, roll a merge back. In-process only: a local operator app
 * builds it with createAccountAdmin and the store owners it booted; no command, route or tool
 * reaches it.
 *
 * It holds no Firestore client. Every read and write goes through a store owner (contract.js): the User
 * owner (`userAccountOwner`, @descix/platform-api) and the dependent store owners the caller passes (Cloud's,
 * Powch's). Owners never call each other; this module sequences them. A delete runs: the User owner's
 * pre-flight (writes nothing), the dependents, the User owner's pre-flight again, the `irrecoverable`
 * dependents, the User owner LAST, so a failed dependent never leaves an orphaned USERS doc behind and the
 * User owner refusing at its turn never strands an irrecoverable delete.
 *
 * Every act first measures the database each owner's client targets (storeTarget) against the target this
 * instance was built for, which the factory measured against the booted cloud-core config of the env.
 *
 * Every refusal THROWS an AccountAdminError and has written nothing. A commit RETURNS once a write was
 * attempted, with an ending decided only from a read-back through the owners.
 */
import crypto from 'node:crypto';
import {
    normalizeOperatorEmailRule,
    operatorEmailAllowed,
    operatorEmailRulePrefixes,
    assertOperatorTarget,
    OperatorGuardError,
    OperatorGuardRefusal,
} from '../operator/index.js';
import { bootedEnvDatabaseId } from '../operator/booted-database.js';
import { normalizeEmail } from '../email/index.js';
import {
    AccountAdminRefusal as R,
    AccountAdminError,
    deletePlanHash,
    mergePlanHash,
    accountAdminHash,
    DELETE_OUTCOME,
    MERGE_OUTCOME,
    MERGE_ROLLBACK_OUTCOME,
    RESTORE_OUTCOME,
    STORE_OWNER_METHODS,
    STORE_OWNER_MERGE_METHODS,
    STORE_OWNER_RESTORE_METHOD,
    USER_OWNER_METHODS,
    nonJsonValuePath,
    footprintViolation,
    moveKey,
    entryDataHash,
    deleteExpectations,
} from './contract.js';

export * from './contract.js';
export * from './conformance.js';

/** How long a plan stays committable after it was made. */
export const ACCOUNT_PLAN_TTL_SECONDS = 600;

const refuse = (code, message, opts) => new AccountAdminError(code, message, opts);

function assertOwner(owner, label, { user = false } = {}) {
    if (!owner || typeof owner !== 'object') throw new Error(`createAccountAdmin: ${label} is required`);
    if (typeof owner.name !== 'string' || !owner.name) throw new Error(`createAccountAdmin: ${label} has no name`);
    const missing = STORE_OWNER_METHODS.filter((m) => typeof owner[m] !== 'function');
    if (missing.length) throw new Error(`createAccountAdmin: store owner '${owner.name}' lacks ${missing.join(', ')} (the store-owner contract: ${STORE_OWNER_METHODS.join(', ')})`);
    if (owner.credentialKeys !== undefined && (!Array.isArray(owner.credentialKeys) || owner.credentialKeys.some((k) => typeof k !== 'string' || !k))) {
        throw new Error(`createAccountAdmin: store owner '${owner.name}' credentialKeys must be an array of key names`);
    }
    if (owner.credentialIdCollections !== undefined && (!Array.isArray(owner.credentialIdCollections) || owner.credentialIdCollections.some((k) => typeof k !== 'string' || !k || k.includes('/')))) {
        throw new Error(`createAccountAdmin: store owner '${owner.name}' credentialIdCollections must be an array of collection ids`);
    }
    if (owner.irrecoverable !== undefined && typeof owner.irrecoverable !== 'boolean') {
        throw new Error(`createAccountAdmin: store owner '${owner.name}' irrecoverable must be true or false (got ${JSON.stringify(owner.irrecoverable)})`);
    }
    if (owner[STORE_OWNER_RESTORE_METHOD] !== undefined && typeof owner[STORE_OWNER_RESTORE_METHOD] !== 'function') {
        throw new Error(`createAccountAdmin: store owner '${owner.name}' ${STORE_OWNER_RESTORE_METHOD} is not a function`);
    }
    const merge = STORE_OWNER_MERGE_METHODS.filter((m) => typeof owner[m] === 'function');
    if (merge.length && merge.length !== STORE_OWNER_MERGE_METHODS.length) {
        throw new Error(`createAccountAdmin: store owner '${owner.name}' implements ${merge.join(', ')} but not ${STORE_OWNER_MERGE_METHODS.filter((m) => !merge.includes(m)).join(', ')}; a merge owner implements all of ${STORE_OWNER_MERGE_METHODS.join(', ')} or none`);
    }
    if (user) {
        if (owner.name !== 'user') throw new Error(`createAccountAdmin: userOwner must be the User owner (name 'user'), got '${owner.name}'`);
        const lacking = [...STORE_OWNER_MERGE_METHODS, ...USER_OWNER_METHODS].filter((m) => typeof owner[m] !== 'function');
        if (lacking.length) throw new Error(`createAccountAdmin: userOwner lacks ${lacking.join(', ')}; pass userAccountOwner from @descix/platform-api, not a mirror of it`);
        if (owner.irrecoverable === true || owner[STORE_OWNER_RESTORE_METHOD] !== undefined) {
            throw new Error(`createAccountAdmin: the User owner declares neither irrecoverable nor ${STORE_OWNER_RESTORE_METHOD} (it always goes last and restores nothing in v1)`);
        }
    } else if (owner.name === 'user') {
        throw new Error('createAccountAdmin: a dependent store owner cannot be named \'user\' (that is the User owner)');
    }
}

/** A footprint as the contract shapes it (footprintViolation), or a loud error naming the owner. */
function checkFootprint(owner, fp, { merge = false } = {}) {
    const why = footprintViolation(fp, { merge, credentialKeys: owner.credentialKeys, credentialIdCollections: owner.credentialIdCollections });
    if (why) throw new Error(`store owner '${owner.name}' returned a malformed ${merge ? 'merge ' : ''}footprint: ${why}`);
    return fp;
}

const moveOf = (owner, m) => ({ owner, path: m.path, field: m.field, ...(m.key === undefined ? {} : { key: m.key }), from: m.from ?? null, to: m.to ?? null });
const sortedUnique = (xs) => [...new Set(xs)].sort();
const describe = (e) => `${e?.code ? `${e.code}: ` : ''}${e?.message ?? e}`;
const isWalletCode = (code) => code === R.ACCOUNT_WALLET_VALUE_UNMEASURED || code === R.ACCOUNT_WALLET_HOLDS_VALUE;

/**
 * THE statement of what a delete plan's wallet reading did NOT measure, built only here and shown with every
 * delete plan (its top-level `notMeasured`, and `wallet.notMeasured`): value outside the reading's scope (the
 * reader's own `scope` sentence is referenced, not restated), an address that was not read, and each
 * wallet-material entry's owner-supplied `unmeasuredNote` (e.g. a vault's imported wallets on other chains).
 * @param {{ address: string|null, measured: boolean }} reading
 * @param {Array<{ owner: string, path: string, unmeasuredNote?: string }>} walletMaterial
 * @returns {string[]}
 */
function walletNotMeasured(reading, walletMaterial) {
    const out = [];
    if (reading.measured === true) out.push(`wallet ${reading.address}: value outside the reading's scope (wallet.scope) was not measured: any EVM network the scope does not name, and any token it does not cover`);
    else if (reading.address) out.push(`wallet ${reading.address}: not measured at all (wallet.failure)`);
    else out.push('the account has no wallet_address: no wallet reading was taken');
    for (const w of walletMaterial) if (w.unmeasuredNote) out.push(`${w.owner}: ${w.path}: ${w.unmeasuredNote}`);
    return out;
}

/**
 * The operator account admin bound to ONE environment, Firestore target and operator email rule. Throws,
 * before any read, when an owner lacks a contract method, the wallet reader is missing, the env is not
 * dev|demo|prod, the booted cloud-core config is not that env or names no database for it, or the target is
 * not the database the env's own defaults-config-<env>.json names (bootedEnvDatabaseId; ACCOUNT_TARGET_INVALID),
 * or the rule is missing/invalid (ACCOUNT_RULE_INVALID). The expected database is never caller-supplied.
 *
 * @param {{
 *   userOwner: typeof import('../models/index.js').userAccountOwner,
 *   storeOwners: Array<{ name: string, footprintForUser: Function, deleteForUser: Function, storeTarget: Function,
 *     irrecoverable?: boolean, restoreForUser?: Function, credentialKeys?: string[],
 *     footprintForMerge?: Function, mergeForUser?: Function, rollbackMergeForUser?: Function, validateRollbackMoves?: Function }>,
 *   walletValueReader: (address: string) => Promise<{ measured: true, holdsValue: boolean, summary: string, scope: string, details?: object }>,
 *   env: 'dev'|'demo'|'prod',
 *   target: { projectId: string, databaseId: string, secretName: string },
 *   rule: { localPart: string, plusAddressing: boolean, domains: string[] },
 *   now?: () => number,
 * }} args
 */
export function createAccountAdmin(args = {}) {
    if (Object.prototype.hasOwnProperty.call(args, 'expectedDatabaseIdFor')) {
        throw new Error('createAccountAdmin: expectedDatabaseIdFor is not an option: the expected database is measured from the booted @descix/cloud-core config (bootedEnvDatabaseId), never supplied by the caller. Remove it.');
    }
    const { userOwner, storeOwners, walletValueReader, env, target, rule, now } = args;
    assertOwner(userOwner, 'userOwner', { user: true });
    if (!Array.isArray(storeOwners)) throw new Error('createAccountAdmin: storeOwners (the dependent store owners, possibly none) must be an array');
    const names = new Set(['user']);
    for (const [i, o] of storeOwners.entries()) {
        assertOwner(o, `storeOwners[${i}]`);
        if (names.has(o.name)) throw new Error(`createAccountAdmin: two store owners are named '${o.name}'`);
        names.add(o.name);
    }
    if (typeof walletValueReader !== 'function') throw new Error('createAccountAdmin: walletValueReader (address) => { measured, holdsValue, summary, scope } is required');
    let normalizedRule;
    let measured;
    try {
        measured = bootedEnvDatabaseId(env);
        assertOperatorTarget({ env, target, expectedDatabaseId: measured.databaseId });
        normalizedRule = normalizeOperatorEmailRule(rule);
    } catch (e) {
        if (!(e instanceof OperatorGuardError)) throw e;
        const code = e.code === OperatorGuardRefusal.RULE_INVALID ? R.ACCOUNT_RULE_INVALID : R.ACCOUNT_TARGET_INVALID;
        throw refuse(code, `${e.message}${/Nothing was read or written\.$/.test(e.message) ? '' : ' Nothing was read or written.'}`, { cause: e });
    }
    const owners = Object.freeze([...storeOwners, userOwner]);
    const ownerByName = new Map(owners.map((o) => [o.name, o]));
    // The delete sequence: dependents, then irrecoverable dependents, then the User owner.
    const deleteOrder = Object.freeze([...storeOwners.filter((o) => o.irrecoverable !== true), ...storeOwners.filter((o) => o.irrecoverable === true), userOwner]);
    const clock = now ?? (() => Date.now());
    const ttlMs = ACCOUNT_PLAN_TTL_SECONDS * 1000;
    const plans = new Map();
    const boundTarget = Object.freeze({ projectId: target.projectId, databaseId: target.databaseId, secretName: target.secretName });

    // ------------------------------------------------------------------ the target each owner's client measures

    /**
     * Refuse (ACCOUNT_TARGET_INVALID, nothing read) unless every owner's own client targets the bound
     * database (and project, when the owner reports one). Two @descix/cloud-core instances in one process
     * (a service's and this package's) build two clients from two configs: this is where they disagree.
     */
    async function assertStoreTargets() {
        for (const owner of owners) {
            let t;
            try {
                t = await owner.storeTarget();
            } catch (e) {
                throw refuse(R.ACCOUNT_TARGET_INVALID, `store owner '${owner.name}' could not report the database its client targets (${describe(e)}). Nothing was read or written.`, { cause: e });
            }
            if (!t || typeof t.databaseId !== 'string' || !t.databaseId) {
                throw refuse(R.ACCOUNT_TARGET_INVALID, `store owner '${owner.name}' storeTarget() answered ${JSON.stringify(t ?? null)?.slice(0, 200)}, not { databaseId: string }. Nothing was read or written.`);
            }
            if (t.databaseId !== boundTarget.databaseId) {
                throw refuse(R.ACCOUNT_TARGET_INVALID, `store owner '${owner.name}' reads and writes database '${t.databaseId}', not '${boundTarget.databaseId}' (env ${env}, ${measured.file}): its client was built from another config or another @descix/cloud-core instance. Nothing was read or written.`);
            }
            if (t.projectId !== undefined && t.projectId !== boundTarget.projectId) {
                throw refuse(R.ACCOUNT_TARGET_INVALID, `store owner '${owner.name}' targets project '${t.projectId}', not '${boundTarget.projectId}'. Nothing was read or written.`);
            }
        }
    }

    // ------------------------------------------------------------------ the rule and the accounts

    const inRule = (view) => (view.verifiedEmail
        ? operatorEmailAllowed(normalizedRule, view.verifiedEmail)
        : view.emailKeyed && operatorEmailAllowed(normalizedRule, view.accountId));

    /** The account's view, refused unless it exists and the rule names it (the refusal never prints its address). */
    async function accountInRule(accountId, role = 'account') {
        if (typeof accountId !== 'string' || !accountId.trim()) throw refuse(R.ACCOUNT_NOT_FOUND, `an ${role} id is required; nothing was read`);
        const view = await userOwner.account(accountId.trim());
        if (!view.exists) throw refuse(R.ACCOUNT_NOT_FOUND, `no account ${accountId} (${role}); nothing was written`);
        if (!inRule(view)) {
            throw refuse(R.ACCOUNT_NOT_IN_RULE, `account ${view.accountId} (${role}): ${view.verifiedEmail ? 'its verified email is not one the operator email rule names' : 'it has no verified email the operator email rule names'}; nothing was written`);
        }
        return view;
    }

    const storeUser = (view) => Object.freeze({ user_id: view.accountId, verified_email: view.verifiedEmail, wallet_address: view.walletAddress });

    // ------------------------------------------------------------------ plans and receipts

    function keepPlan(plan) {
        const t = clock();
        for (const [id, p] of plans) if (t - p.since > ttlMs) plans.delete(id);
        const planId = crypto.randomBytes(16).toString('base64url');
        plans.set(planId, { ...plan, since: t });
        return { planId, expiresAt: new Date(t + ttlMs).toISOString() };
    }

    function takePlan(planId, kind) {
        const p = typeof planId === 'string' ? plans.get(planId) : undefined;
        if (!p || p.kind !== kind) throw refuse(R.ACCOUNT_PLAN_STALE, `this ${kind} plan is unknown, already used or expired; plan again. Nothing was written.`);
        if (clock() - p.since > ttlMs) {
            plans.delete(planId);
            throw refuse(R.ACCOUNT_PLAN_STALE, `this ${kind} plan expired (${ACCOUNT_PLAN_TTL_SECONDS}s); plan again. Nothing was written.`);
        }
        return p;
    }

    const confirmMismatch = (typed, id) => typeof typed !== 'string' || typed.trim() !== id;

    function requireReceiptKeeper(receipt) {
        if (typeof receipt?.save !== 'function') throw refuse(R.ACCOUNT_RECEIPT_INVALID, 'commit needs receipt.save(r) -> label: the receipt is kept before any write. Nothing was written.');
    }

    async function saveReceipt(keeper, r) {
        const label = await keeper.save(structuredClone(r));
        if (typeof label !== 'string' || !label) throw refuse(R.ACCOUNT_RECEIPT_INVALID, 'receipt.save returned no label for the kept receipt; nothing was written.');
        return label;
    }

    /** Refuse a kept receipt of another env or target (ACCOUNT_RECEIPT_INVALID). */
    function assertReceiptHere(r) {
        if (r.env !== env || r.target?.databaseId !== boundTarget.databaseId || r.target?.projectId !== boundTarget.projectId) {
            throw refuse(R.ACCOUNT_RECEIPT_INVALID, `The receipt is for env ${r.env} / database ${r.target?.databaseId}, not ${env} / ${boundTarget.databaseId}. Nothing was written.`);
        }
    }

    function refuseUnknownOwners(names) {
        const unknown = sortedUnique(names).filter((n) => !ownerByName.has(n));
        if (unknown.length) throw refuse(R.ACCOUNT_RECEIPT_INVALID, `The receipt names store owner(s) ${unknown.join(', ')} that this instance does not hold. Nothing was written.`);
    }

    function refuseForBlockers(blockers, act) {
        throw refuse(blockers[0].code, `${act} refused: ${blockers.map((b) => `${b.code}${b.owner ? ` [${b.owner}]` : ''} (${b.detail})`).join('; ')}. Nothing was written.`, { details: blockers });
    }

    // ------------------------------------------------------------------ delete

    /**
     * One wallet reading as the plan shows it: { address, measured: true, holdsValue, summary, scope, details }
     * or { address, measured: false, failure }. Unmeasured is a throw, an answer other than measured === true
     * with a BOOLEAN holdsValue, a string summary and a non-empty string scope (what exactly was measured), or
     * `details` that is not plain JSON; never read as empty.
     */
    async function readWallet(address) {
        let answer;
        try {
            answer = await walletValueReader(address);
        } catch (e) {
            return { address, measured: false, failure: `the value read failed (${e?.message ?? e})` };
        }
        if (!answer || answer.measured !== true || typeof answer.holdsValue !== 'boolean' || typeof answer.summary !== 'string') {
            return { address, measured: false, failure: `the value read answered no measurement (${JSON.stringify(answer ?? null)?.slice(0, 200)}); a reading is { measured: true, holdsValue: boolean, summary: string, scope: string, details? }` };
        }
        if (typeof answer.scope !== 'string' || !answer.scope.trim()) {
            return { address, measured: false, failure: 'the reading names no scope (what exactly was measured: which assets, on which chains, for this address); a reading without a scope is not a measurement' };
        }
        const details = answer.details ?? null;
        const bad = details === null ? null : nonJsonValuePath(details);
        if (bad) return { address, measured: false, failure: `the reading's details.${bad === '(value)' ? '' : bad} is not plain JSON (amounts are decimal strings)` };
        return { address, measured: true, holdsValue: answer.holdsValue, summary: answer.summary, scope: answer.scope, details };
    }

    /**
     * The plan's wallet section and its blockers. The account's wallet_address is read by the wallet value
     * reader; an account without one whose stores hold wallet material (an entry marked walletMaterial) is
     * ACCOUNT_WALLET_VALUE_UNMEASURED; every owner's own wallet blocker (e.g. a derived-address chain nobody
     * measures) is shown with the section. Null when there is nothing to show.
     */
    async function walletSection(view, entries, ownerBlockers) {
        const walletMaterial = entries.filter((e) => e.walletMaterial === true).map((e) => ({ owner: e.owner, path: e.path, ...(e.unmeasuredNote ? { unmeasuredNote: e.unmeasuredNote } : {}) }));
        const own = [];
        let reading;
        if (view.walletAddress) {
            reading = await readWallet(view.walletAddress);
            if (!reading.measured) own.push({ owner: 'wallet', code: R.ACCOUNT_WALLET_VALUE_UNMEASURED, detail: `wallet ${reading.address}: ${reading.failure}; an unmeasured wallet is never read as empty` });
            else if (reading.holdsValue) own.push({ owner: 'wallet', code: R.ACCOUNT_WALLET_HOLDS_VALUE, detail: `wallet ${reading.address}: ${reading.summary || 'holds value'} (${reading.scope})` });
        } else {
            reading = { address: null, measured: false, failure: 'the account has no wallet_address; no reading was taken' };
            if (walletMaterial.length) {
                own.push({ owner: 'wallet', code: R.ACCOUNT_WALLET_VALUE_UNMEASURED, detail: `the account has no wallet_address, but its stores hold wallet material (${walletMaterial.map((w) => `${w.owner}: ${w.path}`).join(', ')}); nobody measured its value` });
            }
        }
        const fromOwners = ownerBlockers.filter((b) => isWalletCode(b.code));
        const notMeasured = walletNotMeasured(reading, walletMaterial);
        if (!view.walletAddress && !walletMaterial.length && !fromOwners.length) return { wallet: null, blockers: [], notMeasured };
        return { wallet: { ...reading, walletMaterial, blockers: [...own, ...fromOwners], notMeasured }, blockers: own, notMeasured };
    }

    /** Every owner's delete footprint, the coverage check and the wallet section; never stops at the first blocker. */
    async function gatherDelete(view) {
        const user = storeUser(view);
        const perOwner = [];
        const blockers = [];
        const leftovers = [];
        let nestedKnown = true;
        for (const owner of owners) {
            let fp;
            try {
                fp = checkFootprint(owner, await owner.footprintForUser(user));
            } catch (e) {
                if (!(e instanceof AccountAdminError)) throw e;
                blockers.push({ owner: owner.name, code: R.ACCOUNT_STORE_READ_FAILED, detail: e.message });
                perOwner.push({ owner: owner.name, entries: [], nested: [] });
                if (owner === userOwner) nestedKnown = false;
                continue;
            }
            for (const b of fp.blockers) blockers.push({ owner: owner.name, code: b.code, detail: b.detail });
            for (const l of fp.leftovers) leftovers.push({ owner: owner.name, what: l.what, why: l.why });
            perOwner.push({
                owner: owner.name,
                entries: fp.entries.map((e) => ({
                    owner: owner.name, path: e.path, kind: e.kind ?? null, summary: e.summary ?? '', data: e.data ?? null,
                    // The plan's record of this document's data: every owner refuses to delete it once it differs.
                    ...(e.volatile === true ? { volatile: true } : { dataHash: entryDataHash(e.data ?? null) }),
                    ...(e.walletMaterial === true ? { walletMaterial: true } : {}),
                    ...(e.unmeasuredNote ? { unmeasuredNote: e.unmeasuredNote } : {}),
                    ...(e.pathIsSecret === true ? { pathIsSecret: true } : {}),
                })),
                nested: owner === userOwner ? (fp.nested ?? []) : [],
            });
        }
        const claimed = new Map();
        for (const o of perOwner) {
            for (const e of o.entries) {
                if (claimed.has(e.path)) throw new Error(`store owners '${claimed.get(e.path)}' and '${o.owner}' both claim ${e.path}; one path has one owner`);
                claimed.set(e.path, o.owner);
            }
        }
        // null = unknown (the User owner's footprint, which lists the documents under the USERS doc, failed: a blocker).
        const unowned = nestedKnown ? perOwner.flatMap((o) => o.nested).filter((p) => !claimed.has(p)).sort() : null;
        if (unowned?.length) {
            const byCollection = new Map();
            for (const p of unowned) {
                const c = p.split('/').slice(0, -1).join('/');
                byCollection.set(c, (byCollection.get(c) ?? 0) + 1);
            }
            blockers.push({ owner: 'user', code: R.ACCOUNT_STORE_UNOWNED, detail: `no store owner covers ${[...byCollection].map(([c, n]) => `${c} (${n})`).join(', ')}; deleting the USERS doc would orphan them` });
        }
        const entries = perOwner.flatMap((o) => o.entries);
        const w = await walletSection(view, entries, blockers);
        blockers.push(...w.blockers);
        const expectations = Object.fromEntries(perOwner.map((o) => [o.owner, deleteExpectations(o.entries)]));
        const ownerPaths = Object.fromEntries(perOwner.map((o) => [o.owner, expectations[o.owner].expectPaths]));
        const ownerData = Object.fromEntries(perOwner.map((o) => [o.owner, expectations[o.owner].expectData]));
        const coveredNested = perOwner.filter((o) => o.owner !== userOwner.name).flatMap((o) => o.entries.map((e) => e.path));
        return { user, entries, leftovers, blockers, unowned, wallet: w.wallet, notMeasured: w.notMeasured, hash: deletePlanHash(view.accountId, entries), ownerPaths, ownerData, coveredNested };
    }

    /**
     * The read-back of a delete: EVERY owner's fresh footprint of the planned account (planned or not: a document
     * re-created during the delete shows here), and whether its USERS doc is gone; readFailures when a re-read fails.
     */
    async function readBackDelete(user) {
        const presentByOwner = new Map();
        const readFailures = [];
        for (const owner of owners) {
            try {
                presentByOwner.set(owner.name, checkFootprint(owner, await owner.footprintForUser(user)).entries.map((e) => e.path));
            } catch (e) {
                readFailures.push(`${owner.name}: ${e?.message ?? e}`);
            }
        }
        let accountGone = null;
        try {
            accountGone = (await userOwner.account(user.user_id)).exists !== true;
        } catch (e) {
            readFailures.push(`user (USERS doc): ${e?.message ?? e}`);
        }
        return { presentByOwner, readFailures, accountGone };
    }

    /** The plan's expectations of one owner: its paths and their planned data hashes. */
    const expectOf = (g, name) => ({ expectPaths: g.ownerPaths[name] ?? [], expectData: g.ownerData[name] ?? {} });

    /** The User owner's pre-flight of its own part of the plan; writes nothing. */
    const preflight = (g) => userOwner.preflightDelete(g.user, { ...expectOf(g, userOwner.name), coveredNested: g.coveredNested });

    // ------------------------------------------------------------------ merge

    function mergeBlockers(fromView, intoView) {
        const blockers = [];
        const intoEmail = intoView.verifiedEmail;
        const fromEmail = fromView.verifiedEmail;
        const keyedBy = fromView.emailKeyed ? normalizeEmail(fromView.accountId) : null;
        if (!intoEmail || !(fromEmail === intoEmail || keyedBy === intoEmail)) {
            blockers.push({ owner: 'user', code: R.ACCOUNT_MERGE_EMAIL_MISMATCH, detail: `${fromView.accountId} and ${intoView.accountId} do not share one verified email (or a record keyed by the surviving account's verified email)` });
        }
        if (!intoView.hasPasskeyCredential) {
            blockers.push({ owner: 'user', code: R.ACCOUNT_MERGE_TARGET_NOT_PASSKEY, detail: `${intoView.accountId} is not a Powch passkey account (the powch provider and a passkey credential)` });
        }
        if (intoView.migratedTo) blockers.push({ owner: 'user', code: R.ACCOUNT_MERGE_ALREADY_MIGRATED, detail: `the surviving account ${intoView.accountId} is itself migrated to ${intoView.migratedTo}` });
        for (const v of [fromView, intoView]) {
            if (v.adminDelete) blockers.push({ owner: 'user', code: R.ACCOUNT_MERGE_DELETE_IN_PROGRESS, detail: `${v.accountId} carries the delete stamp of plan ${v.adminDelete.planHash.slice(0, 12)}: finish or restore that delete before merging` });
        }
        return blockers;
    }

    async function gatherMerge(fromView, intoView) {
        const pair = Object.freeze({ from: storeUser(fromView), into: storeUser(intoView) });
        const blockers = mergeBlockers(fromView, intoView);
        const leftovers = [];
        const leftoversIncomplete = [];
        const moves = [];
        const ownerPaths = {};
        for (const owner of owners) {
            const merges = typeof owner.mergeForUser === 'function';
            try {
                if (merges) {
                    const fp = checkFootprint(owner, await owner.footprintForMerge(pair), { merge: true });
                    for (const b of fp.blockers) blockers.push({ owner: owner.name, code: b.code, detail: b.detail });
                    for (const l of fp.leftovers) leftovers.push({ owner: owner.name, what: l.what, why: l.why });
                    for (const m of fp.entries) moves.push({ ...moveOf(owner.name, m), summary: m.summary ?? '' });
                    ownerPaths[owner.name] = sortedUnique(fp.entries.map((m) => m.path));
                } else {
                    // An owner that moves nothing: its footprint of the from-record stays on it, entries and leftovers
                    // alike. Its delete blockers do not bear on a merge, except that an UNBOUNDED read means this
                    // list of what stays is incomplete: shown, not a blocker.
                    const fp = checkFootprint(owner, await owner.footprintForUser(pair.from));
                    for (const e of fp.entries) leftovers.push({ owner: owner.name, what: e.path, why: `${e.summary || e.kind || 'a record'}: this owner moves nothing on merge; it stays on the from-record` });
                    for (const l of fp.leftovers) leftovers.push({ owner: owner.name, what: l.what, why: l.why });
                    for (const b of fp.blockers) if (b.code === R.ACCOUNT_FOOTPRINT_UNBOUNDED) leftoversIncomplete.push({ owner: owner.name, detail: b.detail });
                }
            } catch (e) {
                if (!(e instanceof AccountAdminError)) throw e;
                blockers.push({ owner: owner.name, code: R.ACCOUNT_STORE_READ_FAILED, detail: e.message });
            }
        }
        const seen = new Set();
        for (const m of moves) {
            if (seen.has(moveKey(m))) throw new Error(`two store owners both move ${moveKey(m)}; one field has one owner`);
            seen.add(moveKey(m));
        }
        return { pair, moves, leftovers, leftoversIncomplete, blockers, hash: mergePlanHash(fromView.accountId, intoView.accountId, moves), ownerPaths };
    }

    // ------------------------------------------------------------------ the instance

    return Object.freeze({
        env,
        target: boundTarget,
        rule: normalizedRule,

        /**
         * Read-only. Every account the rule names: by its verified_email, or (a legacy record with no
         * verified_email) by its email-shaped document id, flagged emailKeyed.
         */
        async listAccounts() {
            await assertStoreTargets();
            const views = await userOwner.accountsByEmailPrefixes(operatorEmailRulePrefixes(normalizedRule));
            const named = views.filter((v) => v.exists && inRule(v));
            const byEmail = new Map();
            for (const v of named) byEmail.set(v.email, [...(byEmail.get(v.email) ?? []), v.accountId]);
            return named.map((v) => ({
                accountId: v.accountId,
                email: v.email,
                createdAt: v.createdAt,
                providers: v.providers,
                hasPasskeyCredential: v.hasPasskeyCredential,
                hasPasskeyKey: v.hasPasskeyKey,
                walletAddress: v.walletAddress,
                emailKeyed: v.emailKeyed,
                migratedTo: v.migratedTo,
                roles: v.roles,
                duplicatesOf: (byEmail.get(v.email) ?? []).filter((id) => id !== v.accountId),
                ...(v.stampMalformed ? { stampMalformed: true } : {}),
            }));
        },

        /**
         * Dry run of a delete (writes nothing): every owner's footprint, every blocker, the leftovers and the
         * wallet section. The plan lives in this instance for ACCOUNT_PLAN_TTL_SECONDS and answers once.
         * @param {{ accountId: string }} args
         */
        async planDelete({ accountId } = {}) {
            await assertStoreTargets();
            const view = await accountInRule(accountId);
            const g = await gatherDelete(view);
            const { planId, expiresAt } = keepPlan({ kind: 'delete', accountId: view.accountId, email: view.email, hash: g.hash, blockers: g.blockers });
            return { planId, planHash: g.hash, accountId: view.accountId, email: view.email, notMeasured: g.notMeasured, entries: g.entries, leftovers: g.leftovers, blockers: g.blockers, unowned: g.unowned, wallet: g.wallet, refused: g.blockers.length > 0, expiresAt };
        },

        /**
         * Delete what the plan showed. Refused, writing nothing: an unknown/used/expired plan or a store that
         * changed (ACCOUNT_PLAN_STALE), a wrong typed id (ACCOUNT_CONFIRMATION_MISMATCH; the plan stays), a
         * plan with blockers (the first blocker's code, all of them in `details`), an account the rule no longer
         * names, the User owner's pre-flight. The receipt is saved BEFORE any write; then the User owner stamps
         * the USERS doc (`admin_delete`: this plan's hash; what restoreDelete later requires), the dependents, the
         * User owner's pre-flight again, the irrecoverable dependents, the User owner LAST (a failure stops the
         * sequence). Every owner gets the plan's paths AND each document's planned data hash, and refuses
         * ACCOUNT_PLAN_STALE when a document changed since. A read-back through EVERY owner decides the ending.
         * A PARTIAL ending while the USERS doc stands names the two ways on: finish forward (plan and commit
         * again) or restoreDelete for the restorable entries. A PARTIAL ending whose USERS doc is gone names the
         * documents left behind (`orphaned`, per owner) and offers neither.
         * @param {{ planId: string, confirmAccountId: string, receipt: { save: (r: Object) => string|Promise<string> } }} args
         */
        async commitDelete({ planId, confirmAccountId, receipt } = {}) {
            await assertStoreTargets();
            const p = takePlan(planId, 'delete');
            requireReceiptKeeper(receipt);
            if (confirmMismatch(confirmAccountId, p.accountId)) throw refuse(R.ACCOUNT_CONFIRMATION_MISMATCH, 'The typed account id does not match the plan; nothing was written.');
            plans.delete(planId);
            if (p.blockers.length) refuseForBlockers(p.blockers, `delete of ${p.accountId}`);
            const view = await accountInRule(p.accountId);
            const g = await gatherDelete(view);
            if (g.blockers.length) refuseForBlockers(g.blockers, `delete of ${p.accountId}`);
            if (g.hash !== p.hash) throw refuse(R.ACCOUNT_PLAN_STALE, `the stores changed since the plan for ${p.accountId}; plan again. Nothing was written.`);

            const startedAt = new Date(clock()).toISOString();
            const kept = { kind: 'delete', env, target: boundTarget, planId, planHash: p.hash, accountId: p.accountId, email: p.email, entries: g.entries, leftovers: g.leftovers, notMeasured: g.notMeasured, createdAt: startedAt };
            const receiptLabel = await saveReceipt(receipt, kept);
            try {
                await preflight(g);
                // The stamp binds restoreDelete to THIS plan: a receipt is honoured only for an account whose delete this tool began with it.
                await userOwner.stampDelete(g.user, { planHash: p.hash, startedAt, expectData: g.ownerData[userOwner.name] ?? {} });
            } catch (e) {
                if (!(e instanceof AccountAdminError)) throw e;
                throw refuse(e.code, `delete of ${p.accountId} refused by the User owner before any dependent write (${e.message}). Receipt ${receiptLabel} was kept; nothing was written.`, { cause: e, ...(e.details === undefined ? {} : { details: e.details }) });
            }

            const notes = [];
            const reportedRemaining = new Map();
            let failure = null;
            let checkedBeforeIrrecoverable = false;
            for (const owner of deleteOrder) {
                const expect = expectOf(g, owner.name);
                if (!expect.expectPaths.length) continue;
                if (owner.irrecoverable === true && !checkedBeforeIrrecoverable) {
                    checkedBeforeIrrecoverable = true;
                    try {
                        await preflight(g);
                    } catch (e) {
                        failure = { owner: userOwner.name, error: e };
                        notes.push(`the User owner's pre-flight before the irrecoverable owner '${owner.name}' refused (${describe(e)}); '${owner.name}' and the User owner did not run`);
                        break;
                    }
                }
                try {
                    const r = await owner.deleteForUser(g.user, expect);
                    if (Array.isArray(r?.remaining) && r.remaining.length) {
                        notes.push(`${owner.name} reported ${r.remaining.length} path(s) remaining`);
                        for (const x of r.remaining) if (expect.expectPaths.includes(x)) reportedRemaining.set(x, owner.name);
                    }
                    for (const x of Array.isArray(r?.reasons) ? r.reasons : []) notes.push(`${owner.name}: ${x.path}: ${x.reason}`);
                    if (Array.isArray(r?.alsoDeleted) && r.alsoDeleted.length) notes.push(`${owner.name} also deleted ${r.alsoDeleted.length} path(s) that appeared since the plan (deleted by query): ${r.alsoDeleted.join(', ')}`);
                } catch (e) {
                    failure = { owner: owner.name, error: e };
                    notes.push(`${owner.name} failed (${describe(e)}); no later owner ran`);
                    break;
                }
            }
            const planned = g.entries.map((e) => e.path);
            const readBack = await readBackDelete(g.user);
            const { readFailures, accountGone } = readBack;
            const presentNow = new Set([...readBack.presentByOwner.values()].flat());
            // A path an owner reports it left (e.g. an index row that now names another account) remains, even
            // when the account's fresh footprint no longer lists it.
            const present = planned.filter((x) => presentNow.has(x) || reportedRemaining.has(x));
            // The USERS doc is gone: every document any owner still lists for the account, planned or not, is orphaned.
            const orphaned = !readFailures.length && accountGone
                ? [
                    ...owners.flatMap((o) => (readBack.presentByOwner.get(o.name) ?? []).map((path) => ({ owner: o.name, path }))),
                    ...[...reportedRemaining].filter(([x]) => !presentNow.has(x)).map(([path, owner]) => ({ owner, path, reason: 'its owner reported it left in place' })),
                ]
                : [];
            let outcome;
            if (readFailures.length) outcome = DELETE_OUTCOME.UNVERIFIED;
            else if (accountGone) outcome = orphaned.length ? DELETE_OUTCOME.PARTIAL : DELETE_OUTCOME.DELETED;
            else if (present.length === 0) outcome = DELETE_OUTCOME.PARTIAL; // every planned path is gone, yet the USERS doc stands: never DELETED
            else if (present.length === planned.length) outcome = DELETE_OUTCOME.NOT_DELETED;
            else outcome = DELETE_OUTCOME.PARTIAL;
            const deleted = readFailures.length ? [] : planned.filter((x) => !present.includes(x));
            const restorable = outcome === DELETE_OUTCOME.PARTIAL && !accountGone
                ? g.entries.filter((e) => deleted.includes(e.path) && e.volatile !== true && e.pathIsSecret !== true && typeof ownerByName.get(e.owner)?.[STORE_OWNER_RESTORE_METHOD] === 'function').map((e) => ({ owner: e.owner, path: e.path }))
                : [];
            let line;
            if (outcome === DELETE_OUTCOME.UNVERIFIED) {
                line = `UNVERIFIED: the read-back failed (${readFailures.join('; ')}). Receipt kept: ${receiptLabel}. Verify the account's stores before acting on it.`;
            } else if (accountGone && orphaned.length) {
                line = `PARTIAL: account ${p.accountId} is deleted (its USERS doc is gone), but ${orphaned.length} document(s) were left behind: ${orphaned.map((x) => `${x.owner}: ${x.path}`).join(', ')}. They are orphaned: neither finish forward nor restoreDelete applies to a deleted account. Receipt kept: ${receiptLabel}.`;
                notes.push(line);
            } else {
                line = `${outcome}: account ${p.accountId}: ${deleted.length} of ${planned.length} planned path(s) read back gone${present.length ? `, ${present.length} remain` : ''}${accountGone ? '' : '; its USERS doc stands'}. Receipt kept: ${receiptLabel}.`;
            }
            if (outcome === DELETE_OUTCOME.NOT_DELETED) {
                // Nothing planned was deleted: the delete never took hold, and its stamp comes off.
                try {
                    if (await userOwner.clearDeleteStamp(g.user, { planHash: p.hash })) notes.push('nothing was deleted; the admin_delete stamp was cleared');
                } catch (e) {
                    notes.push(`nothing was deleted, but the admin_delete stamp could not be cleared (${describe(e)})`);
                }
            }
            if (outcome === DELETE_OUTCOME.PARTIAL && !accountGone) {
                const ways = `Two ways on: finish forward (planDelete again, then commitDelete), or restoreDelete({ receipt, confirmAccountId }) to re-create ${restorable.length ? `the ${restorable.length} restorable entr${restorable.length === 1 ? 'y' : 'ies'} (${restorable.map((x) => `${x.owner}: ${x.path}`).join(', ')})` : 'nothing: no owner of a deleted entry can restore it'}.`;
                line = `${line} ${ways}`;
                notes.push(ways);
            }
            return { outcome, deleted, remaining: present, orphaned, accountDeleted: accountGone === true && !readFailures.length, restorable, receiptLabel, line, notes, cause: failure?.error ?? null };
        },

        /**
         * Re-create the absent entries of a PARTIAL delete from its receipt: every owner that implements
         * restoreForUser re-creates its receipt entries that a fresh footprint does not list (never
         * overwriting an existing document); entries of owners without it, volatile entries and entries whose
         * path is a credential digest stay absent and are reported. Refused, writing nothing: a receipt that is
         * not a delete receipt of this env and target, whose entries no longer hash to its planHash or whose
         * dataHash does not match its data (edited), or that names an owner this instance lacks
         * (ACCOUNT_RECEIPT_INVALID); a typed id other than the receipt's account (ACCOUNT_CONFIRMATION_MISMATCH);
         * an account whose USERS doc is gone (ACCOUNT_NOT_FOUND: the delete completed, and a full delete is not
         * undone by this act); an account the rule does not name; an account whose USERS doc does not carry the
         * `admin_delete` stamp of THIS receipt's plan (ACCOUNT_RECEIPT_INVALID: restore re-creates documents only
         * for an account whose delete this tool began with this plan); a footprint read that fails before the
         * first write (ACCOUNT_STORE_READ_FAILED). A read-back decides the ending (RESTORE_OUTCOME); once every
         * restorable entry reads back restored, the stamp is cleared.
         * @param {{ receipt: Object, confirmAccountId: string }} args
         */
        async restoreDelete({ receipt, confirmAccountId } = {}) {
            await assertStoreTargets();
            const r = receipt;
            if (!r || r.kind !== 'delete' || !Array.isArray(r.entries) || typeof r.accountId !== 'string' || !r.accountId || typeof r.planHash !== 'string'
                || r.entries.some((e) => typeof e?.owner !== 'string' || typeof e?.path !== 'string')) {
                throw refuse(R.ACCOUNT_RECEIPT_INVALID, 'This is not a delete receipt (kind, accountId, planHash, entries of { owner, path, kind, data, dataHash }). Nothing was written.');
            }
            assertReceiptHere(r);
            if (deletePlanHash(r.accountId, r.entries) !== r.planHash) {
                throw refuse(R.ACCOUNT_RECEIPT_INVALID, `The receipt's entries do not hash to its planHash: it was edited after it was kept. Nothing was written.`);
            }
            const badData = r.entries.filter((e) => e.volatile !== true && e.dataHash !== entryDataHash(e.data ?? null)).map((e) => e.path);
            if (badData.length) throw refuse(R.ACCOUNT_RECEIPT_INVALID, `The receipt's dataHash does not match its data for ${badData.slice(0, 5).join(', ')}: it was edited after it was kept. Nothing was written.`);
            if (confirmMismatch(confirmAccountId, r.accountId)) throw refuse(R.ACCOUNT_CONFIRMATION_MISMATCH, 'The typed account id does not match the receipt; nothing was written.');
            refuseUnknownOwners(r.entries.map((e) => e.owner));
            const exists = await userOwner.account(r.accountId);
            if (!exists.exists) {
                throw refuse(R.ACCOUNT_NOT_FOUND, `account ${r.accountId}'s USERS doc is gone: that delete completed. restoreDelete re-creates the absent entries of a PARTIAL delete only; a full delete is not undone by this act. Nothing was written.`);
            }
            const view = await accountInRule(r.accountId);
            if (view.adminDelete?.planHash !== r.planHash) {
                throw refuse(R.ACCOUNT_RECEIPT_INVALID, `account ${r.accountId} carries ${view.adminDelete ? 'the admin_delete stamp of another plan' : 'no admin_delete stamp'}: restoreDelete re-creates documents only for an account whose delete this tool began with this receipt's plan. Nothing was written.`);
            }
            const user = storeUser(view);
            const byOwner = (name) => r.entries.filter((e) => e.owner === name);
            const holders = owners.filter((o) => byOwner(o.name).length);

            /** The receipt paths a fresh footprint of each holder lists; a failed read before any write refuses. */
            const presentNow = async (when) => {
                const present = new Set();
                const failures = [];
                for (const owner of holders) {
                    try {
                        for (const e of checkFootprint(owner, await owner.footprintForUser(user)).entries) present.add(e.path);
                    } catch (e) {
                        if (when === 'before') throw refuse(R.ACCOUNT_STORE_READ_FAILED, `restoreDelete: ${owner.name}'s footprint read failed (${describe(e)}); nothing was written.`, { cause: e });
                        failures.push(`${owner.name}: ${e?.message ?? e}`);
                    }
                }
                return { present, failures };
            };
            const before = await presentNow('before');
            const absent = r.entries.filter((e) => !before.present.has(e.path));
            const notes = [];
            const reasons = new Map();
            const canRestore = (e) => e.volatile !== true && e.pathIsSecret !== true && typeof ownerByName.get(e.owner)?.[STORE_OWNER_RESTORE_METHOD] === 'function';
            for (const owner of [...deleteOrder].reverse()) {
                const mine = absent.filter((e) => e.owner === owner.name);
                if (!mine.length) continue;
                for (const e of mine) {
                    if (e.volatile === true) reasons.set(e.path, 'deleted by query (volatile); never restored');
                    else if (e.pathIsSecret === true) reasons.set(e.path, 'its document id is a credential (the path is a digest); never restored');
                    else if (!canRestore(e)) reasons.set(e.path, `${owner.name} implements no ${STORE_OWNER_RESTORE_METHOD}`);
                }
                const restorable = mine.filter(canRestore);
                if (!restorable.length) continue;
                try {
                    await owner[STORE_OWNER_RESTORE_METHOD](user, restorable.map(({ owner: _o, ...e }) => structuredClone(e)));
                } catch (e) {
                    notes.push(`${owner.name} failed (${describe(e)})`);
                }
            }
            const after = await presentNow('after');
            const restored = after.failures.length ? [] : absent.filter((e) => after.present.has(e.path)).map((e) => e.path);
            const remaining = absent.filter((e) => !restored.includes(e.path)).map((e) => ({ owner: e.owner, path: e.path, ...(reasons.has(e.path) ? { reason: reasons.get(e.path) } : {}) }));
            let outcome;
            if (after.failures.length) outcome = RESTORE_OUTCOME.UNVERIFIED;
            else if (restored.length === absent.length) outcome = RESTORE_OUTCOME.RESTORED;
            else if (restored.length === 0) outcome = RESTORE_OUTCOME.NOT_RESTORED;
            else outcome = RESTORE_OUTCOME.PARTIAL;
            // Everything restorable is back: the delete this tool began is over, and its stamp comes off.
            let stamp = 'kept';
            if (!after.failures.length && absent.filter(canRestore).every((e) => restored.includes(e.path))) {
                try {
                    stamp = (await userOwner.clearDeleteStamp(user, { planHash: r.planHash })) === true ? 'cleared' : 'kept';
                } catch (e) {
                    notes.push(`the admin_delete stamp could not be cleared (${describe(e)})`);
                }
            }
            const line = outcome === RESTORE_OUTCOME.UNVERIFIED
                ? `UNVERIFIED: the read-back failed (${after.failures.join('; ')}). Verify account ${r.accountId}'s stores before acting on it.`
                : `${outcome}: account ${r.accountId}: ${absent.length ? `${restored.length} of ${absent.length} absent receipt entr${absent.length === 1 ? 'y' : 'ies'} read back restored${remaining.length ? `, ${remaining.length} not` : ''}` : 'no receipt entry was absent; nothing to restore'}; the admin_delete stamp is ${stamp}.`;
            return { outcome, restored, remaining, stamp, line, notes };
        },

        /**
         * Dry run of a merge of the legacy record `fromAccountId` into the passkey account `intoAccountId`
         * (writes nothing). The plan lists the moves (each owner's, one per field, `from` null = absent), what
         * stays on the from-record (its sessions, wallet and index rows: the legacy wallet remains a sign-in
         * identity until its services are re-keyed; and the stores of owners that move nothing), where that
         * list is incomplete (`leftoversIncomplete`), and every blocker.
         * @param {{ fromAccountId: string, intoAccountId: string }} args
         */
        async planMerge({ fromAccountId, intoAccountId } = {}) {
            await assertStoreTargets();
            if (typeof fromAccountId === 'string' && fromAccountId.trim() && fromAccountId.trim() === intoAccountId?.trim?.()) {
                throw refuse(R.ACCOUNT_MERGE_SAME_RECORD, `${fromAccountId} cannot be merged into itself; nothing was read`);
            }
            const fromView = await accountInRule(fromAccountId, 'record to merge');
            const intoView = await accountInRule(intoAccountId, 'surviving account');
            const g = await gatherMerge(fromView, intoView);
            const { planId, expiresAt } = keepPlan({ kind: 'merge', fromAccountId: fromView.accountId, intoAccountId: intoView.accountId, email: intoView.verifiedEmail, hash: g.hash, blockers: g.blockers });
            return { planId, planHash: g.hash, fromAccountId: fromView.accountId, intoAccountId: intoView.accountId, email: intoView.verifiedEmail, moves: g.moves, leftovers: g.leftovers, leftoversIncomplete: g.leftoversIncomplete, blockers: g.blockers, refused: g.blockers.length > 0, expiresAt };
        },

        /**
         * Merge as planned. Refusals as commitDelete (both typed ids must match). The receipt (every move, the
         * leftovers, planHash) is saved BEFORE any write; no session is revoked; owners that move anything run
         * first, the User owner last (its migration mark is its last write); a read-back decides the ending.
         * @param {{ planId: string, confirmFromAccountId: string, confirmIntoAccountId: string, receipt: { save: Function } }} args
         */
        async commitMerge({ planId, confirmFromAccountId, confirmIntoAccountId, receipt } = {}) {
            await assertStoreTargets();
            const p = takePlan(planId, 'merge');
            requireReceiptKeeper(receipt);
            if (confirmMismatch(confirmFromAccountId, p.fromAccountId) || confirmMismatch(confirmIntoAccountId, p.intoAccountId)) {
                throw refuse(R.ACCOUNT_CONFIRMATION_MISMATCH, 'The typed account ids do not match the plan; nothing was written.');
            }
            plans.delete(planId);
            if (p.blockers.length) refuseForBlockers(p.blockers, `merge of ${p.fromAccountId} into ${p.intoAccountId}`);
            const fromView = await accountInRule(p.fromAccountId, 'record to merge');
            const intoView = await accountInRule(p.intoAccountId, 'surviving account');
            const g = await gatherMerge(fromView, intoView);
            if (g.blockers.length) refuseForBlockers(g.blockers, `merge of ${p.fromAccountId} into ${p.intoAccountId}`);
            if (g.hash !== p.hash) throw refuse(R.ACCOUNT_PLAN_STALE, `the stores changed since the merge plan; plan again. Nothing was written.`);

            const kept = { kind: 'merge', env, target: boundTarget, planId, planHash: p.hash, fromAccountId: p.fromAccountId, intoAccountId: p.intoAccountId, email: p.email, moves: g.moves.map((m) => moveOf(m.owner, m)), leftovers: g.leftovers, leftoversIncomplete: g.leftoversIncomplete, createdAt: new Date(clock()).toISOString() };
            const receiptLabel = await saveReceipt(receipt, kept);

            const notes = [];
            let failure = null;
            for (const owner of owners) {
                if (typeof owner.mergeForUser !== 'function') continue;
                const expectPaths = g.ownerPaths[owner.name] ?? [];
                if (!expectPaths.length) continue;
                try {
                    const r = await owner.mergeForUser(g.pair, { expectPaths });
                    for (const x of Array.isArray(r?.remaining) ? r.remaining : []) if (x?.reason) notes.push(`${owner.name}: ${moveKey(x)}: ${x.reason}`);
                } catch (e) {
                    failure = { owner: owner.name, error: e };
                    notes.push(`${owner.name} failed (${describe(e)}); no later owner ran`);
                    break;
                }
            }

            // Read-back: the User owner's moves by value; the other owners by a fresh merge footprint (a move
            // done is no longer a move to make).
            const readFailures = [];
            const notMoved = [];
            const userMoves = g.moves.filter((m) => m.owner === userOwner.name);
            try {
                const values = await userOwner.readMergeFields(userMoves);
                userMoves.forEach((m, i) => { if (accountAdminHash(values[i]?.value ?? null) !== accountAdminHash(m.to ?? null)) notMoved.push(moveKey(m)); });
            } catch (e) {
                readFailures.push(`user: ${e?.message ?? e}`);
            }
            for (const owner of storeOwners) {
                if (typeof owner.mergeForUser !== 'function') continue;
                const planned = g.moves.filter((m) => m.owner === owner.name);
                if (!planned.length) continue;
                try {
                    const fp = checkFootprint(owner, await owner.footprintForMerge(g.pair), { merge: true });
                    const still = new Set(fp.entries.map(moveKey));
                    for (const m of planned) if (still.has(moveKey(m))) notMoved.push(moveKey(m));
                } catch (e) {
                    readFailures.push(`${owner.name}: ${e?.message ?? e}`);
                }
            }
            const total = g.moves.length;
            let outcome;
            if (readFailures.length) outcome = MERGE_OUTCOME.UNVERIFIED;
            else if (notMoved.length === 0) outcome = MERGE_OUTCOME.MERGED;
            else if (notMoved.length === total) outcome = MERGE_OUTCOME.NOT_MERGED;
            else outcome = MERGE_OUTCOME.PARTIAL;
            const line = outcome === MERGE_OUTCOME.UNVERIFIED
                ? `UNVERIFIED: the read-back failed (${readFailures.join('; ')}). Receipt kept: ${receiptLabel}. Verify both accounts before acting on them.`
                : `${outcome}: ${p.fromAccountId} into ${p.intoAccountId}: ${total - notMoved.length} of ${total} planned move(s) read back done${notMoved.length ? `, ${notMoved.length} not` : ''}. Receipt kept: ${receiptLabel}.`;
            return { outcome, notMoved, receiptLabel, line, notes, cause: failure?.error ?? null };
        },

        /**
         * Undo a merge from its receipt. Refused, writing nothing: a receipt that is not a merge receipt of
         * this env and target, whose moves no longer hash to its planHash (edited), or that names an owner
         * this instance does not hold (ACCOUNT_RECEIPT_INVALID); typed ids other than the receipt's
         * (ACCOUNT_CONFIRMATION_MISMATCH); either account missing or outside the rule; ANY move an owner's
         * validateRollbackMoves rejects for this pair (every owner is asked before the first write). Then the
         * User owner runs first (the migration mark comes off first), the other owners in reverse; every owner
         * runs even when one fails. A read-back decides the ending.
         * @param {{ receipt: Object, confirmFromAccountId: string, confirmIntoAccountId: string }} args
         */
        async rollbackMerge({ receipt, confirmFromAccountId, confirmIntoAccountId } = {}) {
            await assertStoreTargets();
            const r = receipt;
            if (!r || r.kind !== 'merge' || !Array.isArray(r.moves) || typeof r.fromAccountId !== 'string' || typeof r.intoAccountId !== 'string' || typeof r.planHash !== 'string'
                || r.moves.some((m) => typeof m?.owner !== 'string' || typeof m?.path !== 'string' || typeof m?.field !== 'string')) {
                throw refuse(R.ACCOUNT_RECEIPT_INVALID, 'This is not a merge receipt (kind, fromAccountId, intoAccountId, planHash, moves of { owner, path, field, from, to }). Nothing was written.');
            }
            assertReceiptHere(r);
            if (mergePlanHash(r.fromAccountId, r.intoAccountId, r.moves) !== r.planHash) {
                throw refuse(R.ACCOUNT_RECEIPT_INVALID, 'The receipt\'s moves do not hash to its planHash: it was edited after it was kept. Nothing was written.');
            }
            if (confirmMismatch(confirmFromAccountId, r.fromAccountId) || confirmMismatch(confirmIntoAccountId, r.intoAccountId)) {
                throw refuse(R.ACCOUNT_CONFIRMATION_MISMATCH, 'The typed account ids do not match the receipt; nothing was written.');
            }
            refuseUnknownOwners(r.moves.map((m) => m.owner));
            const fromView = await accountInRule(r.fromAccountId, 'merged record');
            const intoView = await accountInRule(r.intoAccountId, 'surviving account');
            const pair = Object.freeze({ from: storeUser(fromView), into: storeUser(intoView) });
            const byOwner = (name) => r.moves.filter((m) => m.owner === name).map(({ owner, ...m }) => m);
            const order = [userOwner, ...[...storeOwners].reverse()];
            for (const owner of order) {
                const moves = byOwner(owner.name);
                if (!moves.length) continue;
                if (typeof owner.validateRollbackMoves !== 'function') {
                    throw refuse(R.ACCOUNT_RECEIPT_INVALID, `The receipt has ${moves.length} move(s) for '${owner.name}', which moves nothing on merge. Nothing was written.`);
                }
                try {
                    await owner.validateRollbackMoves(structuredClone(moves), pair);
                } catch (e) {
                    if (!(e instanceof AccountAdminError)) throw e;
                    throw refuse(R.ACCOUNT_RECEIPT_INVALID, `'${owner.name}' rejected the receipt's moves (${describe(e)}). Nothing was written.`, { cause: e });
                }
            }
            const notes = [];
            for (const owner of order) {
                const moves = byOwner(owner.name);
                if (!moves.length) continue;
                try {
                    await owner.rollbackMergeForUser(moves, pair);
                } catch (e) {
                    notes.push(`${owner.name} failed (${describe(e)})`);
                }
            }
            const readFailures = [];
            const notRestored = [];
            const userMoves = byOwner(userOwner.name);
            if (userMoves.length) {
                try {
                    const values = await userOwner.readMergeFields(userMoves);
                    userMoves.forEach((m, i) => { if (accountAdminHash(values[i]?.value ?? null) !== accountAdminHash(m.from ?? null)) notRestored.push(moveKey(m)); });
                } catch (e) {
                    readFailures.push(`user: ${e?.message ?? e}`);
                }
            }
            for (const owner of storeOwners) {
                const moves = byOwner(owner.name);
                if (!moves.length) continue;
                try {
                    const fp = checkFootprint(owner, await owner.footprintForMerge(pair), { merge: true });
                    const again = new Set(fp.entries.map(moveKey));
                    for (const m of moves) if (!again.has(moveKey(m))) notRestored.push(moveKey(m));
                } catch (e) {
                    readFailures.push(`${owner.name}: ${e?.message ?? e}`);
                }
            }
            const total = r.moves.length;
            let outcome;
            if (readFailures.length) outcome = MERGE_ROLLBACK_OUTCOME.UNVERIFIED;
            else if (notRestored.length === 0) outcome = MERGE_ROLLBACK_OUTCOME.ROLLED_BACK;
            else if (notRestored.length === total) outcome = MERGE_ROLLBACK_OUTCOME.NOT_ROLLED_BACK;
            else outcome = MERGE_ROLLBACK_OUTCOME.PARTIAL;
            const line = outcome === MERGE_ROLLBACK_OUTCOME.UNVERIFIED
                ? `UNVERIFIED: the read-back failed (${readFailures.join('; ')}). Verify both accounts before acting on them.`
                : `${outcome}: ${r.fromAccountId} / ${r.intoAccountId}: ${total - notRestored.length} of ${total} move(s) read back restored${notRestored.length ? `, ${notRestored.length} not` : ''}.`;
            return { outcome, notRestored, line, notes };
        },
    });
}
