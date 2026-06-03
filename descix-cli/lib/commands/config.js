/**
 * Configuration Commands
 *
 * Manage CLI configuration (.descix/workspace.json)
 * Uses WorkspaceConfig for path resolution - no process.cwd() lookups
 */

import chalk from 'chalk';
import * as path from 'path';
import { WorkspaceConfig } from '../workspace-config.js';

/**
 * Show current configuration
 */
export async function show() {
  try {
    const workspaceConfig = await WorkspaceConfig.load();
    const workspaceRoot = workspaceConfig.getWorkspaceRoot();

    console.log(chalk.cyan('\n📋 DeSciX Workspace Configuration:\n'));
    console.log(chalk.white(`   Workspace:     ${workspaceRoot}`));
    console.log(chalk.white(`   API URL:       ${workspaceConfig.getApiUrl()}`));
    console.log(chalk.white(`   Environment:   ${workspaceConfig.env?.environment || 'production'}`));

    // Show mapped apps (v2.1 env.products)
    const platform = workspaceConfig.env?.platform;
    const products = workspaceConfig.env?.products || [];
    const allApps = [platform?.appId, ...products.map(p => p.appId)].filter(Boolean);
    if (allApps.length > 0) {
      console.log(chalk.white(`   Apps:          ${allApps.join(', ')}`));
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
    const workspaceConfig = await WorkspaceConfig.load();
    const workspaceRoot = workspaceConfig.getWorkspaceRoot();

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
    const workspaceConfig = await WorkspaceConfig.load();
    const workspaceRoot = workspaceConfig.getWorkspaceRoot();
    
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
 * Set target environment persistently in workspace.json.
 * After switching, auto-runs reconnect against the new API URL.
 *
 * @param {string} envName - Environment: dev, demo, prod, or custom name
 * @param {Object} options - { url?: string } optional URL override for custom envs
 */
export async function setEnv(envName, options = {}) {
  try {
    const workspaceConfig = await WorkspaceConfig.load();

    const result = await workspaceConfig.setEnvironment(envName, options.url || null);

    console.log(chalk.green('\n✅ Environment switched!\n'));
    console.log(chalk.white(`   Environment:   ${result.environment}`));
    console.log(chalk.white(`   API URL:       ${result.apiUrl || `https://localhost:${workspaceConfig.env?.platform?.microservice?.port || '4000'} (local)`}`));
    console.log(chalk.white(`   Secret Label:  ${result.secretLabel}`));
    console.log(chalk.gray(`   Saved to:      ${result.configPath}\n`));

    // Auto-reconnect against the new environment
    if (result.apiUrl) {
      process.env.DESCIX_API_URL = result.apiUrl;
    } else {
      delete process.env.DESCIX_API_URL;
    }

    console.log(chalk.cyan('   Reconnecting to new environment...\n'));
    try {
      const { reconnect } = await import('./auth.js');
      await reconnect();
    } catch (err) {
      console.log(chalk.yellow(`\n   ⚠️  Auto-reconnect failed: ${err.message}`));
      console.log(chalk.gray('   Run "descix reconnect" or "descix login" manually.\n'));
    }

  } catch (error) {
    console.error(chalk.red(`\n❌ ${error.message}\n`));
    throw error;
  }
}
