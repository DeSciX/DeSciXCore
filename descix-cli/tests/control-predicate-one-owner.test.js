/**
 * ONE OWNER FOR "WHAT MAKES A FIXTURE CONTROL GREEN" — the gate that proves the drift is gone.
 *
 * THE HAZARD THIS CLOSES, measured at 9cfdf39: two suites each derived their control's greenness
 * TWICE — once in the before() classifier that computes PASS/FAIL, and again in the control test's
 * own assertions. Four copies of two predicates. Add a condition to a control test without adding
 * the matching arm to its classifier and the control goes RED while the classifier still says
 * PASS, so the discriminator it governs keeps reporting GREEN on a failing control. That is the
 * vacuous green the coupling row abolished, re-entering through a hand-mirrored predicate.
 *
 * COVERAGE BOUNDARY — printed on GREEN as well as RED:
 *   WHAT THIS COMPARES: the real exported createFixtureControl() from tests/tools/control-predicate.mjs,
 *     driven over synthetic runs; and the real SOURCE TEXT of the two control tests that consume it.
 *   WHAT IT CATCHES: a control whose classifier and whose own assertions could disagree; a control
 *     that reports PASS without being run; a control test that grows a rival predicate beside its
 *     delegation; a control defined with no conditions at all.
 *   WHAT IT DOES NOT READ: whether the conditions themselves are the RIGHT conditions. This gate
 *     proves the two consumers cannot disagree; it does not prove what they agree about is correct.
 *   NEGATIVE CONTROL IN CODE: DRIFT-1 RECONSTRUCTS THE OLD HAND-MIRRORED SHAPE and demonstrates it
 *     drifting. Without that, DRIFT-2's green would be unattributable — a claim that drift is
 *     impossible is only evidence if the same harness can still exhibit drift when it is allowed to.
 *   RUN BY: `npm test` in descix-cli (node --test "tests/*.test.js").
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFixtureControl, findRivalPredicates } from './tools/control-predicate.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** A run that satisfies condition A but NOT condition B. */
const RUN = { timedOut: false, nestedCreated: true, code: 0, combined: 'created fine' };

const CONDITION_A = {
    id: 'did-not-hang',
    requirement: 'the control run must complete rather than time out',
    holds: (r) => r.timedOut === false,
    diagnose: () => 'the control run TIMED OUT',
};
// The condition a later author adds. RUN does not satisfy it.
const CONDITION_B = {
    id: 'named-the-root',
    requirement: 'the run must name the workspace root it found',
    holds: (r) => /ROOT=/.test(r.combined),
    diagnose: () => 'the run did not name the root',
};

/** Did this function's assertions pass? Returns the failure message, or null on success. */
function failureOf(fn) {
    try { fn(); return null; } catch (e) { return e && e.message ? e.message : String(e); }
}

before(() => {
    console.log([
        '',
        '=== COVERAGE BOUNDARY (printed on GREEN as well as RED) ===',
        'COMPARES : the real createFixtureControl() from tests/tools/control-predicate.mjs over',
        '           synthetic runs, and the real source text of the two control tests using it.',
        'CATCHES  : a classifier and a control test that could disagree; a control reporting PASS',
        '           without being run; a rival predicate beside a delegation; a control with no',
        '           conditions (one that cannot fail).',
        'DOES NOT : judge whether the conditions are the RIGHT conditions. This proves the two',
        '           consumers cannot disagree, not that what they agree on is correct.',
        'CONTROL  : DRIFT-1 reconstructs the OLD hand-mirrored shape and shows it DRIFTING, so',
        '           DRIFT-2\'s green is attributable rather than vacuous.',
        'RUN BY   : npm test (node --test "tests/*.test.js").',
        '==========================================================',
        '',
    ].join('\n'));
});

describe('one owner for the control predicate', () => {

    // ---------------------------------------------------------------- the negative control
    test('DRIFT-1 (NEGATIVE CONTROL): the OLD hand-mirrored shape DOES drift, silently', () => {
        // Reconstructed faithfully: a classifier that knows only condition A, and a control test
        // whose assertions were updated to also check condition B. This is exactly what "add an
        // assertion to a control without the matching classifier arm" produced at 9cfdf39.
        const classifierState = CONDITION_A.holds(RUN) ? 'PASS' : 'FAIL';   // derivation #1
        const controlAssertions = failureOf(() => {                          // derivation #2
            assert.ok(CONDITION_A.holds(RUN), 'A');
            assert.ok(CONDITION_B.holds(RUN), 'B');
        });

        console.log(`[DRIFT-1] classifier says      : ${classifierState}`);
        console.log(`[DRIFT-1] control test says    : ${controlAssertions === null ? 'PASS' : 'FAIL'}`);

        assert.equal(classifierState, 'PASS',
            'the reconstruction must show the classifier still reporting PASS');
        assert.ok(controlAssertions !== null,
            'the reconstruction must show the control test FAILING on the new condition');
        // THE DEFECT, STATED AS AN ASSERTION: the two derivations disagree, and because the
        // discriminator's coupling reads the CLASSIFIER, it would report a vacuous green.
        assert.notEqual(classifierState, 'FAIL',
            'DRIFT DEMONSTRATED: the control is failing while the classifier that governs the '
            + 'discriminator still reports PASS. The discriminator would emit a green its control '
            + 'has not earned.');
        console.log('[DRIFT-1] DRIFT REPRODUCED: control RED, classifier PASS — vacuous green possible.');
    });

    // ---------------------------------------------------------------- the property
    test('DRIFT-2: with ONE owner, adding a condition moves BOTH consumers in the same edit', () => {
        // BEFORE the edit: one condition. Both consumers agree the run is green.
        const before1 = createFixtureControl({
            id: 'GATE X', kind: 'positive', governs: 'GATE Y', rationale: ['r'],
            conditions: [CONDITION_A],
        }).record(RUN);
        const beforeAssert = failureOf(() => before1.assertGreen(assert));
        console.log(`[DRIFT-2] before edit -> classifier=${before1.state} controlTest=${beforeAssert === null ? 'PASS' : 'FAIL'}`);
        assert.equal(before1.state, 'PASS');
        assert.equal(beforeAssert, null);

        // THE SINGLE EDIT: add CONDITION_B to the ONE condition list. Nothing else changes.
        const after = createFixtureControl({
            id: 'GATE X', kind: 'positive', governs: 'GATE Y', rationale: ['r'],
            conditions: [CONDITION_A, CONDITION_B],
        }).record(RUN);
        const afterAssert = failureOf(() => after.assertGreen(assert));
        console.log(`[DRIFT-2] after  edit -> classifier=${after.state} controlTest=${afterAssert === null ? 'PASS' : 'FAIL'}`);

        // BOTH consumers moved. There is no state in which one knows about CONDITION_B and the
        // other does not, because there is only one list for them to read.
        assert.equal(after.state, 'FAIL',
            'the classifier must see the added condition');
        assert.ok(afterAssert !== null,
            'the control test must see the added condition');
        assert.match(afterAssert, /named-the-root/,
            'the control test failure must name the condition that failed');
        assert.ok(after.failedIds.includes('named-the-root'),
            'the classifier must name the same failed condition');
        console.log('[DRIFT-2] ONE edit, BOTH consumers moved — the two cannot disagree.');
    });

    // ---------------------------------------------------------------- the second-evaluation hazard
    // Found by this row's VERIFIER against the first version of the owner: one condition list is
    // not enough if the list is EVALUATED TWICE. A condition that is not a pure function of `run`
    // could hold at classifier time and fail at control-test time, and the discriminator — which
    // reads the CLASSIFIER — would allow the green while the control test failed. The rival-predicate
    // detector reported the body clean, correctly, because it WAS clean. The second place they could
    // disagree was the second evaluation.

    /** A condition that is not a pure function of `run`: it flips on its second call. */
    function makeImpureCondition() {
        let calls = 0;
        return {
            id: 'fixture-still-on-disk',
            requirement: 'the artefact the control produced must still be present',
            holds: () => (++calls === 1),
            diagnose: () => 'the artefact vanished between the classifier and the control test',
            get calls() { return calls; },
        };
    }

    test('DRIFT-3a (NEGATIVE CONTROL): a RE-EVALUATING consumer DOES disagree on an impure condition', () => {
        // Reconstructs the defect: the classifier evaluates, and then the control test evaluates
        // AGAIN rather than replaying. This is what the owner used to do.
        const impure = makeImpureCondition();
        const classifierState = impure.holds({}) ? 'PASS' : 'FAIL';        // evaluation #1
        const controlTest = failureOf(() => {
            assert.ok(impure.holds({}), impure.diagnose());                // evaluation #2
        });
        console.log(`[DRIFT-3a] classifier=${classifierState} controlTest=${controlTest === null ? 'PASS' : 'FAIL'} holdsCalls=${impure.calls}`);
        assert.equal(classifierState, 'PASS');
        assert.ok(controlTest !== null,
            'the reconstruction must show the SECOND evaluation disagreeing with the first');
        console.log('[DRIFT-3a] TWO EVALUATIONS REPRODUCED: classifier PASS, control test FAIL.');
    });

    test('DRIFT-3b: the owner evaluates ONCE, so an impure condition CANNOT split the two consumers', () => {
        const impure = makeImpureCondition();
        const c = createFixtureControl({
            id: 'GATE X', kind: 'positive', governs: 'GATE Y', rationale: ['r'],
            conditions: [impure],
        }).record({ ok: true });

        const controlTest = failureOf(() => c.assertGreen(assert));
        const discriminator = failureOf(() => c.requireGreen('GATE Y', assert));
        console.log(`[DRIFT-3b] classifier=${c.state} controlTest=${controlTest === null ? 'PASS' : 'FAIL'} `
            + `discriminator=${discriminator === null ? 'ALLOWED' : 'REFUSED'} holdsCalls=${impure.calls}`);

        // THE STRUCTURAL ASSERTION: there is exactly ONE evaluation, so there is nothing to diverge.
        assert.equal(impure.calls, 1,
            `the owner evaluated the condition ${impure.calls} times. More than one evaluation is a `
            + 'second place for the classifier and the control test to disagree — which is the '
            + 'defect this module exists to abolish.');

        // AND THE OBSERVABLE CONSEQUENCE: the two consumers agree, whatever the condition does.
        const classifierGreen = c.state === 'PASS';
        const controlGreen = controlTest === null;
        assert.equal(classifierGreen, controlGreen,
            'the classifier and the control test reported different verdicts on the same control');
        assert.equal(controlGreen, discriminator === null,
            'the discriminator must not allow a green the control test would refuse');
        console.log('[DRIFT-3b] ONE evaluation; classifier, control test and discriminator all agree.');
    });

    // ---------------------------------------------------------------- fail-closed
    test('FAIL-CLOSED: a control that never ran, or threw, blocks its discriminator', () => {
        const never = createFixtureControl({
            id: 'GATE X', kind: 'positive', governs: 'GATE Y', rationale: ['r'],
            conditions: [CONDITION_A],
        });
        assert.equal(never.state, 'NOT-RUN');
        const blockedNotRun = failureOf(() => never.requireGreen('GATE Y', assert));
        assert.ok(blockedNotRun !== null, 'a NOT-RUN control must block its discriminator');
        assert.match(blockedNotRun, /CANNOT REPORT PASS/);

        const threw = createFixtureControl({
            id: 'GATE X', kind: 'positive', governs: 'GATE Y', rationale: ['r'],
            conditions: [CONDITION_A],
        }).record(null, new Error('harness exploded'));
        assert.equal(threw.state, 'FAIL');
        const blockedThrew = failureOf(() => threw.requireGreen('GATE Y', assert));
        assert.ok(blockedThrew !== null, 'a THREW control must block its discriminator');
        assert.match(blockedThrew, /harness exploded/,
            'the refusal must carry the cause so the reader debugs the control');

        // And the positive direction: a green control does NOT block.
        const green = createFixtureControl({
            id: 'GATE X', kind: 'positive', governs: 'GATE Y', rationale: ['r'],
            conditions: [CONDITION_A],
        }).record(RUN);
        assert.equal(failureOf(() => green.requireGreen('GATE Y', assert)), null,
            'a PASSing control must NOT block — otherwise this gate always refuses and proves nothing');
        console.log('[FAIL-CLOSED] NOT-RUN blocks, THREW blocks, PASS does not.');
    });

    test('A CONTROL WITH NO CONDITIONS IS REFUSED AT CONSTRUCTION', () => {
        const msg = failureOf(() => createFixtureControl({
            id: 'GATE X', kind: 'positive', governs: 'GATE Y', rationale: ['r'], conditions: [],
        }));
        assert.ok(msg !== null, 'a control with no conditions must be refused');
        assert.match(msg, /cannot fail/);
    });

    // ---------------------------------------------------------------- conformance
    // The owner makes drift between TWO COPIES impossible. It cannot stop someone hand-writing a
    // NEW rival predicate beside the delegation, so that is made mechanically detectable here.
    const CONSUMERS = [
        { file: 'quickstart-no-nested-workspace.test.js', control: 'controlC2', gate: 'GATE C2' },
        { file: 'wizard-refuse-on-present-workspace.test.js', control: 'controlB3b', gate: 'GATE B3b' },
    ];

    /** Extract a `test('<gate> ...', ...)` call's body by brace matching, not by line offset. */
    function extractTestBody(source, gate) {
        const idx = source.indexOf(`test('${gate}`);
        if (idx === -1) return null;
        const open = source.indexOf('{', source.indexOf('=>', idx));
        if (open === -1) return null;
        let depth = 0;
        for (let i = open; i < source.length; i++) {
            if (source[i] === '{') depth++;
            else if (source[i] === '}') { depth--; if (depth === 0) return source.slice(open + 1, i); }
        }
        return null;
    }

    for (const c of CONSUMERS) {
        test(`CONFORMANCE: ${c.file} — ${c.gate}'s body delegates and holds NO rival predicate`, async () => {
            const src = await fs.readFile(path.join(__dirname, c.file), 'utf-8');
            const body = extractTestBody(src, c.gate);
            assert.ok(body !== null, `could not locate ${c.gate}'s test body in ${c.file}`);
            const r = findRivalPredicates(body, c.control);
            console.log(`[CONFORMANCE] ${c.file} ${c.gate}: delegates=${r.hasDelegation} rivalAsserts=${r.rivalAssertCount}`);
            assert.ok(r.hasDelegation,
                `${c.gate} must delegate to ${c.control}.assertGreen(assert) — without it the control `
                + 'asserts nothing and its green is empty');
            assert.equal(r.rivalAssertCount, 0,
                `${c.gate} carries ${r.rivalAssertCount} assertion(s) of its own: ${JSON.stringify(r.rivals)}. `
                + 'That is a SECOND derivation of the control predicate and it will drift from the '
                + 'classifier. Move the condition into the control\'s condition list instead.');
        });
    }

    // The conformance check must be able to FAIL, or it is decoration.
    test('CONFORMANCE SELF-CHECK: the rival-predicate detector fails on a rival and on a missing delegation', () => {
        const clean = findRivalPredicates('  controlC2.assertGreen(assert);\n', 'controlC2');
        assert.equal(clean.ok, true, 'a clean delegating body must pass');

        const rival = findRivalPredicates(
            '  controlC2.assertGreen(assert);\n  assert.ok(r.nestedCreated, "extra");\n', 'controlC2');
        assert.equal(rival.ok, false, 'a body with a rival assertion must FAIL');
        assert.equal(rival.rivalAssertCount, 1);

        const missing = findRivalPredicates('  console.log("nothing here");\n', 'controlC2');
        assert.equal(missing.ok, false, 'a body with no delegation must FAIL');

        // AND IT MUST NOT TRIP ON A MENTION RATHER THAN A CALL.
        const mention = findRivalPredicates(
            '  // we used to assert here, and assert.ok was the wrong shape\n  controlC2.assertGreen(assert);\n',
            'controlC2');
        assert.equal(mention.ok, true,
            'a COMMENT mentioning assert must not trip the detector — it matches calls, not words');
        console.log('[CONFORMANCE SELF-CHECK] detector fails on a rival, fails on a missing delegation, '
            + 'ignores a mention.');
    });
});
