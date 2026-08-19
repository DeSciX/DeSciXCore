/**
 * Shared helper — builds a product URL map from workspace.json.
 * Used by both the gateway (gateway.js) and individual app Vite configs.
 *
 * Returns { [appId]: 'proto://localhost:port' } or null if no products found.
 */
import fs from 'fs';
import path from 'path';
import { resolveGatewayPort } from './gatewayPort.js';

export function buildWorkspaceProducts(workspaceRoot) {
  const wsPath = path.resolve(workspaceRoot, '.descix/workspace.json');
  if (!fs.existsSync(wsPath)) return null;

  const ws = JSON.parse(fs.readFileSync(wsPath, 'utf8'));
  const products = {};

  // Platform (the shell/store app)
  if (ws.env?.platform?.appId && ws.env.platform.site?.port) {
    const proto = ws.env.platform.site.protocol || 'https';
    products[ws.env.platform.appId] = `${proto}://localhost:${ws.env.platform.site.port}`;
  }

  // Products (community apps, Powch, etc.)
  // Gateway port for static site products — resolved by the ONE owner, so this
  // map can never name a port the server is not listening on.
  const { port: gatewayPort } = resolveGatewayPort(ws);

  if (Array.isArray(ws.env?.products)) {
    for (const p of ws.env.products) {
      if (p.appId && p.site?.port) {
        const proto = p.site.protocol || 'https';
        products[p.appId] = `${proto}://localhost:${p.site.port}`;
      } else if (p.appId && p.site?.static) {
        // Static sites are served by the gateway at /p/{appId}
        products[p.appId] = `https://localhost:${gatewayPort}/p/${p.appId}`;
      }
    }
  }

  return Object.keys(products).length > 0 ? products : null;
}

/**
 * Resolve the LOCAL GATEWAY URL for a single app, as served by `descix serve`.
 *
 * This is the URL a developer hits in the browser to view the app through the
 * dev gateway (which mirrors the production LB). It is the canonical resolver
 * shared by the CLI (`descix app open`) and any tooling that needs the same
 * answer the gateway routes to:
 *
 *   - env.platform           → root:           https://localhost:{gatewayPort}/
 *   - product, site.static   → static route:   https://localhost:{gatewayPort}/p/{appId}
 *   - product, site.port     → dev-server route: https://localhost:{gatewayPort}/p/{appId}
 *
 * Both static and dev-server PRODUCT sites are reached through the gateway at
 * /p/{appId} (createViteProxyConfig proxies dev-server products there;
 * staticSitePlugin serves static products there) — so the gateway URL is the
 * same shape for both. The app's own dev-server port (buildWorkspaceProducts'
 * value for a dev-server product) is the ORIGIN the gateway proxies TO; the URL
 * a developer opens is the gateway one.
 *
 * @param {string} workspaceRoot - Workspace root (contains .descix/workspace.json)
 * @param {string} appId - App identifier
 * @returns {{ url: string, gatewayPort: number, kind: 'platform'|'static'|'dev-server', via: string }}
 * @throws {Error} if workspace.json is missing, the app is not in the workspace,
 *                 or the app has no site config (static or port).
 */
export function resolveAppGatewayUrl(workspaceRoot, appId) {
  const wsPath = path.resolve(workspaceRoot, '.descix/workspace.json');
  if (!fs.existsSync(wsPath)) {
    throw new Error('[resolveAppGatewayUrl] No .descix/workspace.json found at ' + workspaceRoot);
  }
  if (!appId) {
    throw new Error('[resolveAppGatewayUrl] appId is required');
  }

  const ws = JSON.parse(fs.readFileSync(wsPath, 'utf8'));
  const env = ws.env || {};
  const { port: gatewayPort } = resolveGatewayPort(ws);

  // Platform app — served at the gateway root.
  if (env.platform?.appId === appId) {
    if (!env.platform.site?.port && !env.platform.site?.static) {
      throw new Error('App \'' + appId + '\' (platform) has no site config (no site.port or site.static) in workspace.json. Nothing to open.');
    }
    return {
      url: 'https://localhost:' + gatewayPort + '/',
      gatewayPort,
      kind: 'platform',
      via: 'gateway root (env.platform)',
    };
  }

  // Product app — must exist in env.products[].
  const products = Array.isArray(env.products) ? env.products : [];
  const product = products.find((p) => p.appId === appId);
  if (!product) {
    throw new Error('App \'' + appId + '\' is not mapped in workspace.json (not env.platform and not in env.products[]).');
  }

  const url = 'https://localhost:' + gatewayPort + '/p/' + appId;

  if (product.site?.static !== undefined && product.site?.static !== null) {
    return { url, gatewayPort, kind: 'static', via: 'gateway /p/' + appId + ' (staticSitePlugin → ' + product.site.static + ')' };
  }
  if (product.site?.port) {
    return { url, gatewayPort, kind: 'dev-server', via: 'gateway /p/' + appId + ' → https://localhost:' + product.site.port };
  }

  throw new Error('App \'' + appId + '\' has no site config (no site.static or site.port) in workspace.json. Nothing to open. Set one with `descix app set-site`.');
}
