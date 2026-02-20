/**
 * Doctor Command
 * 
 * Diagnoses common issues with the DeSciX CLI environment.
 * Checks: Node version, Connectivity, Auth, Permissions, gcloud, ADC.
 */

import chalk from 'chalk';
import ora from 'ora';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DeSciXApiClient } from '../api-client.js';
import { GlobalConfig } from '../global-config.js';
import { isAuthenticated } from '../auth-guard.js';

const execAsync = promisify(exec);

// Minimum required Node version
const MIN_NODE_VERSION = 18;

/**
 * Helper to run a check and report status
 */
async function runCheck(spinner, label, checkFn) {
  spinner.text = `Checking ${label}...`;
  try {
    const result = await checkFn();
    if (result.ok) {
      // Don't succeed the spinner yet, just update text or log info?
      // Actually, standard doctor output usually lists items.
      // We'll use the spinner for the active check, then stop it and print the result line.
      return { ...result, label, status: 'ok' };
    } else {
      return { ...result, label, status: 'fail' };
    }
  } catch (error) {
    return { ok: false, message: error.message, label, status: 'error' };
  }
}

/**
 * Check Node.js version
 */
async function checkNode() {
  const version = process.version; // e.g. 'v18.16.0'
  const major = parseInt(version.substring(1).split('.')[0], 10);
  
  if (major >= MIN_NODE_VERSION) {
    return { ok: true, message: `v${major} (Supported)` };
  }
  return { 
    ok: false, 
    message: `v${major} (Unsupported)`, 
    remediation: `Upgrade Node.js to v${MIN_NODE_VERSION} or higher.` 
  };
}

/**
 * Check API Connectivity
 */
async function checkConnectivity(apiClient) {
  try {
    // Just check if we can reach the health endpoint or root
    // The API client doesn't expose a raw ping, but we can try a lightweight call
    // or just check if we can resolve the URL
    const start = Date.now();
    // We'll use a public endpoint if available, or just try to load credentials which is local
    // Let's try a simple fetch to the base URL
    const response = await fetch(apiClient.baseUrl);
    const duration = Date.now() - start;
    
    if (response.ok || response.status === 404) { // 404 means server is up but route might be missing
      return { ok: true, message: `${duration}ms` };
    }
    return { 
      ok: false, 
      message: `HTTP ${response.status}`, 
      remediation: `Check your internet connection or if the DeSciX API (${apiClient.baseUrl}) is reachable.` 
    };
  } catch (error) {
    return { 
      ok: false, 
      message: 'Unreachable', 
      remediation: `Check your internet connection. API URL: ${apiClient.baseUrl}` 
    };
  }
}

/**
 * Check Authentication
 */
async function checkAuth(apiClient) {
  const isAuth = await isAuthenticated(apiClient);
  if (isAuth) {
    return { ok: true, message: 'Valid session' };
  }
  return { 
    ok: false, 
    message: 'Not authenticated', 
    remediation: `Run 'descix login' to authenticate.` 
  };
}

/**
 * Check Write Permissions
 */
async function checkPermissions() {
  const dirs = [
    path.join(process.cwd(), '.descix'),
    path.join(process.cwd(), '.cursor')
  ];
  
  const issues = [];
  
  for (const dir of dirs) {
    try {
      // Try to access or create dir
      await fs.mkdir(dir, { recursive: true });
      // Try to write a temp file
      const testFile = path.join(dir, '.perm-test');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
    } catch (error) {
      issues.push(path.basename(dir));
    }
  }
  
  if (issues.length === 0) {
    return { ok: true, message: 'Writable' };
  }
  
  return { 
    ok: false, 
    message: `Access denied: ${issues.join(', ')}`, 
    remediation: `Check file permissions for the current directory.` 
  };
}

/**
 * Check gcloud SDK
 */
export async function checkGcloud() {
  try {
    const { stdout } = await execAsync('gcloud --version');
    const version = stdout.split('\n')[0].trim(); // e.g. "Google Cloud SDK 456.0.0"
    return { ok: true, message: version };
  } catch (error) {
    return { 
      ok: false, 
      message: 'Not installed or not in PATH', 
      remediation: `Install the Google Cloud SDK: https://cloud.google.com/sdk/docs/install` 
    };
  }
}

/**
 * Check ADC Credentials
 */
export async function checkAdc() {
  // 1. Check env var
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      await fs.access(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      return { ok: true, message: 'Configured via Env Var' };
    } catch {
      return { 
        ok: false, 
        message: 'Env Var set but file missing', 
        remediation: `Check GOOGLE_APPLICATION_CREDENTIALS path: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}` 
      };
    }
  }

  // 2. Check default location
  // Unix: ~/.config/gcloud/application_default_credentials.json
  // Windows: %APPDATA%/gcloud/application_default_credentials.json
  const home = os.homedir();
  let defaultPath;
  if (process.platform === 'win32') {
    defaultPath = path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'gcloud', 'application_default_credentials.json');
  } else {
    defaultPath = path.join(home, '.config', 'gcloud', 'application_default_credentials.json');
  }

  try {
    await fs.access(defaultPath);
    // Optional: Read file to check scopes? 
    // For now, existence is a good enough proxy for "attempted setup"
    return { ok: true, message: 'Configured (Default Location)' };
  } catch {
    return { 
      ok: false, 
      message: 'Missing Credentials', 
      remediation: `Run: gcloud auth application-default login --scopes=https://www.googleapis.com/auth/drive.file,https://www.googleapis.com/auth/drive` 
    };
  }
}

/**
 * Run the doctor command
 */
export async function runDoctor(options = {}) {
  console.log(chalk.cyan('\n🩺 DeSciX Doctor\n'));
  
  const spinner = ora('Initializing...').start();
  const results = [];
  
  try {
    const globalConfig = await GlobalConfig.load();
    const apiClient = new DeSciXApiClient({ baseUrl: globalConfig.api_url });
    
    // 1. Node Version
    spinner.text = 'Checking Node.js...';
    const nodeRes = await checkNode();
    results.push({ label: 'Node.js Version', ...nodeRes });
    
    // 2. Connectivity
    spinner.text = 'Checking API Connectivity...';
    const connRes = await checkConnectivity(apiClient);
    results.push({ label: 'API Connectivity', ...connRes });
    
    // 3. Authentication
    spinner.text = 'Checking Authentication...';
    const authRes = await checkAuth(apiClient);
    results.push({ label: 'Authentication', ...authRes });
    
    // 4. Permissions
    spinner.text = 'Checking Permissions...';
    const permRes = await checkPermissions();
    results.push({ label: 'Local Permissions', ...permRes });
    
    // 5. gcloud SDK
    spinner.text = 'Checking gcloud SDK...';
    const gcloudRes = await checkGcloud();
    results.push({ label: 'gcloud SDK', ...gcloudRes });
    
    // 6. ADC Credentials
    spinner.text = 'Checking ADC Credentials...';
    const adcRes = await checkAdc();
    results.push({ label: 'ADC Credentials', ...adcRes });
    
    spinner.stop();
    
    // Print Results
    let hasFailures = false;
    
    results.forEach(res => {
      if (res.ok) {
        console.log(`${chalk.green('[✓]')} ${chalk.white(res.label)} ${chalk.gray(res.message ? `(${res.message})` : '')}`);
      } else {
        hasFailures = true;
        console.log(`${chalk.red('[✗]')} ${chalk.white(res.label)}`);
        console.log(`    ${chalk.red('Error:')} ${res.message}`);
        if (res.remediation) {
          console.log(`    ${chalk.yellow('Fix:')}   ${res.remediation}`);
        }
      }
    });
    
    console.log();
    
    if (hasFailures) {
      console.log(chalk.yellow('⚠️  Some checks failed. Please review the issues above.'));
      process.exit(1);
    } else {
      console.log(chalk.green('✨ All checks passed! Your environment is ready.'));
    }
    
  } catch (error) {
    spinner.fail('Doctor crashed');
    console.error(chalk.red(`\nUnexpected error: ${error.message}`));
    process.exit(1);
  }
}
