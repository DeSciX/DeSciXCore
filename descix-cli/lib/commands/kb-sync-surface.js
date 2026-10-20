/**
 * The canonical KB surfaces, named once. Every refusal, hint and next-step that points a
 * developer at KB sync or KB creation consumes these rather than retyping them.
 */

/** The single canonical KB sync surface. */
export const CANONICAL_KB_SYNC = 'descix kb corpus sync';

/** The verb that creates a KB on an existing app — `kb corpus sync`'s dependency. */
export const CANONICAL_KB_CREATE = 'descix kb create';

/** The full KB-create invocation, so its flag spelling has one owner too. */
export function kbCreateInvocation(appId = '<app_id>', kbName = '<kb_name>') {
  return `${CANONICAL_KB_CREATE} -a ${appId} --kb ${kbName}`;
}
