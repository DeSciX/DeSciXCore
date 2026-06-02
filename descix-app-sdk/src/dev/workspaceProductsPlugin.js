/**
 * workspaceProductsPlugin — live-refresh the product map (__WORKSPACE_PRODUCTS__)
 * in a running app dev server when .descix/workspace.json changes.
 *
 * ── The problem ──────────────────────────────────────────────────────────────
 * App dev servers (e.g. the daita PWA at :5174) bake the product map into a Vite
 * `define` (`__WORKSPACE_PRODUCTS__`) at config-load time via buildWorkspaceProducts().
 * A Vite `define` is a compile-time text substitution — it cannot react to a file
 * change. So when a dev runs `descix app set-site` (adding a product's site.static),
 * the workspace.json changes but the running PWA keeps its stale baked map, and the
 * new app site never appears in the app store until the dev-server is restarted.
 *
 * The gateway (:5173) already rebuilds its own map on workspace change (it restarts
 * its Vite server in gateway.js), but it cannot reach into a SEPARATE app dev-server
 * process to update that process's define. This plugin closes that gap from inside
 * the app dev server itself.
 *
 * ── The mechanism (chosen for minimal blast radius) ──────────────────────────
 * AppData.getProductUrl() reads the MUTABLE field AppData._workspaceProducts — not
 * the frozen __WORKSPACE_PRODUCTS__ global directly (the global only SEEDS that field
 * once at module init). So the app store becomes reactive the instant we update
 * AppData._workspaceProducts at runtime. We do NOT need to rip out the existing
 * `define` (which would break the many `typeof __WORKSPACE_PRODUCTS__` guards across
 * the codebase). We layer a live update on top of it:
 *
 *   1. The plugin watches .descix/workspace.json.
 *   2. On change, it recomputes buildWorkspaceProducts() and, if the map changed,
 *      sends a custom HMR event (`descix:workspace-products`) over Vite's WebSocket
 *      with the fresh map — no full page reload, no dev-server restart.
 *   3. A tiny client runtime (the virtual module `virtual:descix/workspace-products-hmr`)
 *      listens for that event and calls AppData.setWorkspaceProducts(map). The app
 *      store re-resolves product URLs from the new map on its next render.
 *
 * The client runtime is delivered as a VIRTUAL MODULE so the SDK owns it end-to-end;
 * the consuming app site imports it once (or the plugin auto-injects it — see
 * `injectClientRuntime`). It is a no-op outside dev (guarded by import.meta.hot).
 *
 * @param {string} workspaceRoot - Workspace root (contains .descix/workspace.json)
 * @param {Object} [options]
 * @param {number} [options.debounceMs=200] - Debounce for rapid workspace writes
 * @param {function} [options.log] - Logger (defaults to console.log)
 * @returns {import('vite').Plugin}
 */
import fs from 'fs';
import path from 'path';
import { buildWorkspaceProducts } from './workspaceProducts.js';

export const WORKSPACE_PRODUCTS_HMR_EVENT = 'descix:workspace-products';
export const WORKSPACE_PRODUCTS_VIRTUAL_ID = 'virtual:descix/workspace-products-hmr';
const RESOLVED_VIRTUAL_ID = '\0' + WORKSPACE_PRODUCTS_VIRTUAL_ID;

/**
 * The client runtime source. Imported into the app via the virtual module.
 * Listens for the HMR event and pushes the fresh product map into AppData.
 * Pure no-op outside a Vite dev (import.meta.hot is undefined in prod builds).
 */
function clientRuntimeSource() {
  return `
import { AppData } from '@descix/app-sdk/AppData';
if (import.meta.hot) {
  import.meta.hot.on(${JSON.stringify(WORKSPACE_PRODUCTS_HMR_EVENT)}, (payload) => {
    try {
      const products = payload && payload.products ? payload.products : null;
      AppData.setWorkspaceProducts(products);
      // Best-effort UI nudge: dispatch a DOM event the shell can listen for.
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('descix:workspace-products-updated', { detail: { products } }));
      }
      console.log('[descix:hmr] workspace products refreshed', products ? Object.keys(products) : products);
    } catch (e) {
      console.warn('[descix:hmr] failed to apply workspace products update:', e && e.message);
    }
  });
}
`;
}

export function workspaceProductsPlugin(workspaceRoot, options = {}) {
  const debounceMs = options.debounceMs ?? 200;
  const log = options.log || (() => {});
  const configPath = path.resolve(workspaceRoot, '.descix/workspace.json');

  let lastSerialized = serialize(buildWorkspaceProducts(workspaceRoot));
  let debounceTimer = null;
  let watcher = null;

  return {
    name: 'descix-workspace-products-hmr',
    apply: 'serve', // dev only — never runs in production builds

    resolveId(id) {
      if (id === WORKSPACE_PRODUCTS_VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
      return null;
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_ID) return clientRuntimeSource();
      return null;
    },

    // Auto-inject the client runtime into the served HTML so the consuming app
    // needs NO source change — the SDK owns the wiring end-to-end. Dev-only
    // (apply:'serve'), so production index.html is untouched.
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: { type: 'module', src: '/@id/' + WORKSPACE_PRODUCTS_VIRTUAL_ID },
          injectTo: 'head',
        },
      ];
    },

    configureServer(server) {
      // Watch the workspace.json directory (atomic writes replace the file, so
      // watching the file directly can miss events — watch the parent dir).
      try {
        watcher = fs.watch(path.dirname(configPath), (_event, filename) => {
          if (filename && filename !== 'workspace.json') return;
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            let products;
            try {
              products = buildWorkspaceProducts(workspaceRoot);
            } catch (e) {
              log(`[descix-workspace-products-hmr] error reading workspace.json: ${e.message}`);
              return;
            }
            const serialized = serialize(products);
            if (serialized === lastSerialized) return; // no product/site change
            lastSerialized = serialized;
            server.hot.send({
              type: 'custom',
              event: WORKSPACE_PRODUCTS_HMR_EVENT,
              data: { products: products || {} },
            });
            log(`[descix-workspace-products-hmr] product map changed — pushed live update (${products ? Object.keys(products).length : 0} products)`);
          }, debounceMs);
        });
      } catch (e) {
        log(`[descix-workspace-products-hmr] could not watch workspace.json: ${e.message}`);
      }

      const close = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        if (watcher) watcher.close();
      };
      server.httpServer?.once('close', close);
    },
  };
}

function serialize(products) {
  // Stable serialization independent of key order, for change detection.
  if (!products) return 'null';
  const keys = Object.keys(products).sort();
  return JSON.stringify(keys.map((k) => [k, products[k]]));
}
