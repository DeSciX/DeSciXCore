/**
 * Configuration Commands
 * 
 * Manage CLI configuration (.descix/workspace.json)
 * Uses PathContext for path resolution - no process.cwd() lookups
 */

import chalk from 'chalk';
import * as path from 'path';
import { PathContext } from '../core/PathContext.js';
import { WorkspaceConfig } from '../workspace-config.js';

/**
 * Show current configuration
 */
export async function show() {
  try {
    const ctx = await PathContext.load();
    const config = ctx.getWorkspaceConfig();
    const workspaceRoot = ctx.getWorkspaceRoot();
    
    console.log(chalk.cyan('\n📋 DeSciX Workspace Configuration:\n'));
    console.log(chalk.white(`   Workspace:     ${workspaceRoot}`));
    console.log(chalk.white(`   API URL:       ${config.apiUrl || 'https://descix.net (default)'}`));
    console.log(chalk.white(`   Environment:   ${config.environment || 'production'}`));
    
    // Show communities/apps
    const communities = Object.keys(config.communities || {});
    if (communities.length > 0) {
      console.log(chalk.white(`   Communities:   ${communities.join(', ')}`));
      
      for (const commId of communities) {
        const apps = Object.keys(config.communities[commId]?.apps || {});
        if (apps.length > 0) {
          console.log(chalk.gray(`     └─ ${commId}: ${apps.join(', ')}`));
        }
      }
    }
    
    console.log('');
    const configPath = path.join(workspaceRoot, '.descix', 'workspace.json');
    console.log(chalk.gray(`   Config file: ${configPath}`));
    console.log('');
    
  } catch (error) {
    console.error(chalk.red('Error loading config:', error.message));
    throw error;
  }
}

/**
 * Set API URL
 */
export async function setUrl(url, options = {}) {
  try {
    const ctx = await PathContext.load();
    const workspaceRoot = ctx.getWorkspaceRoot();
    
    const workspaceConfig = await WorkspaceConfig.load(workspaceRoot);
    workspaceConfig.apiUrl = url;
    workspaceConfig.environment = url.includes('localhost') ? 'development' : 'production';
    const configPath = await workspaceConfig.save(workspaceRoot);
    
    console.log(chalk.green('\n✅ Configuration updated!\n'));
    console.log(chalk.white(`   API URL: ${url}`));
    console.log(chalk.gray(`   Saved to: ${configPath}\n`));
    
  } catch (error) {
    console.error(chalk.red('Error updating config:', error.message));
    throw error;
  }
}

/**
 * Initialize config for environment
 */
export async function init(env = 'prod', options = {}) {
  try {
    const ctx = await PathContext.load();
    const workspaceRoot = ctx.getWorkspaceRoot();
    
    const workspaceConfig = await WorkspaceConfig.load(workspaceRoot);
    
    // Set API URL based on environment
    if (env === 'dev') {
      workspaceConfig.apiUrl = 'https://localhost:4000';
      workspaceConfig.environment = 'development';
    } else {
      workspaceConfig.apiUrl = 'https://descix.net';
      workspaceConfig.environment = 'production';
    }
    
    const configPath = await workspaceConfig.save(workspaceRoot);
    
    console.log(chalk.green('\n✅ Configuration initialized!\n'));
    console.log(chalk.white(`   Environment: ${workspaceConfig.environment}`));
    console.log(chalk.white(`   API URL:     ${workspaceConfig.apiUrl}`));
    console.log(chalk.gray(`   Saved to:    ${configPath}\n`));
    
  } catch (error) {
    console.error(chalk.red('Error initializing config:', error.message));
    throw error;
  }
}

/**
 * Set sync_mode for an app
 * @param {string} mode - "git" or "drive"
 * @param {Object} options - { community, app }
 */
export async function setSyncMode(mode, options = {}) {
  try {
    const validModes = ['git', 'drive'];
    if (!validModes.includes(mode)) {
      throw new Error(`Invalid sync_mode: "${mode}". Must be one of: ${validModes.join(', ')}`);
    }
    
    const ctx = await PathContext.load();
    const workspaceRoot = ctx.getWorkspaceRoot();
    
    // Resolve community and app
    const { communityId, appId } = ctx.requireContext(options);
    
    const workspaceConfig = await WorkspaceConfig.load(workspaceRoot);
    
    // Update app config
    if (!workspaceConfig.communities[communityId]) {
      throw new Error(`Community "${communityId}" not found in workspace.json`);
    }
    if (!workspaceConfig.communities[communityId].apps?.[appId]) {
      throw new Error(`App "${appId}" not found in community "${communityId}"`);
    }
    
    workspaceConfig.communities[communityId].apps[appId].sync_mode = mode;
    
    const configPath = await workspaceConfig.save(workspaceRoot);
    
    console.log(chalk.green('\n✅ Sync mode updated!\n'));
    console.log(chalk.white(`   Community:  ${communityId}`));
    console.log(chalk.white(`   App:        ${appId}`));
    console.log(chalk.white(`   Sync Mode:  ${mode}`));
    console.log(chalk.gray(`   Saved to:   ${configPath}\n`));
    
    if (mode === 'git') {
      console.log(chalk.cyan('   Tip: Use "descix kb build" to process KB locally.'));
    } else {
      console.log(chalk.cyan('   Tip: Use the PWA to upload KB files to Drive.'));
    }
    console.log('');
    
  } catch (error) {
    console.error(chalk.red('Error updating sync mode:', error.message));
    throw error;
  }
}
