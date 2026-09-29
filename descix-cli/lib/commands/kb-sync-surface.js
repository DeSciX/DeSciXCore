/**
 * The canonical KB surfaces, named once. Every refusal, hint and next-step that points a
 * developer at KB sync or KB creation consumes these constants rather than retyping them.
 */

/** The single canonical KB sync surface. */
export const CANONICAL_KB_SYNC = 'descix kb corpus sync';

/** The verb that creates a KB — `kb corpus sync`'s dependency. */
export const CANONICAL_KB_CREATE = 'descix app init --kb <kb_name>';
