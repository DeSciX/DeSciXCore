/**
 * staticSitePlugin — Vite plugin for serving static app sites.
 *
 * Products with `site.static` in workspace.json are served directly
 * from the filesystem at `/p/{appId}/`. No dev server needed.
 * The gateway handles HTTPS. Same files that `descix site upload`
 * would push to GCS.
 *
 * @param {Object} staticRoutes - { appId: absolutePath, ... }
 * @returns {import('vite').Plugin}
 */

import fs from 'fs';
import path from 'path';

// Text types carry an EXPLICIT charset. Without it a browser falls back to its
// legacy encoding and decodes UTF-8 bytes as latin-1 — every non-ASCII character
// in a statically-served app renders as mojibake (measured in Chromium: an em
// dash came back as "a€\"" on a page served through /p/{appId}). The app's own
// dev server sets charset for it; the gateway must not silently take it away.
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jsonl': 'application/x-ndjson; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.wasm': 'application/wasm',
  '.map': 'application/json; charset=utf-8',
};

export function staticSitePlugin(staticRoutes) {
  if (!staticRoutes || Object.keys(staticRoutes).length === 0) {
    return { name: 'descix-static-site', configureServer() {} };
  }

  return {
    name: 'descix-static-site',

    configureServer(server) {
      // Register middleware BEFORE Vite's own middleware (return function)
      // so that static routes are handled before Vite tries to process them.
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]; // Strip query string
        if (!url?.startsWith('/p/')) return next();

        // Extract appId and file path from /p/{appId}/...
        const rest = url.slice(3); // remove '/p/'
        const slashIdx = rest.indexOf('/');
        const appId = slashIdx >= 0 ? rest.slice(0, slashIdx) : rest;
        const filePath = slashIdx >= 0 ? rest.slice(slashIdx + 1) : '';

        const staticRoot = staticRoutes[appId];
        if (!staticRoot) return next();

        // Redirect /p/{appId} to /p/{appId}/ so relative paths resolve correctly
        if (!filePath && !url.endsWith('/')) {
          res.statusCode = 302;
          res.setHeader('Location', url + '/');
          res.end();
          return;
        }

        // Resolve file path — default to index.html for directory requests
        let resolved = path.join(staticRoot, filePath);

        // Security: prevent path traversal
        if (!resolved.startsWith(staticRoot)) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }

        // If path is a directory or empty, serve index.html (SPA convention)
        try {
          const stat = fs.statSync(resolved);
          if (stat.isDirectory()) {
            resolved = path.join(resolved, 'index.html');
          }
        } catch {
          // File doesn't exist — try with .html extension (clean URLs)
          if (!path.extname(resolved)) {
            const withHtml = resolved + '.html';
            if (fs.existsSync(withHtml)) {
              resolved = withHtml;
            } else {
              // SPA fallback: serve root index.html for client-side routing
              resolved = path.join(staticRoot, 'index.html');
            }
          }
        }

        // Serve the file
        try {
          const content = fs.readFileSync(resolved);
          const ext = path.extname(resolved).toLowerCase();
          const contentType = MIME_TYPES[ext] || 'application/octet-stream';
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'no-cache');
          res.statusCode = 200;
          res.end(content);
        } catch {
          // File not found
          res.statusCode = 404;
          res.end(`Not found: ${url}`);
        }
      });
    },
  };
}
