/**
 * Hydrator - Canonical module for all Drive sync operations
 * 
 * Responsibilities:
 * - Pull content from Drive to local filesystem
 * - Push staging files to Drive
 * - Convert files using Drive's native capabilities (no local tools)
 * - Conflict detection and resolution
 * 
 * Architecture:
 * - Uses ADC (Application Default Credentials) for direct Drive access
 * - Drive-Native processing: PDF/Image -> Google Doc -> Markdown export
 * - Client-Side Mediation: No backend involvement for file transfers
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * ONE OWNER for scaffold path resolution. Hydrator.js lives at descix-cli/lib/core/, so two
 * '..' walks reach the CLI package root. Two functions used to resolve this independently and
 * they DISAGREED — copyScaffold walked two, getAvailableScaffolds walked four (and used a
 * hand-rolled import.meta.url.replace('file://','') instead of fileURLToPath). The four-walk
 * path does not exist, so getAvailableScaffolds returned [] on every call, and its bare catch
 * made a path bug indistinguishable from "no scaffolds are installed".
 */
const CLI_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCAFFOLDS_DIR = path.join(CLI_ROOT, 'templates', 'scaffolds');
import { google } from 'googleapis';
import * as driveADC from '../google-storage-adc.js';

// Google Drive MIME type constants
const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder';

// MIME types that can be converted to Google Docs for text extraction
const CONVERTIBLE_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/msword', // DOC
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp'
];

// Google Workspace MIME types that export directly
const GOOGLE_WORKSPACE_EXPORTS = {
  'application/vnd.google-apps.document': { mimeType: 'text/markdown', extension: '.md' },
  'application/vnd.google-apps.spreadsheet': { mimeType: 'text/csv', extension: '.csv' },
  'application/vnd.google-apps.presentation': { mimeType: 'text/plain', extension: '.txt' }
};

// Standard app folders that contain syncable content
const SYNCABLE_FOLDERS = ['assets', 'kb', 'site', 'microservice'];

/**
 * Get ADC-based authentication for Google APIs
 */
async function getADCAuth() {
  const auth = new google.auth.GoogleAuth({
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file'
    ]
  });
  return auth;
}

/**
 * Convert a file to Google Doc and export as markdown
 * This is the "Drive-Native" processing pattern:
 * - PDF/DOCX/Images are copied with convert=true to create a Google Doc
 * - Google performs OCR and text extraction
 * - Export as Markdown for local storage
 * 
 * @param {string} fileId - Drive file ID to convert
 * @returns {Promise<string>} Markdown content
 */
async function convertAndExportAsMarkdown(fileId) {
  const auth = await getADCAuth();
  const drive = google.drive({ version: 'v3', auth });
  
  // Copy file with conversion to Google Doc
  const copy = await drive.files.copy({
    fileId,
    requestBody: {
      mimeType: 'application/vnd.google-apps.document',
      name: 'Temp Converted Doc'
    },
    supportsAllDrives: true
  });
  
  const convertedDocId = copy.data.id;
  
  try {
    // Export as Markdown
    const res = await drive.files.export({
      fileId: convertedDocId,
      mimeType: 'text/markdown'
    }, { responseType: 'text' });
    
    return res.data;
  } finally {
    // Clean up temporary document
    try {
      await drive.files.delete({ fileId: convertedDocId, supportsAllDrives: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Download and convert a single file to text format
 * 
 * @param {Object} driveFile - { id, name, mimeType } from Drive
 * @param {string} localDir - Local directory to save to
 * @returns {Promise<{localPath: string, converted: boolean}>}
 */
async function convertAndSave(driveFile, localDir) {
  const auth = await getADCAuth();
  const drive = google.drive({ version: 'v3', auth });
  
  const { id, name, mimeType } = driveFile;
  
  // Determine export strategy based on MIME type
  const googleExport = GOOGLE_WORKSPACE_EXPORTS[mimeType];
  const isConvertible = CONVERTIBLE_MIME_TYPES.includes(mimeType);
  
  let content;
  let targetName;
  let converted = false;
  
  if (googleExport) {
    // Google Workspace file - export directly
    const res = await drive.files.export({
      fileId: id,
      mimeType: googleExport.mimeType
    }, { responseType: 'text' });
    
    content = res.data;
    targetName = name.replace(/\.[^.]+$/, '') + googleExport.extension;
    converted = true;
  } else if (isConvertible) {
    // PDF/DOCX/Image - convert via Google Doc
    content = await convertAndExportAsMarkdown(id);
    targetName = name.replace(/\.[^.]+$/, '') + '.md';
    converted = true;
  } else {
    // Regular file - download as-is
    const res = await drive.files.get(
      { fileId: id, alt: 'media' },
      { responseType: 'text' }
    );
    content = res.data;
    targetName = name;
    converted = false;
  }
  
  // Write to local filesystem
  const localPath = path.join(localDir, targetName);
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  await fs.writeFile(localPath, content, 'utf-8');
  
  return { localPath, converted };
}

/**
 * Check if a directory has any content (files or subdirectories with files)
 * @param {string} dirPath - Directory path to check
 * @returns {Promise<boolean>}
 */
async function hasContent(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile()) {
        return true;
      }
      if (entry.isDirectory()) {
        const hasSubContent = await hasContent(path.join(dirPath, entry.name));
        if (hasSubContent) return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Recursively pull app content from Drive to local filesystem
 * Handles Google Workspace files and convertible files (PDF, DOCX, images)
 * 
 * @param {string} localPath - Local directory path
 * @param {string} driveFolderId - Drive folder ID to pull from
 * @param {Object} options - { mergeMode: 'overwrite'|'merge', verbose: boolean }
 * @returns {Promise<{downloaded: number, skipped: number, converted: number}>}
 */
async function pullFolder(localPath, driveFolderId, options = {}) {
  const { mergeMode = 'overwrite', verbose = false } = options;
  const stats = { downloaded: 0, skipped: 0, converted: 0 };
  
  await fs.mkdir(localPath, { recursive: true });
  
  const driveFiles = await driveADC.listFolderWithMeta(driveFolderId);
  
  for (const file of driveFiles) {
    const targetPath = path.join(localPath, file.name);
    
    if (file.mimeType === DRIVE_FOLDER_MIME) {
      // Recurse into subfolders
      const subStats = await pullFolder(targetPath, file.id, options);
      stats.downloaded += subStats.downloaded;
      stats.skipped += subStats.skipped;
      stats.converted += subStats.converted;
    } else {
      // Check if file exists locally
      let localExists = false;
      try {
        await fs.access(targetPath);
        localExists = true;
      } catch {
        localExists = false;
      }
      
      if (localExists && mergeMode === 'merge') {
        stats.skipped++;
        if (verbose) console.log(`  Skipped: ${file.name} (local exists)`);
      } else {
        // Download/convert the file
        const result = await driveADC.downloadFileFromDrive(file.id, targetPath, file.mimeType);
        stats.downloaded++;
        if (result.exported) stats.converted++;
        if (verbose) console.log(`  Downloaded: ${file.name}${result.exported ? ' (converted)' : ''}`);
      }
    }
  }
  
  return stats;
}

/**
 * Hydrate a specific Knowledge Base from Drive
 * 
 * Folder Structure Created:
 * - kb/staging/   - Local originals to push to Drive
 * - kb/General/   - Text-only mirror of Drive (auto-converted)
 * - kb/chunks/    - Processed JSON chunks
 * 
 * Enhanced with:
 * - Merge mode options (merge, overwrite, force-overwrite)
 * - Hash-based incremental sync (skip unchanged files)
 * - Never deletes local files not in Drive
 * 
 * @param {Object} config - { workspaceRoot, communityId, appId, kbId, baseFolderId, localPath }
 * @param {Object} options - Hydration options
 * @param {boolean} options.verbose - Enable verbose output
 * @param {string} options.mergeMode - 'merge' | 'overwrite' | 'force-overwrite' (default: 'merge')
 * @param {boolean} options.skipUnchanged - Skip files where hash matches (default: true)
 * @param {boolean} options.dryRun - Show what would happen without making changes
 * @param {function} options.onProgress - Progress callback
 * @returns {Promise<{pulled: number, converted: number, skipped: number, unchanged: number}>}
 */
export async function hydrateKb(config, options = {}) {
  const { workspaceRoot, communityId, appId, kbId = 'General', baseFolderId, directFolderId, localPath } = config;
  const {
    verbose = false,
    mergeMode = 'merge',
    skipUnchanged = true,
    dryRun = false,
    onProgress = null
  } = options;

  // Verify ADC auth
  await driveADC.verifyDriveAuth();

  // Resolve the KB Drive folder: direct override or navigate via base_folder_id
  let kbDriveFolderId;
  if (directFolderId) {
    // --folder override: use the provided folder ID directly (arbitrary Drive folder)
    kbDriveFolderId = directFolderId;
    if (verbose) console.log(`  Using override folder: ${directFolderId}`);
  } else {
    // Standard path: navigate to KB folder using template path
    const kbPath = `${communityId}/${appId}/kb/${kbId}`;
    kbDriveFolderId = await driveADC.findFolderByPath(baseFolderId, kbPath);

    if (!kbDriveFolderId) {
      throw new Error(
        `KB folder not found at path: ${kbPath}\n` +
        'Ensure the app was created from template and the KB folder exists in Drive.'
      );
    }
  }
  
  // Prepare local directories with new structure
  const appLocalPath = localPath || `${communityId}/${appId}`;
  const kbBaseDir = path.join(workspaceRoot, appLocalPath, 'kb');
  const kbTargetDir = path.join(kbBaseDir, kbId);  // kb/General
  const stagingDir = path.join(kbBaseDir, 'staging');
  const chunksDir = path.join(kbBaseDir, 'chunks');
  
  if (!dryRun) {
    // Create all directories
    await fs.mkdir(kbTargetDir, { recursive: true });
    await fs.mkdir(stagingDir, { recursive: true });
    await fs.mkdir(chunksDir, { recursive: true });
  }
  
  // Migration: if old kb/src/ exists, rename to kb/staging/
  if (!dryRun) {
    const oldSrcDir = path.join(kbBaseDir, 'src');
    try {
      const oldSrcExists = await fs.stat(oldSrcDir).then(() => true).catch(() => false);
      if (oldSrcExists) {
        const srcContents = await fs.readdir(oldSrcDir);
        for (const item of srcContents) {
          const srcPath = path.join(oldSrcDir, item);
          const destPath = path.join(stagingDir, item);
          await fs.rename(srcPath, destPath);
        }
        await fs.rmdir(oldSrcDir);
        if (verbose) console.log('  Migrated kb/src/ to kb/staging/');
      }
    } catch {
      // Ignore migration errors
    }
  }
  
  // Load existing metadata for hash comparison
  const metadataPath = path.join(kbTargetDir, '.descix_metadata.json');
  let existingMetadata = { files: {} };
  try {
    const metaContent = await fs.readFile(metadataPath, 'utf-8');
    existingMetadata = JSON.parse(metaContent);
  } catch {
    // No existing metadata
  }
  
  // List files in KB folder
  const driveFiles = await driveADC.listFolderWithMeta(kbDriveFolderId);
  
  if (driveFiles.length === 0) {
    return { pulled: 0, converted: 0, skipped: 0, unchanged: 0 };
  }
  
  // Download and convert files
  const stats = { pulled: 0, converted: 0, skipped: 0, unchanged: 0 };
  const metadata = {
    version: '2.0',
    last_pull: new Date().toISOString(),
    source_kb: kbId,
    merge_mode: mergeMode,
    files: { ...existingMetadata.files }  // Preserve existing local-only file metadata
  };
  
  for (const file of driveFiles) {
    if (file.mimeType === DRIVE_FOLDER_MIME) continue;
    if (file.name.startsWith('.')) continue;
    
    if (onProgress) onProgress(`Processing ${file.name}...`);
    
    try {
      // Determine output filename (converted files get .md extension)
      const outputName = getConvertedFilename(file.name, file.mimeType);
      const localFilePath = path.join(kbTargetDir, outputName);
      
      // Check if local file exists
      let localExists = false;
      let localHash = null;
      try {
        await fs.access(localFilePath);
        localExists = true;
        if (skipUnchanged) {
          localHash = await driveADC.computeFileHash(localFilePath);
        }
      } catch {
        // File doesn't exist locally
      }
      
      // Determine if we should download based on merge mode
      let shouldDownload = true;
      let reason = '';
      
      if (localExists) {
        const existingMeta = existingMetadata.files?.[outputName];
        
        if (mergeMode === 'merge') {
          // Merge mode: keep local files, only add new from Drive
          shouldDownload = false;
          reason = 'merge mode - keeping local';
          stats.skipped++;
        } else if (mergeMode === 'overwrite') {
          // Overwrite mode: replace if Drive is newer or hash differs
          if (existingMeta?.drive_id === file.id && existingMeta?.drive_modified === file.modifiedTime) {
            // Same file, check hash
            if (skipUnchanged && localHash && existingMeta?.local_hash === localHash) {
              shouldDownload = false;
              reason = 'unchanged (hash match)';
              stats.unchanged++;
            }
          }
        }
        // force-overwrite mode: always download
      }
      
      if (shouldDownload) {
        if (dryRun) {
          if (verbose) {
            const action = localExists ? 'overwrite' : 'download';
            console.log(`  [DRY RUN] Would ${action}: ${file.name} → ${outputName}`);
          }
          stats.pulled++;
        } else {
          const result = await convertAndSave(file, kbTargetDir);
          
          // Compute hash of saved file for metadata
          const savedHash = await driveADC.computeFileHash(result.localPath);
          
          metadata.files[path.basename(result.localPath)] = {
            drive_id: file.id,
            drive_name: file.name,
            drive_mime: file.mimeType,
            drive_modified: file.modifiedTime,
            converted: result.converted,
            converted_at: new Date().toISOString(),
            local_hash: savedHash
          };
          
          stats.pulled++;
          if (result.converted) stats.converted++;
          
          if (verbose) {
            const action = localExists ? '↻' : '✓';
            console.log(`  ${action} ${file.name}${result.converted ? ' (converted)' : ''}`);
          }
        }
      } else {
        if (verbose) {
          console.log(`  ⊘ ${file.name} (${reason})`);
        }
        
        // Keep existing metadata for skipped files
        if (existingMetadata.files?.[outputName]) {
          metadata.files[outputName] = existingMetadata.files[outputName];
        }
      }
    } catch (error) {
      if (verbose) console.log(`  ✗ ${file.name}: ${error.message}`);
    }
  }
  
  // Write metadata file (preserves local-only files in metadata)
  if (!dryRun) {
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }
  
  return stats;
}

/**
 * Get the converted filename for a Drive file
 * Helper to determine output filename based on MIME type
 */
function getConvertedFilename(originalName, mimeType) {
  const ext = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, ext);
  
  // Google Docs types get converted to .md
  const googleDocTypes = [
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.google-apps.presentation'
  ];
  
  // Binary formats that get converted
  const convertibleTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint'
  ];
  
  if (googleDocTypes.includes(mimeType) || convertibleTypes.includes(mimeType)) {
    return `${baseName}.md`;
  }
  
  return originalName;
}

/**
 * Hydrate a specific app from Drive
 * 
 * @param {Object} config - { workspaceRoot, communityId, appId, baseFolderId, localPath }
 * @param {Object} options - { mergeMode, verbose }
 * @returns {Promise<{downloaded: number, skipped: number}>}
 */
export async function hydrateApp(config, options = {}) {
  const { workspaceRoot, communityId, appId, baseFolderId, localPath } = config;
  const { mergeMode = 'overwrite', verbose = false } = options;
  
  await driveADC.verifyDriveAuth();
  
  const drivePath = `${communityId}/${appId}`;
  const appFolderId = await driveADC.findFolderByPath(baseFolderId, drivePath);
  
  if (!appFolderId) {
    throw new Error(`App folder not found in Drive: ${drivePath}`);
  }
  
  const appLocalPath = localPath || drivePath;
  const targetPath = path.join(workspaceRoot, appLocalPath);
  
  return pullFolder(targetPath, appFolderId, { mergeMode, verbose });
}

/**
 * Push staging files to Drive
 * Files in kb/staging/ are uploaded to the corresponding Drive KB folder
 * 
 * Enhanced with:
 * - Conflict detection and resolution (interactive/unattended modes)
 * - Move files to .processed/ after successful upload
 * - Support for dry-run mode
 * 
 * @param {Object} config - { workspaceRoot, communityId, appId, kbId, baseFolderId, localPath }
 * @param {Object} options - Push options
 * @param {boolean} options.verbose - Enable verbose output
 * @param {boolean} options.interactive - Enable interactive prompts for conflicts
 * @param {string} options.onConflict - Conflict resolution: 'overwrite' | 'skip' (default: 'overwrite')
 * @param {boolean} options.moveToProcessed - Move files to .processed after upload (default: true)
 * @param {boolean} options.dryRun - Show what would happen without making changes
 * @param {function} options.onConflictPrompt - Callback for interactive conflict resolution
 * @returns {Promise<{uploaded: number, skipped: number, errors: number, processed: string[]}>}
 */
export async function pushStaging(config, options = {}) {
  const { workspaceRoot, communityId, appId, kbId = 'General', baseFolderId, localPath } = config;
  const { 
    verbose = false, 
    interactive = false,
    onConflict = 'overwrite',
    moveToProcessed = true,
    dryRun = false,
    onConflictPrompt = null
  } = options;
  
  await driveADC.verifyDriveAuth();
  
  // Navigate to KB folder
  const kbPath = `${communityId}/${appId}/kb/${kbId}`;
  let kbDriveFolderId = await driveADC.findFolderByPath(baseFolderId, kbPath);
  
  // Create KB folder if it doesn't exist
  if (!kbDriveFolderId) {
    if (dryRun) {
      if (verbose) console.log(`  [DRY RUN] Would create KB folder: ${kbPath}`);
    } else {
      kbDriveFolderId = await driveADC.ensureFolderPath(baseFolderId, kbPath);
      if (verbose) console.log(`  Created KB folder: ${kbPath}`);
    }
  }
  
  // Find staging directory
  const appLocalPath = localPath || `${communityId}/${appId}`;
  const stagingDir = path.join(workspaceRoot, appLocalPath, 'kb', 'staging');
  const processedDir = path.join(stagingDir, '.processed');
  
  try {
    await fs.access(stagingDir);
  } catch {
    // Staging directory doesn't exist - nothing to push
    return { uploaded: 0, skipped: 0, errors: 0, processed: [] };
  }
  
  // List files in staging (skip .processed directory and hidden files)
  const entries = await fs.readdir(stagingDir, { withFileTypes: true });
  const files = entries.filter(e => 
    !e.isDirectory() && 
    !e.name.startsWith('.') &&
    e.name !== '.processed'
  );
  
  if (files.length === 0) {
    return { uploaded: 0, skipped: 0, errors: 0, processed: [] };
  }
  
  const stats = { uploaded: 0, skipped: 0, errors: 0, processed: [] };
  
  // Track overwrite-all/skip-all decisions in interactive mode
  let overwriteAll = false;
  let skipAll = false;
  
  for (const entry of files) {
    const filePath = path.join(stagingDir, entry.name);
    
    try {
      // Check if file exists in Drive (for conflict detection)
      let fileExists = { exists: false };
      if (kbDriveFolderId) {
        fileExists = await driveADC.checkFileExists(kbDriveFolderId, entry.name);
      }
      
      let shouldUpload = true;
      
      if (fileExists.exists) {
        // Handle conflict
        if (skipAll) {
          shouldUpload = false;
          stats.skipped++;
          if (verbose) console.log(`  ⊘ ${entry.name} (skipped - file exists)`);
        } else if (overwriteAll || onConflict === 'overwrite') {
          shouldUpload = true;
          if (verbose && fileExists.exists) console.log(`  ↻ ${entry.name} (overwriting)`);
        } else if (onConflict === 'skip') {
          shouldUpload = false;
          stats.skipped++;
          if (verbose) console.log(`  ⊘ ${entry.name} (skipped - file exists)`);
        } else if (interactive && onConflictPrompt) {
          // Interactive mode - prompt for each conflict
          const action = await onConflictPrompt(entry.name, fileExists);
          
          if (action === 'overwrite') {
            shouldUpload = true;
          } else if (action === 'overwrite-all') {
            shouldUpload = true;
            overwriteAll = true;
          } else if (action === 'skip') {
            shouldUpload = false;
            stats.skipped++;
          } else if (action === 'skip-all') {
            shouldUpload = false;
            skipAll = true;
            stats.skipped++;
          }
        }
      }
      
      if (shouldUpload) {
        if (dryRun) {
          if (verbose) {
            const action = fileExists.exists ? 'overwrite' : 'upload';
            console.log(`  [DRY RUN] Would ${action}: ${entry.name}`);
          }
          stats.uploaded++;
        } else {
          await driveADC.uploadFileToDrive(filePath, entry.name, kbDriveFolderId);
          stats.uploaded++;
          stats.processed.push(entry.name);
          if (verbose) console.log(`  ✓ ${entry.name}${fileExists.exists ? ' (updated)' : ''}`);
          
          // Move to .processed directory
          if (moveToProcessed) {
            await fs.mkdir(processedDir, { recursive: true });
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const processedName = `${path.basename(entry.name, path.extname(entry.name))}_${timestamp}${path.extname(entry.name)}`;
            const processedPath = path.join(processedDir, processedName);
            await fs.rename(filePath, processedPath);
            if (verbose) console.log(`    → moved to .processed/`);
          }
        }
      }
    } catch (error) {
      stats.errors++;
      if (verbose) console.log(`  ✗ ${entry.name}: ${error.message}`);
    }
  }
  
  return stats;
}

/**
 * Check if staging directory has files to process
 * @param {string} stagingDir - Path to staging directory
 * @returns {Promise<{hasFiles: boolean, count: number, files: string[]}>}
 */
export async function checkStagingFiles(stagingDir) {
  try {
    await fs.access(stagingDir);
    const entries = await fs.readdir(stagingDir, { withFileTypes: true });
    const files = entries.filter(e => 
      !e.isDirectory() && 
      !e.name.startsWith('.') &&
      e.name !== '.processed'
    ).map(e => e.name);
    
    return {
      hasFiles: files.length > 0,
      count: files.length,
      files
    };
  } catch {
    return { hasFiles: false, count: 0, files: [] };
  }
}

/**
 * Copy a scaffold template to the current app
 * Scaffolds are Git-based code templates (site, microservice)
 * 
 * @param {string} scaffoldType - 'site' or 'microservice'
 * @param {string} appPath - Path to the app directory
 * @param {Object} options - { verbose, force }
 * @returns {Promise<{copied: number}>}
 */
export async function copyScaffold(scaffoldType, appPath, options = {}) {
  const { verbose = false, force = false } = options;
  
  const validTypes = ['site', 'microservice'];
  if (!validTypes.includes(scaffoldType)) {
    throw new Error(`Invalid scaffold type: ${scaffoldType}. Valid types: ${validTypes.join(', ')}`);
  }
  
  // Templates live inside the CLI package; SCAFFOLDS_DIR is the single owner of that path.
  const scaffoldDir = path.join(SCAFFOLDS_DIR, scaffoldType);
  
  // Check if scaffold exists
  try {
    await fs.access(scaffoldDir);
  } catch {
    throw new Error(`Scaffold template not found: ${scaffoldDir}`);
  }
  
  // Check target directory
  const targetDir = path.join(appPath, scaffoldType);
  
  try {
    const targetExists = await fs.stat(targetDir).then(() => true).catch(() => false);
    if (targetExists) {
      const hasContent = await hasContentInDir(targetDir);
      if (hasContent && !force) {
        throw new Error(
          `Target directory ${scaffoldType}/ already has content. ` +
          `Use --force to overwrite.`
        );
      }
    }
  } catch (err) {
    if (err.message.includes('already has content')) throw err;
    // Directory doesn't exist, that's fine
  }
  
  // Copy scaffold recursively
  const stats = { copied: 0 };
  await copyDir(scaffoldDir, targetDir, stats, verbose);
  
  return stats;
}

/**
 * Check if directory has any content
 */
async function hasContentInDir(dirPath) {
  try {
    const entries = await fs.readdir(dirPath);
    return entries.filter(e => !e.startsWith('.')).length > 0;
  } catch {
    return false;
  }
}

/**
 * Recursively copy a directory
 */
async function copyDir(src, dest, stats, verbose) {
  await fs.mkdir(dest, { recursive: true });
  
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath, stats, verbose);
    } else {
      await fs.copyFile(srcPath, destPath);
      stats.copied++;
      if (verbose) console.log(`  Copied: ${entry.name}`);
    }
  }
}

/**
 * Get available scaffold types
 * @returns {Promise<string[]>}
 */
export async function getAvailableScaffolds() {
  let entries;
  try {
    entries = await fs.readdir(SCAFFOLDS_DIR, { withFileTypes: true });
  } catch (err) {
    // FAIL LOUD: an unreadable scaffolds directory in a shipped CLI is a packaging failure,
    // not "no scaffolds". Swallowing it to [] is what hid the path bug — the caller could not
    // tell a broken install from an empty one. Name the path and the underlying error.
    throw new Error(
      `Scaffold templates are unreadable at ${SCAFFOLDS_DIR} (${err.code || err.message}). ` +
      `This is a broken CLI installation, not an empty template set.`
    );
  }
  return entries.filter(e => e.isDirectory()).map(e => e.name);
}

// Named exports for functions not already exported inline
export {
  convertAndSave,
};

// Default export for backward compatibility
export default {
  hydrateApp,
  hydrateKb,
  pushStaging,
  checkStagingFiles,
  convertAndSave,
  copyScaffold,
  getAvailableScaffolds
};
