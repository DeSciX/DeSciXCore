/**
 * Shared helper — builds a product URL map from workspace.json.
 * Used by both the gateway (gateway.js) and individual app Vite configs.
 *
 * Returns { [appId]: 'proto://localhost:port' } or null if no products found.
 */
import fs from 'fs';
import path from 'path';

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
  // Determine gateway port for static site products (default 5173)
  const gatewayPort = ws.env?.gateway?.port || 5173;

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
