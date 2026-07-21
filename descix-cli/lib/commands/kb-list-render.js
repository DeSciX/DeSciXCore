/**
 * Pure render helpers for `descix kb list` — kept out of bin/descix.js so the
 * count-truth display contract is unit-testable (WS-KB-OBSERVABILITY-LIES).
 *
 * The server (`list_knowledge_bases`) tags every row with `count_source`:
 *   'live'    — the TRUE Pinecone count (authoritative)
 *   'cached'  — the fast cached counter (may under-report un-synced KBs)
 *   'unknown' — a live count was requested but Pinecone enumeration failed
 *
 * An 'unknown' count is rendered '?' — NEVER a fabricated 0 (anti-pattern #7).
 */

/**
 * The Vectors-column cell for a KB row.
 * @param {Object} kb row from list_knowledge_bases
 * @returns {string}
 */
export function kbVectorCell(kb) {
  if (!kb || kb.count_source === 'unknown' || kb.rag_vector_count == null) return '?';
  return String(kb.rag_vector_count);
}

/**
 * The Source-column cell for a KB row. Falls back to the requested mode when the
 * server did not tag the row (older backend), so the column is always populated.
 * @param {Object} kb row from list_knowledge_bases
 * @param {boolean} live whether the CLI requested the live count
 * @returns {string}
 */
export function kbCountSource(kb, live) {
  return (kb && kb.count_source) || (live ? 'live' : 'cached');
}
