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
import { createRequire } from 'module';
import { WorkspaceConfig } from '../workspace-config.js';
import { loadManifests } from '../core/ManifestLoader.js';
import { walkCorpus } from '../core/CorpusWalker.js';
import { chunkFile, categorizeFile } from '../core/Chunker.js';
import { upsertChunks, deleteStaleChunks, deleteStaleChunksByFileId, listRemoteFileIds, purgeKbScope } from '../core/Syncer.js';
import { lintManifestForDenyClasses, assertNoViolations } from '../core/CorpusDenyLint.js';

/**
 * Resolve community_id for corpus sync — same precedence as site upload / update kb:
 * CLI -c > workspace.json > Products registry (get_product_context). No hardcoded defaults.
 */
async function resolveCorpusCommunityId(apiClient, workspaceConfig, appId, options) {
  const ctx = workspaceConfig.resolveContextWithOptions(options);
  const appConfig = workspaceConfig.getAppByAppId(appId);
  let communityId = ctx.communityId || appConfig?.communityId || null;

  if (!communityId) {
    const productCtx = await apiClient.invoke('get_product_context', { app_id: appId });
    communityId = productCtx?.community_id ?? productCtx?.message?.community_id ?? null;
  }

  if (!communityId) {
    throw new Error(
      `Could not resolve community_id for app "${appId}".\n` +
      `Pass -c <community_id> or ensure Products/${appId} is registered (bootstrap / descix app init).`
    );
  }

  return communityId;
}

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

  // Skip empty files — they produce chunks with no text which fails validation
  if (!content || content.trim().length === 0) {
    return [];
  }

  // M1 (2026-04-20): the 500KB silent-drop cap was removed after it was found
  // to be the proximate cause of 77% of EGPT's concordance content missing from
  // Pinecone. The Chunker now handles large files via content-aware splitting
  // (structured-json / JS object-literal extraction / line-aware sliding window).
  // A generous sanity cap protects against accidentally ingesting minified
  // bundles or binary blobs that slipped past the manifest walker.
  const MAX_SRC_BYTES = 20 * 1024 * 1024; // 20MB: anything bigger should be excluded in the manifest
  if (content.length > MAX_SRC_BYTES) {
    console.warn(`    ⚠ Skipping ${fileName}: ${content.length} bytes exceeds ${MAX_SRC_BYTES} sanity cap. Exclude via manifest syncignore.`);
    return [];
  }

  // Use existing Chunker
  const rawChunks = chunkFile({ file_name: fileName, mime_type: mimeType, content });

  // Pinecone metadata limit is 40KB per vector.
  // text field is stored as metadata. Keep each chunk under 35KB text to leave room.
  const MAX_CHUNK_TEXT_BYTES = 35000;

  // Convert to Pinecone-ready records with corpus-specific metadata
  // Filter out any chunks with empty text (safety net for edge cases)
  return rawChunks.map((chunk, idx) => {
    const chunkIdx = chunk.metadata.chunkIndex ?? idx;
    // Content-addressed ID: same blob SHA = same IDs
    const id = `${appId}:${kbName}:${blob_sha}:${chunkIdx}`;

    let text = chunk.content.trim();
    // Truncate if text exceeds Pinecone metadata budget
    if (Buffer.byteLength(text, 'utf-8') > MAX_CHUNK_TEXT_BYTES) {
      text = text.substring(0, MAX_CHUNK_TEXT_BYTES);
    }

    if (!text) return null; // Skip empty chunks

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
      // KB-curation metadata — rides into Pinecone so query surfaces can
      // default-filter to publishable doc_classes and surface provenance.
      doc_class: source_entry.doc_class,
      license_basis: source_entry.license_basis,
      synced_from_edit: source_entry.synced_from_edit,
      // Chunk metadata
      file_name: fileName,
      mime_type: mimeType,
      chunk_idx: chunkIdx,
      total_chunks: rawChunks.length,
      chunk_type: chunk.metadata.type,
      chunk_title: chunk.metadata.title || chunk.metadata.name || null
    };
  }).filter(Boolean);
}

/**
 * Save sync state after a successful corpus sync.
 *
 * @param {string} appRoot - App root directory
 * @param {string} kbName - Knowledge base name
 * @param {Object} state - { last_sync_commit, sources_provenance, synced_files_count, total_chunks, timestamp }
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
 * Detect the current git branch in workspaceRoot.
 * Returns the branch name (e.g., "ws-admin-b1") or null if detached / not a repo.
 *
 * Used by `corpus sync` to emit a one-line advisory when the operator is on a
 * non-main branch and --ref was not provided — flags the silent "synced main
 * not your branch" gotcha that surfaced in WS-CLI-MANIFEST-REF-FEATURE-BRANCH.
 */
function getCurrentBranch(workspaceRoot) {
  // Lazy-require child_process via createRequire — corpus.js is ESM and lacks
  // a synchronous import path, but execSync is itself sync and we want to
  // avoid making the advisory async (it runs once before the manifest loop).
  try {
    // eslint-disable-next-line no-undef
    const requireFn = createRequire(import.meta.url);
    const { execSync } = requireFn('child_process');
    const branch = execSync('git symbolic-ref --short HEAD', {
      cwd: workspaceRoot, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    return branch || null;
  } catch {
    // detached HEAD, no git repo, or git not installed — advisory is skipped
    return null;
  }
}

/**
 * Resolve the ref each manifest source should be walked at.
 *
 * Precedence (highest first):
 *   1. CLI --ref flag (applies to all sources globally — explicit operator override).
 *   2. Per-source manifest "ref" field, if explicitly set in the JSON.
 *   3. ManifestLoader default "main".
 *
 * Returns a NEW manifest object (does not mutate the input) with each
 * _resolvedSources[i].ref rewritten when --ref is supplied.
 *
 * Also returns metadata about the resolution so the sync output can name the
 * ref used and so the status command can report it.
 *
 * @param {Object} manifest - Validated manifest from ManifestLoader
 * @param {string|null} cliRef - Operator's --ref override, or null
 * @returns {{ manifest: Object, resolvedRef: string, source: 'cli'|'manifest'|'default', allDefault: boolean }}
 */
function resolveRef(manifest, cliRef) {
  // Detect whether every source uses the ManifestLoader default ("main") with
  // no explicit override in the JSON. We can't see the raw JSON here, so we
  // compare against the default. ManifestLoader rewrites src.ref to "main" if
  // missing, so an explicit "main" in JSON is indistinguishable from default —
  // intentional: the advisory triggers in both cases.
  const allDefault = manifest._resolvedSources.every(s => s.ref === 'main');

  if (cliRef) {
    const rewritten = manifest._resolvedSources.map(s => ({ ...s, ref: cliRef }));
    return {
      manifest: { ...manifest, _resolvedSources: rewritten },
      resolvedRef: cliRef,
      source: 'cli',
      allDefault
    };
  }

  // No CLI override — report the ref(s) the manifest itself declares.
  // If all sources share one ref, that is the resolved ref; otherwise we
  // surface "mixed" so the status output is honest.
  const refs = [...new Set(manifest._resolvedSources.map(s => s.ref))];
  const resolvedRef = refs.length === 1 ? refs[0] : `mixed(${refs.join(',')})`;
  return {
    manifest,
    resolvedRef,
    source: allDefault ? 'default' : 'manifest',
    allDefault
  };
}

/**
 * Prompt the operator for a y/N confirmation on stdin.
 * Default-deny (returns false unless explicit y/yes).
 *
 * Bypassed when options.yes is set (for scripting). The caller is responsible
 * for that bypass — this helper always actually prompts when called.
 *
 * @param {string} prompt - The question to display (no trailing space needed)
 * @returns {Promise<boolean>}
 */
async function confirmYesNo(prompt) {
  const readline = await import('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(`${prompt} [y/N] `, answer => {
      rl.close();
      const a = (answer || '').trim().toLowerCase();
      resolve(a === 'y' || a === 'yes');
    });
  });
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
    const communityId = await resolveCorpusCommunityId(apiClient, workspaceConfig, appId, options);

    // 2. Load manifests
    spinner.text = 'Loading manifests...';
    const manifests = await loadManifests(appRoot, workspaceRoot, options.kb || null);

    if (manifests.length === 0) {
      spinner.fail('No manifests found');
      const manifestsDir = path.join(appRoot, '.descix', 'manifests');
      throw new Error(`No manifests found at ${manifestsDir}/\nCreate a manifest file first.`);
    }

    spinner.succeed(`Found ${manifests.length} manifest(s)`);

    // Deliverable B: branch-mismatch advisory. We only emit this when:
    //   - no --ref override was supplied, AND
    //   - every loaded manifest's every source uses the default "main", AND
    //   - the operator's git HEAD is on a non-main branch.
    // The advisory is informational — it does NOT block the sync. The operator
    // is free to keep going (e.g., they really do want to sync from main while
    // working on a feature branch). This is the silent gotcha that the
    // WS-CLI-MANIFEST-REF-FEATURE-BRANCH scope doc surfaced.
    if (!options.ref) {
      const allManifestsDefault = manifests.every(m =>
        m._resolvedSources.every(s => s.ref === 'main')
      );
      if (allManifestsDefault) {
        const currentBranch = getCurrentBranch(workspaceRoot);
        if (currentBranch && currentBranch !== 'main') {
          console.log(chalk.yellow(
            `  Advisory: you are on branch "${currentBranch}" but every manifest is configured to walk "main". ` +
            `Pass --ref ${currentBranch} to sync your branch instead.`
          ));
        }
      }
    }

    // 3. Pre-check (fail-loud): verify each manifest's target KB document exists in Firestore.
    // Without the KB doc, chat queries against this KB will hard-fail in prepare_chat_context.
    // We surface this BEFORE wasting time syncing vectors that no chat path can reach.
    //
    // Uses list_knowledge_bases (returns the actual KBs registered for the app) — NOT get_app,
    // which returns only the App doc and lacks any knowledgebases field. The prior pre-check
    // was reading a non-existent field and printing a false-positive warning on every sync.
    let registeredKbNames = null;
    try {
      const kbListResp = await apiClient.invoke('list_knowledge_bases', {
        community_id: communityId,
        app_id: appId
      });
      const kbListData = kbListResp?.message || kbListResp;
      const kbs = kbListData?.knowledgebases || kbListData?.knowledge_bases || [];
      registeredKbNames = new Set(
        kbs.map(kb => kb.knowledgebase_name || kb.kb_name || kb.name).filter(Boolean)
      );
    } catch (kbErr) {
      // If the call itself fails (network/auth), surface and bail — don't silently proceed.
      spinner.fail(`Could not verify KB registry for app "${appId}": ${kbErr.message}`);
      throw new Error(
        `Failed to list KnowledgeBase docs for app "${appId}". ` +
        `This is required so we can refuse to sync into an unregistered KB. ` +
        `Underlying error: ${kbErr.message}`
      );
    }

    const requestedKbNames = manifests.map(m => m.kb_name);
    const missingKbNames = requestedKbNames.filter(name => !registeredKbNames.has(name));
    if (missingKbNames.length > 0) {
      // Hard-fail: every KB we are about to sync into must already be registered in Firestore.
      // No hardcoded fallback. The user creates the KB first with `descix kb create`.
      spinner.fail(`Unregistered KB(s) for app "${appId}"`);
      throw new Error(
        `KnowledgeBase document(s) missing in Firestore for app "${appId}": ${missingKbNames.join(', ')}.\n` +
        `Registered KBs for this app: ${[...registeredKbNames].join(', ') || '(none)'}.\n` +
        `Syncing vectors into Pinecone without a matching KB doc would orphan them (chat queries hard-fail).\n` +
        `Fix: create it first with \`descix kb create -c <community_id> -a ${appId} -k <kb_name>\`.`
      );
    }

    // 4. Process each manifest
    let totalFilesProcessed = 0;
    let totalChunksCreated = 0;
    let totalFilesSkipped = 0;
    let totalFilesDeleted = 0;

    for (const rawManifest of manifests) {
      // ── Deliverable B: resolve --ref override (CLI > manifest > default) ──
      const refResolution = resolveRef(rawManifest, options.ref || null);
      const manifest = refResolution.manifest;
      const kbName = manifest.kb_name;

      console.log(chalk.cyan(`\nSyncing corpus: ${kbName}`));
      // Always name the ref used so the operator can see exactly what was walked.
      const refLabel = refResolution.source === 'cli'
        ? `${refResolution.resolvedRef} (--ref override)`
        : refResolution.source === 'manifest'
          ? `${refResolution.resolvedRef} (manifest)`
          : `${refResolution.resolvedRef} (default)`;
      console.log(chalk.gray(`  Ref: ${refLabel}`));

      // ── K2: Tier-P deny-class lint (CEO-D-2026-07-11-KB-CURATION-RATIFIED) ──
      // A publish_tier:"P" manifest is a PUBLISHING ACT. Before ANY walk or
      // Pinecone read/write, run the canonical deny lint: print every exemption
      // and warning (the review artifact, model §5.3), then FAIL LOUD on any
      // violation. Non-Tier-P manifests (publish_tier "I"/absent) skip this
      // entirely — current behavior unchanged.
      if (manifest.publish_tier === 'P') {
        const lintSpinner = ora('  [deny-lint] Linting Tier-P manifest for deny-classes...').start();
        let denyReport;
        try {
          denyReport = await lintManifestForDenyClasses(manifest, workspaceRoot);
        } catch (lintErr) {
          lintSpinner.fail(`  [deny-lint] Lint could not run: ${lintErr.message}`);
          throw lintErr;
        }
        lintSpinner.stop();
        // Print the review artifact — every exemption and warning, always.
        for (const ex of denyReport.exemptions) console.log(chalk.yellow(`  ${ex.line}`));
        for (const w of denyReport.warnings) console.log(chalk.yellow(`  ${w.line}`));
        // Fail loud BEFORE the walk / any Pinecone op if there are violations.
        assertNoViolations(denyReport);
        console.log(chalk.green(
          `  [deny-lint] OK — ${denyReport.exemptions.length} exemption(s), ` +
          `${denyReport.warnings.length} warning(s), 0 violation(s).`
        ));
      }

      // 3a. Walk corpus
      const walkSpinner = ora('  Walking source directories...').start();
      const { files, commitSha, provenance } = await walkCorpus(manifest, workspaceRoot);
      walkSpinner.succeed(`  Found ${files.length} files (commit: ${commitSha.substring(0, 8)})`);

      // ── Deliverable A: --show-walk prints the resolved ref + first 50 files
      // BEFORE any Pinecone read/write so the operator can sanity-check the
      // walk results without trusting downstream output.
      if (options.showWalk) {
        console.log(chalk.cyan(`  [show-walk] Resolved ref: ${refResolution.resolvedRef} (source=${refResolution.source})`));
        console.log(chalk.cyan(`  [show-walk] Walked ${files.length} file(s). First ${Math.min(50, files.length)}:`));
        for (const f of files.slice(0, 50)) {
          console.log(chalk.gray(`    ${f.blob_sha.substring(0, 8)}  ${f.relative_path}`));
        }
        if (files.length > 50) {
          console.log(chalk.gray(`    ... and ${files.length - 50} more`));
        }
      }

      if (files.length === 0) {
        console.log(chalk.yellow('  No files found in sources. Skipping.'));
        continue;
      }

      // 3b-rebuild: When --rebuild is set, do a FULL metadata-scoped purge of the
      // ENTIRE {community_id, app_id, knowledgebase_name} scope, then re-upsert the
      // full local walk below. This is the WS-KB-CORPUS-SCOPEPURGE fix: the prior
      // implementation enumerated `corpus:<blob_sha>` file_ids and purged only the
      // ones absent from the current walk — but the BULK of orphan pollution came
      // from the legacy `kb sync` path (chunk_ids, no `corpus:` file_id) which is
      // INVISIBLE to that enumeration, so rebuild left those orphans live. The only
      // primitive that clears them is a delete by Pinecone metadata filter
      // {community_id, app_id, knowledgebase_name} — server-side that is
      // kb_delete_chunks(purge_scope:true) → KnowledgeBase.deleteRAG(), which also
      // resets the KB doc's rag_vector_count (the field `kb doctor` reads).
      //
      // We still enumerate file_ids first, but ONLY to report the live state for the
      // dry-run preview / confirmation message. The actual purge is full-scope.
      //
      // Deliverable A preserved: --dry-run writes nothing, interactive confirmation
      // guard intact, --yes skips it.
      let rebuildPurged = 0;
      let rebuildScopePurged = false;
      let rebuildRemoteUniqueCount = 0;
      let rebuildRemoteTotalChunks = 0;
      if (options.rebuild) {
        const rebuildSpinner = ora('  [rebuild] Enumerating Pinecone namespace...').start();
        try {
          // Report-only enumeration (corpus-scheme file_ids are a LOWER BOUND on the
          // true vector count — legacy orphans may not appear here, which is exactly
          // why we full-scope-purge rather than purge this list).
          const remote = await listRemoteFileIds(apiClient, appId, kbName);
          rebuildRemoteUniqueCount = remote.unique_count;
          rebuildRemoteTotalChunks = remote.total_chunks;
          rebuildSpinner.succeed(
            `  [rebuild] Pinecone reports ${remote.unique_count} corpus-scheme file_id(s) / ` +
            `${remote.total_chunks} enumerable chunk(s) (legacy orphans may exceed this)`
          );

          if (options.dryRun) {
            // DRY-RUN: describe the full-scope purge. No writes.
            console.log(chalk.yellow(
              `  [rebuild][dry-run] WOULD purge the ENTIRE scope ` +
              `${communityId}/${appId}/${kbName} (all vectors, any scheme), then re-upsert ` +
              `the full local walk. No action taken.`
            ));
          } else {
            // Interactive confirmation guard. --yes skips for scripting/CI.
            console.log(chalk.yellow(
              `\n  About to FULL-SCOPE PURGE every vector in ${communityId}/${appId}/${kbName} ` +
              `(≥${rebuildRemoteTotalChunks} enumerable chunk(s); legacy orphans included), ` +
              `then re-upsert the full local walk (${files.length} file(s)).`
            ));

            let proceed = true;
            if (!options.yes) {
              const ok = await confirmYesNo('  Proceed with full-scope purge + rebuild?');
              if (!ok) {
                console.log(chalk.cyan('  [rebuild] Aborted by operator. No Pinecone changes made.'));
                // Skip THIS manifest's rebuild + delta phases. Don't break the
                // outer loop — operator might want to keep going for other KBs.
                continue;
              }
            }

            if (proceed) {
              const purgeSpinner = ora(`  [rebuild] Purging full scope ${communityId}/${appId}/${kbName}...`).start();
              const purgeResult = await purgeKbScope(apiClient, communityId, appId, kbName);
              rebuildScopePurged = purgeResult.purged_scope;
              // deleteRAG via filter-based deleteMany returns -1 (count not knowable
              // from the SDK). Surface honestly rather than fabricating a number.
              rebuildPurged = purgeResult.deleted >= 0 ? purgeResult.deleted : 0;
              purgeSpinner.succeed(
                purgeResult.deleted >= 0
                  ? `  [rebuild] Purged ${purgeResult.deleted} vector(s) (full scope) and reset KB doc rag fields`
                  : `  [rebuild] Purged full scope (filter-based delete; SDK reports no count) and reset KB doc rag fields`
              );
            }
          }
        } catch (err) {
          rebuildSpinner.fail(`  [rebuild] Failed: ${err.message}`);
          // Re-throw — rebuild is opt-in and explicit; silent partial failure would
          // leave the namespace half-purged, exactly the silent-degradation we are closing.
          throw err;
        }
      }

      // 3b. Load previous sync state for delta computation
      // We use local sync state (stored blob SHAs) instead of querying Pinecone,
      // because Pinecone metadata queries don't scale (payload size limits).
      // For --rebuild runs we INVALIDATE prior state so every file re-chunks + re-upserts
      // (otherwise unchanged-by-blob-sha files would be skipped despite the purge above).
      //
      // Deliverable A note: in dry-run + rebuild we ALSO null previousState so
      // the count below reflects what a real rebuild would upsert (all files),
      // not what an incremental sync would upsert.
      let previousState = await loadSyncState(appRoot, kbName);
      if (options.rebuild) {
        previousState = null;
      }
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

      // Stale blob_shas: anything we synced previously that is no longer in the local
      // walk. This covers BOTH cases:
      //   (a) File deleted from the source corpus entirely.
      //   (b) File modified in place — same source_path, new blob_sha → old blob_sha
      //       is no longer in localBlobShas.
      // Each stale blob_sha maps to a file_id of `corpus:{blob_sha}` in Pinecone metadata
      // and is purged via the deleteStaleChunksByFileId primitive (multi-tenancy filter).
      const deletedBlobShas = [...previousBlobShas].filter(sha => !localBlobShas.has(sha));
      const fileIdsToDelete = deletedBlobShas.map(sha => `corpus:${sha}`);

      const unchangedCount = files.length - newOrChangedFiles.length;

      if (options.verbose) {
        console.log(chalk.gray(`  New/changed files: ${newOrChangedFiles.length}`));
        console.log(chalk.gray(`  Unchanged files: ${unchangedCount}`));
        console.log(chalk.gray(`  Stale blob SHAs (delete): ${deletedBlobShas.length}`));
      }

      // 3d. Chunk new/changed files
      const allChunks = [];
      if (newOrChangedFiles.length > 0) {
        const chunkSpinner = ora(`  Chunking ${newOrChangedFiles.length} file(s)...`).start();

        for (const fileEntry of newOrChangedFiles) {
          try {
            const chunks = await chunkCorpusFile(fileEntry, { appId, communityId, kbName });
            allChunks.push(...chunks);

            if (chunks.length === 0) {
              // M1 (2026-04-20): always surface 0-chunk files even without -v.
              // These are the silent failures that caused the 77% EGPT gap.
              // 'kb doctor' scans sync logs for this exact string.
              console.log(chalk.yellow(`    ⚠ 0-chunk: ${fileEntry.relative_path} produced no chunks (check file type / content)`));
            } else if (options.verbose) {
              console.log(chalk.gray(`    ${fileEntry.relative_path}: ${chunks.length} chunks`));
            }
          } catch (err) {
            // Always surface errors — skipping silently is what produced the 2026-04-20 regression.
            console.log(chalk.yellow(`    ⚠ skipped: ${fileEntry.relative_path} (${err.message})`));
          }
        }

        chunkSpinner.succeed(`  Chunked: ${allChunks.length} chunks from ${newOrChangedFiles.length} files`);
      }

      // Deliverable A: dry-run summary + early continue. We do all the
      // counting work above (walk + chunk + remote enumeration) so the operator
      // sees the EXACT plan that --rebuild (without --dry-run) would execute,
      // but we never call upsertChunks / deleteStaleChunksByFileId.
      if (options.dryRun) {
        console.log(chalk.cyan(`\n  [dry-run] Plan for ${kbName}:`));
        console.log(chalk.white(`    Would upsert: ${allChunks.length} chunks from ${newOrChangedFiles.length} file(s)`));
        console.log(chalk.white(`    Would delete (stale-file): ${fileIdsToDelete.length} blob SHA(s)`));
        if (options.rebuild) {
          console.log(chalk.white(`    Would purge (rebuild): FULL scope ${communityId}/${appId}/${kbName} (≥${rebuildRemoteTotalChunks} enumerable chunks; legacy orphans included)`));
        }
        // Track for the summary exit-code computation at the end of the loop.
        totalFilesProcessed += newOrChangedFiles.length;
        totalChunksCreated += allChunks.length;
        totalFilesSkipped += unchangedCount;
        // Full-scope rebuild would purge ≥ the enumerable chunk count. Use it as the
        // would-delete tally so dry-run reports drift whenever a purge would run.
        totalFilesDeleted += fileIdsToDelete.length + (options.rebuild ? rebuildRemoteTotalChunks : 0);
        // Do NOT call upsertChunks, deleteStaleChunksByFileId, deleteStaleChunks,
        // or saveSyncState in dry-run. Continue to next manifest.
        continue;
      }

      // 3e. Sync to Pinecone with rate limiting
      // Pinecone has a 1M token/min rate limit for embeddings.
      // We batch in small groups with delays between to stay under the limit.
      let upserted = 0;
      let deleted = 0;
      const syncFailures = [];

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
              const msg = err.message || '';
              const isRateLimit = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
              // A per-batch upsert TIMEOUT (server raced out the wedged Pinecone call →
              // UPSERT_TIMEOUT) or a transient network/gateway stall (ETIMEDOUT / 504 /
              // 502 / 503 / ECONNRESET) is RESUMABLE — the upsert is id-keyed and
              // idempotent, so retrying the same batch overwrites any partially-landed
              // records. We must NOT skip it (that silently drops chunks). Retry with
              // backoff like a rate-limit. This is what makes a re-run resume cleanly
              // and a single rebuild never wedge for hours.
              const isResumableStall =
                msg.includes('UPSERT_TIMEOUT') ||
                msg.includes('ETIMEDOUT') ||
                msg.includes('timed out') ||
                msg.includes('504') || msg.includes('502') || msg.includes('503') ||
                msg.includes('ECONNRESET') || msg.includes('socket hang up');

              if (isRateLimit || isResumableStall) {
                retries++;
                const backoff = BATCH_DELAY_MS * Math.pow(2, retries);
                const reason = isRateLimit ? 'Rate limited' : 'Transient stall/timeout';
                syncSpinner.text = `  ${reason}. Waiting ${backoff / 1000}s before retry ${retries}/${MAX_RETRIES} (batch ${i}-${i + batch.length})...`;
                await new Promise(r => setTimeout(r, backoff));
              } else {
                // Genuine non-transient error (e.g. validation): log failed chunks,
                // continue with remaining batches.
                const failedIds = batch.map(c => c.id);
                syncFailures.push({ error: err.message, chunks: failedIds });
                syncSpinner.text = `  Batch failed (${failedIds.length} chunks): ${err.message.substring(0, 80)}. Continuing...`;
                success = true; // Don't retry non-transient errors, move to next batch
              }
            }
          }

          if (!success) {
            syncSpinner.warn(
              `  Batch ${i}-${i + batch.length} did not complete after ${MAX_RETRIES} retries. ` +
              `Synced ${upserted} chunks so far. This run is BOUNDED (it did not hang) — ` +
              `re-run 'descix kb corpus sync -a ${appId} -k ${kbName}' to RESUME: id-keyed upserts ` +
              `are idempotent so already-synced batches are cheap and the remainder continues.`
            );
            break;
          }

          // Delay between batches to stay under rate limit
          if (i + BATCH_SIZE < allChunks.length) {
            await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
          }
        }

        syncSpinner.succeed(`  Upserted: ${upserted} chunks`);

        // Write failure log to .descix if any batches failed
        if (syncFailures.length > 0) {
          const failLogDir = path.join(appRoot, '.descix', 'sync-state');
          await fs.mkdir(failLogDir, { recursive: true });
          const failLogPath = path.join(failLogDir, `${kbName}-failures.json`);
          await fs.writeFile(failLogPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            commit: commitSha,
            failures: syncFailures,
          }, null, 2));
          console.log(chalk.yellow(`  ⚠ ${syncFailures.length} batch(es) failed. Details: ${failLogPath}`));
        }
      }

      if (fileIdsToDelete.length > 0) {
        const deleteSpinner = ora(`  Purging stale chunks for ${fileIdsToDelete.length} blob SHA(s)...`).start();
        try {
          // Use file_id-based delete: each stale blob_sha maps to file_id `corpus:{sha}`,
          // and pineconeService::deleteVectorsByFileId scopes by full multi-tenancy filter
          // (community_id, app_id, knowledgebase_name) — guarantees namespace isolation.
          const result = await deleteStaleChunksByFileId(apiClient, communityId, appId, kbName, fileIdsToDelete);
          deleted = result.deleted;
          deleteSpinner.succeed(`  Purged: ${deleted} chunk(s) across ${fileIdsToDelete.length} stale blob SHA(s)`);
        } catch (err) {
          deleteSpinner.warn(`  Delete failed: ${err.message}`);
        }
      }

      // 3f. Save sync state with blob SHAs for future delta computation
      const allSyncedBlobShas = [...localBlobShas]; // All current files
      await saveSyncState(appRoot, kbName, {
        last_sync_commit: commitSha,
        // Per-source provenance: WHICH repo, at WHICH ref, and the RESOLVED COMMIT SHA actually
        // synced. `ref` may be a mutable branch, so the ref alone is not a record of what was
        // synced — the resolved sha is, and it stays exact after the branch moves.
        sources_provenance: provenance,
        synced_files_count: files.length,
        total_chunks: previousChunkCount + upserted - deleted,
        timestamp: new Date().toISOString(),
        files_upserted: newOrChangedFiles.length,
        files_unchanged: unchangedCount,
        chunks_upserted: upserted,
        chunks_deleted: deleted,
        synced_blob_shas: allSyncedBlobShas
      });

      // 3g. AUTO-RECONCILE the cached rag_vector_count to the TRUE live Pinecone
      // count after a COMPLETED, clean sync (no batch failures). This keeps the
      // doctor's fast cached read truthful after every clean run, so drift only
      // ever appears mid-flight (on interruption). Skipped if any batch failed
      // (the run is partial — reconciling would bake in the partial state and the
      // re-run will reconcile once complete). Non-fatal: a reconcile hiccup must
      // not fail an otherwise-successful sync.
      if (syncFailures.length === 0) {
        try {
          const recRes = await apiClient.invoke('get_kb_rag_status', {
            app_id: appId, kb_id: kbName, reconcile: true
          }, { allowGuest: false });
          const rec = recRes.message || recRes;
          if (rec && typeof rec.reconcileAfter === 'number') {
            const d = rec.reconcileAfter - rec.reconcileBefore;
            console.log(chalk.gray(
              `  ⟳ Reconciled live count: cached ${rec.reconcileBefore} → live ${rec.reconcileAfter}` +
              (d === 0 ? ' (already truthful)' : ` (${d >= 0 ? '+' : ''}${d})`)
            ));
          }
        } catch (recErr) {
          console.log(chalk.yellow(`  ⚠ Auto-reconcile skipped (non-fatal): ${recErr.message}`));
        }
      }

      totalFilesProcessed += newOrChangedFiles.length;
      totalChunksCreated += upserted;
      totalFilesSkipped += unchangedCount;
      totalFilesDeleted += deleted + rebuildPurged;
    }

    // Summary
    if (options.dryRun) {
      const driftCount = totalFilesProcessed + totalFilesDeleted;
      console.log(chalk.cyan('\nCorpus sync dry-run complete:'));
      console.log(chalk.white(`  Would-upsert files:  ${totalFilesProcessed}`));
      console.log(chalk.white(`  Would-upsert chunks: ${totalChunksCreated}`));
      console.log(chalk.white(`  Would-delete refs:   ${totalFilesDeleted}`));
      console.log(chalk.white(`  Unchanged files:     ${totalFilesSkipped}`));
      if (driftCount === 0) {
        console.log(chalk.green('  Drift: NONE. No changes would be made.\n'));
        // Return value drives the bin/descix.js wrapper's process.exit code.
        return { dryRun: true, drift: false, driftCount: 0 };
      } else {
        console.log(chalk.yellow(`  Drift: ${driftCount} change(s) would be applied.\n`));
        return { dryRun: true, drift: true, driftCount };
      }
    }

    console.log(chalk.green('\nCorpus sync complete:'));
    console.log(chalk.white(`  Files synced:    ${totalFilesProcessed}`));
    console.log(chalk.white(`  Chunks created:  ${totalChunksCreated}`));
    console.log(chalk.white(`  Files unchanged: ${totalFilesSkipped}`));
    if (totalFilesDeleted > 0) {
      console.log(chalk.white(`  Chunks deleted:  ${totalFilesDeleted}`));
    } else {
      console.log(chalk.gray(`  Chunks deleted:  0`));
    }
    console.log('');
    return { dryRun: false };

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

    for (const rawManifest of manifests) {
      // Apply the same ref resolution the sync command uses, so `status`
      // reports the EXACT ref the next sync would walk.
      const refResolution = resolveRef(rawManifest, options.ref || null);
      const manifest = refResolution.manifest;
      const kbName = manifest.kb_name;
      const syncState = await loadSyncState(appRoot, kbName);

      console.log(chalk.cyan(`\nCorpus Status: ${appId} / ${kbName}`));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.white(`  Resolved ref:    ${refResolution.resolvedRef} (source=${refResolution.source})`));

      // File count from a fresh walk so the operator sees the LIVE file count
      // at the resolved ref, not the count from the last sync. This is the
      // single most useful piece of information for diagnosing "why does this
      // not match what I expect" and is cheap (no Pinecone read).
      try {
        const { files } = await walkCorpus(manifest, workspaceRoot);
        console.log(chalk.white(`  Live file count: ${files.length}`));
      } catch (err) {
        console.log(chalk.gray(`  Live file count: (walk error: ${err.message})`));
      }

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
