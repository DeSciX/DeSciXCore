/**
 * Interactive App Creation Wizard
 * Guides developers through creating/updating an app with all assets
 */

import chalk from 'chalk';
import readline from 'readline';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Create readline interface for interactive prompts
 */
function createPrompt() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Ask a yes/no question
 */
async function askYesNo(rl, question, defaultYes = true) {
  return new Promise((resolve) => {
    const suffix = defaultYes ? '(Y/n)' : '(y/N)';
    rl.question(`${question} ${suffix}: `, (answer) => {
      const trimmed = answer.trim().toLowerCase();
      if (trimmed === '') {
        resolve(defaultYes);
      } else {
        resolve(trimmed === 'y' || trimmed === 'yes');
      }
    });
  });
}

/**
 * Ask for text input with optional default
 */
async function askInput(rl, question, defaultValue = '') {
  return new Promise((resolve) => {
    const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

/**
 * Ask for file/folder path with validation
 */
async function askPath(rl, question, mustExist = true, isDirectory = false) {
  return new Promise((resolve) => {
    const askPathRecursive = async () => {
      const input = await askInput(rl, question);
      
      if (!input) {
        resolve(null); // Allow skip
        return;
      }
      
      // Expand ~ to home directory
      const expandedPath = input.startsWith('~') 
        ? path.join(process.env.HOME || '', input.slice(1))
        : input;
      
      const absolutePath = path.isAbsolute(expandedPath) 
        ? expandedPath 
        : path.resolve(process.cwd(), expandedPath);
      
      if (mustExist) {
        try {
          const stats = await fs.stat(absolutePath);
          if (isDirectory && !stats.isDirectory()) {
            console.log(chalk.yellow(`  ⚠️  Path exists but is not a directory.`));
            askPathRecursive();
            return;
          }
          if (!isDirectory && stats.isDirectory()) {
            console.log(chalk.yellow(`  ⚠️  Path is a directory, expected a file.`));
            askPathRecursive();
            return;
          }
          resolve(absolutePath);
        } catch (err) {
          console.log(chalk.yellow(`  ⚠️  Path does not exist: ${absolutePath}`));
          askPathRecursive();
        }
      } else {
        resolve(absolutePath);
      }
    };
    
    askPathRecursive();
  });
}

/**
 * Read file content as base64
 */
async function readFileAsBase64(filePath) {
  const content = await fs.readFile(filePath);
  return content.toString('base64');
}

/**
 * Read all files from a directory recursively
 */
async function readDirectoryFiles(dirPath, basePath = '') {
  const files = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.join(basePath, entry.name);
    
    if (entry.isDirectory()) {
      const subFiles = await readDirectoryFiles(fullPath, relPath);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      // Skip hidden files and common non-content files
      if (entry.name.startsWith('.') || entry.name === 'Thumbs.db') {
        continue;
      }
      const content = await fs.readFile(fullPath);
      files.push({
        name: entry.name,
        path: relPath,
        content: content.toString('base64')
      });
    }
  }
  
  return files;
}

import crypto from 'crypto';

/**
 * Generate a new service key pair
 */
function generateServiceKey() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'secp256k1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  
  return { publicKey, privateKey };
}

/**
 * Run the interactive app creation wizard
 */
export async function runAppWizard(apiClient, options) {
  const rl = createPrompt();
  
  console.log(chalk.cyan('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║       DeSciX App Creation Wizard           ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════╝\n'));
  
  try {
    // Phase 1: Entitlements Discovery
    console.log(chalk.gray('  Fetching entitlements...'));
    const entitlementsResponse = await apiClient.invoke('fetch_my_purchases', {});
    const entitlements = entitlementsResponse.message || {};
    const serviceSlots = entitlements.service_slots || [];
    
    if (serviceSlots.length === 0) {
      console.log(chalk.yellow('\n⚠️  No service slots available.'));
      console.log(chalk.white('   You need a "Runner NFT" or Subscription to create an app.'));
      console.log(chalk.gray('   Visit https://descix.net/store to purchase one.\n'));
      rl.close();
      return;
    }

    console.log(chalk.cyan('\nSelect a Service Slot for this App:'));
    serviceSlots.forEach((slot, index) => {
      const statusColor = slot.status === 'active' ? chalk.green : chalk.gray;
      console.log(`${index + 1}. ${chalk.bold(slot.name)} (${slot.type})`);
      console.log(`   Specs: ${slot.specs.ram}, ${slot.specs.cpu}`);
      console.log(`   Status: ${statusColor(slot.status)}`);
    });

    const slotIndex = await askInput(rl, chalk.white('\nSelect Slot #'), '1');
    const selectedSlot = serviceSlots[parseInt(slotIndex) - 1];

    if (!selectedSlot) {
      console.log(chalk.red('\n❌ Invalid selection.\n'));
      rl.close();
      return;
    }

    console.log(chalk.green(`\n  ✓ Selected: ${selectedSlot.name}\n`));

    // Step 1: Get community and app name if not provided
    let communityId = options.community;
    let appName = options.name;
    
    if (!communityId) {
      // Show available communities
      const communities = entitlements.communities || [];
      if (communities.length > 0) {
        console.log(chalk.cyan('Select Community:'));
        communities.forEach((c, i) => {
            console.log(`${i + 1}. ${c.community_name} (${c.community_id})`);
        });
        const commIndex = await askInput(rl, chalk.white('\nSelect Community # (or type ID)'), '1');
        const selectedComm = communities[parseInt(commIndex) - 1];
        communityId = selectedComm ? selectedComm.community_id : commIndex;
      } else {
        communityId = await askInput(rl, chalk.white('Community ID'));
      }

      if (!communityId) {
        console.log(chalk.red('\n❌ Community ID is required.\n'));
        rl.close();
        return;
      }
    }
    
    if (!appName) {
      appName = await askInput(rl, chalk.white('App name'));
      if (!appName) {
        console.log(chalk.red('\n❌ App name is required.\n'));
        rl.close();
        return;
      }
    }
    
    console.log(chalk.gray(`\n📋 Creating app '${appName}' in community '${communityId}'...\n`));
    
    // Step 2: Check developer permission
    console.log(chalk.gray('  Checking developer permissions...'));
    const permCheck = await apiClient.invoke('check_developer_permission', {
      community_id: communityId
    });
    const permResult = permCheck.message || permCheck;
    
    if (!permResult.has_permission) {
      console.log(chalk.red(`\n❌ ${permResult.message}`));
      console.log(chalk.yellow('   Contact the community admin to request developer access.\n'));
      rl.close();
      return;
    }
    console.log(chalk.green(`  ✓ Developer permission confirmed (${permResult.permission_type})\n`));
    
    // Step 3: Check base folder registration
    console.log(chalk.gray('  Checking Drive folder registration...'));
    let folderCheck = await apiClient.invoke('get_user_base_folder', {});
    let folderResult = folderCheck.message || folderCheck;
    
    if (!folderResult.has_folder) {
      console.log(chalk.yellow(`\n⚠️  No base folder registered yet.`));
      console.log(chalk.gray('\n   You need a Google Drive folder shared with dip@descix.net (Editor access).'));
      console.log(chalk.gray('   This is where your app files will be stored.\n'));
      
      const registerNow = await askYesNo(rl, chalk.white('   Do you have a folder ready to register?'), true);
      
      if (!registerNow) {
        console.log(chalk.gray('\n   To set up a folder:'));
        console.log(chalk.white('   1. Create a folder in your Google Drive'));
        console.log(chalk.white('   2. Share it with dip@descix.net (Editor access)'));
        console.log(chalk.white('   3. Run this wizard again\n'));
        rl.close();
        return;
      }
      
      // Ask for folder URL/ID
      const folderInput = await askInput(rl, chalk.white('\n   Enter folder URL or ID'));
      if (!folderInput) {
        console.log(chalk.red('\n❌ Folder URL is required.\n'));
        rl.close();
        return;
      }
      
      // Extract folder ID from URL if needed
      let folderId = folderInput.trim();
      if (folderId.includes('drive.google.com')) {
        const match = folderId.match(/\/folders\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          folderId = match[1];
        }
      }
      // Also handle /d/ URLs
      if (folderId.includes('/d/')) {
        const match = folderId.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          folderId = match[1];
        }
      }
      
      console.log(chalk.gray(`\n   Registering folder: ${folderId}...`));
      
      try {
        const registerResult = await apiClient.invoke('register_base_folder', {
          folder_url: folderId
        });
        const registerData = registerResult.message || registerResult;
        console.log(chalk.green(`   ✓ Folder registered: ${registerData.folder_name || folderId}`));
        folderResult = { has_folder: true, folder_id: folderId };
      } catch (err) {
        console.log(chalk.red(`\n❌ ${err.message}`));
        console.log(chalk.yellow('\n   Make sure you\'ve shared the folder with dip@descix.net (Editor access)\n'));
        rl.close();
        return;
      }
    } else {
      console.log(chalk.green(`  ✓ Base folder registered: ${folderResult.folder_id}`));
    }
    console.log();
    
    // Step 4: Check if app already exists
    const appId = appName.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    console.log(chalk.gray('  Checking for existing app...'));
    const existsCheck = await apiClient.invoke('check_app_exists', {
      community_id: communityId,
      app_id: appId
    });
    const existsResult = existsCheck.message || existsCheck;
    
    let overwrite = false;
    if (existsResult.exists) {
      console.log(chalk.yellow(`\n⚠️  App '${appId}' already exists in community '${communityId}'.`));
      overwrite = await askYesNo(rl, chalk.white('   Overwrite existing app?'), false);
      if (!overwrite) {
        console.log(chalk.gray('\n   Operation cancelled.\n'));
        rl.close();
        return;
      }
      console.log(chalk.gray('   Will update existing app.\n'));
    } else {
      console.log(chalk.green(`  ✓ App '${appId}' is available\n`));
    }
    
    // Step 5: Collect optional assets
    console.log(chalk.cyan('─── Optional Assets ───\n'));
    console.log(chalk.gray('  Press Enter to skip any of these.\n'));
    
    // Icon file
    const iconPath = await askPath(rl, chalk.white('  Icon file path (png/jpg)'), true, false);
    let iconBase64 = null;
    if (iconPath) {
      try {
        iconBase64 = await readFileAsBase64(iconPath);
        console.log(chalk.green(`    ✓ Icon loaded: ${path.basename(iconPath)}`));
      } catch (err) {
        console.log(chalk.yellow(`    ⚠️  Could not read icon: ${err.message}`));
      }
    }
    
    // Description file
    const descPath = await askPath(rl, chalk.white('  Description file path (txt/md)'), true, false);
    let description = null;
    if (descPath) {
      try {
        description = await fs.readFile(descPath, 'utf-8');
        console.log(chalk.green(`    ✓ Description loaded: ${path.basename(descPath)} (${description.length} chars)`));
      } catch (err) {
        console.log(chalk.yellow(`    ⚠️  Could not read description: ${err.message}`));
      }
    }
    
    // System instructions (text or file)
    console.log(chalk.gray('  System instructions: Enter text directly or provide file path'));
    const sysInstrInput = await askInput(rl, chalk.white('  System instructions (text or file path)'), true);
    let systemInstructions = null;
    let systemInstructionsFile = null;
    if (sysInstrInput) {
      // Check if it's a file path (contains path separators or ends with common extensions)
      if (sysInstrInput.includes('/') || sysInstrInput.includes('\\') || 
          sysInstrInput.endsWith('.txt') || sysInstrInput.endsWith('.md')) {
        try {
          systemInstructionsFile = await fs.readFile(sysInstrInput, 'utf-8');
          systemInstructions = systemInstructionsFile;
          console.log(chalk.green(`    ✓ System instructions loaded from file: ${path.basename(sysInstrInput)} (${systemInstructions.length} chars)`));
        } catch (err) {
          console.log(chalk.yellow(`    ⚠️  Could not read system instructions file: ${err.message}`));
          // Treat as text if file read fails
          systemInstructions = sysInstrInput;
          console.log(chalk.gray(`    Using as text input (${systemInstructions.length} chars)`));
        }
      } else {
        // Treat as direct text input
        systemInstructions = sysInstrInput;
        console.log(chalk.green(`    ✓ System instructions entered as text (${systemInstructions.length} chars)`));
      }
    }
    
    // Knowledge base folder
    const kbPath = await askPath(rl, chalk.white('  Knowledge base folder path'), true, true);
    let kbFiles = null;
    if (kbPath) {
      try {
        kbFiles = await readDirectoryFiles(kbPath);
        console.log(chalk.green(`    ✓ KB folder loaded: ${kbFiles.length} files`));
      } catch (err) {
        console.log(chalk.yellow(`    ⚠️  Could not read KB folder: ${err.message}`));
      }
    }
    
    // Step 6: Confirm and create
    console.log(chalk.cyan('\n─── Summary ───\n'));
    console.log(chalk.white(`  Community:    ${communityId}`));
    console.log(chalk.white(`  App Name:     ${appName}`));
    console.log(chalk.white(`  App ID:       ${appId}`));
    console.log(chalk.white(`  Slot:         ${selectedSlot.name} (${selectedSlot.type})`));
    console.log(chalk.white(`  Icon:         ${iconPath ? path.basename(iconPath) : 'Default'}`));
    console.log(chalk.white(`  Description:  ${description ? `${description.length} chars` : 'Default'}`));
    console.log(chalk.white(`  Sys Instr:    ${systemInstructions ? `${systemInstructions.length} chars` : 'Default'}`));
    console.log(chalk.white(`  KB Files:     ${kbFiles ? `${kbFiles.length} files` : 'None'}`));
    console.log(chalk.white(`  Overwrite:    ${overwrite ? 'Yes' : 'No'}`));
    
    const proceed = await askYesNo(rl, chalk.white('\n  Proceed with app creation?'), true);
    if (!proceed) {
      console.log(chalk.gray('\n  Operation cancelled.\n'));
      rl.close();
      return;
    }
    
    // Step 7: Create skeleton app
    console.log(chalk.gray('\n  Creating app structure...'));
    const createResult = await apiClient.invoke('create_skeleton_app', {
      community_id: communityId,
      app_name: appName,
      overwrite: overwrite,
      app_description: description,
      // icon_url will be set after upload
    });
    const createData = createResult.message || createResult;
    console.log(chalk.green(`  ✓ App structure created`));
    console.log(chalk.gray(`    Drive folder: ${createData.folder_id}`));

    // New Step: Generate and Register Service Key
    console.log(chalk.gray('  Generating Service Delegate Key...'));
    const { publicKey, privateKey } = generateServiceKey();
    
    // Register delegate with Core (Virtual Registry)
    try {
        await apiClient.invoke('register_delegate', {
            slot_id: selectedSlot.nft_id || selectedSlot.id,
            slot_type: selectedSlot.type,
            public_key: publicKey,
            app_id: appId,
            community_id: communityId
        });
        console.log(chalk.green('  ✓ Service Delegate Key registered'));
        
        // Save key to dev-overrides.json (Standard Config Pattern)
        const overridesPath = path.resolve(process.cwd(), 'dev-overrides.json');
        let overrides = {};
        
        try {
            const content = await fs.readFile(overridesPath, 'utf-8');
            overrides = JSON.parse(content);
        } catch (e) {
            // File doesn't exist or invalid, start fresh
        }
        
        // Update SERVICE_KEY in overrides
        overrides.SERVICE_KEY = {
            privateKey,
            publicKey,
            slotId: selectedSlot.nft_id || selectedSlot.id,
            slotType: selectedSlot.type,
            appId,
            communityId,
            createdAt: new Date().toISOString()
        };
        
        await fs.writeFile(overridesPath, JSON.stringify(overrides, null, 2));
        console.log(chalk.green(`  ✓ Key saved to dev-overrides.json`));
        
        // Add to .gitignore if it exists
        try {
            const gitignorePath = path.resolve(process.cwd(), '.gitignore');
            let gitignore = await fs.readFile(gitignorePath, 'utf-8').catch(() => '');
            if (!gitignore.includes('dev-overrides.json')) {
                await fs.appendFile(gitignorePath, '\ndev-overrides.json\n');
                console.log(chalk.gray('    Added dev-overrides.json to .gitignore'));
            }
        } catch (err) {
            // Ignore gitignore errors
        }

    } catch (err) {
        console.log(chalk.yellow(`  ⚠️  Failed to register delegate key: ${err.message}`));
        console.log(chalk.gray('    You can register it later manually.'));
    }
    
    // Step 8: Upload assets (icon, description, system_instructions)
    if (iconBase64) {
      console.log(chalk.gray('  Uploading icon...'));
      try {
        await apiClient.invoke('upload_app_asset', {
          community_id: communityId,
          app_id: appId,
          asset_type: 'icon',
          file_name: `icon${path.extname(iconPath)}`,
          file_content: iconBase64
        });
        console.log(chalk.green(`  ✓ Icon uploaded`));
      } catch (err) {
        console.log(chalk.yellow(`  ⚠️  Icon upload failed: ${err.message}`));
      }
    }
    
    if (description) {
      console.log(chalk.gray('  Uploading description...'));
      try {
        const descBase64 = Buffer.from(description, 'utf-8').toString('base64');
        await apiClient.invoke('upload_app_asset', {
          community_id: communityId,
          app_id: appId,
          asset_type: 'description',
          file_name: 'app_description.md',
          file_content: descBase64
        });
        console.log(chalk.green(`  ✓ Description uploaded`));
      } catch (err) {
        console.log(chalk.yellow(`  ⚠️  Description upload failed: ${err.message}`));
      }
    }
    
    if (systemInstructions) {
      console.log(chalk.gray('  Uploading system instructions...'));
      try {
        const sysInstrBase64 = Buffer.from(systemInstructions, 'utf-8').toString('base64');
        await apiClient.invoke('upload_app_asset', {
          community_id: communityId,
          app_id: appId,
          asset_type: 'system_instructions',
          file_name: 'system_instructions.md',
          file_content: sysInstrBase64
        });
        console.log(chalk.green(`  ✓ System instructions uploaded`));
      } catch (err) {
        console.log(chalk.yellow(`  ⚠️  System instructions upload failed: ${err.message}`));
      }
    }
    
    // Step 9: Upload KB files if provided (in batches to avoid payload limits)
    if (kbFiles && kbFiles.length > 0) {
      console.log(chalk.gray(`  Uploading ${kbFiles.length} KB files...`));
      
      const BATCH_SIZE = 5; // Upload 5 files at a time (reduced for vectorization time)
      let totalUploaded = 0;
      let totalErrors = [];
      
      try {
        for (let i = 0; i < kbFiles.length; i += BATCH_SIZE) {
          const batch = kbFiles.slice(i, i + BATCH_SIZE);
          const batchNum = Math.floor(i / BATCH_SIZE) + 1;
          const totalBatches = Math.ceil(kbFiles.length / BATCH_SIZE);
          
          if (totalBatches > 1) {
            process.stdout.write(chalk.gray(`    Batch ${batchNum}/${totalBatches}...`));
          }
          
          try {
            const uploadResult = await apiClient.invoke('upload_files_to_kb', {
              community_id: communityId,
              app_id: appId,
              kb_id: 'General',
              files: batch
            });
            const uploadData = uploadResult.message || uploadResult;
            totalUploaded += uploadData.uploaded || batch.length;
            if (uploadData.errors?.length) {
              totalErrors.push(...uploadData.errors);
            }
            if (totalBatches > 1) {
              console.log(chalk.green(` ✓`));
            }
          } catch (batchErr) {
            if (totalBatches > 1) {
              console.log(chalk.yellow(` failed: ${batchErr.message}`));
            }
            console.log(chalk.gray(`      Files in batch: ${batch.map(f => f.name).join(', ')}`));
            totalErrors.push({ batch: batchNum, error: batchErr.message });
          }
        }
        
        console.log(chalk.green(`  ✓ Uploaded ${totalUploaded} files`));
        if (totalErrors.length > 0) {
          console.log(chalk.yellow(`    ⚠️  ${totalErrors.length} errors during upload`));
        }
      } catch (err) {
        console.log(chalk.yellow(`  ⚠️  KB upload failed: ${err.message}`));
      }
    }
    
    // Done!
    console.log(chalk.green('\n╔════════════════════════════════════════════╗'));
    console.log(chalk.green('║           App Created Successfully!        ║'));
    console.log(chalk.green('╚════════════════════════════════════════════╝\n'));
    console.log(chalk.white(`  App ID:      ${appId}`));
    console.log(chalk.white(`  Community:   ${communityId}`));
    console.log(chalk.white(`  Folder:      ${createData.folder_id}`));
    
    console.log(chalk.gray(`\n  To process your Knowledge Base:`));
    console.log(chalk.cyan(`  1. descix kb pull -c ${communityId} -a ${appId}`));
    console.log(chalk.cyan(`  2. descix kb build -c ${communityId} -a ${appId}`));
    
    console.log(chalk.gray(`\n  Query your app with:`));
    console.log(chalk.cyan(`  npx descix chat -c ${communityId} -a ${appId} "Your question here"`));
    
    console.log(chalk.gray(`\n  Add a CodeSite (static HTML/JS/CSS app):`));
    console.log(chalk.cyan(`  1. Build your static site in a local directory`));
    console.log(chalk.cyan(`  2. Deploy it: descix site deploy -c ${communityId} -a ${appId} -p <localPath>`));
    console.log(chalk.cyan(`  3. The CodeSite will be available in the PWA's "My Apps" view\n`));
    
    rl.close();
    
  } catch (error) {
    rl.close();
    throw error;
  }
}

