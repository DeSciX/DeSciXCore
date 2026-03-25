/**
 * createViteProxyConfig - Reusable Vite proxy config for the DeSciX local gateway.
 *
 * Reads .descix/workspace.json from workspacePath to discover local app/service
 * ports and environment URLs. Generates proxy rules for:
 *   - /apifront, /api, /mcp  -> Core API
 *   - /powch/*               -> Powch PWA (local or production)
 *   - /s/{appId}             -> Microservice ports (path rewritten, prefix stripped)
 *   - /p/{appId}             -> Product site dev servers (NO path rewrite)
 *   - /Community/*           -> GCS fallback for remote assets
 *   - /.proxy/gcs_media      -> GCS media proxy
 */

import fs from 'fs';
import path from 'path';

/**
 * @param {string} workspacePath - Path to workspace root (contains .descix/workspace.json)
 * @param {Object} options
 * @param {string} [options.apiGatewayUrl] - API gateway URL override (falls back to workspace env/apiUrl)
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

  const env = config.env || {};
  // Derive API URL: explicit option > env.apiUrl > workspace microservice config — no fallback
  let apiGatewayUrl = options.apiGatewayUrl ?? env.apiUrl ?? config.apiUrl;
  if (!apiGatewayUrl) {
    const ms = env.platform?.microservice;
    if (!ms?.port) {
      throw new Error('[createViteProxyConfig] Cannot determine API URL: no apiGatewayUrl option, no env.apiUrl, and no env.platform.microservice.port in workspace.json');
    }
    const proto = ms.protocol || 'https';
    apiGatewayUrl = `${proto}://localhost:${ms.port}`;
  }
  // Powch URL: explicit env.powchUrl, or auto-discover from env.products[]
  let powchUrl = env.powchUrl ?? null;
  if (!powchUrl && Array.isArray(env.products)) {
    const powchProduct = env.products.find(p => p.appId === 'powch');
    if (powchProduct?.site?.port) {
      powchUrl = `https://localhost:${powchProduct.site.port}`;
    }
  }

  const localAppRoutes = {};
  const serviceRoutes = {};

  // v2.1 workspace format: env.platform + env.products[]
  const envBlock = config.env || {};
  // Platform: only register microservice route (site is handled by gateway's root proxy)
  if (envBlock.platform) {
    const p = envBlock.platform;
    const appId = p.appId;
    if (appId) {
      if (p.microservice?.port) serviceRoutes[appId] = { port: p.microservice.port };
    }
  }
  if (Array.isArray(envBlock.products)) {
    for (const p of envBlock.products) {
      const appId = p.appId;
      if (!appId) continue;
      if (p.site?.port)        localAppRoutes[appId] = { port: p.site.port, protocol: p.site.protocol };
      if (p.microservice?.port) serviceRoutes[appId] = { port: p.microservice.port };
    }
  }

  const proxy = {};

  // Core API routes
  proxy['/apifront'] = {
    target: apiGatewayUrl,
    changeOrigin: true,
    secure: false,
  };
  proxy['/api'] = {
    target: apiGatewayUrl,
    changeOrigin: true,
    secure: false,
  };
  proxy['/mcp'] = {
    target: apiGatewayUrl,
    changeOrigin: true,
    secure: false,
  };

  // Debug Proxy (if VITE_DEBUG_PROXY is set)
  proxy['/.proxy/api_debug'] = {
    target: apiGatewayUrl,
    changeOrigin: true,
    secure: false,
    rewrite: (p) => p.replace(/^\/\.proxy\/api_debug/, ''),
  };

  // Powch PWA route (local port or production URL)
  if (powchUrl) {
    proxy['/powch'] = {
      target: powchUrl,
      changeOrigin: true,
      secure: false,
      ws: true,
    };
  }

  // Microservice routes: /s/{appId} -> localhost:{service.port} (prefix stripped)
  Object.entries(serviceRoutes).forEach(([routeKey, route]) => {
    const prefix = `/s/${routeKey}`;
    proxy[prefix] = {
      target: `http://localhost:${route.port}`, // Services are usually HTTP
      changeOrigin: true,
      ws: true,
      rewrite: (p) => p.replace(new RegExp(`^${prefix}`), ''),
    };
  });

  // Product site dev server routes: /p/{productId} -> localhost:{site.port}
  // NO path rewrite — each app must configure its framework's base path to match.
  Object.entries(localAppRoutes).forEach(([productId, route]) => {
    const pathPrefix = `/p/${productId}`;
    const proto = route.protocol || 'https';

    proxy[pathPrefix] = {
      target: `${proto}://localhost:${route.port}`,
      changeOrigin: true,
      secure: false,
      ws: true,
    };
  });

  // GCS fallback for remote Community assets
  proxy['/Community'] = {
    target: 'https://storage.googleapis.com',
    changeOrigin: true,
    secure: true,
    rewrite: (p) => {
      if (p.startsWith('/Community')) {
        return `/descix-assets-public${p}`;
      }
      return p;
    },
  };

  proxy['/.proxy/gcs_media'] = {
    target: 'https://storage.googleapis.com',
    changeOrigin: true,
    secure: true,
    rewrite: (p) => {
      let pathWithoutPrefix = p.replace('/.proxy/gcs_media', '');
      if (!pathWithoutPrefix.startsWith('/')) pathWithoutPrefix = '/' + pathWithoutPrefix;
      if (pathWithoutPrefix.startsWith('/descix-assets-public/')) return pathWithoutPrefix;
      return `/descix-assets-public${pathWithoutPrefix}`;
    },
  };

  return proxy;
}
