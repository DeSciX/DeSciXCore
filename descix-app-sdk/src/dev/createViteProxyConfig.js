/**
 * createViteProxyConfig - Reusable Vite proxy config for the DeSciX local gateway.
 *
 * Reads .descix/workspace.json from workspacePath to discover local app/service
 * ports and environment URLs. Generates proxy rules for:
 *   - /apifront, /api, /mcp  -> Core API
 *   - /powch/*               -> Powch PWA (only when the workspace names it)
 *   - /s/{appId}             -> Microservice ports (path rewritten, prefix stripped)
 *   - /p/{appId}             -> Product site dev servers (NO path rewrite)
 *   - /Community/*           -> GCS fallback for remote assets
 *   - /.proxy/gcs_media      -> GCS media proxy
 */

import fs from 'fs';
import path from 'path';
import { resolveApiTarget, proxyEntry } from './resolveGatewayTargets.js';
import { resolvePowchUrl } from './powchUrl.js';
import { localUpstreamOrigin } from './localOrigin.js';
import { devServerProxyGuard } from './devServerProxyGuard.js';
import { invokedBin } from './invokedBin.js';

/**
 * @param {string} workspacePath - Path to workspace root (contains .descix/workspace.json)
 * @param {Object} options
 * @param {string} [options.apiGatewayUrl] - API gateway URL override (else resolveApiTarget)
 * @returns {Object} Vite server.proxy config
 */
export function createViteProxyConfig(workspacePath, options = {}) {
  const workspaceConfigPath = path.resolve(workspacePath, '.descix/workspace.json');
  let config = {};

  try {
    if (fs.existsSync(workspaceConfigPath)) {
      config = JSON.parse(fs.readFileSync(workspaceConfigPath, 'utf8'));
    }
  } catch (e) {
    console.warn('[createViteProxyConfig] Could not load .descix/workspace.json:', e.message);
  }

  // API target — resolved by the one owner (resolveGatewayTargets.js), never re-derived here.
  const { apiUrl: apiGatewayUrl } = resolveApiTarget(config, options);
  // Powch URL — resolved by its ONE owner (powchUrl.js), the same function the
  // gateway and the shell build use. The hand-rolled copy of that precedence that
  // stood here was a second owner for the wallet's location. The trailing slash
  // is stripped because this value is an http-proxy TARGET, where it would be
  // joined with the request path.
  const resolvedPowchUrl = resolvePowchUrl(config);
  const powchUrl = resolvedPowchUrl ? resolvedPowchUrl.replace(/\/$/, '') : null;

  const localAppRoutes = {};
  const serviceRoutes = {};
  const staticRoutes = {};
  const modeNotes = [];

  // v2.1 workspace format: env.platform + env.products[]
  const envBlock = config.env || {};
  const workspaceRoot = path.dirname(path.dirname(workspaceConfigPath)); // up from .descix/

  // Platform: only register microservice route (site is handled by gateway's root proxy)
  if (envBlock.platform) {
    const p = envBlock.platform;
    const appId = p.appId;
    if (appId) {
      if (p.microservice?.port) serviceRoutes[appId] = { port: p.microservice.port, protocol: p.microservice.protocol };
    }
  }
  if (Array.isArray(envBlock.products)) {
    for (const p of envBlock.products) {
      const appId = p.appId;
      if (!appId) continue;
      // One active mode per product: a site.port serves the DEV SERVER; site.static serves
      // the built dir. `descix app set-site` keeps the slot single-mode per write; BOTH
      // fields exist only after an explicit combined write, and then the dev server wins —
      // said out loud (modeNotes → the serve banner), never silently.
      if (p.site?.port) {
        localAppRoutes[appId] = { port: p.site.port, protocol: p.site.protocol };
        if (p.site.static) {
          modeNotes.push(
            `/p/${appId} has BOTH site.port and site.static — the DEV SERVER (site.port ${p.site.port}) is served; ` +
            `site.static "${p.site.static}" is ignored while site.port is set. ` +
            `Switch to the built site: ${invokedBin()} app set-site -a ${appId} --static ${p.site.static}`
          );
        }
      }
      else if (p.site?.static) {
        // Static site: resolve path relative to product localPath from workspace root
        const localPath = p.localPath || '.';
        const staticDir = p.site.static === '.' ? localPath : path.join(localPath, p.site.static);
        staticRoutes[appId] = path.resolve(workspaceRoot, staticDir);
      }
      if (p.microservice?.port) serviceRoutes[appId] = { port: p.microservice.port, protocol: p.microservice.protocol };
    }
  }

  const proxy = {};

  // Core API routes
  proxy['/apifront'] = proxyEntry(apiGatewayUrl);
  proxy['/api'] = proxyEntry(apiGatewayUrl);
  proxy['/mcp'] = proxyEntry(apiGatewayUrl);
  // OAuth Authorization Server endpoints (WS-MCP-OAUTH) — served by the Core API
  // backend at the same paths (no rewrite). /oauth is a prefix covering
  // /oauth/register, /oauth/authorize, /oauth/github/callback, /oauth/token.
  proxy['/oauth'] = proxyEntry(apiGatewayUrl);
  // Exact-path .well-known entries only — do NOT blanket-proxy all of /.well-known.
  proxy['/.well-known/oauth-protected-resource'] = proxyEntry(apiGatewayUrl);
  proxy['/.well-known/oauth-authorization-server'] = proxyEntry(apiGatewayUrl);
  // RFC 8414 / RFC 9728 path-inserted metadata locations (WS-MCP-OAUTH). Because
  // the issuer has a path (/oauth) and the resource has a path (/mcp), spec-strict
  // clients (Claude.ai) probe these path-inserted .well-known URLs. Exact paths only.
  proxy['/.well-known/oauth-authorization-server/oauth'] = proxyEntry(apiGatewayUrl);
  proxy['/.well-known/oauth-protected-resource/mcp'] = proxyEntry(apiGatewayUrl);

  // Debug Proxy (if VITE_DEBUG_PROXY is set)
  proxy['/.proxy/api_debug'] = proxyEntry(apiGatewayUrl, {
    rewrite: (p) => p.replace(/^\/\.proxy\/api_debug/, ''),
  });

  // Powch PWA route — whatever origin the workspace named. Absent means no route:
  // there is no default wallet origin to fall back to.
  if (powchUrl) {
    proxy['/powch'] = proxyEntry(powchUrl, { ws: true });
  }

  // Microservice routes: /s/{appId} -> the service's local origin (prefix stripped).
  // The origin — scheme included — comes from the ONE owner (localOrigin.js); this used to
  // hardcode http:// here while resolveGatewayTargets built the same service as https.
  Object.entries(serviceRoutes).forEach(([routeKey, route]) => {
    const prefix = `/s/${routeKey}`;
    proxy[prefix] = proxyEntry(localUpstreamOrigin(route, `env.*[${routeKey}].microservice`), {
      ws: true,
      rewrite: (p) => p.replace(new RegExp(`^${prefix}`), ''),
    });
  });

  // Product site dev server routes: /p/{productId} -> the site's local origin.
  // NO path rewrite — each app must configure its framework's base path to match.
  // An unreachable or protocol-mismatched upstream answers a LOUD 502 naming the target and
  // the remedy (devServerProxyGuard), never the empty body Vite's default handler sends.
  Object.entries(localAppRoutes).forEach(([productId, route]) => {
    const pathPrefix = `/p/${productId}`;
    const target = localUpstreamOrigin(route, `env.products[${productId}].site`);
    proxy[pathPrefix] = proxyEntry(target, { ws: true, configure: devServerProxyGuard(productId, target) });
  });

  // GCS fallback for remote Community assets
  proxy['/Community'] = proxyEntry('https://storage.googleapis.com', {
    rewrite: (p) => {
      if (p.startsWith('/Community')) {
        return `/descix-assets-public${p}`;
      }
      return p;
    },
  });

  proxy['/.proxy/gcs_media'] = proxyEntry('https://storage.googleapis.com', {
    rewrite: (p) => {
      let pathWithoutPrefix = p.replace('/.proxy/gcs_media', '');
      if (!pathWithoutPrefix.startsWith('/')) pathWithoutPrefix = '/' + pathWithoutPrefix;
      if (pathWithoutPrefix.startsWith('/descix-assets-public/')) return pathWithoutPrefix;
      return `/descix-assets-public${pathWithoutPrefix}`;
    },
  });

  // Attach staticRoutes to the proxy object so gateway.js can access them
  // without changing the function signature (backward compatible)
  proxy._staticRoutes = staticRoutes;
  // Mode notes (same channel as _staticRoutes): lines the gateway banner prints so the
  // active site mode is visible whenever a product carries both site.port and site.static.
  proxy._modeNotes = modeNotes;

  return proxy;
}
