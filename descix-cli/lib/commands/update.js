/**
 * Update Commands - Context-Driven Resource Syncing
 * 
 * Commands for updating resources based on workspace.json context detection:
 *   descix update          # Auto-detect what to update
 *   descix update app      # Sync app assets to Drive
 *   descix update kb       # Sync KB + vectorize
 *   descix update site     # Deploy site to GCS
 *   descix update all      # Update everything
 * 
 * Uses WorkspaceConfig as sole configuration methodology.
 * Folder structure follows convention:
 *   {appPath}/assets/      - App assets (icon, description, system_instructions)
 *   {appPath}/kb/{kbId}/   - Knowledge base files
 *   {appPath}/site/        - Static site files
 *   {appPath}/microservice/ - Microservice code
 */

import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs/promises';
import * as path from 'path';
import crypto from 'crypto';
import { DeSciXApiClient } from '../api-client.js';
import { requireAuth } from '../auth-guard.js';
import { WorkspaceConfig } from '../workspace-config.js';
import { refuseRetiredKbSync } from './retired-kb-sync.js';

/**
 * Helper to load workspace context with options override
 * Unified Registry: app_id only required; community_id derived on backend
 * @param {Object} options - CLI options with community, app, kb
 * @returns {{ workspaceConfig, communityId, appId, kbId, appPath }}
 */
async function loadWorkspaceContext(options = {}) {
  const workspaceConfig = await WorkspaceConfig.load();
  const ctx = workspaceConfig.requireContext(options);

  // Unified Registry: getAppByAppId only — v1 community-keyed fallback removed
  const appConfig = workspaceConfig.getAppByAppId(ctx.appId);

  if (!appConfig) {
    throw new Error(
      `App "${ctx.appId}" not found in workspace.json.\n` +
      'Use `descix app init` to register, or `descix app set-localpath -a <id> -p <path>` to repoint.'
    );
  }

  const appPath = appConfig.absolutePath ||
    (appConfig.localPath && workspaceConfig.workspaceRoot
      ? path.join(workspaceConfig.workspaceRoot, appConfig.localPath)
      : null);

  if (!appPath) {
    throw new Error(`App path not configured for ${ctx.appId}`);
  }

  return {
    workspaceConfig,
    communityId: ctx.communityId || appConfig.communityId,
    appId: ctx.appId,
    kbId: ctx.kbId || appConfig.kbId || 'General',
    appPath
  };
}

/**
 * Compute SHA256 hash of file content
 */
function computeHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Read all files from a directory
 */
async function readDirectoryFiles(dirPath) {
  const files = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue; // Skip hidden files
      
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isFile()) {
        const content = await fs.readFile(fullPath);
        files.push({
          name: entry.name,
          path: entry.name,
          content: content.toString('base64'),
          hash: computeHash(content),
          size: content.length
        });
      } else if (entry.isDirectory()) {
        // Recursive read for subdirectories
        const subFiles = await readDirectoryFilesRecursive(fullPath, entry.name);
        files.push(...subFiles);
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  
  return files;
}

/**
 * Recursively read files from directory
 */
async function readDirectoryFilesRecursive(dirPath, basePath = '') {
  const files = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.join(basePath, entry.name);
    
    if (entry.isFile()) {
      const content = await fs.readFile(fullPath);
      files.push({
        name: entry.name,
        path: relativePath,
        content: content.toString('base64'),
        hash: computeHash(content),
        size: content.length
      });
    } else if (entry.isDirectory()) {
      const subFiles = await readDirectoryFilesRecursive(fullPath, relativePath);
      files.push(...subFiles);
    }
  }
  
  return files;
}

/**
 * Auto-detect and run appropriate update based on current directory
 */
export async function updateAuto(options = {}) {
  const spinner = ora('Loading context...').start();
  
  try {
    const ctx = await loadWorkspaceContext(options);
    const cwd = process.cwd();
    
    // Detect what to sync based on current directory relative to app path
    const relativePath = path.relative(ctx.appPath, cwd);
    let syncType = 'app'; // default
    
    if (relativePath.startsWith('kb') || relativePath.startsWith('kb/')) {
      syncType = 'kb';
    } else if (relativePath.startsWith('site') || relativePath.startsWith('site/')) {
      syncType = 'site';
    } else if (relativePath.startsWith('assets') || relativePath.startsWith('assets/')) {
      syncType = 'app';
    } else if (relativePath.startsWith('microservice') || relativePath.startsWith('microservice/')) {
      syncType = 'microservice';
    }
    
    spinner.succeed(`Context loaded: ${ctx.communityId || '?'}/${ctx.appId}`);
    console.log(chalk.gray(`  Auto-detected sync type: ${syncType}\n`));
    
    // Route to appropriate update function
    switch (syncType) {
      case 'app':
        return await updateApp(options);
      case 'kb':
        // kb sync has exactly ONE surface. Auto-detect lands here whenever the user is
        // standing in the app's kb/ directory, so this path is REACHED in normal use —
        // it is the single most likely way someone still tries to sync a KB via `update`.
        // Refuses through the one owner so this branch and the explicit `update kb`
        // branch cannot drift apart.
        spinner.stop();
        return refuseRetiredKbSync('descix update kb', chalk.red);
      case 'site':
        return await updateSite(options);
      case 'microservice':
        console.log(chalk.yellow('  Microservice deployment not supported via update. Use \'descix deploy\'.\n'));
        return { success: false, reason: 'use_deploy' };
      default:
        console.log(chalk.yellow(`  Unknown sync type: ${syncType}. Use 'descix update app/kb/site' explicitly.\n`));
        return { success: false, reason: 'unknown_sync_type' };
    }
    
  } catch (error) {
    spinner.fail('Update failed');
    console.error(chalk.red(`\n❌ ${error.message}\n`));
    throw error;
  }
}

/**
 * Update app assets (icon, description, system_instructions)
 * Stage 1: Local → Drive (DIRECT using ADC - no backend)
 * Stage 2: Drive → GCS/Firestore (backend refresh_listing_assets)
 * 
 * Convention: Assets are in {appPath}/assets/
 */
export async function updateApp(options = {}) {
  const apiClient = new DeSciXApiClient();
  await requireAuth(apiClient);
  
  const spinner = ora('Loading context...').start();
  
  try {
    const ctx = await loadWorkspaceContext(options);
    
    spinner.text = 'Reading app assets...';
    
    // Convention: assets folder
    const assetsDir = path.join(ctx.appPath, 'assets');
    
    // Get list of local asset files
    let localFiles = [];
    try {
      const entries = await fs.readdir(assetsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && !entry.name.startsWith('.')) {
          const fullPath = path.join(assetsDir, entry.name);
          const stats = await fs.stat(fullPath);
          localFiles.push({
            name: entry.name,
            path: fullPath,
            size: stats.size,
            modifiedTime: stats.mtime.toISOString()
          });
        }
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        spinner.succeed('No app assets to sync');
        console.log(chalk.gray(`\n  Directory: ${assetsDir}`));
        console.log(chalk.gray('  No files found.\n'));
        return { success: true, synced: 0 };
      }
      throw error;
    }
    
    if (localFiles.length === 0) {
      spinner.succeed('No app assets to sync');
      console.log(chalk.gray(`\n  Directory: ${assetsDir}`));
      console.log(chalk.gray('  No files found.\n'));
      return { success: true, synced: 0 };
    }
    
    spinner.succeed(`Found ${localFiles.length} files`);
    
    console.log(chalk.cyan('\n📤 Updating App Assets\n'));
    console.log(chalk.gray(`  Community: ${ctx.communityId}`));
    console.log(chalk.gray(`  App: ${ctx.appId}`));
    console.log(chalk.gray(`  Source: ${assetsDir}\n`));
    
    // Show files
    console.log(chalk.gray('  Files:'));
    localFiles.forEach(f => {
      console.log(chalk.gray(`    • ${f.name} (${(f.size / 1024).toFixed(1)}KB)`));
    });
    console.log('');
    
    // Stage 1: Upload directly to Drive using ADC
    spinner.start('Stage 1: Uploading to Drive (direct)...');
    
    const googleStorageADC = await import('../google-storage-adc.js');
    
    // Get base folder ID from workspace config or user profile
    let baseFolderId = ctx.workspaceConfig.driveConfig?.base_folder_id;
    
    if (!baseFolderId) {
      // `get_my_profile` was a call to a verb NOTHING SERVES: it is absent from Cloud's command
      // registry and had zero references anywhere in DeSciX_Cloud, DeSciX_Core or DeSciX_Powch
      // outside this one call site (measured 2026-08-29). `get_folder_info` is the served,
      // AUTHENTICATED verb that owns this fact — registry.js maps it to appCommands.js, and for
      // entity_type 'user' it returns the caller's own base_folder_id as `folder_id`.
      const folderInfo = await apiClient.invoke('get_folder_info', { entity_type: 'user' });
      baseFolderId = folderInfo.message?.folder_id;
    }
    
    if (!baseFolderId) {
      throw new Error('No base Drive folder configured. Run descix login --setup first.');
    }
    
    // Navigate to assets folder: {base}/{community}/{app}/assets
    const assetsPath = `${ctx.communityId}/${ctx.appId}/assets`;
    let assetsFolderId = await googleStorageADC.findFolderByPath(baseFolderId, assetsPath);
    
    if (!assetsFolderId) {
      spinner.text = 'Stage 1: Creating folder structure...';
      assetsFolderId = await googleStorageADC.ensureFolderPath(baseFolderId, assetsPath);
    }
    
    // List Drive files for delta comparison
    const driveFiles = await googleStorageADC.listFolderWithMeta(assetsFolderId);
    
    // Compute delta
    const { toUpload, toUpdate, unchanged } = googleStorageADC.computeDelta(localFiles, driveFiles);
    
    // Upload changed files directly to Drive
    const uploaded = [];
    for (const file of [...toUpload, ...toUpdate]) {
      spinner.text = `Stage 1: Uploading ${file.name}...`;
      await googleStorageADC.uploadFileToDrive(file.path, file.name, assetsFolderId);
      uploaded.push(file.name);
    }
    
    spinner.succeed(`Stage 1: ${uploaded.length} files uploaded (${unchanged.length} unchanged)`);
    
    // Stage 2: Trigger backend to sync Drive → GCS/Firestore
    spinner.start('Stage 2: Syncing to platform...');
    
    const response = await apiClient.invoke('refresh_listing_assets', {
      community_id: ctx.communityId,
      app_id: ctx.appId
    });
    
    const result = response.message || response;
    
    spinner.succeed('Stage 2: Platform sync complete');
    
    // Summary
    if (uploaded.length > 0) {
      console.log(chalk.green('\n  Uploaded to Drive:'));
      uploaded.forEach(f => console.log(chalk.green(`    ✓ ${f}`)));
    }
    
    if (unchanged.length > 0) {
      console.log(chalk.gray('\n  Unchanged:'));
      unchanged.forEach(f => console.log(chalk.gray(`    • ${f.name}`)));
    }
    
    if (result.icon_updated) {
      console.log(chalk.green('\n  ✓ Icon synced to platform'));
    }
    if (result.description_updated) {
      console.log(chalk.green('  ✓ Description synced to platform'));
    }
    if (result.system_instructions_updated) {
      console.log(chalk.green('  ✓ System instructions synced to platform'));
    }
    
    if (result.errors?.length > 0) {
      console.log(chalk.yellow('\n  Errors:'));
      result.errors.forEach(e => console.log(chalk.yellow(`    ⚠ ${e}`)));
    }
    
    console.log('');
    return { success: true, uploaded, unchanged: unchanged.map(f => f.name), ...result };
    
  } catch (error) {
    spinner.fail('Update failed');
    console.error(chalk.red(`\n❌ ${error.message}\n`));
    throw error;
  }
}

// updateKB is DELETED. `update kb` refuses and names `descix kb corpus sync`; `update all`
// and `update auto` no longer touch the KB. No exported symbol survives without a caller.

/**
 * Update site (deploy to GCS)
 * Convention: Site files are in {appPath}/site/
 */
export async function updateSite(options = {}) {
  const apiClient = new DeSciXApiClient();
  await requireAuth(apiClient);
  
  const spinner = ora('Loading context...').start();
  
  try {
    const ctx = await loadWorkspaceContext(options);
    
    // Convention: site folder path
    const siteDir = path.join(ctx.appPath, 'site');
    
    // Handle local port registration — setSitePort mutates the live env entry and saves
    if (options.port) {
      spinner.text = `Registering local port: ${options.port}`;
      try {
        await ctx.workspaceConfig.setSitePort(ctx.appId, options.port);
        console.log(chalk.green(`\n✅ Local port ${options.port} registered in workspace.json`));
      } catch (err) {
        console.log(chalk.yellow(`\n⚠️  Could not register port: ${err.message}`));
      }
    }

    // Run build command if specified
    if (options.build) {
      spinner.text = `Running build: ${options.build}`;
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      try {
        await execAsync(options.build, { cwd: siteDir });
        spinner.succeed('Build completed');
      } catch (error) {
        spinner.fail('Build failed');
        console.error(chalk.red(`\n❌ ${error.message}\n`));
        return { success: false, reason: 'build_failed' };
      }
    }
    
    spinner.text = 'Reading site files...';
    
    // Import GitUtils for file hashing (same as site deploy command)
    const { GitUtils } = await import('@descix/sdk/integrations/git');
    const mime = (await import('mime-types')).default;
    
    const gitUtils = new GitUtils(ctx.appPath);
    const localFiles = await gitUtils.getFileHashes(siteDir);
    
    const fileList = Object.entries(localFiles).map(([filePath, info]) => ({
      path: filePath,
      hash: info.hash,
      size: info.size,
      content_type: mime.lookup(filePath) || 'application/octet-stream'
    }));
    
    spinner.succeed(`Found ${fileList.length} files`);
    
    if (fileList.length === 0) {
      console.log(chalk.yellow('\n  No files found in site directory. Nothing to deploy.\n'));
      return { success: true, synced: 0 };
    }
    
    console.log(chalk.cyan('\n📤 Deploying CodeSite\n'));
    console.log(chalk.gray(`  Community: ${ctx.communityId}`));
    console.log(chalk.gray(`  App: ${ctx.appId}`));
    console.log(chalk.gray(`  Source: ${siteDir}`));
    if (options.preview) console.log(chalk.yellow(`  Mode: PREVIEW`));
    console.log('');
    
    // Request deploy token
    spinner.start('Requesting deploy token...');
    
    const tokenResponse = await apiClient.invoke('get_site_deploy_token', {
      community_id: ctx.communityId,
      app_id: ctx.appId,
      files: fileList,
      preview: options.preview || false
    });
    
    const { signed_urls, upload_headers, existing_manifest, token_id, site_url } = tokenResponse.message;
    
    // Determine delta
    let filesToUpload = fileList;
    
    if (!options.full && existing_manifest) {
      const delta = gitUtils.compareSyncState(localFiles, existing_manifest);
      filesToUpload = fileList.filter(f => 
        delta.added.includes(f.path) || delta.modified.includes(f.path)
      );
      spinner.succeed(`Delta: ${delta.added.length} added, ${delta.modified.length} modified, ${delta.unchanged.length} unchanged`);
    } else {
      spinner.succeed('Full upload');
    }
    
    if (filesToUpload.length === 0) {
      console.log(chalk.green('\n✅ Site already up to date!\n'));
      console.log(chalk.cyan(`  URL: ${site_url}\n`));
      return { success: true, synced: 0, url: site_url };
    }
    
    // Upload files
    spinner.start(`Uploading ${filesToUpload.length} files...`);
    
    let uploadedCount = 0;
    
    for (const file of filesToUpload) {
      const signedUrl = signed_urls[file.path];
      if (!signedUrl) continue;
      
      const content = await fs.readFile(path.join(siteDir, file.path));

      // Canonical contract (WS-DEPLOY-HARDENING item 4): the server binds Cache-Control into
      // the v4 signed URL signature (generateSiteUploadUrls/siteAssetCacheControl). Ferry the
      // exact header bag the server minted — never re-derive the policy client-side, and never
      // send a header the signature doesn't expect (GCS returns 403 signature-mismatch).
      const headers = (upload_headers && upload_headers[file.path]) || { 'Content-Type': file.content_type };
      const response = await fetch(signedUrl, {
        method: 'PUT',
        headers,
        body: content
      });
      
      if (response.ok) uploadedCount++;
    }
    
    spinner.succeed(`Uploaded ${uploadedCount} files`);
    
    // Confirm deployment
    spinner.start('Confirming deployment...');
    
    const confirmResponse = await apiClient.invoke('confirm_site_deploy', {
      community_id: ctx.communityId,
      app_id: ctx.appId,
      token_id: token_id,
      manifest: {
        version: '1.0',
        app_id: ctx.appId,
        community_id: ctx.communityId,
        files: localFiles
      },
      preview: options.preview || false
    });
    
    const result = confirmResponse.message;
    
    spinner.succeed('Site deployed!');
    
    console.log(chalk.green(`\n✅ CodeSite deployed successfully!\n`));
    console.log(chalk.cyan(`  URL: ${result.site_url}`));
    console.log(chalk.gray(`  Files: ${result.files_count}\n`));
    
    return { success: true, url: result.site_url, files: result.files_count };
    
  } catch (error) {
    spinner.fail('Deployment failed');
    console.error(chalk.red(`\n❌ ${error.message}\n`));
    throw error;
  }
}

/**
 * Update all resources (assets, KB, site)
 * Convention-based: checks for existence of assets/, kb/, site/ folders
 */
export async function updateAll(options = {}) {
  const spinner = ora('Loading context...').start();
  
  try {
    const ctx = await loadWorkspaceContext(options);
    spinner.succeed(`Context: ${ctx.communityId}/${ctx.appId}`);
    
    console.log(chalk.cyan('\n📤 Updating All Resources\n'));
    
    const results = {};
    
    // Check for assets folder and update if exists
    const assetsDir = path.join(ctx.appPath, 'assets');
    try {
      await fs.access(assetsDir);
      console.log(chalk.white('─── App Assets ───\n'));
      results.app = await updateApp(options);
    } catch {
      // assets folder doesn't exist, skip
    }
    
    // Knowledge bases are NOT part of `update all`. The one KB sync surface is
    // `descix kb corpus sync` (git-manifest); this composite keeps doing app and site.

    // Check for site folder and update if exists
    const siteDir = path.join(ctx.appPath, 'site');
    try {
      await fs.access(siteDir);
      console.log(chalk.white('\n─── CodeSite ───\n'));
      results.site = await updateSite(options);
    } catch {
      // site folder doesn't exist, skip
    }
    
    console.log(chalk.green('\n✅ All resources updated!\n'));
    
    return { success: true, results };
    
  } catch (error) {
    spinner.fail('Update failed');
    console.error(chalk.red(`\n❌ ${error.message}\n`));
    throw error;
  }
}

export default {
  updateAuto,
  updateApp,
  updateSite,
  updateAll
};
