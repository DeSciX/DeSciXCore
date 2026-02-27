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

    // 3. Validate Drive configuration
    const driveConfig = workspaceConfig.driveConfig;
    if (!driveConfig?.base_folder_id) {
      spinner.fail('Drive not configured');
      console.log(chalk.yellow('\n💡 Run "descix setup --dev" first to link Drive.\n'));
      throw new Error('The base_folder_id is required for KB operations.');
    }

    // 4. Get paths
    const workspaceRoot = workspaceConfig.getWorkspaceRoot();
    const appPath = workspaceConfig.getAppByAppId(appId)?.absolutePath;
    
    // 5. Delegate to Hydrator with merge mode options
    spinner.text = 'Connecting to Google Drive...';
    
    const result = await hydrateKb({
      workspaceRoot,
      communityId,
      appId,
      kbId,
      baseFolderId: driveConfig.base_folder_id,
      localPath: appPath ? appPath.replace(workspaceRoot + '/', '') : `${communityId}/${appId}`
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
    const localPath = appPath ? appPath.replace(workspaceRoot + '/', '') : `${communityId}/${appId}`;
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
 * @param {Object} options - { community, app, kb, chunkSize, overlap, verbose }
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
    
    // 4. Delegate to Chunker
    const chunkOptions = {
      maxChunkSize: parseInt(options.chunkSize || 2000),
      overlapSize: parseInt(options.overlap || 500),
      verbose: options.verbose
    };
    
    if (options.verbose) {
      console.log(chalk.gray(`  Chunk size: ${chunkOptions.maxChunkSize}`));
      console.log(chalk.gray(`  Overlap: ${chunkOptions.overlapSize}`));
    }
    
    const result = await processKb({
      workspaceRoot,
      communityId,
      appId,
      kbId,
      localPath: appPath ? appPath.replace(workspaceRoot + '/', '') : `${communityId}/${appId}`
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
      localPath: appPath ? appPath.replace(workspaceRoot + '/', '') : `${communityId}/${appId}`
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
    const localPath = appPath ? appPath.replace(workspaceRoot + '/', '') : `${communityId}/${appId}`;
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
      localPath: appPath ? appPath.replace(workspaceRoot + '/', '') : `${communityId}/${appId}`
    });
    
    spinner.stop();
    
    console.log(chalk.cyan(`\n📊 KB Status: ${communityId}/${appId}/${kbId}\n`));
    console.log(chalk.white(`   Local chunks:  ${status.local}`));
    console.log(chalk.white(`   Remote chunks: ${status.remote}`));
    
    if (status.inSync) {
      console.log(chalk.green('\n   ✓ In sync\n'));
    } else {
      console.log(chalk.yellow('\n   ⚠ Out of sync:'));
      if (status.toUpload > 0) {
        console.log(chalk.gray(`     - ${status.toUpload} chunks to upload`));
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
    const localPath = appPath ? appPath.replace(workspaceRoot + '/', '') : `${communityId}/${appId}`;
    
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

export default {
  runKbPull,
  runKbPush,
  runKbChunk,
  runKbSync,
  runKbBuild,
  runKbStatus,
  runKbCompare
};
