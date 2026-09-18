/**
 * Which message a turn writes to. Pure, React-free, testable.
 *
 * THE DEFECT (measured on PROD, egpt-godsworld, 2026-09-18, by a DOM observer the CEO ran):
 * every write a turn made to its answer targeted `messages[messages.length - 1]` — "the last
 * message" — rather than the message the turn created. That is only the same message while
 * nothing else appends one. A self-guided action fires as soon as its block has streamed in,
 * and its result is sent as a NEW turn in milliseconds, which appends a message while the
 * first turn is still streaming. The first turn's next chunk then lands in the NEW message:
 * its whole answer, action block included, is copied there, and the copy renders a second
 * card that fires the op again. Measured: every result sent twice, prose duplicated, the
 * second fire 0.5–0.9s after the first (the gap to the next chunk), and one requested act
 * spending the page's entire 24-hop budget.
 *
 * "The last message" is a position, and a position is not an identity. A turn owns the
 * message it minted, and writes to that id or to nothing.
 */

let seq = 0;

/**
 * A message id unique within this page. `Date.now()` alone is not: two turns minted in the
 * same millisecond — exactly what an action result racing a live stream produces — would share
 * an id, and a write addressed to one would land on the other.
 */
export function mintMessageId() {
    seq += 1;
    return `msg_${Date.now()}_${seq}`;
}

/**
 * Return a new message array with ONE message, found by id, patched.
 *
 * `patch` is an object to merge, or a function `(message) => object` for a conditional patch.
 * A missing id writes NOTHING and says so: the message was deleted or the thread was switched
 * mid-stream, and writing the answer to whichever message happens to be last is the defect
 * this function exists to end.
 */
export function patchMessageById(messages, id, patch) {
    if (!Array.isArray(messages)) return messages;
    const index = messages.findIndex((m) => m && m.id === id);
    if (index === -1) {
        console.error(
            `[chat] turn ${id} has no message in this thread any more (deleted, or the thread ` +
            `was switched mid-stream). Its update is DROPPED rather than written to another message.`);
        return messages;
    }
    const current = messages[index];
    const delta = typeof patch === 'function' ? patch(current) : patch;
    if (!delta || Object.keys(delta).length === 0) return messages;
    const next = [...messages];
    next[index] = { ...current, ...delta };
    return next;
}
