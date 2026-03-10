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

  // Try to load workspace context — WorkspaceConfig first (handles v2), fallback to PathContext
  let ctx = null;
  let workspaceRoot = null;
  let workspaceConfig = null;
  try {
    const { WorkspaceConfig } = await import('../workspace-config.js');
    const wsConfig = await WorkspaceConfig.load();
    workspaceRoot = wsConfig.getWorkspaceRoot();
    workspaceConfig = wsConfig;
  } catch {
    // Fallback to PathContext
    ctx = await PathContext.tryLoad();
    workspaceRoot = ctx?.getWorkspaceRoot();
  }

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
  
  if (workspaceConfig || ctx) {
    console.log(`Config File:    ${path.join(workspaceRoot, '.descix', 'workspace.json')}`);

    if (workspaceConfig) {
      // V2 path — use WorkspaceConfig which handles env.platform/products format
      try {
        const defaultCtx = workspaceConfig.defaultContext;
        if (defaultCtx) {
          console.log(`Community:      ${defaultCtx.communityId || 'unknown'}`);
          console.log(`App:            ${defaultCtx.appId || 'unknown'}`);
        }

        // List all configured apps
        const platform = workspaceConfig.env?.platform;
        const products = workspaceConfig.env?.products || [];
        const allApps = [platform?.appId, ...products.map(p => p.appId)].filter(Boolean);
        if (allApps.length > 0) {
          console.log(`Local Apps:     ${allApps.join(', ')}`);
        }

        console.log(`API:            ${workspaceConfig.apiUrl || 'unknown'}`);
        console.log(`Local Root:     ${workspaceRoot}`);
      } catch (error) {
        console.log(`Mode:           ${chalk.red('Unknown/Invalid')} (${error.message})`);
      }
    } else {
      // Legacy PathContext path
      const wsRawConfig = ctx.getWorkspaceConfig();
      try {
        const mode = detectWorkspaceMode(wsRawConfig);
        console.log(`Mode:           ${chalk.green(mode)}`);

        if (wsRawConfig.communities) {
          for (const [commId, comm] of Object.entries(wsRawConfig.communities)) {
            const appCount = Object.keys(comm.apps || {}).length;
            console.log(chalk.gray(`  └─ ${commId}: ${appCount} app(s)`));
          }
        }
        console.log(`Local Root:     ${workspaceRoot}`);
      } catch (error) {
        console.log(`Mode:           ${chalk.red('Unknown/Invalid')} (${error.message})`);
      }
    }
  } else {
    console.log(`Status:         ${chalk.yellow('No workspace found')}`);
    console.log(`Action:         Run 'descix init -c <community> -a <app> -p .' to create a workspace`);
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
