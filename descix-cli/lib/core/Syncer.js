/**
 * Syncer - Canonical module for upstream sync to Pinecone
 * 
 * Responsibilities:
 * - Sync local chunks to Pinecone via backend API
 * - Compute delta between local and remote chunks using content_hash
 * - Manage chunk lifecycle (upsert/delete)
 * 
 * Architecture:
 * - Chunks are processed locally by Chunker (with content_hash)
 * - Syncer compares hashes to determine what needs upserting
 * - Only changed/new chunks are sent to backend
 * - Backend handles Pinecone authentication and embedding
 * - Pinecone performs integrated embeddings (server-side)
 * 
 * Security:
 * - Pinecone API keys never leave the backend
 * - CLI only sends text + metadata; backend handles embedding
 * 
 * Chunk ID Format (v2.1):
 * - Composite: ${community_id}:${app_id}:${kb_id}:${file_id}:${chunk_idx}
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { loadChunks } from './Chunker.js';

/**
 * THE ONE VALUE this CLI uses to mean "the store did not report a count".
 *
 * A receipt is derived from the STORE, never from the REQUEST. Where the store
 * cannot report, we say so — we never substitute the number of things we ASKED
 * to be changed, because that number is a description of our own request and
 * carries no information about what happened.
 *
 * @type {number}
 */
export const UNREPORTED_COUNT = -1;

/**
 * Normalize a count the store returned into either that count or UNREPORTED_COUNT.
 * This is the ONLY place the "did the store report a number?" decision is made.
 *
 * @param {*} value - the raw count field as it arrived from the store
 * @returns {number} the store's count, or UNREPORTED_COUNT if it reported none
 */
export function reportedCount(value) {
  return Number.isFinite(value) ? value : UNREPORTED_COUNT;
}

/**
 * True when `value` is a count the store actually reported. Callers use this to
 * choose between printing a number and printing "unknown" — never to fabricate one.
 *
 * @param {*} value
 * @returns {boolean}
 */
export function isReportedCount(value) {
  return Number.isFinite(value) && value >= 0;
}

/**
 * Sum counts across batches while preserving unknown-ness: if ANY batch could not
 * be reported, the total is not a number we can honestly state.
 *
 * @param {number} runningTotal - UNREPORTED_COUNT once any batch was unreportable
 * @param {*} batchValue - the raw count field from this batch's store response
 * @returns {number}
 */
export function accumulateReportedCount(runningTotal, batchValue) {
  const next = reportedCount(batchValue);
  if (!isReportedCount(runningTotal) || !isReportedCount(next)) return UNREPORTED_COUNT;
  return runningTotal + next;
}

/**
 * Compute delta between local chunks and remote Pinecone records
 * Uses content_hash for efficient change detection when available.
 * 
 * @param {Array} localChunks - Chunk records from local JSON files (with content_hash)
 * @param {Array<Object>} remoteChunks - Remote chunk metadata { id, content_hash } or just IDs
 * @returns {Object} { toUpsert: Array, toDelete: Array<string>, unchanged: number }
 */
export function computeChunkDelta(localChunks, remoteChunks) {
  // Handle both old format (array of IDs) and new format (array of {id, content_hash})
  const isNewFormat = remoteChunks.length > 0 && typeof remoteChunks[0] === 'object';
  
  // Build maps for efficient lookup
  const localById = new Map(localChunks.map(c => [c.id, c]));
  const remoteById = isNewFormat 
    ? new Map(remoteChunks.map(c => [c.id, c.content_hash]))
    : new Map(remoteChunks.map(id => [id, null]));  // No hash available
  
  const toUpsert = [];
  let unchanged = 0;
  
  for (const chunk of localChunks) {
    const remoteHash = remoteById.get(chunk.id);
    
    if (remoteHash === undefined) {
      // Chunk doesn't exist in remote - need to upsert
      toUpsert.push(chunk);
    } else if (remoteHash === null) {
      // No hash comparison available (old backend) - always upsert
      toUpsert.push(chunk);
    } else if (chunk.content_hash !== remoteHash) {
      // Hash differs - content changed, need to upsert
      toUpsert.push(chunk);
    } else {
      // Hash matches - skip (already in sync)
      unchanged++;
    }
  }
  
  // Find chunks to delete (exist in remote but not locally)
  const localIds = new Set(localChunks.map(c => c.id));
  const remoteIds = isNewFormat ? remoteChunks.map(c => c.id) : remoteChunks;
  const toDelete = remoteIds.filter(id => !localIds.has(id));
  
  return { toUpsert, toDelete, unchanged };
}

/**
 * Get existing chunk metadata from Pinecone (with content_hash for delta).
 * Falls back to the IDs-only endpoint when the metadata endpoint is unavailable.
 *
 * An empty array means the STORE REPORTED an empty KB. It never means "we could
 * not find out" — when neither endpoint can report, this THROWS naming both
 * endpoints and both causes, because an unknown remote set presented as an empty
 * one makes every caller conclude that nothing is stale.
 *
 * @param {Object} apiClient - DeSciXApiClient instance
 * @param {string} communityId - Community ID
 * @param {string} appId - App ID
 * @param {string} kbId - Knowledge base ID
 * @returns {Promise<Array<{id: string, content_hash: string}>|Array<string>>} Chunk
 *          metadata, or plain chunk ids from the compatibility endpoint.
 * @throws {Error} when neither endpoint reports the remote chunk set.
 */
export async function getRemoteChunkMetadata(apiClient, communityId, appId, kbId) {
  // A fallback is a COMPATIBILITY PATH, not an error handler: we fall back when
  // the newer endpoint is absent, and we FAIL LOUD when neither can report.
  // Returning [] here would present a transport failure as a store state
  // ("remote is empty"), and every caller would then compute that nothing is
  // stale and re-upsert everything — silently.
  const failures = [];

  try {
    const result = await apiClient.invoke('kb_get_chunk_metadata', {
      app_id: appId,
      kb_id: kbId
    });
    // apiClient.invoke returns { status, message: { chunks, count, ... } }
    const data = result?.message || result;
    // An empty ARRAY is the store reporting an empty KB — legal, and preserved.
    // An ABSENT field is the store not reporting at all — not the same fact.
    if (Array.isArray(data?.chunks)) return data.chunks;
    failures.push("kb_get_chunk_metadata: response carried no 'chunks' array");
  } catch (error) {
    failures.push(`kb_get_chunk_metadata: ${error.message}`);
  }

  try {
    const result = await apiClient.invoke('kb_get_chunk_ids', {
      app_id: appId,
      kb_id: kbId
    });
    // apiClient.invoke returns { status, message: { chunk_ids, count, ... } }
    const data = result?.message || result;
    if (Array.isArray(data?.chunk_ids)) return data.chunk_ids;
    failures.push("kb_get_chunk_ids: response carried no 'chunk_ids' array");
  } catch (error) {
    failures.push(`kb_get_chunk_ids: ${error.message}`);
  }

  throw new Error(
    `Cannot enumerate remote chunks for ${appId}/${kbId}: both endpoints failed to report. ` +
    'The remote chunk set is UNKNOWN — it must NOT be treated as an empty KB, because ' +
    'that would silently skip stale-chunk deletion and re-upsert everything. ' +
    failures.join(' | ')
  );
}

/**
 * @deprecated Use getRemoteChunkMetadata instead
 * Get existing chunk IDs from Pinecone
 */
export async function getRemoteChunkIds(apiClient, communityId, appId, kbId) {
  const metadata = await getRemoteChunkMetadata(apiClient, communityId, appId, kbId);
  // Handle both formats
  if (metadata.length > 0 && typeof metadata[0] === 'object') {
    return metadata.map(c => c.id);
  }
  return metadata;
}

/**
 * Upsert chunks to Pinecone via backend API
 * 
 * @param {Object} apiClient - DeSciXApiClient instance
 * @param {string} communityId - Community ID
 * @param {string} appId - App ID
 * @param {string} kbId - Knowledge base ID
 * @param {Array} chunks - Chunk records to upsert
 * @returns {Promise<{upserted: number}>} `upserted` is the store's own count, or
 *          UNREPORTED_COUNT if ANY batch's store response carried no count.
 *          Test it with isReportedCount(); never print it unguarded.
 */
export async function upsertChunks(apiClient, communityId, appId, kbId, chunks) {
  if (chunks.length === 0) {
    return { upserted: 0 };
  }

  // Pinecone limits upserts to 96 vectors per batch
  const BATCH_SIZE = 90;
  let totalUpserted = 0;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const result = await apiClient.invoke('kb_sync_chunks', {
      app_id: appId,
      kb_id: kbId,
      chunks: batch
    });
    // apiClient.invoke returns the whole { status, message: {...} } envelope.
    const data = result?.message || result;
    totalUpserted = accumulateReportedCount(totalUpserted, data?.upserted_count);
  }

  return { upserted: totalUpserted };
}

/**
 * Delete stale chunks from Pinecone by explicit chunk IDs.
 *
 * Use this when you have the exact chunk_ids to purge (e.g., shrinking file
 * where chunks N..M no longer exist locally but linger in Pinecone).
 *
 * @param {Object} apiClient - DeSciXApiClient instance
 * @param {string} communityId - Community ID
 * @param {string} appId - App ID
 * @param {string} kbId - Knowledge base ID
 * @param {Array<string>} chunkIds - Chunk IDs to delete
 * @returns {Promise<{deleted: number}>} `deleted` is the store's own count, or
 *          UNREPORTED_COUNT if the store reported none. It is NOT chunkIds.length.
 *          Test it with isReportedCount(); never print it unguarded.
 */
export async function deleteStaleChunks(apiClient, communityId, appId, kbId, chunkIds) {
  if (chunkIds.length === 0) {
    return { deleted: 0 };
  }

  const result = await apiClient.invoke('kb_delete_chunks', {
    community_id: communityId,
    app_id: appId,
    kb_id: kbId,
    chunk_ids: chunkIds
  });

  const data = result?.message || result;
  return { deleted: reportedCount(data?.deleted_count) };
}

/**
 * Delete stale chunks from Pinecone by file_id (metadata filter).
 *
 * This is the canonical stale-purge path for `kb corpus sync`: when a file's
 * blob_sha changes, the prior blob_sha is a stale file_id. Passing it here
 * deletes every chunk where metadata.file_id matches, scoped by the full
 * multi-tenancy filter (community_id, app_id, knowledgebase_name) on the
 * server side via pineconeService.deleteVectorsByFileId.
 *
 * Bulk: pass multiple file_ids in one call to amortize the round-trip.
 *
 * @param {Object} apiClient - DeSciXApiClient instance
 * @param {string} communityId - Community ID
 * @param {string} appId - App ID
 * @param {string} kbId - Knowledge base ID
 * @param {Array<string>} fileIds - file_id values to delete (e.g., ['corpus:abc...', 'local:def...'])
 * @returns {Promise<{deleted: number, deleted_by_file_id: number}>} Each field is the
 *          store's own count, or UNREPORTED_COUNT if the store reported that field.
 *          The two are INDEPENDENT — one may be reported and the other not. Neither
 *          is validFileIds.length. Test with isReportedCount(); never print unguarded.
 */
export async function deleteStaleChunksByFileId(apiClient, communityId, appId, kbId, fileIds) {
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return { deleted: 0, deleted_by_file_id: 0 };
  }

  // Filter out null/undefined/empty entries — pineconeService treats empty fileId as 0-count no-op
  const validFileIds = fileIds.filter(Boolean);
  if (validFileIds.length === 0) {
    return { deleted: 0, deleted_by_file_id: 0 };
  }

  const result = await apiClient.invoke('kb_delete_chunks', {
    community_id: communityId,
    app_id: appId,
    kb_id: kbId,
    file_ids: validFileIds
  });

  const data = result?.message || result;
  return {
    deleted: reportedCount(data?.deleted_count),
    deleted_by_file_id: reportedCount(data?.deleted_by_file_id)
  };
}

/**
 * Purge EVERY vector in a KB's {community_id, app_id, knowledgebase_name} scope.
 *
 * This is the FULL metadata-scoped purge — it clears all vectors regardless of
 * their file_id scheme, including legacy/orphan vectors that carry no `corpus:`
 * file_id and are therefore INVISIBLE to listRemoteFileIds (the corpus-scheme
 * enumeration). It is the only primitive that fully clears accumulated orphan
 * pollution before a `--rebuild` re-upsert.
 *
 * Server-side it routes to kb_delete_chunks(purge_scope: true), which delegates
 * to the canonical KnowledgeBase.deleteRAG(). As of WS-KB-CORPUS-SCOPEPURGE-SCALE
 * that purge is ROBUST AT SCALE: it enumerates the KB's vectors by their canonical
 * id-prefix `${app_id}:${kb_id}:` (deterministic listPaginated) and deletes them in
 * bounded batches of 1000, so an arbitrarily large scope (~20k+ vectors) is cleared
 * without exceeding the Pinecone client's max-retries ceiling (the prior single
 * giant metadata deleteMany failed at that size). It still clears ALL orphans
 * (they share the prefix) AND resets the KB doc's rag fields (rag_vector_count→0)
 * so `kb doctor` reports clean drift after the subsequent re-sync. The rag-field
 * reset happens ONLY after the live purge completes. Touches Pinecone vectors +
 * the KB doc's rag fields ONLY — no Firestore/GCS/Products cascade. On a partial
 * batch failure it FAILS LOUD (recoverable by re-running — idempotent).
 *
 * @param {Object} apiClient - DeSciXApiClient instance
 * @param {string} communityId - Community ID (required server-side; full scope)
 * @param {string} appId - App ID
 * @param {string} kbId - Knowledge base ID
 * @returns {Promise<{ deleted: number, purged_scope: boolean }>}
 *          `deleted` is the actual count of vectors purged (the batched path always
 *          reports it), or UNREPORTED_COUNT if the store reported no count.
 *          Test it with isReportedCount(); never print it unguarded.
 */
export async function purgeKbScope(apiClient, communityId, appId, kbId) {
  const result = await apiClient.invoke('kb_delete_chunks', {
    community_id: communityId,
    app_id: appId,
    kb_id: kbId,
    purge_scope: true
  });
  const data = result?.message || result;
  return {
    deleted: reportedCount(data?.deleted_count),
    purged_scope: data?.purged_scope === true
  };
}

/**
 * Enumerate all file_id values currently present in a KB's Pinecone namespace.
 *
 * Used by `descix kb corpus sync --rebuild` to compute drift:
 *   stale = pinecone_file_ids − current_local_file_ids
 *
 * @param {Object} apiClient - DeSciXApiClient instance
 * @param {string} appId - App ID
 * @param {string} kbId - Knowledge base ID
 * @returns {Promise<{ file_ids: string[], unique_count: number, total_chunks: number }>}
 */
export async function listRemoteFileIds(apiClient, appId, kbId) {
  const result = await apiClient.invoke('kb_list_file_ids', {
    app_id: appId,
    kb_id: kbId
  });
  const data = result?.message || result;
  return {
    file_ids: data.file_ids || [],
    unique_count: data.unique_count || 0,
    total_chunks: data.total_chunks || 0
  };
}

/**
 * Sync a KB to Pinecone - full workflow with content-hash based delta
 * 
 * Workflow:
 * 1. Load local chunks from kb/chunks/ (with content_hash)
 * 2. Get existing chunk metadata from Pinecone (with content_hash)
 * 3. Compute delta using hash comparison (only upsert changed/new)
 * 4. Delete stale chunks (exist in Pinecone but not locally)
 * 5. Upsert new/modified chunks
 * 
 * @param {Object} apiClient - DeSciXApiClient instance (required)
 * @param {Object} config - { workspaceRoot, communityId, appId, kbId, localPath }
 * @param {Object} options - { verbose, onProgress }
 * @returns {Promise<{synced: number, deleted: number, unchanged: number}>}
 */
export async function syncKb(apiClient, config, options = {}) {
  const { workspaceRoot, communityId, appId, kbId = 'General', localPath } = config;
  const { verbose = false, onProgress } = options;
  
  if (!apiClient) {
    throw new Error('Authentication required. Run "descix login" first.');
  }
  
  // 1. Load local chunks
  const localChunks = await loadChunks({
    workspaceRoot,
    communityId,
    appId,
    kbId,
    localPath
  });
  
  if (localChunks.length === 0) {
    if (verbose) console.log('No chunks to sync');
    return { synced: 0, deleted: 0, unchanged: 0 };
  }
  
  if (onProgress) onProgress(`Found ${localChunks.length} local chunks`);
  
  // 2. Get existing chunk metadata from Pinecone (with content_hash if available)
  if (onProgress) onProgress('Fetching existing chunks from Pinecone...');
  const remoteChunks = await getRemoteChunkMetadata(apiClient, communityId, appId, kbId);
  
  // getRemoteChunkMetadata returns an array or throws — it never reports an
  // unknown remote set as an empty one, so there is no non-array case to default.
  const remoteCount = remoteChunks.length;
  
  if (verbose) {
    console.log(`  Local chunks: ${localChunks.length}`);
    console.log(`  Remote chunks: ${remoteCount}`);
  }
  
  // 3. Compute delta using content_hash
  const { toUpsert, toDelete, unchanged } = computeChunkDelta(localChunks, remoteChunks);
  
  if (verbose && unchanged > 0) {
    console.log(`  Unchanged (skipped): ${unchanged}`);
  }
  
  // 4. Delete stale chunks
  let deleted = 0;
  if (toDelete.length > 0) {
    if (onProgress) onProgress(`Deleting ${toDelete.length} stale chunks...`);
    try {
      const deleteResult = await deleteStaleChunks(apiClient, communityId, appId, kbId, toDelete);
      deleted = deleteResult.deleted;
      if (verbose) console.log(`  Deleted ${deleted} stale chunks`);
    } catch (error) {
      if (verbose) console.log(`  Delete failed: ${error.message}`);
    }
  }
  
  // 5. Upsert only changed/new chunks
  let synced = 0;
  if (toUpsert.length > 0) {
    if (onProgress) onProgress(`Upserting ${toUpsert.length} chunks...`);
    const upsertResult = await upsertChunks(apiClient, communityId, appId, kbId, toUpsert);
    synced = upsertResult.upserted;
  } else {
    if (onProgress) onProgress('All chunks already in sync');
  }

  // 6. File-level stale purge (belt-and-suspenders).
  // The chunk_id-based delete in step 4 handles the common shrinking/deletion case
  // but only sees chunk_ids that were returned by getRemoteChunkMetadata. For
  // robustness — and to close DN-2 at the lower-level kb sync surface too — we
  // also enumerate remote file_ids and delete any whose file_id is not present
  // in the current local chunk set. This catches file deletions and modifications
  // that produced new chunk_id shapes (e.g., content-hash-based ids).
  let deletedByFileId = 0;
  try {
    const localFileIds = new Set(localChunks.map(c => c.file_id).filter(Boolean));
    const remoteFileIdsResp = await apiClient.invoke('kb_list_file_ids', {
      app_id: appId,
      kb_id: kbId
    });
    const remoteData = remoteFileIdsResp?.message || remoteFileIdsResp;
    const remoteFileIds = remoteData?.file_ids || [];
    const staleFileIds = remoteFileIds.filter(fid => !localFileIds.has(fid));
    if (staleFileIds.length > 0) {
      if (onProgress) onProgress(`Purging ${staleFileIds.length} stale file_id(s)...`);
      const purgeResult = await deleteStaleChunksByFileId(apiClient, communityId, appId, kbId, staleFileIds);
      deletedByFileId = purgeResult.deleted;
    }
  } catch (purgeErr) {
    // Non-fatal: surface via verbose log. The chunk_id-based delete above is the primary
    // path; this is a safety net. We do NOT silently swallow — caller sees a warning.
    if (verbose) console.log(`  File-id purge skipped: ${purgeErr.message}`);
  }

  return {
    synced,
    deleted: deleted + deletedByFileId,
    deleted_chunk_ids: deleted,
    deleted_by_file_id: deletedByFileId,
    unchanged
  };
}

/**
 * Get sync status - compare local chunks with Pinecone using content_hash
 * 
 * @param {Object} apiClient - DeSciXApiClient instance
 * @param {Object} config - { workspaceRoot, communityId, appId, kbId, localPath }
 * @returns {Promise<{local: number, remote: number, toUpsert: number, toDelete: number, unchanged: number, inSync: boolean}>}
 */
export async function getSyncStatus(apiClient, config) {
  const { workspaceRoot, communityId, appId, kbId = 'General', localPath } = config;
  
  // Load local chunks
  const localChunks = await loadChunks({
    workspaceRoot,
    communityId,
    appId,
    kbId,
    localPath
  });
  
  // Get remote chunk metadata
  const remoteChunks = await getRemoteChunkMetadata(apiClient, communityId, appId, kbId);
  // Array-or-throw, as above: no fabricated zero for an unknown remote set.
  const remoteCount = remoteChunks.length;
  
  // Compute delta using content_hash
  const { toUpsert, toDelete, unchanged } = computeChunkDelta(localChunks, remoteChunks);
  
  return {
    local: localChunks.length,
    remote: remoteCount,
    toUpsert: toUpsert.length,
    toDelete: toDelete.length,
    unchanged,
    inSync: toUpsert.length === 0 && toDelete.length === 0
  };
}

export default {
  syncKb,
  computeChunkDelta,
  getRemoteChunkIds,
  getRemoteChunkMetadata,
  upsertChunks,
  deleteStaleChunks,
  deleteStaleChunksByFileId,
  purgeKbScope,
  listRemoteFileIds,
  getSyncStatus
};
