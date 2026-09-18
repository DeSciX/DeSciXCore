/**
 * KB (Knowledge Base) Commands - SDK Architecture V2
 * 
 * Commands for local KB processing using canonical core modules:
 * - pull: Download from Drive, convert to text (Hydrator)
 * - push: Upload staging files to Drive (Hydrator)
 * - chunk: Generate chunks from text files (Chunker)
 * - sync: Push chunks to Pinecone via API (Syncer)
 * - build: Full pipeline (push staging → pull → chunk → sync)
 * - status: Show sync status
 * - compare: Show file-level deltas
 * 
 * Architecture:
 * - Uses WorkspaceConfig for all path resolution (supports v2.1 env.platform/products format)
 * - All operations delegate to lib/core/ modules
 * - Supports interactive and unattended (agent) modes
 * - CLI handles UX (prompts, progress, errors)
 */

import chalk from 'chalk';
import ora from 'ora';
import * as path from 'path';
import * as fs from 'fs/promises';
import inquirer from 'inquirer';
// "May I prompt?" has ONE OWNER. --interactive is an opt-IN, not a guarantee a human is there.
import { requireInteractive } from '../interactive.js';
import { WorkspaceConfig } from '../workspace-config.js';
import { hydrateKb, pushStaging, checkStagingFiles } from '../core/Hydrator.js';
import { processKb } from '../core/Chunker.js';
import { syncKb, getSyncStatus, listRemoteFileIds } from '../core/Syncer.js';
import * as driveADC from '../google-storage-adc.js';
// The one canonical KB-sync surface, from its owner. Never spell it as a literal here: these
// commands' next steps are read by a developer as instructions, so they must name the live verb
// and nothing else.
import { CANONICAL_KB_SYNC } from './retired-kb-sync.js';
import { loadSyncState, syncStatePath } from '../core/syncState.js';

// ============ Pull Command ============

/**
 * Pull KB content from Drive and convert to local text
 * Delegates to Hydrator.hydrateKb()
 * 
 * @param {DeSciXApiClient|null} apiClient - API client (unused, kept for interface)
 * @param {Object} options - Command options
 * @param {string} options.community - Community ID
 * @param {string} options.app - App ID
 * @param {string} options.kb - KB ID
 * @param {boolean} options.verbose - Verbose output
 * @param {string} options.mergeMode - 'merge' | 'overwrite' | 'force-overwrite'
 * @param {boolean} options.interactive - Enable interactive prompts
 * @param {boolean} options.dryRun - Show what would happen
 */
export async function runKbPull(apiClient, options) {
  const spinner = ora('Loading workspace configuration...').start();

  try {
    // 1. Load WorkspaceConfig (from workspace.json - no searching)
    const workspaceConfig = await WorkspaceConfig.load();

    // 2. Resolve context (auto-detect from cwd or use CLI flags)
    const { communityId, appId, kbId } = workspaceConfig.requireContext(options);

    spinner.text = `Pulling KB: ${communityId}/${appId}/${kbId}`;

    // 3. Handle --folder override: extract folder ID from raw ID or full Drive URL
    let directFolderId = null;
    if (options.folder) {
      const folderInput = options.folder;
      // Handle full Drive URLs: https://drive.google.com/drive/u/0/folders/FOLDER_ID or variants
      const urlMatch = folderInput.match(/\/folders\/([a-zA-Z0-9_-]+)/);
      directFolderId = urlMatch ? urlMatch[1] : folderInput;
      spinner.text = `Pulling KB from override folder: ${directFolderId.substring(0, 12)}...`;
    }

    // 4. Validate Drive configuration (skip base_folder_id check when --folder is provided)
    const driveConfig = workspaceConfig.driveConfig;
    if (!directFolderId && !driveConfig?.base_folder_id) {
      spinner.fail('Drive not configured');
      console.log(chalk.yellow('\n💡 Drive is not linked: set driveConfig.base_folder_id in .descix/workspace.json, or use --folder <id> for a one-time import.\n'));
      throw new Error('The base_folder_id is required for KB operations (or use --folder for one-time import).');
    }

    // 5. Get paths
    const workspaceRoot = workspaceConfig.getWorkspaceRoot();
    const appPath = workspaceConfig.getAppByAppId(appId)?.absolutePath;

    // 6. Delegate to Hydrator with merge mode options
    spinner.text = 'Connecting to Google Drive...';

    const result = await hydrateKb({
      workspaceRoot,
      communityId,
      appId,
      kbId,
      baseFolderId: directFolderId ? null : driveConfig.base_folder_id,
      directFolderId,
      localPath: appPath ? (path.relative(workspaceRoot, appPath) || '.') : `${communityId}/${appId}`
    }, {
      verbose: options.verbose,
      mergeMode: options.mergeMode || 'merge',
      dryRun: options.dryRun,
      onProgress: (msg) => { spinner.text = msg; }
    });
    
    // Build status message
    const parts = [];
    if (result.pulled > 0) parts.push(`${result.pulled} downloaded`);
    if (result.converted > 0) parts.push(`${result.converted} converted`);
    if (result.skipped > 0) parts.push(`${result.skipped} skipped`);
    if (result.unchanged > 0) parts.push(`${result.unchanged} unchanged`);
    
    const statusMsg = parts.length > 0 ? parts.join(', ') : 'No changes';
    spinner.succeed(`Pull complete: ${statusMsg}`);
    
    // Show next steps
    if (!options.quiet) {
      console.log(chalk.cyan('\n📋 Next steps:'));
      console.log(chalk.gray('   1. Review files in kb/' + kbId + '/'));
      console.log(chalk.gray(`   2. Run "${CANONICAL_KB_SYNC} -a <app_id>" to push to Pinecone\n`));
    }
    
    return result;
    
  } catch (error) {
    spinner.fail('Pull failed');
    throw error;
  }
}

// ============ Push Command ============

/**
 * Push staging files to Drive
 * Delegates to Hydrator.pushStaging()
 * 
 * @param {DeSciXApiClient|null} apiClient - API client (unused)
 * @param {Object} options - Command options
 * @param {boolean} options.interactive - Enable interactive prompts for conflicts
 * @param {string} options.onConflict - 'overwrite' | 'skip' (default: 'overwrite')
 * @param {boolean} options.moveToProcessed - Move files to .processed (default: true)
 * @param {boolean} options.dryRun - Show what would happen
 */
export async function runKbPush(apiClient, options) {
  const spinner = ora('Loading workspace configuration...').start();
  
  try {
    // 1. Load WorkspaceConfig
    const workspaceConfig = await WorkspaceConfig.load();

    // 2. Resolve context
    const { communityId, appId, kbId } = workspaceConfig.requireContext(options);

    spinner.text = `Pushing staging: ${communityId}/${appId}/${kbId}`;

    // 3. Validate Drive configuration
    const driveConfig = workspaceConfig.driveConfig;
    if (!driveConfig?.base_folder_id) {
      spinner.fail('Drive not configured');
      throw new Error('Drive is not linked: set driveConfig.base_folder_id in .descix/workspace.json.');
    }

    // 4. Get paths
    const workspaceRoot = workspaceConfig.getWorkspaceRoot();
    const appPath = workspaceConfig.getAppByAppId(appId)?.absolutePath;
    const localPath = appPath ? (path.relative(workspaceRoot, appPath) || '.') : `${communityId}/${appId}`;
    const stagingDir = path.join(workspaceRoot, localPath, 'kb', 'staging');
    
    // Check if staging has files
    const stagingCheck = await checkStagingFiles(stagingDir);
    if (!stagingCheck.hasFiles) {
      spinner.info('No files in staging directory');
      return { uploaded: 0, skipped: 0, errors: 0, processed: [] };
    }
    
    // 5. Delegate to Hydrator
    spinner.text = 'Uploading to Google Drive...';
    
    // Create conflict prompt callback for interactive mode
    const onConflictPrompt = options.interactive ? async (fileName, fileInfo) => {
      spinner.stop();
      requireInteractive({
        what: 'descix drive push --interactive',
        question: `File "${fileName}" exists in Drive. Overwrite or skip?`,
        nonInteractiveForm: ['descix drive push   # without --interactive, conflicts resolve without a prompt']
      });
      const { action } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: `File "${fileName}" exists in Drive. What would you like to do?`,
        choices: [
          { name: 'Overwrite this file', value: 'overwrite' },
          { name: 'Overwrite all conflicts', value: 'overwrite-all' },
          { name: 'Skip this file', value: 'skip' },
          { name: 'Skip all conflicts', value: 'skip-all' }
        ]
      }]);
      spinner.start('Continuing upload...');
      return action;
    } : null;
    
    const result = await pushStaging({
      workspaceRoot,
      communityId,
      appId,
      kbId,
      baseFolderId: driveConfig.base_folder_id,
      localPath
    }, { 
      verbose: options.verbose,
      interactive: options.interactive,
      onConflict: options.onConflict || 'overwrite',
      moveToProcessed: options.moveToProcessed !== false,
      dryRun: options.dryRun,
      onConflictPrompt
    });
    
    // Build status message
    const parts = [];
    if (result.uploaded > 0) parts.push(`${result.uploaded} uploaded`);
    if (result.skipped > 0) parts.push(`${result.skipped} skipped`);
    if (result.errors > 0) parts.push(`${result.errors} errors`);
    
    const statusMsg = parts.length > 0 ? parts.join(', ') : 'No files processed';
    spinner.succeed(`Push complete: ${statusMsg}`);
    
    if (result.processed?.length > 0 && options.moveToProcessed !== false) {
      console.log(chalk.gray(`   Files moved to kb/staging/.processed/`));
    }
    
    // Show next steps
    if (!options.quiet) {
      console.log(chalk.cyan('\n📋 Next steps:'));
      console.log(chalk.gray('   1. Run "descix drive pull" to sync all Drive content'));
      console.log(chalk.gray(`   2. Run "${CANONICAL_KB_SYNC} -a <app_id>" to push to Pinecone\n`));
    }
    
    return result;
    
  } catch (error) {
    spinner.fail('Push failed');
    throw error;
  }
}

// `kb chunk`, `kb sync`, `kb build`, `kb status` and `kb compare` are REMOVED.
// runKbChunk / runKbSync / runKbBuild / runKbStatus / runKbCompare are DELETED, not
// retained-for-later: the one canonical KB sync surface is `descix kb corpus sync`
// (lib/commands/corpus.js::runCorpusSync). runKbPull/runKbPush above survive because
// `descix drive pull` / `descix drive push` still call them — they move files to and
// from Drive and never write Pinecone.

// ============ M3: `descix kb doctor` — drift detector (2026-04-20) ============
/**
 * Check a KB against its last corpus sync by FILE IDENTITY, and scan the most recent verbose
 * sync log (if any) for per-file 0-chunk warnings.
 *
 * WHY IDENTITY, NOT COUNT
 * -----------------------
 * The first version compared Pinecone's vectorCount with the sync-state's total_chunks. But the
 * sync writes total_chunks FROM the reconciled live count, so the comparison was the store
 * against a copy of itself: drift 0 by construction, "HEALTHY" over a superseded document that
 * was still live and retrievable (measured 2026-09-18, GODSWORLD-DEV, PROD). vectorCount also
 * lags deletes. What matters is WHICH files are live, so that is what this checks.
 *
 * BEHAVIOUR
 * ---------
 *   descix kb doctor -a <app> -k <kb> [--live | --reconcile]
 *
 *   (a) get_kb_rag_status for vectorCount — reported as information only. --live / --reconcile
 *       still check the server's CACHED counter against the live store, a separate question.
 *   (b) Reads this origin's sync-state: the walked blob SHAs and the zero-chunk ones.
 *   (c) Lists the live corpus file_ids and reports:
 *          ORPHANS — live but not walked: retrievable stale content. Fails.
 *          MISSING — walked, has content, not live. Fails. UNVERIFIABLE (not failing) when the
 *                    state predates the zero-chunk record, rather than guessing.
 *   (d) Scans the most recent logs/kb-sync-*.log for '0-chunk' / 'skipped' warnings.
 *   (e) Exits 1 on orphans or missing files, 2 when the state cannot be read.
 */
export async function runKbDoctor(apiClient, options) {
  const { WorkspaceConfig } = await import('../workspace-config.js');
  const workspaceConfig = await WorkspaceConfig.load();

  const appId = options.app;
  const kbName = options.kb;
  if (!appId) throw new Error('-a, --app <id> is required');
  if (!kbName) throw new Error('-k, --kb <name> is required');

  const appMeta = workspaceConfig.getAppByAppId(appId);
  if (!appMeta) throw new Error(`App '${appId}' not found in workspace.json`);
  const appRoot = appMeta.absolutePath;
  const communityId = appMeta.communityId || appMeta.community_id || null;

  const scope = communityId ? `${communityId}/${appId}/${kbName}` : `${appId}/${kbName}`;
  console.log(chalk.cyan(`\n🩺 kb doctor — ${scope}\n`));

  // --live   : compute vectorCount from the TRUE live Pinecone scope (id-prefix
  //            enumeration), bypassing the cached rag_vector_count counter that
  //            LIES after an interrupted op.
  // --reconcile: compute the live count AND write it back to rag_vector_count so the
  //            fast cached read is truthful again. Implies --live truth.
  const live = !!options.live || !!options.reconcile;
  const reconcile = !!options.reconcile;

  // (a) Pinecone vector count (cached by default; live/reconciled on request)
  let vectorCount = null;
  let ragStatus = null;
  try {
    const res = await apiClient.invoke('get_kb_rag_status', {
      app_id: appId,
      kb_id: kbName,
      live,
      reconcile
    }, { allowGuest: false });
    ragStatus = res.message || res;
    vectorCount = ragStatus?.vectorCount;
    if (typeof vectorCount !== 'number') {
      throw new Error(`get_kb_rag_status returned no vectorCount: ${JSON.stringify(ragStatus)}`);
    }
  } catch (err) {
    console.log(chalk.red(`  ✗ get_kb_rag_status failed: ${err.message}`));
    throw err;
  }

  if (reconcile) {
    console.log(chalk.cyan(
      `  ⟳ Reconciled cached count: ${ragStatus.reconcileBefore} → ${ragStatus.reconcileAfter} ` +
      `(${ragStatus.reconcileAfter - ragStatus.reconcileBefore >= 0 ? '+' : ''}${ragStatus.reconcileAfter - ragStatus.reconcileBefore})\n`
    ));
  }
  if (live) {
    const src = ragStatus.source === 'live' ? chalk.green('LIVE (Pinecone)') : chalk.yellow(ragStatus.source);
    console.log(`  Count source         : ${src}`);
    if (typeof ragStatus.cachedVectorCount === 'number') {
      const cacheDrift = ragStatus.drift;
      console.log(
        `  Cached counter       : ${chalk.white(ragStatus.cachedVectorCount)} ` +
        `(live − cache = ${cacheDrift >= 0 ? '+' : ''}${cacheDrift})` +
        (cacheDrift === 0 ? chalk.green('  ✓ truthful') : chalk.yellow('  ⚠ cache drifted; run --reconcile'))
      );
    }
  }

  // (b) Local sync-state total_chunks, for THIS ORIGIN.
  //
  // The path is resolved by its owner (lib/core/syncState.js), never rebuilt here: doctor
  // compares a LOCAL record against a LIVE store, so reading one origin's state while querying
  // another's store would manufacture the very drift this command exists to detect.
  const doctorOrigin = await apiClient.ensureBaseUrl();
  const statePathForOrigin = syncStatePath(appRoot, kbName, doctorOrigin);
  const loadedState = await loadSyncState(appRoot, kbName, doctorOrigin);
  const syncStateRaw = loadedState.state;
  if (!syncStateRaw) {
    console.log(chalk.yellow(`  ⚠ No local sync-state for ${doctorOrigin} at ${statePathForOrigin}`));
    if (loadedState.detail) console.log(chalk.gray(`    ${loadedState.detail}`));
    console.log(chalk.gray(`    Run 'descix kb corpus sync -a ${appId} -k ${kbName}' against this origin first.`));
    process.exit(2);
  }
  // (c) IDENTITY, not count. Which corpus files are LIVE, against which files the last sync
  // WALKED. The count comparison this replaced read the store against `total_chunks`, which the
  // sync itself writes FROM the reconciled live count — so drift was zero by construction and
  // the check could not fail (measured 2026-09-18, GODSWORLD-DEV: "HEALTHY" printed over a
  // superseded INDEX.md that was still live and retrievable). Identity catches exactly that.
  if (!Array.isArray(syncStateRaw.synced_blob_shas)) {
    console.log(chalk.yellow(`  ⚠ sync-state records no synced_blob_shas at ${statePathForOrigin} — the walked set is UNKNOWN.`));
    process.exit(2);
  }
  const report = diagnoseCorpusIdentity({
    liveFileIds: (await listRemoteFileIds(apiClient, appId, kbName)).file_ids,
    walkedBlobShas: syncStateRaw.synced_blob_shas,
    zeroChunkBlobShas: syncStateRaw.zero_chunk_blob_shas,
  });

  console.log(`  Walked by last sync  : ${chalk.white(report.walked)} file(s)` +
    (report.zeroKnown ? chalk.gray(` (${report.zeroChunk} empty by design)`) : ''));
  console.log(`  Live corpus files    : ${chalk.white(report.live)}`);
  console.log(`  Orphans (live, not walked) : ${report.orphans.length ? chalk.red(report.orphans.length) : chalk.green(0)}`);
  report.orphans.slice(0, 10).forEach((id) => console.log(chalk.red(`    ${id}`)));
  if (report.zeroKnown) {
    console.log(`  Missing (walked, not live) : ${report.missing.length ? chalk.red(report.missing.length) : chalk.green(0)}`);
    report.missing.slice(0, 10).forEach((id) => console.log(chalk.red(`    ${id}`)));
  } else {
    console.log(chalk.yellow('  Missing (walked, not live) : UNVERIFIABLE — this state predates the record of empty files; the next sync writes it.'));
  }
  console.log(chalk.gray(`  Pinecone vectorCount : ${vectorCount} (informational — it lags deletes and is not a health signal)`));
  console.log(`  Index                : ${ragStatus.indexName || '(unknown)'}`);
  console.log(`  Last sync (server)   : ${ragStatus.lastSync || '(unknown)'}`);
  console.log(`  Last sync (local)    : ${syncStateRaw.timestamp || '(unknown)'}`);

  // (d) Scan most recent sync log for 0-chunk / skipped warnings
  const logsDir = path.join(appRoot, '.descix', 'logs');
  let recentLog = null;
  let warnings = [];
  try {
    const entries = await fs.readdir(logsDir);
    const syncLogs = entries.filter(f => /^kb-sync-.*\.log$/.test(f)).sort();
    if (syncLogs.length > 0) {
      recentLog = path.join(logsDir, syncLogs[syncLogs.length - 1]);
      const content = await fs.readFile(recentLog, 'utf-8');
      for (const line of content.split('\n')) {
        if (/0-chunk|⚠ skipped/.test(line)) {
          warnings.push(line.trim());
        }
      }
    }
  } catch {
    // logs dir may not exist — not fatal
  }

  if (recentLog) {
    console.log(`\n  Most recent sync log : ${path.relative(process.cwd(), recentLog)}`);
    if (warnings.length > 0) {
      console.log(chalk.yellow(`  Per-file warnings (${warnings.length}):`));
      warnings.slice(0, 10).forEach(w => console.log(chalk.yellow(`    ${w}`)));
      if (warnings.length > 10) {
        console.log(chalk.gray(`    ...${warnings.length - 10} more`));
      }
    } else {
      console.log(chalk.gray(`  No 0-chunk / skipped warnings in most recent log.`));
    }
  } else {
    console.log(chalk.gray(`\n  No sync log found at ${logsDir} (logs are optional).`));
  }

  // (e) Exit
  console.log();
  if (report.orphans.length > 0) {
    console.log(chalk.red(`  ✗ ORPHANS: ${report.orphans.length} corpus file(s) are live and retrievable but were not in the last walk.`));
    console.log(chalk.gray(`    A plain sync purges them (it reconciles against the live KB). Preview it first:`));
    console.log(chalk.gray(`      descix kb corpus sync -a ${appId} -k ${kbName} --dry-run\n`));
  }
  if (report.missing.length > 0) {
    console.log(chalk.red(`  ✗ MISSING: ${report.missing.length} walked file(s) hold chunks but are not live.`));
    console.log(chalk.gray(`    A plain sync skips files its state already records, so rebuild:`));
    console.log(chalk.gray(`      descix kb corpus sync -a ${appId} -k ${kbName} --rebuild --dry-run\n`));
  }
  if (report.orphans.length > 0 || report.missing.length > 0) process.exit(1);

  if (report.zeroKnown) {
    console.log(chalk.green(`  ✓ HEALTHY — every live corpus file was walked, and every walked file with content is live.\n`));
  } else {
    console.log(chalk.green(`  ✓ No orphans.`) + chalk.yellow(` Missing-content check pending the next sync.\n`));
  }
}

/**
 * Compare the live corpus file set against the last walk. Pure, so the verdict is testable
 * without a store. Only `corpus:` ids are this manifest's to judge; other schemes are ignored.
 */
export function diagnoseCorpusIdentity({ liveFileIds, walkedBlobShas, zeroChunkBlobShas }) {
  const live = new Set((liveFileIds || []).filter((id) => typeof id === 'string' && id.startsWith('corpus:')));
  const walked = new Set((walkedBlobShas || []).map((sha) => `corpus:${sha}`));
  const zeroKnown = Array.isArray(zeroChunkBlobShas);
  const zero = new Set((zeroChunkBlobShas || []).map((sha) => `corpus:${sha}`));
  const orphans = [...live].filter((id) => !walked.has(id)).sort();
  const missing = zeroKnown ? [...walked].filter((id) => !zero.has(id) && !live.has(id)).sort() : [];
  return { live: live.size, walked: walked.size, zeroKnown, zeroChunk: zero.size, orphans, missing };
}

export default {
  runKbPull,
  runKbPush,
  runKbDoctor
};
