/**
 * Gateway — Pure reverse proxy for the DeSciX local dev mesh.
 *
 * Boots a Vite server as a reverse-proxy routing the entire mesh through a
 * single HTTPS origin. Mirrors production's GCP Load Balancer locally, so the
 * App Shell, an app's own site and /apifront all share ONE origin (which is
 * what makes a shell sign-in visible to the app, and passkeys possible).
 *
 * Routing is data-driven via .descix/workspace.json:
 *   - root '/'       → the App Shell: env.siteUrl, or a local env.platform.site,
 *                      or the API origin when that is remote (resolveGatewayTargets)
 *   - env.products[] → /p/{appId} per product (dev server or static dir)
 *   - API, services, GCS → standard prefixes
 *
 * A workspace with no local platform checkout therefore serves the CLOUD shell
 * and proxies /apifront to cloud DEV — local app dev needs no platform source.
 *
 * This module lives in @descix/app-sdk so that any app built on the
 * SDK can spin up the gateway. The CLI is a thin wrapper.
 */

import fs from 'fs';
import path from 'path';
import { createViteProxyConfig } from './createViteProxyConfig.js';
import { getViteHttpsConfig, resolveCertPaths, trustCertCommand } from './getViteHttpsConfig.js';
import { watchWorkspaceConfig } from './watchWorkspaceConfig.js';
import { buildWorkspaceProducts } from './workspaceProducts.js';
import { staticSitePlugin } from './staticSitePlugin.js';
import { resolveGatewayTargets, proxyEntry, isLocalOrigin } from './resolveGatewayTargets.js';
import { resolveGatewayPort, portInUseMessage } from './gatewayPort.js';
import { assertVitePin } from './vitePin.js';
import { resolveServeBinding, appBindingPlugin, APP_BINDING_PATH } from './serveBinding.js';
import { resolvePowchUrl } from './powchUrl.js';
import { resolveDevCertOptions } from './devCerts.js';

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
 * Build the Vite `define` map from workspace config.
 * Injected into frontend code the gateway itself transforms (a LOCAL shell or
 * app dev server). When the root is remote, the shell arrives pre-built from
 * that origin and these defines are inert.
 */
function buildDefines(config, workspaceRoot, targets) {
  // Powch URL — ONE owner, shared with the shell's own build (see powchUrl.js).
  const powchAppUrl = resolvePowchUrl(config);
  if (!powchAppUrl && isLocalOrigin(targets.siteUrl)) {
    // Only meaningful for a locally-built shell; a remote shell carries its own.
    // Said early because the shell now FAILS at boot rather than defaulting to a
    // production wallet — this warning is the hint that names the fix first.
    console.warn(
      '[Gateway] No Powch URL in workspace config — the shell will fail to boot.\n' +
      '          Set env.powchUrl in .descix/workspace.json, or run Powch as a\n' +
      '          product (env.products[] with appId "powch" and a site.port).'
    );
  }

  // Build product map from workspace.json (shared helper)
  const products = buildWorkspaceProducts(workspaceRoot) || {};

  // Standalone is NOT a define here. It is SERVED, at APP_BINDING_PATH, because
  // the shell this gateway fronts usually arrives pre-built from the cloud and
  // never passes through a define. See serveBinding.js (AMB-1c).
  return {
    '__POWCH_APP_URL__': JSON.stringify(powchAppUrl),
    '__API_GATEWAY_URL__': JSON.stringify(targets.apiUrl),
    '__WORKSPACE_PRODUCTS__': JSON.stringify(products),
    'global': 'globalThis',
  };
}

/**
 * Build the full gateway proxy config.
 * Composes app-level proxy rules + the root route for the App Shell.
 *
 * @param {string} workspaceRoot
 * @param {{apiUrl: string, siteUrl: string}} targets
 */
export function buildGatewayProxy(workspaceRoot, targets) {
  // App-level routes (API, services, products, GCS)
  const proxy = createViteProxyConfig(workspaceRoot, { apiGatewayUrl: targets.apiUrl });

  // Root: the App Shell — local checkout or cloud origin (must be LAST in the
  // table so the specific routes above take priority).
  proxy['/'] = proxyEntry(targets.siteUrl, { ws: true });

  return proxy;
}

/**
 * @param {Object} options
 * @param {number} [options.port] - Explicit port override (the --port flag). Omit to
 *   resolve from env.gateway.port, else the built-in default (see gatewayPort.js).
 * @param {string} [options.portSource] - Human label for where an explicit port came from
 * @param {string} [options.workspaceRoot] - Workspace root (auto-discovered from CWD if omitted)
 * @param {string} [options.apiUrl] - Override the API target for this run
 * @param {string} [options.apiSource] - Human label for where apiUrl came from
 * @param {string} [options.siteUrl] - Override the App Shell (root) target for this run
 * @param {string} [options.siteSource] - Human label for where siteUrl came from
 * @param {function} [options.log] - Logger (defaults to console.log)
 */
export async function runGateway(options = {}) {
  const log = options.log || console.log;
  const targetOverrides = {
    ...(options.apiUrl ? { apiGatewayUrl: options.apiUrl, apiSource: options.apiSource } : {}),
    ...(options.siteUrl ? { siteUrl: options.siteUrl, siteSource: options.siteSource } : {}),
  };

  // Resolve workspace root
  const workspaceRoot = options.workspaceRoot
    ? findWorkspaceRoot(options.workspaceRoot) || options.workspaceRoot
    : findWorkspaceRoot(process.cwd());

  if (!workspaceRoot || !fs.existsSync(path.join(workspaceRoot, '.descix', 'workspace.json'))) {
    throw new Error('No .descix/workspace.json found. Run from a DeSciX workspace or pass --workspace-root.');
  }

  const config = readWorkspaceConfig(workspaceRoot);
  const targets = resolveGatewayTargets(config, targetOverrides);
  // ONE owner of the port, so the server and the product map the shell bakes
  // (buildWorkspaceProducts) can never name different ports.
  const { port, portSource } = resolveGatewayPort(config, {
    port: options.port,
    portSource: options.portSource || (options.port !== undefined ? '--port' : undefined),
  });

  log(`\n  descix-serve — Unified Local Gateway\n`);
  log(`  Workspace: ${workspaceRoot}`);
  log(`  API:       ${targets.apiUrl}   [${targets.apiSource}]`);
  log(`  Shell:     ${targets.siteUrl}   [${targets.siteSource}]`);
  log(`  Port:      ${port}   [${portSource}]`);

  // Which app is this session serving? cwd by default, --app to override.
  // Fails loud rather than falling back to store chrome (AMB-2, AMB-5).
  const binding = resolveServeBinding(workspaceRoot, config, {
    app: options.app,
    cwd: options.cwd || process.cwd(),
    gatewayPort: port,
  });
  log(`  App:       ${binding.appId}   [${binding.source}]  → standalone at ${binding.appUrl}`);
  log('');

  const proxyRules = buildGatewayProxy(workspaceRoot, targets);
  const staticRoutes = proxyRules._staticRoutes || {};
  delete proxyRules._staticRoutes;
  // Dev certs — ONE owner, shared with every app dev server behind this gateway
  // (createViteServerConfig). They used to diverge, so a workspace-configured
  // trusted cert reached :5173 and nothing else — and passkey login is
  // origin-bound, so it worked on the gateway and failed on the app.
  const certOpts = resolveDevCertOptions(workspaceRoot, {}, config);
  const httpsConfig = getViteHttpsConfig(certOpts);
  const { certPath } = resolveCertPaths(certOpts);

  logProxyTable(proxyRules, log);
  if (Object.keys(staticRoutes).length > 0) {
    log('  Static sites:');
    for (const [appId, dir] of Object.entries(staticRoutes)) {
      log(`    /p/${appId.padEnd(36)} → ${dir}`);
    }
    log('');
  }

  // Model V: the proxy engine is exact-pinned by this package. Refuse to boot
  // the local mesh on a version the gateway was not verified on.
  const { pinned } = assertVitePin();
  log(`  Proxy engine: vite ${pinned} (exact-pinned by @descix/app-sdk)\n`);

  const { createServer } = await import('vite');

  let server = await createServer({
    root: workspaceRoot,
    configFile: false,
    plugins: [appBindingPlugin(binding), staticSitePlugin(staticRoutes)],
    server: {
      port,
      strictPort: true,
      ...httpsConfig,
      host: true,
      hmr: false,
      proxy: proxyRules,
    },
    define: buildDefines(config, workspaceRoot, targets),
    optimizeDeps: { noDiscovery: true },
  });

  await listenOrFailLoud(server, port, portSource);
  log(`\n  Gateway listening on https://localhost:${port}\n`);
  log(`  App binding: https://localhost:${port}${APP_BINDING_PATH}\n`);
  log(`  Dev cert: ${certPath}`);
  log(`  Passkey login needs this cert trusted once:\n    ${trustCertCommand(certPath)}\n`);

  // WS-7: Service discovery — fetch /manifest from all microservices
  discoverServices(config, log).catch(err => {
    log(`  [Service Discovery] Error: ${err.message}\n`);
  });

  const watcher = watchWorkspaceConfig(workspaceRoot, async (newConfig) => {
    const newTargets = resolveGatewayTargets(newConfig, targetOverrides);
    const newProxy = buildGatewayProxy(workspaceRoot, newTargets);
    const newStaticRoutes = newProxy._staticRoutes || {};
    delete newProxy._staticRoutes;

    log('\n  workspace.json changed — restarting gateway...\n');
    logProxyTable(newProxy, log);

    // Re-resolve the binding too: a renamed or moved app must not keep serving
    // the previous answer at APP_BINDING_PATH.
    const newBinding = resolveServeBinding(workspaceRoot, newConfig, {
      app: options.app,
      cwd: options.cwd || process.cwd(),
      gatewayPort: port,
    });

    await server.close();

    server = await createServer({
      root: workspaceRoot,
      configFile: false,
      plugins: [appBindingPlugin(newBinding), staticSitePlugin(newStaticRoutes)],
      server: {
        port,
        strictPort: true,
        ...httpsConfig,
        host: true,
        hmr: false,
        proxy: newProxy,
      },
      define: buildDefines(newConfig, workspaceRoot, newTargets),
      optimizeDeps: { noDiscovery: true },
    });

    await listenOrFailLoud(server, port, portSource);
    log(`\n  Gateway restarted on https://localhost:${port}  (app ${newBinding.appId})\n`);
  });

  process.on('SIGINT', () => { watcher.close(); server.close(); process.exit(0); });
  process.on('SIGTERM', () => { watcher.close(); server.close(); process.exit(0); });
}

/**
 * Listen on the resolved port, or fail loud naming BOTH where the port came
 * from and the flag that overrides it.
 *
 * `strictPort: true` is what makes this honest: without it Vite silently walks
 * to the next free port, so the server ends up somewhere the product map the
 * shell baked (buildWorkspaceProducts) does not point at — the map and the
 * server disagree and nothing says so.
 *
 * @param {Object} server - a Vite dev server
 * @param {number} port
 * @param {string} portSource
 */
export async function listenOrFailLoud(server, port, portSource) {
  try {
    await server.listen();
  } catch (err) {
    if (err?.code === 'EADDRINUSE' || /(address|port).*in use/i.test(err?.message || '')) {
      throw new Error(portInUseMessage(port, portSource));
    }
    throw err;
  }
}

/**
 * WS-7: Service Discovery
 *
 * After the gateway starts, discover all microservices by fetching their /manifest
 * endpoint. Logs the results for visibility into the service mesh state.
 *
 * Services self-register with Cloud on their own startup (Powch → storage.js,
 * Cloud → app.js bootstrap). This discovery step provides a unified view and
 * catches any services that may have failed to self-register.
 *
 * @param {Object} config — workspace config from .descix/workspace.json
 * @param {Function} log — logger function
 */
async function discoverServices(config, log) {
  const services = [];

  // Platform microservice (Cloud)
  const platform = config.env?.platform;
  if (platform?.microservice?.port) {
    services.push({
      name: platform.appId || 'platform',
      port: platform.microservice.port,
    });
  }

  // Product microservices (Powch, BEAST, etc.)
  const products = config.env?.products || [];
  for (const p of products) {
    if (p.microservice?.port) {
      services.push({
        name: p.appId,
        port: p.microservice.port,
      });
    }
  }

  if (services.length === 0) {
    log('  [Service Discovery] No microservices found in workspace.json\n');
    return;
  }

  log('  Service discovery:');

  // Tolerate self-signed certs in dev (same as Vite proxy secure:false)
  const prevTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  for (const svc of services) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`https://localhost:${svc.port}/manifest`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        log(`    ${svc.name.padEnd(20)} port:${svc.port}  no /manifest (${res.status})`);
        continue;
      }

      const manifest = await res.json();
      const commandCount = Object.keys(manifest.commands || {}).length;
      const version = manifest.service?.version || '?';
      log(`    ${svc.name.padEnd(20)} port:${svc.port}  ${commandCount} commands (v${version})`);
    } catch (err) {
      const reason = err.name === 'AbortError' ? 'timeout' : err.message;
      log(`    ${svc.name.padEnd(20)} port:${svc.port}  unreachable (${reason})`);
    }
  }

  // Restore TLS setting
  if (prevTls === undefined) {
    delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  } else {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = prevTls;
  }

  log('');
}

function logProxyTable(proxy, log) {
  log('  Proxy routes:');
  for (const [route, config] of Object.entries(proxy)) {
    const target = config.target || '?';
    log(`    ${route.padEnd(40)} → ${target}`);
  }
  log('');
}
