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
 * HOW DRIFT IS MADE IMPOSSIBLE RATHER THAN MERELY ABSENT. A control's greenness is defined ONCE,
 * as an ordered list of CONDITIONS. Both consumers iterate THAT LIST:
 *
 *   · the CLASSIFIER calls `record(run)`   -> evaluates every condition to compute PASS/FAIL
 *   · the CONTROL TEST calls `assertGreen()` -> asserts every condition, generated from the list
 *
 * Neither consumer writes a predicate of its own. Adding, removing or changing a condition is a
 * single edit in a single array, and BOTH consumers change in the same breath because there is
 * no second place for them to disagree. You cannot add an assertion to the control test without
 * the classifier seeing it, because the control test has no assertions to add -- it delegates.
 *
 * WHAT REMAINS POSSIBLE, STATED PLAINLY: someone could still hand-write an EXTRA assertion beside
 * the delegation. That is not drift between two copies of one predicate -- it is the creation of
 * a NEW second copy, and it is visible as such precisely because this owner exists. The
 * conformance check `assertNoRivalPredicate()` below exists to make even that a FAILURE rather
 * than a silent divergence, and it is exercised by this module's own self-test.
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
                state = 'FAIL'; run = null; failedIds = ['threw'];
                why = `the control run THREW: ${error && error.message}`;
                return this;
            }
            if (measuredRun === null || measuredRun === undefined) {
                state = 'FAIL'; run = null; failedIds = ['absent'];
                why = 'the control produced no run at all';
                return this;
            }
            run = measuredRun;
            const failed = conditions.filter((c) => !holdsSafely(c, run));
            failedIds = failed.map((c) => c.id);
            if (failed.length) {
                state = 'FAIL';
                why = failed.map((c) => diagnoseSafely(c, run)).join('\n           ');
            } else {
                state = 'PASS';
                why = `every condition held: ${conditions.map((c) => c.id).join(', ')}`;
            }
            return this;
        },

        /**
         * THE CONTROL TEST'S ENTRY POINT. Asserts EXACTLY the conditions the classifier evaluated,
         * generated from the same array, so the two can never disagree. The control test body is
         * this call and nothing else -- that is what makes the drift structural rather than
         * a matter of discipline.
         */
        assertGreen(assert) {
            assert.ok(run !== null,
                `${id} (${kind} control) did not run at all: ${why}`);
            for (const c of conditions) {
                assert.ok(holdsSafely(c, run),
                    `${id} (${kind} control) CONDITION "${c.id}" FAILED.\n`
                    + `  REQUIREMENT: ${c.requirement}\n`
                    + `  DIAGNOSIS  : ${diagnoseSafely(c, run)}`);
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
 * IT MATCHES A CALL, NOT A MENTION: the check counts `assert.<something>(` CALL sites and allows
 * exactly the delegating one. A comment that merely says "assert" does not trip it, and deleting
 * the real delegation does not pass it.
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
