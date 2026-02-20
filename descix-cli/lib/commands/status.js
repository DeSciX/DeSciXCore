/**
 * Status Command
 * 
 * Displays comprehensive status of the developer environment:
 * - System info (CLI version, Node version, etc.)
 * - Authentication status
 * - Workspace context and mode
 * - Configuration state
 * 
 * Uses PathContext for workspace resolution - no scattered process.cwd() calls
 */

import chalk from 'chalk';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DeSciXApiClient } from '../api-client.js';
import { GlobalConfig } from '../global-config.js';
import { PathContext } from '../core/PathContext.js';
import { detectWorkspaceMode } from '../workspace-utils.js';
import { isAuthenticated } from '../auth-guard.js';

const execAsync = promisify(exec);

/**
 * Get CLI version from package.json
 */
async function getCliVersion() {
  try {
    // Navigate up from lib/commands/status.js to package.json
    const packageJsonPath = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      '../../package.json'
    );
    const data = await fs.readFile(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(data);
    return pkg.version;
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Check if gcloud is installed
 */
async function checkGcloud() {
  try {
    const { stdout } = await execAsync('gcloud --version');
    const version = stdout.split('\n')[0].trim();
    return { installed: true, version };
  } catch (error) {
    return { installed: false };
  }
}

/**
 * Check ADC credentials
 */
async function checkAdc() {
  // Simple check: see if GOOGLE_APPLICATION_CREDENTIALS is set
  // or if default credentials file exists
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return { configured: true, source: 'env_var' };
  }

  const defaultPath = path.join(os.homedir(), '.config', 'gcloud', 'application_default_credentials.json');
  try {
    await fs.access(defaultPath);
    return { configured: true, source: 'default_file' };
  } catch {
    return { configured: false };
  }
}

/**
 * Run the status command
 */
export async function runStatus(options = {}) {
  console.log(chalk.cyan('\nDeSciX CLI Status'));
  console.log(chalk.cyan('=================\n'));

  // 1. System Info
  console.log(chalk.white('System'));
  console.log(chalk.white('------'));
  
  const cliVersion = await getCliVersion();
  console.log(`CLI Version:    ${chalk.green(cliVersion)}`);
  console.log(`Node Version:   ${chalk.green(process.version)}`);
  console.log(`OS:             ${os.type()} ${os.release()}`);
  
  const globalConfig = await GlobalConfig.load();
  console.log(`Environment:    ${globalConfig.environment} (${globalConfig.api_url})`);
  console.log();

  // Try to load PathContext (may fail if not in workspace)
  const ctx = await PathContext.tryLoad();
  const workspaceRoot = ctx?.getWorkspaceRoot();

  // 2. Authentication
  console.log(chalk.white('Authentication'));
  console.log(chalk.white('--------------'));

  const apiClient = new DeSciXApiClient({ baseUrl: globalConfig.api_url });
  const isAuth = await isAuthenticated(apiClient);

  if (isAuth) {
    console.log(`Status:         ${chalk.green('Authenticated')}`);
    
    // Try to get wallet address from stored credentials if available
    if (workspaceRoot) {
      try {
        const { WalletFileManager } = await import('../wallet-file.js');
        const walletData = await WalletFileManager.loadFromWorkspace(workspaceRoot);
        if (walletData && walletData.walletAddress) {
          console.log(`Wallet:         ${chalk.green(walletData.walletAddress)}`);
        }
      } catch (e) {
        // Ignore wallet load error
      }
    }
  } else {
    console.log(`Status:         ${chalk.yellow('Not Authenticated')}`);
    console.log(`Action:         Run 'descix login' to authenticate`);
  }
  console.log();

  // 3. Workspace Context
  console.log(chalk.white('Workspace Context'));
  console.log(chalk.white('-----------------'));
  
  if (ctx) {
    const workspaceConfig = ctx.getWorkspaceConfig();
    console.log(`Config File:    ${path.join(workspaceRoot, '.descix', 'workspace.json')}`);
    
    try {
      const mode = detectWorkspaceMode(workspaceConfig);
      console.log(`Mode:           ${chalk.green(mode)}`);
      
      // Display context based on mode
      if (mode === 'single_app') {
        let communityId = workspaceConfig.community_id || workspaceConfig.defaultContext?.communityId;
        let appId = workspaceConfig.app_id || workspaceConfig.defaultContext?.appId;
        let appName = workspaceConfig.app_name || appId;

        // V2 Support: Extract from communities object if missing at top level
        if (!communityId && workspaceConfig.communities) {
          const commIds = Object.keys(workspaceConfig.communities);
          if (commIds.length > 0) {
            communityId = commIds[0];
            const comm = workspaceConfig.communities[communityId];
            if (comm.apps) {
              const appIds = Object.keys(comm.apps);
              if (appIds.length > 0) {
                appId = appIds[0];
                appName = comm.apps[appId].app_name || appId;
              }
            }
          }
        }

        console.log(`Community:      ${communityId}`);
        console.log(`App:            ${appName} (${appId})`);
        console.log(`Drive Path:     ${communityId}/${appId}/`);
      } else if (mode === 'single_community') {
        const communityId = workspaceConfig.community_id || (workspaceConfig.communities && Object.keys(workspaceConfig.communities)[0]);
        const communityName = workspaceConfig.community_name || communityId;
        
        console.log(`Community:      ${communityName} (${communityId})`);
        
        let appCount = 0;
        if (workspaceConfig.apps) {
          appCount = Object.keys(workspaceConfig.apps).length;
        } else if (workspaceConfig.communities && workspaceConfig.communities[communityId]) {
          appCount = Object.keys(workspaceConfig.communities[communityId].apps || {}).length;
        }
        
        console.log(`Apps:           ${appCount} configured`);
        console.log(`Drive Path:     ${communityId}/`);
      } else if (mode === 'multi_community') {
        const commCount = Object.keys(workspaceConfig.communities || {}).length;
        console.log(`Communities:    ${commCount} configured`);
        
        // Show apps per community
        for (const [commId, comm] of Object.entries(workspaceConfig.communities || {})) {
          const appCount = Object.keys(comm.apps || {}).length;
          console.log(chalk.gray(`  └─ ${commId}: ${appCount} app(s)`));
        }
        
        console.log(`Drive Path:     / (Root)`);
      }
      
      console.log(`Local Root:     ${workspaceRoot}`);
    } catch (error) {
      console.log(`Mode:           ${chalk.red('Unknown/Invalid')} (${error.message})`);
    }
  } else {
    console.log(`Status:         ${chalk.yellow('No workspace found')}`);
    console.log(`Action:         Run 'descix setup' to create a workspace`);
  }
  console.log();

  // 4. Configuration & Tools
  console.log(chalk.white('Configuration'));
  console.log(chalk.white('-------------'));

  if (globalConfig.hasBaseFolder()) {
    console.log(`Base Drive Folder:  ${chalk.green('Registered')} (ID: ${globalConfig.user_base_folder_id})`);
  } else {
    console.log(`Base Drive Folder:  ${chalk.yellow('Not Registered')}`);
  }

  // Check for service key (dev-overrides.json) - use workspace root if available
  const checkDir = workspaceRoot || process.cwd();
  const overridesPath = path.join(checkDir, 'dev-overrides.json');
  try {
    await fs.access(overridesPath);
    console.log(`Service Key:        ${chalk.green('Present')} (dev-overrides.json)`);
  } catch {
    console.log(`Service Key:        ${chalk.gray('None')} (dev-overrides.json)`);
  }

  // Check for MCP rules
  const rulesPath = path.join(checkDir, '.cursor', 'rules', 'descix_mcp.mdc');
  try {
    await fs.access(rulesPath);
    console.log(`MCP Rules:          ${chalk.green('Deployed')} (.cursor/rules/descix_mcp.mdc)`);
  } catch {
    console.log(`MCP Rules:          ${chalk.gray('Not Deployed')}`);
  }

  // Check gcloud
  const gcloudStatus = await checkGcloud();
  if (gcloudStatus.installed) {
    console.log(`gcloud SDK:         ${chalk.green('Installed')} (${gcloudStatus.version})`);
  } else {
    console.log(`gcloud SDK:         ${chalk.yellow('Not Installed')}`);
  }

  // Check ADC
  const adcStatus = await checkAdc();
  if (adcStatus.configured) {
    console.log(`ADC Credentials:    ${chalk.green('Configured')} (${adcStatus.source})`);
  } else {
    console.log(`ADC Credentials:    ${chalk.yellow('Not Configured')}`);
  }

  console.log();
}
