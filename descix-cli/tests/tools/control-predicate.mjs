/**
 * THE ONE OWNER OF "WHAT MAKES A FIXTURE CONTROL GREEN".
 *
 * WHY THIS EXISTS (measured at 9cfdf39, the coupling merge). Two suites each coupled a
 * discriminator to a fixture control, and each one derived "what makes this control green" TWICE:
 * once in the before() classifier that computes the control's state, and again in the control
 * test's own assertions. Four copies of two predicates across two files. Add a condition to a
 * control test without adding the matching arm to its classifier and the control goes RED while
 * the classifier still reports PASS -- so the discriminator it governs keeps reporting GREEN on a
 * control that is failing. That is the VACUOUS GREEN the coupling row existed to abolish,
 * restored through the back door of a hand-mirrored predicate.
 *
 * TWO DERIVATIONS OF ONE FACT IS THE GENERAL FORM OF MIRROR DRIFT, and the fix is never to patch
 * the divergent copy: it is to extract ONE owner that every site consumes.
 *
 * HOW DRIFT IS MADE IMPOSSIBLE RATHER THAN MERELY ABSENT. It takes BOTH of these, and the first
 * one alone is not enough -- that was this module's own first-version defect:
 *
 *   1. ONE LIST. A control's greenness is defined once, as an ordered list of CONDITIONS. No
 *      consumer writes a predicate of its own, so adding or changing a condition is a single edit
 *      in a single array.
 *   2. ONE EVALUATION. `record()` evaluates that list EXACTLY ONCE and stores the per-condition
 *      result. Both consumers then READ that stored result rather than re-asking the conditions:
 *
 *        · the CLASSIFIER    calls `record(run)`     -> performs the one evaluation, computes PASS/FAIL
 *        · the CONTROL TEST  calls `assertGreen()`   -> REPLAYS that evaluation as assertions
 *        · the DISCRIMINATOR calls `requireGreen()`  -> reads the same state
 *
 * Two readings of one result cannot disagree. Two evaluations of one list CAN, whenever a
 * condition is not a pure function of `run` -- and that is exactly how the first version of this
 * module could still produce a vacuous green (see the note on `evaluation` below).
 *
 * WHAT REMAINS POSSIBLE, STATED PLAINLY AND COMPLETELY. Someone can still hand-write an EXTRA
 * assertion beside the delegation in a control test body. That is not drift between two copies of
 * one predicate -- it is the creation of a NEW second copy, and it is visible as such precisely
 * because this owner exists. `findRivalPredicates()` below makes the common form of it a FAILURE
 * rather than a silent divergence; read its own "WHAT IT DOES NOT CATCH" note before relying on
 * its silence, because it recognises rivals written against `assert` and nothing else.
 *
 * A CONTROL IS FAIL-CLOSED. Every state that is not an observed PASS -- NOT-RUN, a throw, a
 * timeout -- blocks the discriminator it governs. "We never measured it" and "we measured it and
 * it was fine" must never read the same.
 */

/**
 * Define one fixture control.
 *
 * @param {object} spec
 * @param {string}   spec.id        - the control's gate name as a reader will cite it, e.g. 'GATE C2'.
 * @param {'positive'|'negative'} spec.kind - positive controls prove the fixture CAN produce the
 *        thing the discriminator reads as absent; negative controls prove it can produce the
 *        OTHER outcome. The word appears in every refusal so the reader knows what was proven.
 * @param {string}   spec.governs   - the discriminator this control licenses, e.g. 'GATE C1'.
 * @param {string[]} spec.rationale - why this control governs that gate, in the refusal's own voice.
 * @param {Array<{id:string, requirement:string, holds:(run:any)=>boolean, diagnose:(run:any)=>string}>}
 *        spec.conditions - THE SINGLE DERIVATION. Every consumer reads this and only this.
 */
export function createFixtureControl({ id, kind, governs, rationale, conditions }) {
    if (!Array.isArray(conditions) || conditions.length === 0) {
        throw new Error(`createFixtureControl(${id}): a control with no conditions cannot fail, `
            + 'and a control that cannot fail licenses nothing.');
    }
    for (const c of conditions) {
        for (const f of ['id', 'requirement', 'holds', 'diagnose']) {
            if (!c || c[f] === undefined) {
                throw new Error(`createFixtureControl(${id}): condition "${c && c.id}" is missing `
                    + `"${f}". A condition without a diagnosis sends the next reader to debug the `
                    + 'wrong thing.');
            }
        }
    }

    let state = 'NOT-RUN';
    let why = 'the control has not been run yet';
    let run = null;
    let failedIds = [];
    /**
     * THE ONE EVALUATION. `record()` evaluates every condition EXACTLY ONCE and stores the result
     * here; every consumer reads THIS, and no consumer calls `holds()` again.
     *
     * WHY (measured 2026-09-15, found by this row's verifier against the first version of this
     * file): `assertGreen` used to RE-EVALUATE `holds(run)` rather than replay what `record()` had
     * already decided. One condition list, but TWO EVALUATIONS OF IT at two different times — so a
     * condition that is not a pure function of `run` (one that stats the fixture, reads the
     * filesystem or looks at the clock) could hold at classifier time and fail at control-test
     * time. Probed: classifier PASS, control test FAIL, failedIds [], and the discriminator's
     * `requireGreen` ALLOWED THE GREEN, with the control test body still a bare delegation that the
     * rival-predicate detector correctly reported clean. That is the precise symptom this module
     * exists to abolish, reappearing inside the mechanism built to abolish it. THE SECOND PLACE
     * THEY COULD DISAGREE WAS THE SECOND EVALUATION, and collapsing it is what makes the
     * impossibility claim above true rather than aspirational.
     */
    let evaluation = null;

    /** Evaluate one condition without letting a throw masquerade as a pass. */
    function holdsSafely(c, r) {
        try { return !!c.holds(r); } catch (e) { return false; }
    }
    function diagnoseSafely(c, r) {
        try { return c.diagnose(r); } catch (e) { return `${c.id}: diagnosis threw: ${e && e.message}`; }
    }

    return {
        id, kind, governs, rationale, conditions,

        get state() { return state; },
        get why() { return why; },
        get run() { return run; },
        get failedIds() { return [...failedIds]; },

        /**
         * THE CLASSIFIER'S ENTRY POINT. Measure the control ONCE, before any gate reads its
         * verdict -- independently of declaration order or runner concurrency.
         * @param {any} measuredRun  what the harness produced, or null if it could not run
         * @param {Error|null} error the throw that prevented it, if any
         */
        record(measuredRun, error = null) {
            if (error) {
                state = 'FAIL'; run = null; evaluation = null; failedIds = ['threw'];
                why = `the control run THREW: ${error && error.message}`;
                return this;
            }
            if (measuredRun === null || measuredRun === undefined) {
                state = 'FAIL'; run = null; evaluation = null; failedIds = ['absent'];
                why = 'the control produced no run at all';
                return this;
            }
            run = measuredRun;
            // THE ONE EVALUATION. Each condition's verdict AND its diagnosis are captured here, at
            // this instant, against this run. Nothing downstream re-asks the condition.
            evaluation = conditions.map((c) => {
                const held = holdsSafely(c, run);
                return {
                    id: c.id,
                    requirement: c.requirement,
                    held,
                    diagnosis: held ? null : diagnoseSafely(c, run),
                };
            });
            const failed = evaluation.filter((e) => !e.held);
            failedIds = failed.map((e) => e.id);
            if (failed.length) {
                state = 'FAIL';
                why = failed.map((e) => e.diagnosis).join('\n           ');
            } else {
                state = 'PASS';
                why = `every condition held: ${evaluation.map((e) => e.id).join(', ')}`;
            }
            return this;
        },

        /**
         * THE CONTROL TEST'S ENTRY POINT. REPLAYS the single evaluation `record()` performed; it
         * does NOT re-ask the conditions. The classifier's state and these assertions are two
         * READINGS of one result, never two evaluations of one list, so they cannot disagree even
         * when a condition is impure. The control test body is this call and nothing else.
         */
        assertGreen(assert) {
            assert.ok(evaluation !== null,
                `${id} (${kind} control) did not run at all: ${why}`);
            for (const e of evaluation) {
                assert.ok(e.held,
                    `${id} (${kind} control) CONDITION "${e.id}" FAILED.\n`
                    + `  REQUIREMENT: ${e.requirement}\n`
                    + `  DIAGNOSIS  : ${e.diagnosis}`);
            }
        },

        /**
         * THE DISCRIMINATOR'S COUPLING GUARD. Returns silently only when the control was OBSERVED
         * to pass; otherwise fails the gate with a message naming the CONTROL as the thing to
         * debug. A refusal that does not name its cause sends the next reader to the wrong gate.
         */
        requireGreen(gate, assert) {
            if (state === 'PASS') return;
            assert.fail([
                `${gate} CANNOT REPORT PASS: its ${kind} control ${id} is ${state}.`,
                '',
                `  WHY ${id} GOVERNS ${gate}:`,
                ...rationale.map((l) => `    ${l}`),
                '',
                `  CONTROL STATE     : ${state}`,
                `  CONDITIONS FAILED : ${failedIds.length ? failedIds.join(', ') : '(none recorded)'}`,
                `  CONTROL REASON    : ${why}`,
                '',
                `  DEBUG THE CONTROL, NOT THIS GATE. ${gate} is making no claim about the product`,
                `  right now; it is refusing to report a result it cannot attribute. Fix ${id} and`,
                '  this gate will discriminate once more.',
            ].join('\n'));
        },

        /** The coverage-boundary line both suites print, so the reader of a green sees the coupling. */
        boundaryLine() {
            return `COUPLED  : ${governs} is COUPLED TO ${id} IN CODE, and both the classifier and `
                 + `${id}'s own\n           assertions are generated from ONE condition list `
                 + `(${conditions.map((c) => c.id).join(', ')}),\n           so the two cannot drift apart.`;
        },

        /** What this control proved, printed on GREEN as well as RED. */
        verdictLine() {
            return `[CONTROL ${id}] state=${state} :: ${why.split('\n')[0]}`;
        },
    };
}

/**
 * CONFORMANCE CHECK -- makes a RIVAL PREDICATE a failure rather than a silent second derivation.
 *
 * It reads the control test's own source and requires that the only assertion it performs is the
 * delegation to its control. This is the one thing the owner cannot make structurally impossible,
 * so it is made mechanically detectable instead.
 *
 * IT MATCHES A CALL, NOT A MENTION: the check counts `assert(` and `assert.<something>(` CALL
 * sites and allows exactly the delegating one. A comment that merely says "assert" does not trip
 * it, and deleting the real delegation does not pass it.
 *
 * WHAT IT DOES NOT CATCH -- STATED BECAUSE A READER TAKES A GATE'S SILENCE FOR COVERAGE.
 * It recognises rivals written against the `assert` binding, and NOTHING ELSE. Measured over ten
 * synthetic bodies, it MISSES a rival expressed as:
 *   · a bare `throw` (`if (!r.nestedCreated) throw new Error(...)`)
 *   · a helper call -- `expectCode(r, 0)`, `expect(r.nestedCreated).toBe(true)`
 *   · a destructured alias -- `const { ok } = assert; ok(...)`, or `strict.equal(...)`
 *   · an assertion nested inside a closure the body invokes
 * Its green therefore means "no rival written as assert.*", not "no rival". That is a deliberate
 * floor: the STRUCTURAL guarantee against drift is the single evaluation in `record()`, which holds
 * regardless of what a control test body contains. This check is a second line against the one
 * thing that guarantee cannot reach, not the thing the guarantee rests on.
 *
 * @param {string} source      the control test function's source text
 * @param {string} controlName the identifier the delegation is called on, e.g. 'controlC2'
 */
export function findRivalPredicates(source, controlName) {
    const delegation = new RegExp(String.raw`\b${controlName}\s*\.\s*assertGreen\s*\(`);
    const hasDelegation = delegation.test(source);
    // Count real assert CALL sites, not the word "assert".
    const assertCalls = [...source.matchAll(/\bassert\s*(?:\.\s*[A-Za-z_$][\w$]*\s*)?\(/g)]
        .map((m) => m[0]);
    return {
        hasDelegation,
        rivalAssertCount: assertCalls.length,
        rivals: assertCalls,
        ok: hasDelegation && assertCalls.length === 0,
    };
}
