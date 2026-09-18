/**
 * What an action card SAYS. Pure, React-free, testable.
 *
 * The card used to render `Action: previewPath`, which names a function rather than reporting
 * an act (CEO, on reading his own thread: the cards "are unintuitive as presented (are they
 * supposed to re-run what Maxi just did?)"). A reader watching an agent work needs to know what
 * HAPPENED, in the tense it happened in.
 */

/**
 * Humanise a camelCase / snake_case function name into a readable phrase.
 *
 * Deliberately generic: the SDK does not know what any given app's verbs MEAN, and inventing a
 * per-verb dictionary here would be a platform surface guessing at app semantics. What it CAN
 * do honestly is stop showing the reader an identifier.
 */
export function humaniseActionName(functionName) {
    if (typeof functionName !== 'string' || functionName.trim() === '') return 'action';
    return functionName
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .toLowerCase()
        .trim();
}

/**
 * The card's full presentation for a given run state.
 *
 * `status` is one of:
 *   'ran'     — this action executed; the card REPORTS, and offers no accidental re-run
 *   'running' — executing now; the affordance is STOP, never run-again
 *   'held'    — the page declined to auto-run it and said why; running is the human's choice
 *   'idle'    — no self-guidance is present at all; the human drives
 */
export function describeActionCard({ functionName, status, reason }) {
    const name = humaniseActionName(functionName);
    switch (status) {
        case 'ran':
            return { severity: 'success', text: `Ran ${name}`, action: 'rerun', reason: reason || null };
        case 'running':
            return { severity: 'success', text: `Running ${name}…`, action: 'stop', reason: null };
        case 'held':
            return { severity: 'info', text: `Did not run ${name}`, action: 'run', reason: reason || null };
        case 'idle':
        default:
            return { severity: 'info', text: `Ready to run ${name}`, action: 'run', reason: reason || null };
    }
}
