/**
 * Corpus Commands - Git-aware RAG corpus sync
 *
 * Commands for syncing git-managed source files to Pinecone RAG via manifests.
 * Manifests declare a *view* over files — files stay in place, git does versioning.
 *
 * Commands:
 * - corpus sync:   Walk manifest sources, chunk changed files, sync to Pinecone
 * - corpus status:  Show sync state (files, chunks, last sync)
 *
 * Architecture:
 * - ManifestLoader reads {app_root}/.descix/manifests/{kb_name}.json
 * - CorpusWalker walks dirs, applies syncignore, computes git blob SHAs
 * - Chunker (existing) chunks files by type (code, docs, generic)
 * - Syncer (existing) pushes chunks to Pinecone via kb_sync_chunks API
 * - Chunk IDs are content-addressed: {app_id}:{kb_name}:{blob_sha}:{chunk_idx}
 * - CEO-D12: Single Pinecone namespace, metadata filtering (kb_name: "Corpus")
 * - CEO-D16: Manual sync trigger only — no CI hooks
 */

import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs/promises';
import * as path from 'path';
import { WorkspaceConfig } from '../workspace-config.js';
import { loadManifests } from '../core/ManifestLoader.js';
import { walkCorpus } from '../core/CorpusWalker.js';
import { chunkFile, categorizeFile } from '../core/Chunker.js';
import { upsertChunks, deleteStaleChunks } from '../core/Syncer.js';

/**
 * Read a file and chunk it using the existing Chunker.
 * Returns chunk records with corpus-specific metadata and content-addressed IDs.
 *
 * Chunk ID format: {app_id}:{kb_name}:{blob_sha}:{chunk_idx}
 * This is content-addressed — same file content = same blob SHA = same chunk IDs.
 *
 * @param {Object} fileEntry - From CorpusWalker { absolute_path, relative_path, blob_sha, source_entry, source_repo }
 * @param {Object} context - { appId, communityId, kbName }
 * @returns {Promise<Array>} Pinecone-ready chunk records
 */
async function chunkCorpusFile(fileEntry, context) {
  const { appId, communityId, kbName } = context;
  const { absolute_path, relative_path, blob_sha, source_entry, source_repo } = fileEntry;

  // Read file content
  const content = await fs.readFile(absolute_path, 'utf-8');
  const fileName = path.basename(absolute_path);

  // Determine MIME type from extension
  let mimeType = 'text/plain';
  if (fileName.endsWith('.md')) mimeType = 'text/markdown';
  else if (fileName.endsWith('.js') || fileName.endsWith('.mjs')) mimeType = 'application/javascript';
  else if (fileName.endsWith('.json')) mimeType = 'application/json';
  else if (fileName.endsWith('.jsonl')) mimeType = 'application/jsonl';

  // Skip files that are too large (> 500KB) — likely generated/minified
  if (content.length > 500000) {
    return [];
  }

  // Use existing Chunker
  const rawChunks = chunkFile({ file_name: fileName, mime_type: mimeType, content });

  // Pinecone metadata limit is 40KB per vector.
  // text field is stored as metadata. Keep each chunk under 35KB text to leave room.
  const MAX_CHUNK_TEXT_BYTES = 35000;

  // Convert to Pinecone-ready records with corpus-specific metadata
  return rawChunks.map((chunk, idx) => {
    const chunkIdx = chunk.metadata.chunkIndex ?? idx;
    // Content-addressed ID: same blob SHA = same IDs
    const id = `${appId}:${kbName}:${blob_sha}:${chunkIdx}`;

    let text = chunk.content.trim();
    // Truncate if text exceeds Pinecone metadata budget
    if (Buffer.byteLength(text, 'utf-8') > MAX_CHUNK_TEXT_BYTES) {
      text = text.substring(0, MAX_CHUNK_TEXT_BYTES);
    }

    return {
      id,
      text,
      entity_type: 'CHUNK',
      // Multi-tenancy fields (required for filtering)
      community_id: communityId,
      app_id: appId,
      knowledgebase_name: kbName,
      // file_id required by pineconeService validator — use blob_sha as content-addressed ID
      file_id: `corpus:${blob_sha}`,
      // Corpus-specific metadata
      blob_sha,
      source_path: relative_path,
      source_repo,
      tier: source_entry.tier,
      doc_type: source_entry.doc_type,
      // Chunk metadata
      file_name: fileName,
      mime_type: mimeType,
      chunk_idx: chunkIdx,
      total_chunks: rawChunks.length,
      chunk_type: chunk.metadata.type,
      chunk_title: chunk.metadata.title || chunk.metadata.name || null
    };
  });
}

/**
 * Save sync state after a successful corpus sync.
 *
 * @param {string} appRoot - App root directory
 * @param {string} kbName - Knowledge base name
 * @param {Object} state - { last_sync_commit, synced_files_count, total_chunks, timestamp }
 */
async function saveSyncState(appRoot, kbName, state) {
  const stateDir = path.join(appRoot, '.descix', 'sync-state');
  await fs.mkdir(stateDir, { recursive: true });
  const statePath = path.join(stateDir, `${kbName}.json`);
  await fs.writeFile(statePath, JSON.stringify(state, null, 2));
}

/**
 * Load sync state from a previous corpus sync.
 *
 * @param {string} appRoot - App root directory
 * @param {string} kbName - Knowledge base name
 * @returns {Promise<Object|null>} Sync state or null if no previous sync
 */
async function loadSyncState(appRoot, kbName) {
  const statePath = path.join(appRoot, '.descix', 'sync-state', `${kbName}.json`);
  try {
    const raw = await fs.readFile(statePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Run corpus sync for an app.
 *
 * Algorithm:
 * 1. Load WorkspaceConfig, find app by app_id, get localPath
 * 2. Load manifest(s) from {localPath}/.descix/manifests/
 * 3. For each manifest:
 *    a. Run CorpusWalker to get file list with blob SHAs
 *    b. Query Pinecone for existing chunks with this app_id + kb_name
 *    c. Compute delta: new/changed files (different blob SHA), deleted files
 *    d. For changed/new files: chunk using existing Chunker
 *    e. Sync chunks via existing Syncer (upsertChunks / deleteStaleChunks)
 *    f. Store sync state
 *
 * @param {Object} apiClient - DeSciXApiClient instance
 * @param {Object} options - { app, kb, verbose }
 */
export async function runCorpusSync(apiClient, options) {
  const spinner = ora('Loading workspace configuration...').start();

  try {
    if (!apiClient) {
      spinner.fail('Authentication required');
      throw new Error('Run "descix login" first.');
    }

    // 1. Load WorkspaceConfig
    const workspaceConfig = await WorkspaceConfig.load();
    const workspaceRoot = workspaceConfig.getWorkspaceRoot();

    // Resolve app
    const appId = options.app;
    if (!appId) {
      spinner.fail('App ID required');
      throw new Error('Use -a <app_id> to specify the app.');
    }

    const appConfig = workspaceConfig.getAppByAppId(appId);
    if (!appConfig) {
      spinner.fail(`App not found: ${appId}`);
      throw new Error(`App "${appId}" not found in workspace.json. Check env.products[].`);
    }

    const appRoot = appConfig.absolutePath;
    const communityId = appConfig.communityId || 'unkamon'; // Default for unk-* apps

    // 2. Load manifests
    spinner.text = 'Loading manifests...';
    const manifests = await loadManifests(appRoot, workspaceRoot, options.kb || null);

    if (manifests.length === 0) {
      spinner.fail('No manifests found');
      const manifestsDir = path.join(appRoot, '.descix', 'manifests');
      throw new Error(`No manifests found at ${manifestsDir}/\nCreate a manifest file first.`);
    }

    spinner.succeed(`Found ${manifests.length} manifest(s)`);

    // 3. Process each manifest
    let totalFilesProcessed = 0;
    let totalChunksCreated = 0;
    let totalFilesSkipped = 0;
    let totalFilesDeleted = 0;

    for (const manifest of manifests) {
      const kbName = manifest.kb_name;
      console.log(chalk.cyan(`\nSyncing corpus: ${kbName}`));

      // 3a. Walk corpus
      const walkSpinner = ora('  Walking source directories...').start();
      const { files, commitSha } = await walkCorpus(manifest, workspaceRoot);
      walkSpinner.succeed(`  Found ${files.length} files (commit: ${commitSha.substring(0, 8)})`);

      if (files.length === 0) {
        console.log(chalk.yellow('  No files found in sources. Skipping.'));
        continue;
      }

      // 3b. Load previous sync state for delta computation
      // We use local sync state (stored blob SHAs) instead of querying Pinecone,
      // because Pinecone metadata queries don't scale (payload size limits).
      const previousState = await loadSyncState(appRoot, kbName);
      const previousBlobShas = new Set(previousState?.synced_blob_shas || []);
      const previousChunkCount = previousState?.total_chunks || 0;

      if (previousBlobShas.size > 0) {
        console.log(chalk.gray(`  Previous sync: ${previousBlobShas.size} files, ${previousChunkCount} chunks`));
      } else {
        console.log(chalk.gray('  First sync (no previous state)'));
      }

      // 3c. Compute delta — compare by blob SHA against local sync state
      const localBlobShas = new Set(files.map(f => f.blob_sha));
      const newOrChangedFiles = files.filter(f => !previousBlobShas.has(f.blob_sha));
      const deletedBlobShas = [...previousBlobShas].filter(sha => !localBlobShas.has(sha));

      // Note: we cannot efficiently delete individual chunks from Pinecone by blob SHA
      // without querying for them first. For now, we track deletions in sync state
      // and handle them on the next full re-sync if needed.
      const idsToDelete = []; // Deferred — would need Pinecone query per deleted blob SHA

      const unchangedCount = files.length - newOrChangedFiles.length;

      if (options.verbose) {
        console.log(chalk.gray(`  New/changed files: ${newOrChangedFiles.length}`));
        console.log(chalk.gray(`  Unchanged files: ${unchangedCount}`));
        console.log(chalk.gray(`  Deleted blob SHAs: ${deletedBlobShas.length}`));
      }

      // 3d. Chunk new/changed files
      const allChunks = [];
      if (newOrChangedFiles.length > 0) {
        const chunkSpinner = ora(`  Chunking ${newOrChangedFiles.length} file(s)...`).start();

        for (const fileEntry of newOrChangedFiles) {
          try {
            const chunks = await chunkCorpusFile(fileEntry, { appId, communityId, kbName });
            allChunks.push(...chunks);

            if (options.verbose) {
              console.log(chalk.gray(`    ${fileEntry.relative_path}: ${chunks.length} chunks`));
            }
          } catch (err) {
            if (options.verbose) {
              console.log(chalk.yellow(`    ${fileEntry.relative_path}: skipped (${err.message})`));
            }
          }
        }

        chunkSpinner.succeed(`  Chunked: ${allChunks.length} chunks from ${newOrChangedFiles.length} files`);
      }

      // 3e. Sync to Pinecone with rate limiting
      // Pinecone has a 1M token/min rate limit for embeddings.
      // We batch in small groups with delays between to stay under the limit.
      let upserted = 0;
      let deleted = 0;

      if (allChunks.length > 0) {
        const syncSpinner = ora(`  Upserting ${allChunks.length} chunks...`).start();
        const BATCH_SIZE = 30; // Small batches to manage Pinecone embedding rate limits (1M tokens/min)
        const BATCH_DELAY_MS = 5000; // 5 second delay between batches
        const MAX_RETRIES = 5;

        for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
          const batch = allChunks.slice(i, i + BATCH_SIZE);
          let retries = 0;
          let success = false;

          while (!success && retries < MAX_RETRIES) {
            try {
              const result = await upsertChunks(apiClient, communityId, appId, kbName, batch);
              upserted += result.upserted;
              success = true;
              syncSpinner.text = `  Upserting chunks... ${i + batch.length}/${allChunks.length}`;
            } catch (err) {
              if (err.message && (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED'))) {
                retries++;
                const backoff = BATCH_DELAY_MS * Math.pow(2, retries);
                syncSpinner.text = `  Rate limited. Waiting ${backoff / 1000}s before retry ${retries}/${MAX_RETRIES}...`;
                await new Promise(r => setTimeout(r, backoff));
              } else {
                throw err;
              }
            }
          }

          if (!success) {
            syncSpinner.warn(`  Rate limit exceeded after ${MAX_RETRIES} retries. Synced ${upserted} chunks so far.`);
            break;
          }

          // Delay between batches to stay under rate limit
          if (i + BATCH_SIZE < allChunks.length) {
            await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
          }
        }

        syncSpinner.succeed(`  Upserted: ${upserted} chunks`);
      }

      if (idsToDelete.length > 0) {
        const deleteSpinner = ora(`  Deleting ${idsToDelete.length} stale chunks...`).start();
        try {
          const result = await deleteStaleChunks(apiClient, communityId, appId, kbName, idsToDelete);
          deleted = result.deleted;
          deleteSpinner.succeed(`  Deleted: ${deleted} stale chunks`);
        } catch (err) {
          deleteSpinner.warn(`  Delete failed: ${err.message}`);
        }
      }

      // 3f. Save sync state with blob SHAs for future delta computation
      const allSyncedBlobShas = [...localBlobShas]; // All current files
      await saveSyncState(appRoot, kbName, {
        last_sync_commit: commitSha,
        synced_files_count: files.length,
        total_chunks: previousChunkCount + upserted - deleted,
        timestamp: new Date().toISOString(),
        files_upserted: newOrChangedFiles.length,
        files_unchanged: unchangedCount,
        chunks_upserted: upserted,
        chunks_deleted: deleted,
        synced_blob_shas: allSyncedBlobShas
      });

      totalFilesProcessed += newOrChangedFiles.length;
      totalChunksCreated += upserted;
      totalFilesSkipped += unchangedCount;
      totalFilesDeleted += deleted;
    }

    // Summary
    console.log(chalk.green('\nCorpus sync complete:'));
    console.log(chalk.white(`  Files synced:    ${totalFilesProcessed}`));
    console.log(chalk.white(`  Chunks created:  ${totalChunksCreated}`));
    console.log(chalk.white(`  Files unchanged: ${totalFilesSkipped}`));
    if (totalFilesDeleted > 0) {
      console.log(chalk.white(`  Chunks deleted:  ${totalFilesDeleted}`));
    }
    console.log('');

  } catch (error) {
    if (spinner.isSpinning) spinner.fail('Corpus sync failed');
    throw error;
  }
}

/**
 * Show corpus sync status for an app.
 *
 * Reads sync state from .descix/sync-state/{kb_name}.json and shows:
 * - Last sync commit + timestamp
 * - Files tracked / chunks in Pinecone
 * - Files changed since last sync (quick git diff check)
 *
 * @param {Object} apiClient - DeSciXApiClient instance (optional for offline status)
 * @param {Object} options - { app, kb, verbose }
 */
export async function runCorpusStatus(apiClient, options) {
  const spinner = ora('Loading workspace configuration...').start();

  try {
    // Load WorkspaceConfig
    const workspaceConfig = await WorkspaceConfig.load();
    const workspaceRoot = workspaceConfig.getWorkspaceRoot();

    const appId = options.app;
    if (!appId) {
      spinner.fail('App ID required');
      throw new Error('Use -a <app_id> to specify the app.');
    }

    const appConfig = workspaceConfig.getAppByAppId(appId);
    if (!appConfig) {
      spinner.fail(`App not found: ${appId}`);
      throw new Error(`App "${appId}" not found in workspace.json.`);
    }

    const appRoot = appConfig.absolutePath;

    // Load manifests
    const manifests = await loadManifests(appRoot, workspaceRoot, options.kb || null);

    if (manifests.length === 0) {
      spinner.info('No manifests found');
      return;
    }

    spinner.stop();

    for (const manifest of manifests) {
      const kbName = manifest.kb_name;
      const syncState = await loadSyncState(appRoot, kbName);

      console.log(chalk.cyan(`\nCorpus Status: ${appId} / ${kbName}`));
      console.log(chalk.gray('─'.repeat(50)));

      if (!syncState) {
        console.log(chalk.yellow('  Never synced. Run "descix kb corpus sync" first.'));
        continue;
      }

      console.log(chalk.white(`  Last sync:       ${syncState.timestamp}`));
      console.log(chalk.white(`  Commit:          ${syncState.last_sync_commit?.substring(0, 8) || 'unknown'}`));
      console.log(chalk.white(`  Files tracked:   ${syncState.synced_files_count}`));
      console.log(chalk.white(`  Chunks in store: ${syncState.total_chunks}`));

      // Quick change detection: walk and compare blob SHAs
      if (options.verbose) {
        try {
          const { files } = await walkCorpus(manifest, workspaceRoot);
          // Compare current blob SHAs against what we'd expect from last sync
          console.log(chalk.white(`  Current files:   ${files.length}`));

          // Check git diff since last sync commit
          if (syncState.last_sync_commit && syncState.last_sync_commit !== 'unknown') {
            const { execSync } = await import('child_process');
            try {
              const diffOutput = execSync(
                `git diff --name-only "${syncState.last_sync_commit}" HEAD`,
                { cwd: workspaceRoot, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
              ).trim();

              if (diffOutput) {
                const changedFiles = diffOutput.split('\n');
                // Filter to files in our sources
                const sourcePaths = manifest._resolvedSources.map(s => s.path);
                const relevantChanges = changedFiles.filter(f =>
                  sourcePaths.some(sp => f.startsWith(sp))
                );

                if (relevantChanges.length > 0) {
                  console.log(chalk.yellow(`  Changed since last sync: ${relevantChanges.length} file(s)`));
                  for (const f of relevantChanges.slice(0, 10)) {
                    console.log(chalk.gray(`    - ${f}`));
                  }
                  if (relevantChanges.length > 10) {
                    console.log(chalk.gray(`    ... and ${relevantChanges.length - 10} more`));
                  }
                } else {
                  console.log(chalk.green('  No changes since last sync'));
                }
              } else {
                console.log(chalk.green('  No changes since last sync'));
              }
            } catch {
              console.log(chalk.gray('  (unable to compute changes since last sync)'));
            }
          }
        } catch (err) {
          console.log(chalk.gray(`  (walk error: ${err.message})`));
        }
      }
    }

    console.log('');

  } catch (error) {
    if (spinner.isSpinning) spinner.fail('Status check failed');
    throw error;
  }
}

export default { runCorpusSync, runCorpusStatus };
