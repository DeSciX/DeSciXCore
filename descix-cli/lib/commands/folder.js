/**
 * Folder Commands - Drive Folder Management
 * 
 * Commands for managing Drive folder IDs for entities:
 *   descix folder set --user/--community/--app/--kb <folder-id>
 *   descix folder get --user/--community/--app/--kb
 *   descix folder allocate --app/--kb
 *   descix folder validate <folder-id>
 */

import chalk from 'chalk';
import ora from 'ora';
import { DeSciXApiClient } from '../api-client.js';
import { requireAuth } from '../auth-guard.js';
import { GlobalConfig } from '../global-config.js';

/**
 * Extract folder ID from Drive URL or return as-is
 */
function extractFolderId(input) {
  if (!input) return null;
  
  const trimmed = input.trim();
  
  // Handle full URLs
  if (trimmed.includes('drive.google.com')) {
    const foldersMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (foldersMatch && foldersMatch[1]) return foldersMatch[1];
    
    const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (dMatch && dMatch[1]) return dMatch[1];
    
    const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) return idMatch[1];
  }
  
  return trimmed;
}

/**
 * Set folder ID for an entity
 */
export async function setFolder(options) {
  const apiClient = new DeSciXApiClient();
  await requireAuth(apiClient);
  
  const spinner = ora('Setting folder...').start();
  
  try {
    let entityType, entityIds, folderId;
    
    if (options.user) {
      entityType = 'user';
      folderId = extractFolderId(options.user);
    } else if (options.community) {
      entityType = 'community';
      entityIds = { community_id: options.community };
      folderId = extractFolderId(options.folderId);
    } else if (options.app) {
      entityType = 'app';
      // Parse "community app" format
      const parts = options.app.split(/\s+/);
      if (parts.length < 2) {
        throw new Error('App requires both community and app ID: --app "community app"');
      }
      entityIds = { community_id: parts[0], app_id: parts[1] };
      folderId = extractFolderId(options.folderId);
    } else if (options.kb) {
      entityType = 'kb';
      // Parse "community app kb" format
      const parts = options.kb.split(/\s+/);
      if (parts.length < 3) {
        throw new Error('KB requires community, app, and kb ID: --kb "community app kb"');
      }
      entityIds = { community_id: parts[0], app_id: parts[1], kb_id: parts[2] };
      folderId = extractFolderId(options.folderId);
    } else {
      throw new Error('Specify entity type: --user, --community, --app, or --kb');
    }
    
    if (!folderId) {
      throw new Error('Folder ID is required');
    }
    
    const response = await apiClient.invoke('set_folder_id', {
      entity_type: entityType,
      entity_ids: entityIds,
      folder_id: folderId
    });
    
    const result = response.message || response;
    
    spinner.succeed('Folder set successfully');
    
    console.log(chalk.green(`\n✓ ${result.message}`));
    console.log(chalk.gray(`  Entity: ${entityType}`));
    console.log(chalk.gray(`  Folder: ${folderId}`));
    console.log(chalk.cyan(`  URL: https://drive.google.com/drive/folders/${folderId}\n`));
    
    // Update global config if setting user folder
    if (entityType === 'user') {
      const globalConfig = await GlobalConfig.load();
      globalConfig.user_base_folder_id = folderId;
      globalConfig.registered_at = new Date().toISOString();
      await globalConfig.save();
    }
    
    return result;
    
  } catch (error) {
    spinner.fail('Failed to set folder');
    console.error(chalk.red(`\n❌ ${error.message}\n`));
    throw error;
  }
}

/**
 * Get folder info for an entity
 */
export async function getFolder(options) {
  const apiClient = new DeSciXApiClient();
  await requireAuth(apiClient);
  
  const spinner = ora('Getting folder info...').start();
  
  try {
    let entityType, entityIds;
    
    if (options.user) {
      entityType = 'user';
    } else if (options.community) {
      entityType = 'community';
      entityIds = { community_id: options.community };
    } else if (options.app) {
      entityType = 'app';
      const parts = options.app.split(/\s+/);
      if (parts.length < 2) {
        throw new Error('App requires both community and app ID: --app "community app"');
      }
      entityIds = { community_id: parts[0], app_id: parts[1] };
    } else if (options.kb) {
      entityType = 'kb';
      const parts = options.kb.split(/\s+/);
      if (parts.length < 3) {
        throw new Error('KB requires community, app, and kb ID: --kb "community app kb"');
      }
      entityIds = { community_id: parts[0], app_id: parts[1], kb_id: parts[2] };
    } else {
      throw new Error('Specify entity type: --user, --community, --app, or --kb');
    }
    
    const response = await apiClient.invoke('get_folder_info', {
      entity_type: entityType,
      entity_ids: entityIds
    });
    
    const result = response.message || response;
    
    spinner.succeed('Folder info retrieved');
    
    console.log(chalk.cyan(`\n📁 Folder Info: ${entityType}\n`));
    
    if (result.has_folder) {
      console.log(chalk.green(`  ✓ Folder registered`));
      console.log(chalk.white(`    ID: ${result.folder_id}`));
      if (result.folder_name) {
        console.log(chalk.white(`    Name: ${result.folder_name}`));
      }
      if (result.kb_folder_id) {
        console.log(chalk.white(`    KB Folder: ${result.kb_folder_id}`));
      }
      console.log(chalk.cyan(`    URL: https://drive.google.com/drive/folders/${result.folder_id}`));
    } else {
      console.log(chalk.yellow(`  ⚠ No folder registered`));
      console.log(chalk.gray(`    Use 'descix folder set' to register a folder`));
    }
    
    console.log('');
    return result;
    
  } catch (error) {
    spinner.fail('Failed to get folder info');
    console.error(chalk.red(`\n❌ ${error.message}\n`));
    throw error;
  }
}

/**
 * Allocate a new folder for an entity
 */
export async function allocateFolder(options) {
  const apiClient = new DeSciXApiClient();
  await requireAuth(apiClient);
  
  const spinner = ora('Allocating folder...').start();
  
  try {
    let entityType, entityIds, folderName;
    
    if (options.app) {
      entityType = 'app';
      const parts = options.app.split(/\s+/);
      if (parts.length < 2) {
        throw new Error('App requires both community and app ID: --app "community app"');
      }
      entityIds = { community_id: parts[0], app_id: parts[1] };
      folderName = options.name || `${parts[0]}_${parts[1]}`;
    } else if (options.kb) {
      entityType = 'kb';
      const parts = options.kb.split(/\s+/);
      if (parts.length < 3) {
        throw new Error('KB requires community, app, and kb ID: --kb "community app kb"');
      }
      entityIds = { community_id: parts[0], app_id: parts[1], kb_id: parts[2] };
      folderName = options.name || parts[2];
    } else {
      throw new Error('Specify entity type: --app or --kb');
    }
    
    const response = await apiClient.invoke('allocate_folder', {
      entity_type: entityType,
      entity_ids: entityIds,
      folder_name: folderName
    });
    
    const result = response.message || response;
    
    spinner.succeed('Folder allocated successfully');
    
    console.log(chalk.green(`\n✓ New folder created`));
    console.log(chalk.white(`  Name: ${result.folder_name}`));
    console.log(chalk.white(`  ID: ${result.folder_id}`));
    console.log(chalk.cyan(`  URL: ${result.drive_url}\n`));
    
    return result;
    
  } catch (error) {
    spinner.fail('Failed to allocate folder');
    console.error(chalk.red(`\n❌ ${error.message}\n`));
    throw error;
  }
}

/**
 * Validate folder access
 */
export async function validateFolder(folderId, options = {}) {
  const apiClient = new DeSciXApiClient();
  await requireAuth(apiClient);
  
  const spinner = ora('Validating folder...').start();
  
  try {
    const parsedFolderId = extractFolderId(folderId);
    
    if (!parsedFolderId) {
      throw new Error('Folder ID is required');
    }
    
    const response = await apiClient.invoke('validate_folder_access', {
      folder_id: parsedFolderId
    });
    
    const result = response.message || response;
    
    if (result.accessible) {
      spinner.succeed('Folder is accessible');
      console.log(chalk.green(`\n✓ ${result.message}`));
      console.log(chalk.white(`  Name: ${result.folder_name}`));
      console.log(chalk.white(`  ID: ${parsedFolderId}`));
      console.log(chalk.cyan(`  URL: https://drive.google.com/drive/folders/${parsedFolderId}\n`));
    } else {
      spinner.fail('Folder not accessible');
      console.log(chalk.red(`\n❌ ${result.message}\n`));
    }
    
    return result;
    
  } catch (error) {
    spinner.fail('Validation failed');
    console.error(chalk.red(`\n❌ ${error.message}\n`));
    throw error;
  }
}

export default {
  setFolder,
  getFolder,
  allocateFolder,
  validateFolder
};
