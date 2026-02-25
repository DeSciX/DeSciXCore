/**
 * createViteProxyConfig - Reusable Vite proxy config for the DeSciX local gateway.
 *
 * Reads .descix/workspace.json from workspacePath to discover local app/service
 * ports and environment URLs. Generates proxy rules for:
 *   - /apifront, /api, /mcp  -> Core API
 *   - /powch/*               -> Powch PWA (local or production)
 *   - /s/{community}/{app}   -> Microservice ports
 *   - /Community/.../site/*   -> Local site dev servers
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
  const apiGatewayUrl = options.apiGatewayUrl ?? env.apiUrl ?? config.apiUrl ?? 'https://localhost:4000';
  const powchUrl = env.powchUrl ?? null;

  const localAppRoutes = {};
  const serviceRoutes = {};

  if (config.communities) {
    Object.entries(config.communities).forEach(([communityId, communityData]) => {
      if (!communityData.apps) return;

      Object.entries(communityData.apps).forEach(([appId, appData]) => {
        if (appData.site?.port) {
          localAppRoutes[`${communityId}/${appId}`] = {
            port: appData.site.port,
          };
        }
        if (appData.service?.port) {
          serviceRoutes[`${communityId}/${appId}`] = {
            port: appData.service.port,
          };
        }
      });
    });
  }

  if (config.products) {
    Object.entries(config.products).forEach(([productId, productData]) => {
      if (productData.site?.port) {
        localAppRoutes[productId] = {
          port: productData.site.port,
        };
      }
      if (productData.service?.port) {
        serviceRoutes[productId] = {
          port: productData.service.port,
        };
      }
    });
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

  // Embedded App API Proxy (for Powch in iframe)
  // REMOVED: Powch/Internal iframes should NOT use .proxy/ prefix.
  // The client-side isEmbedded check now correctly excludes standalone apps.
  // proxy['/.proxy/api'] = {
  //   target: apiGatewayUrl,
  //   changeOrigin: true,
  //   secure: false,
  //   rewrite: (p) => p.replace(/^\/\.proxy\/api/, ''),
  // };
  
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

  // Microservice routes: /s/{communityId}/{appId} -> localhost:{service.port}
  Object.entries(serviceRoutes).forEach(([routeKey, route]) => {
    const prefix = `/s/${routeKey}`;
    proxy[prefix] = {
      target: `http://localhost:${route.port}`, // Services are usually HTTP
      changeOrigin: true,
      ws: true,
      rewrite: (p) => p.replace(new RegExp(`^${prefix}`), ''),
    };
  });

  // Site dev server routes: /Community/{c}/Apps/{a}/site -> localhost:{site.port}
  // OR /p/{productId} -> localhost:{site.port}
  Object.entries(localAppRoutes).forEach(([routeKey, route]) => {
    if (routeKey.includes('/')) {
      const [community, appId] = routeKey.split('/');
      const pathPrefix = `/Community/${community}/Apps/${appId}/site`;
      const localBase = `/s/${appId}`;

      proxy[pathPrefix] = {
        target: `https://localhost:${route.port}`,
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (p) => p.replace(new RegExp(`^${pathPrefix}`), ''),
      };
      proxy[localBase] = {
        target: `https://localhost:${route.port}`,
        changeOrigin: true,
        secure: false,
        ws: true,
      };
    } else {
      // Global Product Route
      const productId = routeKey;
      const pathPrefix = `/p/${productId}`;
      
      proxy[pathPrefix] = {
        target: `https://localhost:${route.port}`,
        changeOrigin: true,
        secure: false,
        ws: true,
        // Do NOT rewrite path. The target app must handle the /p/{productId} base.
        // rewrite: (p) => p.replace(new RegExp(`^${pathPrefix}`), ''),
      };
    }
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
