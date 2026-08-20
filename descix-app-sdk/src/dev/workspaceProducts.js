/**
 * Shared helper — builds the product URL map the SHELL consumes
 * (__WORKSPACE_PRODUCTS__), from workspace.json.
 * Used by both the gateway (gateway.js) and individual app Vite configs.
 *
 * EVERY URL IN THIS MAP IS ON THE GATEWAY ORIGIN. That is the contract, not an
 * implementation detail: the shell feeds these URLs straight to the CodeSite
 * iframe `src` (AppData.getProductUrl -> AppWidget -> CodeSiteWidget), and
 * SplitView dispatches actions by reaching into `iframe.contentWindow` — direct
 * interframe scripting, no postMessage bridge. Hand the shell an app's OWN
 * dev-server origin and that reach throws a cross-origin SecurityError, so
 * SplitView dies silently for exactly the apps a developer is working on.
 * Apps are ALWAYS shell-origin when iframed (CEO-D-2026-08-19-SERVE-UX-AMB-RULINGS,
 * AMB-4). The gateway already proxies /p/{appId} to the app's dev server with no
 * path rewrite (createViteProxyConfig), so the gateway URL is the whole answer.
 *
 * Returns { [appId]: 'https://localhost:{gatewayPort}/p/{appId}' } (platform:
 * the gateway root) or null if no products found.
 */
import fs from 'fs';
import path from 'path';
import { resolveGatewayPort } from './gatewayPort.js';
import { POWCH_APP_ID } from './powchUrl.js';

/**
 * The local gateway origin. ONE owner of the shape, so the map and
 * resolveAppGatewayUrl below cannot drift into two different answers.
 * @param {number} gatewayPort
 * @returns {string}
 */
export function gatewayOrigin(gatewayPort) {
  return `https://localhost:${gatewayPort}`;
}

/**
 * Where the shell loads a PRODUCT app from — always the gateway origin.
 * @param {number} gatewayPort
 * @param {string} appId
 * @returns {string}
 */
export function gatewayProductUrl(gatewayPort, appId) {
  return `${gatewayOrigin(gatewayPort)}/p/${appId}`;
}

export function buildWorkspaceProducts(workspaceRoot) {
  const wsPath = path.resolve(workspaceRoot, '.descix/workspace.json');
  if (!fs.existsSync(wsPath)) return null;

  const ws = JSON.parse(fs.readFileSync(wsPath, 'utf8'));
  const products = {};

  // Gateway port — resolved by the ONE owner, so this map can never name a port
  // the server is not listening on.
  const { port: gatewayPort } = resolveGatewayPort(ws);

  // Platform (the shell/store app) — served at the gateway ROOT.
  if (ws.env?.platform?.appId && (ws.env.platform.site?.port || ws.env.platform.site?.static)) {
    products[ws.env.platform.appId] = `${gatewayOrigin(gatewayPort)}/`;
  }

  // Products (community apps, Powch, etc.) — served at the gateway /p/{appId},
  // whether the gateway serves them from disk (site.static, staticSitePlugin) or
  // proxies them to their own dev server (site.port, createViteProxyConfig).
  // site.protocol describes that UPSTREAM origin and is consumed by the proxy
  // builder; it is deliberately absent here, because the browser never talks to
  // the upstream directly.
  if (Array.isArray(ws.env?.products)) {
    for (const p of ws.env.products) {
      if (!p.appId) continue;
      // Powch is NOT a hosted app and must never appear here. This map is the
      // shell-origin map — everything in it is same-origin with the shell by
      // design. Powch is the ZK-SSO identity silo and is CROSS-origin by design:
      // same-origin would let every hosted app read its DOM and memory through
      // the same reach SplitView uses. Its location has one owner, resolvePowchUrl.
      if (p.appId === POWCH_APP_ID) continue;
      if (p.site?.port || p.site?.static) {
        products[p.appId] = gatewayProductUrl(gatewayPort, p.appId);
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
 * same shape for both. The app's own dev-server port is the ORIGIN the gateway
 * proxies TO; it is never a URL anything opens or iframes.
 *
 * This returns the SAME answer buildWorkspaceProducts puts in the map — both go
 * through gatewayProductUrl/gatewayOrigin above. Two answers to "where is this
 * app" is the G-1 defect and it must not come back.
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
      url: gatewayOrigin(gatewayPort) + '/',
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

  const url = gatewayProductUrl(gatewayPort, appId);

  if (product.site?.static !== undefined && product.site?.static !== null) {
    return { url, gatewayPort, kind: 'static', via: 'gateway /p/' + appId + ' (staticSitePlugin → ' + product.site.static + ')' };
  }
  if (product.site?.port) {
    return { url, gatewayPort, kind: 'dev-server', via: 'gateway /p/' + appId + ' → https://localhost:' + product.site.port };
  }

  throw new Error('App \'' + appId + '\' has no site config (no site.static or site.port) in workspace.json. Nothing to open. Set one with `descix app set-site`.');
}
