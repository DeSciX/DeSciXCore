/**
 * Google Storage ADC (Application Default Credentials) Module
 * 
 * This module provides direct Drive access for CLI operations using ADC.
 * No backend involvement - CLI operates directly on user's Drive.
 * 
 * Prerequisites:
 *   gcloud auth application-default login \
 *     --scopes=https://www.googleapis.com/auth/drive.file,https://www.googleapis.com/auth/drive
 */

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Get ADC-based authentication for Google APIs
 * Uses Application Default Credentials from gcloud CLI
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
 * Verify ADC authentication is working
 * @returns {Promise<Object>} User info { email, name }
 */
export async function verifyDriveAuth() {
  try {
    const auth = await getADCAuth();
    const drive = google.drive({ version: 'v3', auth });
    const response = await drive.about.get({ fields: 'user' });
    return response.data.user;
  } catch (error) {
    if (error.message.includes('Could not load the default credentials')) {
      throw new Error(
        'Google Drive authentication not configured.\n' +
        'Run: gcloud auth application-default login --scopes=https://www.googleapis.com/auth/drive'
      );
    }
    throw error;
  }
}

/**
 * Navigate a folder path and return the final folder ID
 * @param {string} rootFolderId - Starting folder ID
 * @param {string} relativePath - Path like "community_id/app_id/kb/General"
 * @returns {Promise<string|null>} Folder ID or null if not found
 */
export async function findFolderByPath(rootFolderId, relativePath) {
  const auth = await getADCAuth();
  const drive = google.drive({ version: 'v3', auth });
  
  const parts = relativePath.split('/').filter(Boolean);
  let currentFolderId = rootFolderId;
  
  for (const part of parts) {
    const res = await drive.files.list({
      q: `'${currentFolderId}' in parents and name='${part}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)'
    });
    
    if (!res.data.files?.length) {
      return null;
    }
    currentFolderId = res.data.files[0].id;
  }
  
  return currentFolderId;
}

/**
 * Ensure a folder path exists, creating any missing folders
 * @param {string} rootFolderId - Starting folder ID
 * @param {string} relativePath - Path like "community_id/app_id/kb/General"
 * @returns {Promise<string>} Final folder ID
 */
export async function ensureFolderPath(rootFolderId, relativePath) {
  const auth = await getADCAuth();
  const drive = google.drive({ version: 'v3', auth });
  
  const parts = relativePath.split('/').filter(Boolean);
  let currentFolderId = rootFolderId;
  
  for (const part of parts) {
    // Try to find existing folder
    const res = await drive.files.list({
      q: `'${currentFolderId}' in parents and name='${part}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)'
    });
    
    if (res.data.files?.length) {
      currentFolderId = res.data.files[0].id;
    } else {
      // Create folder
      const createRes = await drive.files.create({
        requestBody: {
          name: part,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [currentFolderId]
        },
        fields: 'id'
      });
      currentFolderId = createRes.data.id;
    }
  }
  
  return currentFolderId;
}

/**
 * List files in a folder with metadata
 * @param {string} folderId - Folder ID to list
 * @returns {Promise<Array>} Array of { id, name, mimeType, modifiedTime, size }
 */
export async function listFolderWithMeta(folderId) {
  const auth = await getADCAuth();
  const drive = google.drive({ version: 'v3', auth });
  
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id, name, mimeType, modifiedTime, size)',
    pageSize: 1000
  });
  
  return res.data.files || [];
}

/**
 * Upload a file to Drive
 * @param {string} localPath - Local file path
 * @param {string} fileName - Name for the file in Drive
 * @param {string} parentFolderId - Parent folder ID
 * @returns {Promise<string>} New file ID
 */
export async function uploadFileToDrive(localPath, fileName, parentFolderId) {
  const auth = await getADCAuth();
  const drive = google.drive({ version: 'v3', auth });
  
  // Check if file exists and get its ID for update
  const existingRes = await drive.files.list({
    q: `'${parentFolderId}' in parents and name='${fileName}' and trashed=false`,
    fields: 'files(id)'
  });
  
  const fileStream = fs.createReadStream(localPath);
  
  if (existingRes.data.files?.length) {
    // Update existing file
    const existingId = existingRes.data.files[0].id;
    const updateRes = await drive.files.update({
      fileId: existingId,
      media: { body: fileStream },
      fields: 'id'
    });
    return updateRes.data.id;
  } else {
    // Create new file
    const createRes = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [parentFolderId]
      },
      media: { body: fileStream },
      fields: 'id'
    });
    return createRes.data.id;
  }
}

/**
 * Upload content (string or buffer) to Drive
 * @param {string|Buffer} content - File content
 * @param {string} fileName - Name for the file in Drive
 * @param {string} parentFolderId - Parent folder ID
 * @param {string} mimeType - MIME type (default: text/plain)
 * @returns {Promise<string>} New file ID
 */
export async function uploadContentToDrive(content, fileName, parentFolderId, mimeType = 'text/plain') {
  const auth = await getADCAuth();
  const drive = google.drive({ version: 'v3', auth });
  
  // Check if file exists and get its ID for update
  const existingRes = await drive.files.list({
    q: `'${parentFolderId}' in parents and name='${fileName}' and trashed=false`,
    fields: 'files(id)'
  });
  
  const { Readable } = await import('stream');
  const stream = Readable.from([content]);
  
  if (existingRes.data.files?.length) {
    // Update existing file
    const existingId = existingRes.data.files[0].id;
    const updateRes = await drive.files.update({
      fileId: existingId,
      media: { body: stream, mimeType },
      fields: 'id'
    });
    return updateRes.data.id;
  } else {
    // Create new file
    const createRes = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [parentFolderId]
      },
      media: { body: stream, mimeType },
      fields: 'id'
    });
    return createRes.data.id;
  }
}

/**
 * Read file content from Drive
 * @param {string} fileId - File ID
 * @returns {Promise<string>} File content as string
 */
export async function readDriveFile(fileId) {
  const auth = await getADCAuth();
  const drive = google.drive({ version: 'v3', auth });
  
  const res = await drive.files.get({
    fileId,
    alt: 'media'
  });
  
  return res.data;
}

// Google Workspace MIME types that require export
const GOOGLE_DOCS_MIME_TYPES = {
  'application/vnd.google-apps.document': { exportMime: 'text/markdown', extension: '.md' },
  'application/vnd.google-apps.spreadsheet': { exportMime: 'text/csv', extension: '.csv' },
  'application/vnd.google-apps.presentation': { exportMime: 'application/pdf', extension: '.pdf' },
  'application/vnd.google-apps.drawing': { exportMime: 'image/png', extension: '.png' }
};

/**
 * Download a file from Drive to local filesystem
 * Handles both regular files and Google Workspace files (Docs, Sheets, etc.)
 * Google Docs are exported as Markdown, Sheets as CSV, etc.
 * @param {string} fileId - Drive file ID
 * @param {string} localPath - Local path to save file
 * @param {string} mimeType - Optional MIME type (if known, avoids extra API call)
 * @returns {Promise<{localPath: string, exported: boolean}>} Final local path and whether file was exported
 */
export async function downloadFileFromDrive(fileId, localPath, mimeType = null) {
  const auth = await getADCAuth();
  const drive = google.drive({ version: 'v3', auth });
  
  // Get file metadata if mimeType not provided
  if (!mimeType) {
    const metaRes = await drive.files.get({ fileId, fields: 'mimeType' });
    mimeType = metaRes.data.mimeType;
  }
  
  // Ensure parent directory exists
  const parentDir = path.dirname(localPath);
  await fs.promises.mkdir(parentDir, { recursive: true });
  
  // Check if this is a Google Workspace file that needs export
  const exportConfig = GOOGLE_DOCS_MIME_TYPES[mimeType];
  
  if (exportConfig) {
    // Export Google Workspace file
    // Adjust local path extension if needed
    const basePath = localPath.replace(/\.[^.]+$/, ''); // Remove existing extension
    const finalPath = basePath + exportConfig.extension;
    
    const res = await drive.files.export(
      { fileId, mimeType: exportConfig.exportMime },
      { responseType: 'stream' }
    );
    
    const dest = fs.createWriteStream(finalPath);
    return new Promise((resolve, reject) => {
      res.data
        .on('error', reject)
        .pipe(dest)
        .on('finish', () => resolve({ localPath: finalPath, exported: true }))
        .on('error', reject);
    });
  } else {
    // Regular file - download directly
    const res = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );
    
    const dest = fs.createWriteStream(localPath);
    return new Promise((resolve, reject) => {
      res.data
        .on('error', reject)
        .pipe(dest)
        .on('finish', () => resolve({ localPath, exported: false }))
        .on('error', reject);
    });
  }
}

/**
 * Compute delta between local files and Drive files
 * @param {Array} localFiles - Array of { name, path, modifiedTime, size }
 * @param {Array} driveFiles - Array of { id, name, modifiedTime, size }
 * @returns {Object} { toUpload: [], toUpdate: [], unchanged: [], driveOnly: [] }
 */
export function computeDelta(localFiles, driveFiles) {
  const driveMap = new Map();
  driveFiles.forEach(f => driveMap.set(f.name.toLowerCase(), f));
  
  const localMap = new Map();
  localFiles.forEach(f => localMap.set(f.name.toLowerCase(), f));
  
  const toUpload = [];
  const toUpdate = [];
  const unchanged = [];
  const driveOnly = [];
  
  // Check local files
  for (const localFile of localFiles) {
    const nameKey = localFile.name.toLowerCase();
    const driveFile = driveMap.get(nameKey);
    
    if (!driveFile) {
      // Local file not in Drive - needs upload
      toUpload.push(localFile);
    } else {
      // File exists in both - compare modified times
      const localMod = localFile.modifiedTime ? new Date(localFile.modifiedTime) : null;
      const driveMod = driveFile.modifiedTime ? new Date(driveFile.modifiedTime) : null;
      
      if (localMod && driveMod && localMod > driveMod) {
        // Local is newer
        toUpdate.push({ ...localFile, driveId: driveFile.id });
      } else {
        // Same or Drive is newer
        unchanged.push({ ...localFile, driveId: driveFile.id });
      }
    }
  }
  
  // Check for Drive-only files
  for (const driveFile of driveFiles) {
    const nameKey = driveFile.name.toLowerCase();
    if (!localMap.has(nameKey)) {
      driveOnly.push(driveFile);
    }
  }
  
  return { toUpload, toUpdate, unchanged, driveOnly };
}

/**
 * Read .descix_metadata.json from a Drive folder
 * @param {string} folderId - Folder ID
 * @returns {Promise<Object|null>} Metadata object or null if not found
 */
export async function readDriveMetadata(folderId) {
  const auth = await getADCAuth();
  const drive = google.drive({ version: 'v3', auth });
  
  const res = await drive.files.list({
    q: `'${folderId}' in parents and name='.descix_metadata.json' and trashed=false`,
    fields: 'files(id)'
  });
  
  if (!res.data.files?.length) {
    return null;
  }
  
  const content = await readDriveFile(res.data.files[0].id);
  try {
    return typeof content === 'string' ? JSON.parse(content) : content;
  } catch {
    return null;
  }
}

/**
 * Write .descix_metadata.json to a Drive folder
 * @param {string} folderId - Folder ID
 * @param {Object} metadata - Metadata to write
 * @returns {Promise<string>} File ID
 */
export async function writeDriveMetadata(folderId, metadata) {
  const content = JSON.stringify(metadata, null, 2);
  return await uploadContentToDrive(content, '.descix_metadata.json', folderId, 'application/json');
}

/**
 * Compute SHA256 hash of a file
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} Hash string prefixed with 'sha256:'
 */
export async function computeFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(`sha256:${hash.digest('hex')}`));
    stream.on('error', reject);
  });
}

/**
 * Compute SHA256 hash of content (string or buffer)
 * @param {string|Buffer} content - Content to hash
 * @returns {string} Hash string prefixed with 'sha256:'
 */
export function computeContentHash(content) {
  const hash = crypto.createHash('sha256');
  hash.update(content);
  return `sha256:${hash.digest('hex')}`;
}

/**
 * Get file metadata including hash for Drive file
 * Downloads file content to compute hash
 * @param {string} fileId - Drive file ID
 * @returns {Promise<{hash: string, size: number}>}
 */
export async function getDriveFileHash(fileId) {
  const auth = await getADCAuth();
  const drive = google.drive({ version: 'v3', auth });
  
  // Download file content
  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );
  
  const buffer = Buffer.from(response.data);
  const hash = computeContentHash(buffer);
  
  return { hash, size: buffer.length };
}

/**
 * Check if a file exists in a Drive folder
 * @param {string} folderId - Parent folder ID
 * @param {string} fileName - Name of file to check
 * @returns {Promise<{exists: boolean, fileId: string|null, modifiedTime: string|null}>}
 */
export async function checkFileExists(folderId, fileName) {
  const auth = await getADCAuth();
  const drive = google.drive({ version: 'v3', auth });
  
  const res = await drive.files.list({
    q: `'${folderId}' in parents and name='${fileName}' and trashed=false`,
    fields: 'files(id, name, modifiedTime)'
  });
  
  if (res.data.files?.length) {
    const file = res.data.files[0];
    return {
      exists: true,
      fileId: file.id,
      modifiedTime: file.modifiedTime
    };
  }
  
  return { exists: false, fileId: null, modifiedTime: null };
}

/**
 * List all files in a Drive folder (non-recursive)
 * @param {string} folderId - Folder ID
 * @returns {Promise<Array<{id: string, name: string, modifiedTime: string}>>}
 */
export async function listDriveFiles(folderId) {
  const auth = await getADCAuth();
  const drive = google.drive({ version: 'v3', auth });
  
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false and mimeType != 'application/vnd.google-apps.folder'`,
    fields: 'files(id, name, mimeType, modifiedTime, size)',
    pageSize: 1000
  });
  
  return res.data.files || [];
}

export default {
  verifyDriveAuth,
  findFolderByPath,
  ensureFolderPath,
  listFolderWithMeta,
  uploadFileToDrive,
  uploadContentToDrive,
  readDriveFile,
  downloadFileFromDrive,
  computeDelta,
  readDriveMetadata,
  writeDriveMetadata,
  checkFileExists,
  listDriveFiles,
  computeFileHash,
  computeContentHash,
  getDriveFileHash
};
