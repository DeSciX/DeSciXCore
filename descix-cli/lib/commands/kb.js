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
import { WorkspaceConfig } from '../workspace-config.js';
import { hydrateKb, pushStaging, checkStagingFiles } from '../core/Hydrator.js';
import { processKb } from '../core/Chunker.js';
import { syncKb, getSyncStatus } from '../core/Syncer.js';
import * as driveADC from '../google-storage-adc.js';

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
      console.log(chalk.yellow('\n💡 Run "descix setup --dev" first to link Drive, or use --folder <id> for one-time import.\n'));
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
      console.log(chalk.gray('   2. Run "descix kb chunk" to generate chunks'));
      console.log(chalk.gray('   3. Run "descix kb sync" to push to Pinecone\n'));
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
      throw new Error('Run "descix setup --dev" first to link Drive.');
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
      console.log(chalk.gray('   1. Run "descix kb pull" to sync all Drive content'));
      console.log(chalk.gray('   2. Run "descix kb chunk" to generate chunks\n'));
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
 * Compare local sync-state vs live Pinecone vectorCount, and scan the most
 * recent verbose sync log (if any) for per-file 0-chunk warnings. Reports
 * drift direction and exits non-zero when drift exceeds the threshold.
 *
 * WHY THIS EXISTS
 * ---------------
 * `descix kb corpus sync` trusts local sync-state/<KB>.json for delta
 * detection. When the Pinecone index is reset (e.g. dev-env churn), the
 * local state still lists all blob SHAs as "synced", so the next sync
 * skips re-upload and orphan/loss goes undetected until a content
 * retrieval test fails. This command surfaces the drift directly.
 *
 * BEHAVIOUR
 * ---------
 *   descix kb doctor -a <app> -k <kb>
 *
 *   (a) Queries Pinecone via get_kb_rag_status for vectorCount.
 *   (b) Reads {appRoot}/.descix/sync-state/{kb}.json for total_chunks.
 *   (c) Reports diff and direction:
 *          Pinecone < sync-state  → LOST (chunks missing from Pinecone)
 *          Pinecone > sync-state  → ORPHANS (Pinecone has extra vectors)
 *          |drift| / local ≤ threshold  → HEALTHY
 *   (d) Scans the most recent file matching logs/kb-sync-*.log for
 *       '0-chunk' / 'skipped' warnings (these are the signal M1 wired
 *       into corpus.js).
 *   (e) Exits non-zero on drift above threshold (default: 5%).
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

  // Drift threshold (fraction). CEO guidance 2026-04-20: ~5% is reasonable.
  const DRIFT_THRESHOLD = Number.isFinite(Number(options.threshold))
    ? Number(options.threshold) : 0.05;

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

  // (b) Local sync-state total_chunks
  const syncStatePath = path.join(appRoot, '.descix', 'sync-state', `${kbName}.json`);
  let localChunks = null;
  let syncStateRaw = null;
  try {
    const raw = await fs.readFile(syncStatePath, 'utf-8');
    syncStateRaw = JSON.parse(raw);
    localChunks = syncStateRaw?.total_chunks;
    if (typeof localChunks !== 'number') {
      throw new Error(`sync-state has no total_chunks: ${syncStatePath}`);
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(chalk.yellow(`  ⚠ No local sync-state at ${syncStatePath}`));
      console.log(chalk.gray(`    Run 'descix kb corpus sync -a ${appId} -k ${kbName}' first.`));
      process.exit(2);
    }
    throw err;
  }

  // (c) Report
  const delta = vectorCount - localChunks;
  const ratio = localChunks === 0 ? Infinity : Math.abs(delta) / localChunks;
  const direction = delta === 0 ? 'EXACT'
    : delta < 0 ? 'LOST (Pinecone missing chunks)'
    : 'ORPHANS (Pinecone has extra vectors)';
  const healthy = Math.abs(delta) / Math.max(localChunks, 1) <= DRIFT_THRESHOLD;

  console.log(`  Pinecone vectorCount : ${chalk.white(vectorCount)}`);
  console.log(`  Local total_chunks   : ${chalk.white(localChunks)}`);
  console.log(`  Drift                : ${chalk.white((delta >= 0 ? '+' : '') + delta)} (${(ratio * 100).toFixed(1)}%)`);
  console.log(`  Direction            : ${delta === 0 ? chalk.green(direction) : (healthy ? chalk.yellow(direction) : chalk.red(direction))}`);
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
  if (!healthy) {
    console.log(chalk.red(`  ✗ DRIFT detected: ${(ratio * 100).toFixed(1)}% exceeds ${(DRIFT_THRESHOLD * 100).toFixed(1)}% threshold.\n`));
    if (delta < 0) {
      console.log(chalk.gray(`    Recommended: invalidate sync-state and re-sync:`));
      console.log(chalk.gray(`      rm "${syncStatePath}"`));
      console.log(chalk.gray(`      descix kb corpus sync -a ${appId} -k ${kbName}\n`));
    } else {
      console.log(chalk.gray(`    Recommended: clear stale vectors and re-sync to rebuild Pinecone from local state.\n`));
    }
    process.exit(1);
  }

  console.log(chalk.green(`  ✓ HEALTHY (drift within ${(DRIFT_THRESHOLD * 100).toFixed(1)}% threshold)\n`));
}

export default {
  runKbPull,
  runKbPush,
  runKbDoctor
};
