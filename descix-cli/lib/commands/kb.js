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

// ============ Chunk Command ============

/**
 * Generate chunks from text files
 * Delegates to Chunker.processKb()
 *
 * @param {Object} options - { community, app, kb, chunkSize, overlap, verbose, metadata }
 */
export async function runKbChunk(options) {
  const spinner = ora('Loading workspace configuration...').start();

  try {
    // 1. Load WorkspaceConfig
    const workspaceConfig = await WorkspaceConfig.load();

    // 2. Resolve context
    const { communityId, appId, kbId } = workspaceConfig.requireContext(options);

    spinner.text = `Chunking KB: ${communityId}/${appId}/${kbId}`;

    // 3. Get paths
    const workspaceRoot = workspaceConfig.getWorkspaceRoot();
    const appPath = workspaceConfig.getAppByAppId(appId)?.absolutePath;

    // 4. Parse custom metadata (JSON string from --metadata flag)
    let customMetadata = null;
    if (options.metadata) {
      try {
        customMetadata = JSON.parse(options.metadata);
        if (typeof customMetadata !== 'object' || Array.isArray(customMetadata)) {
          throw new Error('metadata must be a JSON object');
        }
      } catch (parseErr) {
        spinner.fail('Invalid --metadata value');
        throw new Error(`--metadata must be a valid JSON object: ${parseErr.message}`);
      }
    }

    // 5. Delegate to Chunker
    const chunkOptions = {
      maxChunkSize: parseInt(options.chunkSize || 2000),
      overlapSize: parseInt(options.overlap || 500),
      verbose: options.verbose
    };

    if (options.verbose) {
      console.log(chalk.gray(`  Chunk size: ${chunkOptions.maxChunkSize}`));
      console.log(chalk.gray(`  Overlap: ${chunkOptions.overlapSize}`));
      if (customMetadata) {
        console.log(chalk.gray(`  Custom metadata: ${JSON.stringify(customMetadata)}`));
      }
    }

    const result = await processKb({
      workspaceRoot,
      communityId,
      appId,
      kbId,
      localPath: appPath ? (path.relative(workspaceRoot, appPath) || '.') : `${communityId}/${appId}`,
      customMetadata
    }, chunkOptions);
    
    spinner.succeed(`Generated ${result.totalChunks} chunks from ${result.files} files`);
    
    // Show next steps
    if (!options.quiet) {
      console.log(chalk.cyan('\n📋 Next steps:'));
      console.log(chalk.gray('   Run "descix kb sync" to push chunks to Pinecone\n'));
    }
    
    return result;
    
  } catch (error) {
    spinner.fail('Chunk failed');
    throw error;
  }
}

// ============ Sync Command ============

/**
 * Sync chunks to Pinecone via API
 * Delegates to Syncer.syncKb()
 * 
 * @param {DeSciXApiClient} apiClient - API client for backend
 * @param {Object} options - { community, app, kb, verbose }
 */
export async function runKbSync(apiClient, options) {
  const spinner = ora('Loading workspace configuration...').start();
  
  try {
    if (!apiClient) {
      spinner.fail('Authentication required');
      throw new Error('Run "descix login" first.');
    }
    
    // 1. Load WorkspaceConfig
    const workspaceConfig = await WorkspaceConfig.load();

    // 2. Resolve context
    const { communityId, appId, kbId } = workspaceConfig.requireContext(options);

    spinner.text = `Syncing KB: ${communityId}/${appId}/${kbId}`;

    // 3. Get paths
    const workspaceRoot = workspaceConfig.getWorkspaceRoot();
    const appPath = workspaceConfig.getAppByAppId(appId)?.absolutePath;
    
    // 4. Delegate to Syncer
    const result = await syncKb(apiClient, {
      workspaceRoot,
      communityId,
      appId,
      kbId,
      localPath: appPath ? (path.relative(workspaceRoot, appPath) || '.') : `${communityId}/${appId}`
    }, {
      verbose: options.verbose,
      onProgress: (msg) => { spinner.text = msg; }
    });
    
    if (result.synced > 0 || result.deleted > 0) {
      spinner.succeed(`Synced ${result.synced} chunks (${result.deleted} deleted)`);
    } else {
      spinner.succeed('Already in sync');
    }
    
    return result;
    
  } catch (error) {
    spinner.fail('Sync failed');
    throw error;
  }
}

// ============ Build Command (Combined) ============

/**
 * Full KB build pipeline: [push staging] → pull → chunk → sync
 * 
 * Enhanced pipeline:
 * 1. Check staging - if files exist, push to Drive first
 * 2. Pull from Drive with merge mode
 * 3. Chunk local files
 * 4. Sync to Pinecone
 * 
 * @param {DeSciXApiClient} apiClient - API client
 * @param {Object} options - Combined options for all steps
 * @param {boolean} options.interactive - Enable interactive prompts
 * @param {boolean} options.skipStaging - Skip staging push step
 * @param {string} options.mergeMode - 'merge' | 'overwrite' | 'force-overwrite'
 * @param {boolean} options.dryRun - Show what would happen
 */
export async function runKbBuild(apiClient, options) {
  const { interactive = false, skipStaging = false, dryRun = false } = options;
  
  console.log(chalk.cyan('\n=== KB Build Pipeline ===\n'));
  
  if (dryRun) {
    console.log(chalk.yellow('DRY RUN MODE - No changes will be made\n'));
  }
  
  try {
    // Load context once for all steps
    const workspaceConfig = await WorkspaceConfig.load();
    const { communityId, appId, kbId } = workspaceConfig.requireContext(options);
    const workspaceRoot = workspaceConfig.getWorkspaceRoot();
    const appPath = workspaceConfig.getAppByAppId(appId)?.absolutePath;
    const localPath = appPath ? (path.relative(workspaceRoot, appPath) || '.') : `${communityId}/${appId}`;
    const stagingDir = path.join(workspaceRoot, localPath, 'kb', 'staging');
    
    // Show which app we're building
    console.log(chalk.white(`Target: ${chalk.cyan(communityId)}/${chalk.cyan(appId)}/${chalk.gray(kbId)}\n`));
    
    let stepNum = 1;
    const totalSteps = skipStaging ? 3 : 4;
    
    // Step 1: Check and push staging (unless skipped)
    if (!skipStaging) {
      const stagingCheck = await checkStagingFiles(stagingDir);
      
      if (stagingCheck.hasFiles) {
        console.log(chalk.white(`[${stepNum}/${totalSteps}] Push staging files to Drive`));
        console.log(chalk.gray(`   Found ${stagingCheck.count} file(s) in staging:`));
        stagingCheck.files.forEach(f => console.log(chalk.gray(`     - ${f}`)));
        console.log('');
        
        await runKbPush(apiClient, { 
          ...options, 
          quiet: true,
          onConflict: interactive ? undefined : 'overwrite'
        });
        console.log('');
      } else {
        console.log(chalk.gray(`[${stepNum}/${totalSteps}] No staging files to push\n`));
      }
      stepNum++;
    }
    
    // Step 2: Pull from Drive
    console.log(chalk.white(`[${stepNum}/${totalSteps}] Pull from Drive`));
    
    // After initial setup, default to merge mode to preserve local files
    const mergeMode = options.mergeMode || 'merge';
    if (mergeMode !== 'force-overwrite') {
      console.log(chalk.gray(`   Mode: ${mergeMode} (use --force-overwrite to replace all)\n`));
    }
    
    await runKbPull(apiClient, { 
      ...options, 
      quiet: true,
      mergeMode 
    });
    console.log('');
    stepNum++;
    
    // Step 3: Chunk
    console.log(chalk.white(`[${stepNum}/${totalSteps}] Generate chunks`));
    await runKbChunk({ ...options, quiet: true });
    console.log('');
    stepNum++;
    
    // Step 4: Sync
    console.log(chalk.white(`[${stepNum}/${totalSteps}] Sync to Pinecone`));
    await runKbSync(apiClient, { ...options, quiet: true });
    
    console.log(chalk.green('\n✅ KB build complete!\n'));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ ${error.message}\n`));
    throw error;
  }
}

// ============ Status Command ============

/**
 * Show KB sync status
 * 
 * @param {DeSciXApiClient} apiClient - API client
 * @param {Object} options - { community, app, kb }
 */
export async function runKbStatus(apiClient, options) {
  const spinner = ora('Checking sync status...').start();
  
  try {
    // Load WorkspaceConfig
    const workspaceConfig = await WorkspaceConfig.load();
    const { communityId, appId, kbId } = workspaceConfig.requireContext(options);

    const workspaceRoot = workspaceConfig.getWorkspaceRoot();
    const appPath = workspaceConfig.getAppByAppId(appId)?.absolutePath;

    const status = await getSyncStatus(apiClient, {
      workspaceRoot,
      communityId,
      appId,
      kbId,
      localPath: appPath ? (path.relative(workspaceRoot, appPath) || '.') : `${communityId}/${appId}`
    });
    
    spinner.stop();
    
    console.log(chalk.cyan(`\n📊 KB Status: ${communityId}/${appId}/${kbId}\n`));
    console.log(chalk.white(`   Local chunks:  ${status.local}`));
    console.log(chalk.white(`   Remote chunks: ${status.remote}`));
    
    if (status.inSync) {
      console.log(chalk.green('\n   ✓ In sync\n'));
    } else {
      console.log(chalk.yellow('\n   ⚠ Out of sync:'));
      if (status.toUpsert > 0) {
        console.log(chalk.gray(`     - ${status.toUpsert} chunks to upsert`));
      }
      if (status.toDelete > 0) {
        console.log(chalk.gray(`     - ${status.toDelete} chunks to delete`));
      }
      console.log(chalk.gray('\n   Run "descix kb sync" to synchronize\n'));
    }
    
    return status;
    
  } catch (error) {
    spinner.fail('Status check failed');
    throw error;
  }
}

// ============ Compare Command ============

/**
 * Show file-level deltas between local and Drive
 * 
 * @param {DeSciXApiClient|null} apiClient - API client (unused)
 * @param {Object} options - { community, app, kb, staging, local }
 */
export async function runKbCompare(apiClient, options) {
  const spinner = ora('Loading workspace configuration...').start();
  
  try {
    // Load WorkspaceConfig
    const workspaceConfig = await WorkspaceConfig.load();
    const { communityId, appId, kbId } = workspaceConfig.requireContext(options);

    const driveConfig = workspaceConfig.driveConfig;
    if (!driveConfig?.base_folder_id) {
      spinner.fail('Drive not configured');
      throw new Error('Run "descix setup --dev" first to link Drive.');
    }

    const workspaceRoot = workspaceConfig.getWorkspaceRoot();
    const appPath = workspaceConfig.getAppByAppId(appId)?.absolutePath;
    const localPath = appPath ? (path.relative(workspaceRoot, appPath) || '.') : `${communityId}/${appId}`;
    
    spinner.text = 'Connecting to Google Drive...';
    
    await driveADC.verifyDriveAuth();
    
    // Get Drive KB folder
    const kbPath = `${communityId}/${appId}/kb/${kbId}`;
    const kbDriveFolderId = await driveADC.findFolderByPath(driveConfig.base_folder_id, kbPath);
    
    spinner.stop();
    
    console.log(chalk.cyan(`\n📊 KB Compare: ${communityId}/${appId}/${kbId}\n`));
    
    // Compare staging → Drive
    if (options.staging !== false) {
      const stagingDir = path.join(workspaceRoot, localPath, 'kb', 'staging');
      const stagingCheck = await checkStagingFiles(stagingDir);
      
      console.log(chalk.white('Staging → Drive:'));
      
      if (!stagingCheck.hasFiles) {
        console.log(chalk.gray('   (no files in staging)\n'));
      } else {
        // Get Drive files for comparison
        const driveFiles = kbDriveFolderId 
          ? await driveADC.listDriveFiles(kbDriveFolderId) 
          : [];
        const driveFileNames = new Set(driveFiles.map(f => f.name.toLowerCase()));
        
        for (const fileName of stagingCheck.files) {
          const existsInDrive = driveFileNames.has(fileName.toLowerCase());
          if (existsInDrive) {
            console.log(chalk.yellow(`   ~ ${fileName}`) + chalk.gray(' (would overwrite)'));
          } else {
            console.log(chalk.green(`   + ${fileName}`) + chalk.gray(' (to upload)'));
          }
        }
        console.log('');
      }
    }
    
    // Compare local KB → Drive
    if (options.local !== false) {
      const kbDir = path.join(workspaceRoot, localPath, 'kb', kbId);
      
      console.log(chalk.white('Local KB ↔ Drive:'));
      
      // Get local files
      let localFiles = [];
      try {
        const entries = await fs.readdir(kbDir, { withFileTypes: true });
        localFiles = entries
          .filter(e => !e.isDirectory() && !e.name.startsWith('.'))
          .map(e => e.name);
      } catch {
        // KB directory doesn't exist
      }
      
      // Get Drive files
      const driveFiles = kbDriveFolderId 
        ? await driveADC.listDriveFiles(kbDriveFolderId) 
        : [];
      
      // Load metadata for hash comparison
      let metadata = { files: {} };
      try {
        const metaPath = path.join(kbDir, '.descix_metadata.json');
        const metaContent = await fs.readFile(metaPath, 'utf-8');
        metadata = JSON.parse(metaContent);
      } catch {
        // No metadata
      }
      
      const localSet = new Set(localFiles.map(f => f.toLowerCase()));
      const driveSet = new Set(driveFiles.map(f => f.name.toLowerCase()));
      
      let hasDeltas = false;
      
      // Files in Drive but not local
      for (const driveFile of driveFiles) {
        const localName = driveFile.name.toLowerCase();
        if (!localSet.has(localName)) {
          console.log(chalk.cyan(`   ↓ ${driveFile.name}`) + chalk.gray(' (Drive only)'));
          hasDeltas = true;
        }
      }
      
      // Files in local
      for (const localFile of localFiles) {
        const meta = metadata.files?.[localFile];
        
        if (!driveSet.has(localFile.toLowerCase())) {
          // Local only
          console.log(chalk.magenta(`   * ${localFile}`) + chalk.gray(' (local only)'));
          hasDeltas = true;
        } else if (meta?.drive_modified) {
          // In both - check if in sync
          const driveFile = driveFiles.find(f => f.name.toLowerCase() === localFile.toLowerCase());
          if (driveFile && driveFile.modifiedTime !== meta.drive_modified) {
            console.log(chalk.yellow(`   ↻ ${localFile}`) + chalk.gray(' (Drive updated)'));
            hasDeltas = true;
          } else {
            console.log(chalk.green(`   = ${localFile}`) + chalk.gray(' (in sync)'));
          }
        } else {
          console.log(chalk.gray(`   ? ${localFile}`) + chalk.gray(' (unknown sync state)'));
          hasDeltas = true;
        }
      }
      
      if (!hasDeltas && localFiles.length === 0 && driveFiles.length === 0) {
        console.log(chalk.gray('   (no files)\n'));
      } else {
        console.log('');
      }
    }
    
    // Legend
    console.log(chalk.gray('Legend: + new  ~ overwrite  ↓ Drive only  * local only  = in sync  ↻ updated\n'));
    
    return { communityId, appId, kbId };
    
  } catch (error) {
    spinner.fail('Compare failed');
    throw error;
  }
}


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

  // (a) Pinecone live vector count
  let vectorCount = null;
  let ragStatus = null;
  try {
    const res = await apiClient.invoke('get_kb_rag_status', {
      app_id: appId,
      kb_id: kbName
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
  runKbChunk,
  runKbSync,
  runKbBuild,
  runKbStatus,
  runKbCompare,
  runKbDoctor
};
