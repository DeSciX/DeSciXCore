#!/usr/bin/env node
/**
 * Test Drive Hydration
 */

import { google } from 'googleapis';
import GoogleStorage from './lib/google-storage-adc.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder';

async function getAuth() {
  return new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.file']
  });
}

async function main() {
  console.log('=== Drive Hydration Test ===\n');
  
  // Step 1: Verify ADC
  console.log('1. Verifying ADC authentication...');
  const user = await GoogleStorage.verifyDriveAuth();
  console.log(`   ✓ Authenticated as: ${user.emailAddress}\n`);
  
  // Step 2: Find DeSciX base folder
  console.log('2. Looking for DeSciX base folder...');
  const auth = await getAuth();
  const drive = google.drive({ version: 'v3', auth });
  
  const possibleNames = ['DeSciX', 'DeSciX_Apps', 'descix-apps', 'descix'];
  let baseFolder = null;
  
  for (const name of possibleNames) {
    const res = await drive.files.list({
      q: `name='${name}' and mimeType='${DRIVE_FOLDER_MIME}' and trashed=false`,
      fields: 'files(id, name)'
    });
    if (res.data.files?.length) {
      baseFolder = res.data.files[0];
      console.log(`   ✓ Found base folder: "${name}" (ID: ${baseFolder.id})\n`);
      break;
    }
  }
  
  if (!baseFolder) {
    console.log('   ✗ Could not find DeSciX base folder');
    const rootRes = await drive.files.list({
      q: `'root' in parents and mimeType='${DRIVE_FOLDER_MIME}' and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 20
    });
    console.log('   Root folders:');
    for (const f of rootRes.data.files || []) {
      console.log(`     - ${f.name} (${f.id})`);
    }
    return;
  }
  
  // Step 3: Find descix/agent
  console.log('3. Locating descix/agent folder...');
  const agentFolderId = await GoogleStorage.findFolderByPath(baseFolder.id, 'descix/agent');
  
  if (!agentFolderId) {
    console.log('   ✗ Could not find descix/agent folder');
    console.log('   Contents of base folder:');
    const contents = await GoogleStorage.listFolderWithMeta(baseFolder.id);
    for (const f of contents) {
      console.log(`     - ${f.name} (${f.mimeType === DRIVE_FOLDER_MIME ? 'folder' : 'file'})`);
    }
    return;
  }
  
  console.log(`   ✓ Found descix/agent folder (ID: ${agentFolderId})\n`);
  
  // Step 4: List contents
  console.log('4. Contents of descix/agent in Drive:');
  const agentContents = await GoogleStorage.listFolderWithMeta(agentFolderId);
  for (const f of agentContents) {
    const type = f.mimeType === DRIVE_FOLDER_MIME ? '📁' : '📄';
    console.log(`   ${type} ${f.name}`);
    
    // List subfolders
    if (f.mimeType === DRIVE_FOLDER_MIME) {
      const subContents = await GoogleStorage.listFolderWithMeta(f.id);
      for (const sf of subContents) {
        const subType = sf.mimeType === DRIVE_FOLDER_MIME ? '📁' : '📄';
        console.log(`     ${subType} ${sf.name}`);
      }
    }
  }
  console.log('');
  
  // Step 5: Pull content using the new downloadFileFromDrive function
  const targetDir = '/Users/essam/Documents/Code/DaitaERC20/descix/agent';
  console.log(`5. Pulling content to ${targetDir}...`);
  
  const pullRecursive = async (localPath, folderId, indent = '  ') => {
    await fs.mkdir(localPath, { recursive: true });
    const files = await GoogleStorage.listFolderWithMeta(folderId);
    let count = 0;
    
    for (const file of files) {
      const targetPath = path.join(localPath, file.name);
      
      if (file.mimeType === DRIVE_FOLDER_MIME) {
        console.log(`${indent}📁 ${file.name}/`);
        count += await pullRecursive(targetPath, file.id, indent + '  ');
      } else {
        console.log(`${indent}📄 Downloading: ${file.name}`);
        await GoogleStorage.downloadFileFromDrive(file.id, targetPath);
        count++;
      }
    }
    return count;
  };
  
  const downloaded = await pullRecursive(targetDir, agentFolderId);
  console.log(`\n   ✓ Downloaded ${downloaded} files\n`);
  
  // Step 6: Verify
  console.log('6. Verifying local content:');
  const verifyDir = async (dir, indent = '') => {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        const type = e.isDirectory() ? '📁' : '📄';
        console.log(`   ${indent}${type} ${e.name}`);
        if (e.isDirectory()) {
          await verifyDir(path.join(dir, e.name), indent + '  ');
        }
      }
    } catch {
      console.log(`   ${indent}(empty)`);
    }
  };
  await verifyDir(targetDir);
  
  console.log('\n=== Test Complete ===');
  console.log(`\nBase folder ID for workspace.json: ${baseFolder.id}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
