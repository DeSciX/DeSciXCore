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
 * Get existing chunk metadata from Pinecone (with content_hash for delta)
 * Falls back to IDs-only if metadata endpoint not available.
 * 
 * @param {Object} apiClient - DeSciXApiClient instance
 * @param {string} communityId - Community ID
 * @param {string} appId - App ID
 * @param {string} kbId - Knowledge base ID
 * @returns {Promise<Array<{id: string, content_hash: string}>>} Chunk metadata
 */
export async function getRemoteChunkMetadata(apiClient, communityId, appId, kbId) {
  try {
    // Try new metadata endpoint first
    const result = await apiClient.invoke('kb_get_chunk_metadata', {
      app_id: appId,
      kb_id: kbId
    });
    return result.chunks || [];
  } catch (error) {
    // Fall back to IDs-only endpoint
    try {
      const result = await apiClient.invoke('kb_get_chunk_ids', {
        app_id: appId,
        kb_id: kbId
      });
      // Return as array of IDs (old format) for backward compatibility
      return result.chunk_ids || [];
    } catch {
      return [];
    }
  }
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
 * @returns {Promise<{upserted: number}>}
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
    totalUpserted += result.upserted_count || batch.length;
  }

  return { upserted: totalUpserted };
}

/**
 * Delete stale chunks from Pinecone
 * 
 * @param {Object} apiClient - DeSciXApiClient instance
 * @param {string} communityId - Community ID
 * @param {string} appId - App ID
 * @param {string} kbId - Knowledge base ID
 * @param {Array<string>} chunkIds - Chunk IDs to delete
 * @returns {Promise<{deleted: number}>}
 */
export async function deleteStaleChunks(apiClient, communityId, appId, kbId, chunkIds) {
  if (chunkIds.length === 0) {
    return { deleted: 0 };
  }
  
  await apiClient.invoke('kb_delete_chunks', {
    app_id: appId,
    kb_id: kbId,
    chunk_ids: chunkIds
  });
  
  return { deleted: chunkIds.length };
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
  
  const remoteCount = Array.isArray(remoteChunks) 
    ? remoteChunks.length 
    : 0;
  
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
  
  return {
    synced,
    deleted,
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
  const remoteCount = Array.isArray(remoteChunks) ? remoteChunks.length : 0;
  
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
  getSyncStatus
};
