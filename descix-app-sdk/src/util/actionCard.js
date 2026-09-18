/**
 * What an action card SAYS, and which action it IS. Pure, React-free, testable.
 *
 * TWO FACTS LIVE HERE, and they are separate on purpose.
 *
 * 1. THE LABEL. The card used to render `Action: previewPath`, which names a function rather
 *    than reporting an act (CEO, on reading his own thread: the cards "are unintuitive as
 *    presented (are they supposed to re-run what Maxi just did?)"). A reader watching an agent
 *    work needs to know what HAPPENED, in the tense it happened in.
 *
 * 2. THE IDENTITY. Which action this IS, for dedupe. It must NOT be the function name.
 *    Measured (GODSWORLD-DEV, 2026-09-18): their own method takes the same action twice on
 *    purpose — "Recipe: read the detector … a second look after a short wait" — because a
 *    pattern is only real if you look twice at different accumulation depths. A guard keyed on
 *    the function name silently eats that second look, and the failure presents as the MODEL
 *    being lazy rather than as a guard misfiring. Identity is therefore the action's PLACE in
 *    the transcript plus its arguments — never its name.
 */

/**
 * A stable identity for one action AS IT APPEARS in the transcript.
 *
 * Survives a remount, because nothing in it comes from the React instance. Two genuinely
 * distinct acts differ in `messageId` or `index`; a re-render of the same act does not.
 */
export function actionInstanceKey({ messageId, index, functionName, args }) {
    if (!messageId && messageId !== 0) {
        throw new Error(
            'actionInstanceKey: messageId is required. Without it the key collapses to ' +
            '(name, args), which cannot tell a deliberate repeat from a double-fire.');
    }
    let argPart;
    try {
        argPart = stableStringify(args);
    } catch {
        argPart = '<unserializable>';
    }
    return `${messageId}#${index}#${functionName}#${argPart}`;
}

/** Key order must not change the identity — JSON.stringify alone would let it. */
function stableStringify(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

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
