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
export async function init(env, options = {}) {
  try {
    // NO DEFAULT ENVIRONMENT. This used to be `init(env = 'prod')` with an `if (env === 'dev')
    // … else <production>` body, which meant a bare `descix config init` — and ANY unrecognised
    // environment name, including a typo — silently wrote the PRODUCTION origin into the
    // workspace. That is precisely "an origin the developer did not choose".
    if (!env) {
      throw new Error(
        'descix config init requires an environment: --env dev|demo|prod.\n' +
        'There is no default — the origin this workspace talks to is a choice, not an omission.'
      );
    }

    const normalized = String(env).toLowerCase();
    const known = WorkspaceConfig.ENV_MAP[normalized];
    if (!known) {
      throw new Error(
        `Unknown environment "${env}". Known environments: ` +
        `${Object.keys(WorkspaceConfig.ENV_MAP).join(', ')}.\n` +
        'For a self-hosted or port-forwarded gateway use ' +
        '`descix config set-env <name> --url https://...`.'
      );
    }

    // Write through the CANONICAL writer. This function used to assign the LEGACY top-level
    // `workspaceConfig.apiUrl`, while `config set-env` writes `env.apiUrl` — two writers of one
    // fact, writing two different keys, one of which `getApiUrl()` only consults as a fallback.
    const workspaceConfig = await WorkspaceConfig.load();
    const result = await workspaceConfig.setEnvironment(normalized, options.url || null);

    console.log(chalk.green('\n✅ Configuration initialized!\n'));
    console.log(chalk.white(`   Environment: ${result.environment}`));
    console.log(chalk.white(`   API URL:     ${result.apiUrl}`));
    console.log(chalk.gray(`   Saved to:    ${result.configPath}\n`));

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

// ─── Workspace-level env keys (redteam G-6) ──────────────────────────────────
// env.gateway.port, env.devCerts, env.powchUrl and env.siteUrl are read by the
// gateway and the shell build, but had NO verb — the only way to set them was to
// hand-edit .descix/workspace.json. The target UX is that a developer never
// hand-crafts that file, so each of these now has a command.

/**
 * Shared writer: set one key, report it, and say where it landed.
 *
 * `produceValue` is a THUNK, not a value, so validation runs INSIDE this
 * try/catch. Passing an already-validated value meant a rejection threw at the
 * call site, propagated to the CLI action's `catch { process.exit(1) }`, and the
 * developer got a bare exit code with no message — a fail-loud that fails
 * silently, which is worse than no validation because it looks like a crash.
 */
async function setWorkspaceEnvKey(dottedKey, produceValue, label) {
  try {
    const value = typeof produceValue === 'function' ? produceValue() : produceValue;
    const workspaceConfig = await WorkspaceConfig.load();
    const configPath = await workspaceConfig.setEnvKey(dottedKey, value);
    console.log(chalk.green(`\n✅ ${label}\n`));
    console.log(chalk.white(`   env.${dottedKey}: ${value === null ? chalk.gray('(removed)') : value}`));
    console.log(chalk.gray(`   Saved to: ${configPath}\n`));
    return configPath;
  } catch (error) {
    console.error(chalk.red(`\n❌ ${error.message}\n`));
    throw error;
  }
}

/** Reject anything that is not a usable port BEFORE it reaches the file. */
function assertPort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Port must be an integer 1-65535, got "${value}".`);
  }
  return port;
}

/** Reject anything that is not an absolute http(s) URL BEFORE it reaches the file. */
function assertUrl(value, what) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${what} must be an absolute URL (e.g. https://powch.dev.descix.net), got "${value}".`);
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`${what} must be http(s), got "${parsed.protocol}//".`);
  }
  return value;
}

/**
 * Set the port `descix serve` listens on (env.gateway.port).
 */
export async function setGatewayPort(port) {
  return setWorkspaceEnvKey(
    'gateway.port',
    () => (port === null ? null : assertPort(port)),
    'Gateway port set — `descix serve` will listen here and the shell product map will match it.',
  );
}

/**
 * Point the local dev servers at a specific TLS cert pair (env.devCerts.*).
 * One owner: the gateway AND every app dev server behind it read this.
 */
export async function setDevCerts(options = {}) {
  const { dir, cert, key, clear } = options;
  if (clear) {
    await setWorkspaceEnvKey('devCerts.dir', null, 'Dev certs cleared — falling back to the SDK-tracked SAN pair.');
    await setWorkspaceEnvKey('devCerts.cert', null, 'Dev cert file cleared.');
    return setWorkspaceEnvKey('devCerts.key', null, 'Dev key file cleared.');
  }
  if (!dir && !cert && !key) {
    const message =
      'Nothing to set. Pass --dir <path> (a directory holding cert.pem + key.pem), ' +
      'or --cert <path> and --key <path>, or --clear to remove.';
    console.error(chalk.red(`\n❌ ${message}\n`));
    throw new Error(message);
  }
  let last;
  if (dir) last = await setWorkspaceEnvKey('devCerts.dir', path.resolve(dir), 'Dev cert directory set.');
  if (cert) last = await setWorkspaceEnvKey('devCerts.cert', path.resolve(cert), 'Dev certificate set.');
  if (key) last = await setWorkspaceEnvKey('devCerts.key', path.resolve(key), 'Dev private key set.');
  return last;
}

/**
 * Set where Powch lives (env.powchUrl).
 * Powch is CROSS-ORIGIN from the shell by design — it holds passkeys and the
 * wallet — so this is its own origin, never a path on the gateway.
 */
export async function setPowchUrl(url) {
  return setWorkspaceEnvKey(
    'powchUrl',
    () => (url === null ? null : assertUrl(url, 'Powch URL')),
    'Powch URL set — the gateway and the shell build now agree on it.',
  );
}

/**
 * Set the App Shell origin `descix serve` proxies `/` to (env.siteUrl).
 */
export async function setSiteUrl(url) {
  return setWorkspaceEnvKey(
    'siteUrl',
    () => (url === null ? null : assertUrl(url, 'Site URL')),
    'App Shell URL set — `descix serve` will proxy / here.',
  );
}
