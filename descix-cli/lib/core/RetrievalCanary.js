/**
 * RetrievalCanary — a corpus sync does not report success until a KNOWN chunk it just
 * wrote actually RETRIEVES from the store.
 *
 * MEASURED 2026-09-17: `descix kb corpus sync --rebuild` purges and re-upserts, then
 * reports success and a reconciled live count, while the PROD search index takes ~20
 * minutes to catch up. Every status surface said healthy over a KB that returned zero
 * results for hours. The reconcile step (`get_kb_rag_status {reconcile:true}`, driven from
 * `corpus.js::runCorpusSync`) counts by Pinecone ID PREFIX — presence, not searchability —
 * so a clean reconcile is not evidence the index can answer a query yet.
 *
 * THE CANARY: after upserting, pick ONE chunk that was actually upserted (never one from a
 * failed batch), run `query_knowledge_base` scoped to that chunk's own document
 * (`file_filter`) using the chunk's own text as the query, and check the result set for a
 * row whose metadata identifies THIS chunk (blob_sha + chunk_idx — the two fields
 * `corpus.js::chunkCorpusFile` always writes, so this needs no second identity scheme).
 *
 * BOUNDED, NOT A LOOP: `query_knowledge_base` is a real, credit-metered read (WS-HEADLESS-MVP-A3
 * flat debit per call). A canary that polled every few seconds for the full ~20-minute
 * propagation window would multiply that cost by hundreds of calls for a single sync. This
 * canary makes a SMALL, FIXED number of attempts (`DEFAULT_CANARY_DELAYS_MS`, 3 calls across
 * ~25s) — enough to catch the common case where the index catches up quickly — and REFUSES to
 * claim success if it does not, rather than waiting out the full window synchronously inside a
 * CLI command. See corpus.js's hand-back for the case this does not close and the remedy it
 * names when it doesn't (re-run the sync; unchanged blob SHAs make the re-run cheap and it
 * re-runs this same canary).
 */

/** Fixed, small backoff schedule — see the module doc for why this is bounded, not a loop. */
export const DEFAULT_CANARY_DELAYS_MS = [3000, 7000, 15000];

/** Pinecone metadata budget note in chunkCorpusFile caps chunk text at 35000 bytes; a canary
 * query only needs enough text to be a near-exact self-match, so it is truncated far below that
 * — a long query costs more to embed for no better discrimination.
 */
const MAX_CANARY_QUERY_CHARS = 300;

/**
 * The query text for a canary check: the chunk's own text is guaranteed to retrieve itself
 * with the highest similarity of anything in the index, so no second corpus of "known good"
 * queries is needed.
 *
 * @param {{text: string}} chunk
 * @returns {string}
 */
export function canaryQueryText(chunk) {
    return String(chunk.text || '').trim().slice(0, MAX_CANARY_QUERY_CHARS);
}

/**
 * Does this `query_knowledge_base` result row identify the given chunk?
 *
 * Matches on `blob_sha` + `chunk_idx` — the two fields `chunkCorpusFile()` always writes as
 * Pinecone metadata, content-addressed and stable regardless of any server-side text
 * normalization. This is the SAME identity the sync's own delta computation uses, not a
 * second one invented for this check.
 *
 * @param {{metadata?: Record<string, any>}} row - one row of `query_knowledge_base`'s `results`
 * @param {{blob_sha: string, chunk_idx: number}} chunk
 * @returns {boolean}
 */
export function chunkMatchesCanary(row, chunk) {
    const md = row?.metadata || {};
    return md.blob_sha === chunk.blob_sha && md.chunk_idx === chunk.chunk_idx;
}

/**
 * Pick one upserted chunk to canary-check: the first chunk that was NOT part of a batch the
 * store reported as failed. Returns null when there is nothing safe to check (every batch
 * failed) — the caller's existing batch-failure reporting already covers that case loudly;
 * this module does not re-report it.
 *
 * @param {Array<{id: string}>} allChunks - every chunk this sync attempted to upsert
 * @param {Array<{chunks: string[]}>} syncFailures - failed batches, each naming its chunk ids
 * @returns {object|null}
 */
export function pickCanaryChunk(allChunks, syncFailures) {
    const failedIds = new Set((syncFailures || []).flatMap((f) => f.chunks || []));
    return allChunks.find((c) => !failedIds.has(c.id)) || null;
}

/**
 * Run the bounded-backoff retrieval canary against a freshly-upserted chunk.
 *
 * @param {object} apiClient - an initialized DeSciXApiClient
 * @param {object} args
 * @param {string} args.appId
 * @param {string} args.kbName
 * @param {object} args.chunk - one entry from `allChunks` (must carry text/file_id/blob_sha/chunk_idx)
 * @param {number[]} [args.delaysMs] - injectable for tests; production default is
 *        DEFAULT_CANARY_DELAYS_MS
 * @param {(ms: number) => Promise<void>} [args.sleep] - injectable for tests (real timers by default)
 * @returns {Promise<{ok: boolean, attempts: number, elapsedMs: number, lastError: string|null}>}
 */
export async function runRetrievalCanary(apiClient, {
    appId, kbName, chunk,
    delaysMs = DEFAULT_CANARY_DELAYS_MS,
    sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
}) {
    const startedAt = Date.now();
    let attempts = 0;
    let lastError = null;

    for (const delay of delaysMs) {
        attempts++;
        await sleep(delay);
        try {
            const resp = await apiClient.invoke('query_knowledge_base', {
                app_id: appId,
                kb_id: kbName,
                query: canaryQueryText(chunk),
                limit: 5,
                file_filter: chunk.file_id,
            }, { allowGuest: false });
            const data = resp?.message || resp;
            const results = data?.results || [];
            if (results.some((row) => chunkMatchesCanary(row, chunk))) {
                return { ok: true, attempts, elapsedMs: Date.now() - startedAt, lastError: null };
            }
        } catch (err) {
            // A transient failure on ONE attempt does not end the canary early — the schedule is
            // already bounded by delaysMs.length, so this is not an unbounded retry-on-error loop.
            lastError = err.message;
        }
    }

    return { ok: false, attempts, elapsedMs: Date.now() - startedAt, lastError };
}
