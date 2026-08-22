/**
 * self-guided — the shell's half of the page-declares/shell-decides contract.
 *
 * The single most valuable assertion in here is the NEGATIVE CONTROL: a page with no declaration,
 * or an op the page does not declare, must behave EXACTLY as today (ordinary Run button, silent).
 * That is the check proving a declaration cannot leak into unrelated behaviour — without it,
 * "auto-run works" is compatible with "auto-run happens to everything".
 *
 * Contract owner is the PAGE (VIEWER), already merged + deployed; these tests pin the shell's
 * side of it, including the three rules that look like style and are not: never branch on the
 * autoRun array, never model reversible/recorded, never mirror stop state.
 *
 * Run: cd descix-app-sdk && node --test "tests/self-guided.test.js"
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    SELF_GUIDED_VERSION,
    readSelfGuidedDeclaration,
    decideAutoRun,
    recordHopSpend,
    requestStop,
    isStopped,
} from '../src/util/selfGuided.js';

/** A declaration shaped exactly like the deployed one, with call-counting so we can assert HOW it was used. */
function makeDecl(overrides = {}) {
    const calls = { mayAutoRun: [], shouldContinue: 0, spend: [], stop: [], status: 0 };
    const decl = {
        v: 1,
        autoRun: ['look', 'setCamera'],       // display/debug only — tests assert we do NOT read these
        neverAutoRun: ['restart'],
        mayAutoRun(fn) { calls.mayAutoRun.push(fn); return fn === 'look' || fn === 'setCamera'; },
        shouldContinue() { calls.shouldContinue += 1; return { ok: true, remaining: 5 }; },
        spend(n) { calls.spend.push(n); return 1; },
        stop(reason) { calls.stop.push(reason); return reason; },
        status() { calls.status += 1; return { state: 'driven', spent: 0, budget: 6, stopped: false }; },
        ...overrides,
    };
    return { decl, calls };
}

// ── reading the declaration ──────────────────────────────────────────────────

test('a well-formed declaration is returned as the LIVE object, not a copy', () => {
    const { decl } = makeDecl();
    const got = readSelfGuidedDeclaration({ DeSciX_SelfGuided: decl });
    assert.equal(got, decl, 'must hand back the same object — a copy would freeze budget and stop-state');
});

test('no frame, no declaration, or a junk declaration yields null', () => {
    assert.equal(readSelfGuidedDeclaration(null), null);
    assert.equal(readSelfGuidedDeclaration(undefined), null);
    assert.equal(readSelfGuidedDeclaration({}), null);
    assert.equal(readSelfGuidedDeclaration({ DeSciX_SelfGuided: 'nope' }), null);
});

test('the version key is `v`, not `version` — a page using `version` is NOT honoured', () => {
    const { decl } = makeDecl();
    const wrongKey = { ...decl }; delete wrongKey.v; wrongKey.version = 1;
    assert.equal(readSelfGuidedDeclaration({ DeSciX_SelfGuided: wrongKey }), null,
        'the deployed contract says `v`; accepting `version` too would make the shell tolerate a shape that is not served');
    assert.equal(SELF_GUIDED_VERSION, 1);
});

test('a future contract version is ignored rather than half-honoured', () => {
    const { decl } = makeDecl({ v: 2 });
    assert.equal(readSelfGuidedDeclaration({ DeSciX_SelfGuided: decl }), null);
});

test('a declaration missing ANY required function is refused whole', () => {
    for (const missing of ['mayAutoRun', 'shouldContinue', 'spend', 'stop', 'status']) {
        const { decl } = makeDecl();
        delete decl[missing];
        assert.equal(readSelfGuidedDeclaration({ DeSciX_SelfGuided: decl }), null,
            `missing ${missing} must refuse the whole declaration — a partial contract is how half-features ship`);
    }
});

test('a cross-origin frame throws on access and is treated as "no declaration", not an error', () => {
    const hostile = { get DeSciX_SelfGuided() { throw new Error('Blocked a frame with origin ...'); } };
    assert.equal(readSelfGuidedDeclaration(hostile), null,
        'Powch is deliberately cross-origin; this must not break the chat pane');
});

// ── the decision ─────────────────────────────────────────────────────────────

test('a declared, eligible op with budget auto-runs', () => {
    const { decl, calls } = makeDecl();
    assert.deepEqual(decideAutoRun(decl, 'look'), { autoRun: true, reason: null });
    assert.deepEqual(calls.mayAutoRun, ['look'], 'eligibility must be ASKED, not derived');
    assert.equal(calls.shouldContinue, 1);
});

test('THE CRITERION IS NEVER RE-DERIVED: an op absent from autoRun[] still runs if mayAutoRun says yes', () => {
    // The arrays are for humans. If this shell branched on them, the page could not change its
    // criterion without a second-repo change — the two-copies drift class.
    const { decl } = makeDecl({ mayAutoRun: () => true });
    decl.autoRun = [];                       // array says nothing is auto-runnable...
    assert.equal(decideAutoRun(decl, 'anything').autoRun, true, '...but the FUNCTION is the owner');
});

test('NEGATIVE CONTROL: an undeclared op does not auto-run, and says nothing', () => {
    const { decl } = makeDecl();
    assert.deepEqual(decideAutoRun(decl, 'restart'), { autoRun: false, reason: null },
        'not-eligible is ordinary — it must render the plain Run button with no scary reason text');
});

test('NEGATIVE CONTROL: with NO declaration at all, nothing auto-runs and nothing is reported', () => {
    assert.deepEqual(decideAutoRun(null, 'look'), { autoRun: false, reason: null },
        'a page that never opted in must be byte-for-byte unchanged — this is the leak check');
});

test('budget exhaustion DEGRADES to Run and surfaces the page\'s own reason', () => {
    const { decl } = makeDecl({ shouldContinue: () => ({ ok: false, reason: 'media budget spent (1/1)' }) });
    assert.deepEqual(decideAutoRun(decl, 'look'), { autoRun: false, reason: 'media budget spent (1/1)' },
        'refusing outright would strand the user; a human can always click');
});

test('a latched STOP keeps refusing even with budget remaining', () => {
    const { decl } = makeDecl({ shouldContinue: () => ({ ok: false, reason: 'stopped by user' }) });
    assert.equal(decideAutoRun(decl, 'look').autoRun, false);
});

test('a throwing declaration fails CLOSED, with the error surfaced', () => {
    const a = makeDecl({ mayAutoRun: () => { throw new Error('boom'); } }).decl;
    assert.equal(decideAutoRun(a, 'look').autoRun, false);
    assert.match(decideAutoRun(a, 'look').reason, /boom/);
    const b = makeDecl({ shouldContinue: () => { throw new Error('bang'); } }).decl;
    assert.equal(decideAutoRun(b, 'look').autoRun, false);
    assert.match(decideAutoRun(b, 'look').reason, /bang/);
});

test('eligibility is asked BEFORE budget — an ineligible op must not consume a budget question', () => {
    const { decl, calls } = makeDecl();
    decideAutoRun(decl, 'restart');
    assert.equal(calls.shouldContinue, 0);
});

// ── spend, stop, status ──────────────────────────────────────────────────────

test('a text-only hop still spends ONE — a media-only bound would leave text loops unbounded', () => {
    const { decl, calls } = makeDecl();
    recordHopSpend(decl);
    assert.deepEqual(calls.spend, [undefined], 'bare spend() adds 1 by the page\'s own contract');
});

test('a hop that produced media spends that many', () => {
    const { decl, calls } = makeDecl();
    recordHopSpend(decl, 3);
    assert.deepEqual(calls.spend, [3]);
});

test('zero media is still one hop, not zero', () => {
    const { decl, calls } = makeDecl();
    recordHopSpend(decl, 0);
    assert.deepEqual(calls.spend, [undefined]);
});

test('STOP is delegated to the page — the shell keeps no flag of its own', () => {
    const { decl, calls } = makeDecl();
    assert.equal(requestStop(decl, 'user pressed stop'), true);
    assert.deepEqual(calls.stop, ['user pressed stop'],
        'one stop state, owned by the page; a local mirror would drift and half-stop the system');
});

test('stop-state is READ from the page every time, never cached', () => {
    let stopped = false;
    const { decl, calls } = makeDecl({ status: () => ({ state: 'driven', spent: 0, budget: 6, stopped }) });
    assert.equal(isStopped(decl), false);
    stopped = true;                                   // the page changes DURING a run
    assert.equal(isStopped(decl), true, 'a cached read here is the boot-snapshot bug VIEWER already shipped once');
    assert.equal(calls.status, 0);                    // our own counter is unused by this override
});

test('spend/stop/status degrade quietly with no declaration — never throw into the chat pane', () => {
    assert.equal(recordHopSpend(null), null);
    assert.equal(requestStop(null, 'x'), false);
    assert.equal(isStopped(null), false);
});
