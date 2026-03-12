/**
 * Gateway — Pure reverse proxy for the DeSciX local dev mesh.
 *
 * Boots a Vite server as a reverse-proxy routing the entire mesh
 * (Platform PWA, Powch, community apps, microservices) through a
 * single HTTPS port. Mirrors production's GCP Load Balancer locally.
 *
 * Routing is data-driven via .descix/workspace.json:
 *   - env.platform  → root proxy (the shell/store)
 *   - env.products[] → /p/{appId} per product
 *   - API, services, GCS → standard prefixes
 *
 * This module lives in @descix/app-sdk so that any app built on the
 * SDK can spin up the gateway. The CLI is a thin wrapper.
 */

import fs from 'fs';
import path from 'path';
import { createViteProxyConfig } from './createViteProxyConfig.js';
import { getViteHttpsConfig } from './getViteHttpsConfig.js';
import { watchWorkspaceConfig } from './watchWorkspaceConfig.js';
import { buildWorkspaceProducts } from './workspaceProducts.js';

/**
 * Find the workspace root by walking up from startDir looking for .descix/workspace.json.
 * @param {string} startDir
 * @returns {string|null}
 */
function findWorkspaceRoot(startDir) {
  let dir = path.resolve(startDir);
  while (true) {
    if (fs.existsSync(path.join(dir, '.descix', 'workspace.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Read workspace config from .descix/workspace.json.
 * @param {string} workspaceRoot
 * @returns {Object}
 */
function readWorkspaceConfig(workspaceRoot) {
  const configPath = path.join(workspaceRoot, '.descix', 'workspace.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

/**
 * Derive the API gateway URL from workspace config.
 */
function deriveApiUrl(config) {
  const env = config.env || {};
  if (env.apiUrl || config.apiUrl) {
    return env.apiUrl || config.apiUrl;
  }
  // Derive from platform microservice config
  const ms = env.platform?.microservice || {};
  const port = ms.port || 4000;
  const proto = ms.protocol || 'https';
  return `${proto}://localhost:${port}`;
}

/**
 * Build the Vite `define` map from workspace config.
 * Injected into frontend code served through the gateway.
 */
function buildDefines(config, workspaceRoot) {
  const env = config.env || {};

  // Powch URL: env.powchUrl or auto-discover from env.products[]
  let powchAppUrl = env.powchUrl || 'https://powch.descix.net/';
  if (!env.powchUrl && Array.isArray(env.products)) {
    const powchProduct = env.products.find(p => p.appId === 'powch');
    if (powchProduct?.site?.port) {
      powchAppUrl = `https://localhost:${powchProduct.site.port}/`;
    }
  }

  const apiGatewayUrl = deriveApiUrl(config);

  // Build product map from workspace.json (shared helper)
  const products = buildWorkspaceProducts(workspaceRoot) || {};

  return {
    '__STANDALONE_APP_ID__': 'null',
    '__STANDALONE_APP_URL__': 'null',
    '__POWCH_APP_URL__': JSON.stringify(powchAppUrl),
    '__API_GATEWAY_URL__': JSON.stringify(apiGatewayUrl),
    '__WORKSPACE_PRODUCTS__': JSON.stringify(products),
    'global': 'globalThis',
  };
}

/**
 * Build the full gateway proxy config.
 * Composes app-level proxy rules + root catch-all for the platform site.
 */
function buildGatewayProxy(workspaceRoot, apiGatewayUrl) {
  // App-level routes (API, services, products, GCS)
  const proxy = createViteProxyConfig(workspaceRoot, { apiGatewayUrl });

  // Root catch-all: platform site (must be LAST so specific routes take priority)
  const config = readWorkspaceConfig(workspaceRoot);
  const platform = config.env?.platform;
  if (platform?.site?.port) {
    const proto = platform.site.protocol || 'https';
    proxy['/'] = {
      target: `${proto}://localhost:${platform.site.port}`,
      changeOrigin: true,
      secure: false,
      ws: true,
    };
  }

  return proxy;
}

/**
 * @param {Object} options
 * @param {number} [options.port=5173]
 * @param {string} [options.workspaceRoot] - Workspace root (auto-discovered from CWD if omitted)
 * @param {function} [options.log] - Logger (defaults to console.log)
 */
export async function runGateway(options = {}) {
  const port = options.port || 5173;
  const log = options.log || console.log;

  // Resolve workspace root
  const workspaceRoot = options.workspaceRoot
    ? findWorkspaceRoot(options.workspaceRoot) || options.workspaceRoot
    : findWorkspaceRoot(process.cwd());

  if (!workspaceRoot || !fs.existsSync(path.join(workspaceRoot, '.descix', 'workspace.json'))) {
    throw new Error('No .descix/workspace.json found. Run from a DeSciX workspace or pass --workspace-root.');
  }

  const config = readWorkspaceConfig(workspaceRoot);
  const apiGatewayUrl = deriveApiUrl(config);

  log(`\n  descix-serve — Unified Local Gateway\n`);
  log(`  Workspace: ${workspaceRoot}`);
  log(`  API:       ${apiGatewayUrl}`);
  log(`  Port:      ${port}`);
  log('');

  const proxyRules = buildGatewayProxy(workspaceRoot, apiGatewayUrl);
  const httpsConfig = getViteHttpsConfig();

  logProxyTable(proxyRules, log);

  const { createServer } = await import('vite');

  let server = await createServer({
    root: workspaceRoot,
    configFile: false,
    server: {
      port,
      ...httpsConfig,
      host: true,
      hmr: false,
      proxy: proxyRules,
    },
    define: buildDefines(config, workspaceRoot),
    optimizeDeps: { noDiscovery: true },
  });

  await server.listen();
  log(`\n  Gateway listening on https://localhost:${port}\n`);

  const watcher = watchWorkspaceConfig(workspaceRoot, async (newConfig) => {
    const newApiUrl = deriveApiUrl(newConfig);
    const newProxy = buildGatewayProxy(workspaceRoot, newApiUrl);

    log('\n  workspace.json changed — restarting gateway...\n');
    logProxyTable(newProxy, log);

    await server.close();

    server = await createServer({
      root: workspaceRoot,
      configFile: false,
      server: {
        port,
        ...httpsConfig,
        host: true,
        hmr: false,
        proxy: newProxy,
      },
      define: buildDefines(newConfig, workspaceRoot),
      optimizeDeps: { noDiscovery: true },
    });

    await server.listen();
    log(`\n  Gateway restarted on https://localhost:${port}\n`);
  });

  process.on('SIGINT', () => { watcher.close(); server.close(); process.exit(0); });
  process.on('SIGTERM', () => { watcher.close(); server.close(); process.exit(0); });
}

function logProxyTable(proxy, log) {
  log('  Proxy routes:');
  for (const [route, config] of Object.entries(proxy)) {
    const target = config.target || '?';
    log(`    ${route.padEnd(40)} → ${target}`);
  }
  log('');
}
