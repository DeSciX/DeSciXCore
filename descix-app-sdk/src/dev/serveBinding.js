/**
 * serveBinding — the ONE owner of "which app is this `descix serve` session
 * bound to, and how does the shell find out".
 *
 * ── Why this exists ──────────────────────────────────────────────────────────
 * Standalone used to be expressible ONLY as a build-time Vite define
 * (__STANDALONE_APP_ID__), which meant one shell bundle per app and no way for
 * `descix serve` to express it at all — the gateway hardcoded the define to
 * 'null', and in the common topology the shell arrives PRE-BUILT from the cloud
 * origin, so the gateway compiles nothing and no define could reach it anyway.
 *
 * The binding is therefore SERVED, not compiled (CEO-D-2026-08-19-SERVE-UX-AMB-
 * RULINGS, AMB-1(c)): the gateway answers GET /__descix/app-binding.json on the
 * shell's OWN origin, and the shell reads it before it mounts. The same cloud
 * store bundle then boots as the store on descix.net and as your app standalone
 * on localhost, with no rebuild — which is the whole point of runtime binding.
 *
 * ── Which app? (AMB-2) ───────────────────────────────────────────────────────
 * cwd-detection is the default, `--app` is the override, and NOTHING is written
 * to workspace.json: a persistent "current app" pointer is mutable state that
 * goes stale and lies. `cd my-app && descix serve` just works; from anywhere
 * else you say which app you meant.
 *
 * ── Local serve is standalone ONLY (AMB-5) ───────────────────────────────────
 * Store chrome under `descix serve` is a BUG, not a mode — the developer owns
 * the app and does not need the store to see it; store context belongs to a
 * site deploy. So this module never resolves to a store binding, and when it
 * cannot name an app it FAILS LOUD naming both fixes rather than quietly
 * falling back to the store.
 */
import path from 'path';
import { gatewayProductUrl } from './workspaceProducts.js';
// ONE owner of the bin name: two bins reach this gateway and a hardcoded one misleads half
// the readers. See invokedBin.js.
import { invokedBin } from './invokedBin.js';
// ONE spelling of the path, shared with the browser-side reader. That module is
// deliberately node-free so both sides can import the same constant.
import { APP_BINDING_PATH } from '../util/appBinding.js';

export { APP_BINDING_PATH };

/**
 * Every app the workspace could bind to, with the directory that means "I am
 * working on this one".
 * @param {Object} config - parsed workspace.json
 * @returns {Array<{appId: string, localPath: string, isPlatform: boolean}>}
 */
export function bindableApps(config) {
  const env = config?.env || {};
  const out = [];
  if (env.platform?.appId) {
    out.push({ appId: env.platform.appId, localPath: env.platform.localPath || '.', isPlatform: true });
  }
  for (const p of Array.isArray(env.products) ? env.products : []) {
    if (p.appId) out.push({ appId: p.appId, localPath: p.localPath || '.', isPlatform: false });
  }
  return out;
}

/**
 * The app whose directory contains `cwd`. LONGEST match wins, so a product
 * nested inside another product's tree resolves to the inner one.
 * @returns {{appId: string, isPlatform: boolean}|null}
 */
export function detectAppFromCwd(workspaceRoot, config, cwd) {
  const here = path.resolve(cwd);
  let best = null;
  for (const app of bindableApps(config)) {
    const dir = path.resolve(workspaceRoot, app.localPath);
    if (here === dir || here.startsWith(dir + path.sep)) {
      if (!best || dir.length > best.dir.length) best = { ...app, dir };
    }
  }
  return best ? { appId: best.appId, isPlatform: best.isPlatform } : null;
}

/**
 * Resolve what this serve session is bound to.
 *
 * @param {string} workspaceRoot
 * @param {Object} config - parsed workspace.json
 * @param {Object} [options]
 * @param {string} [options.app] - explicit --app override
 * @param {string} [options.cwd] - directory to detect from (default process.cwd())
 * @param {number} options.gatewayPort - the port the gateway is listening on
 * @returns {{mode: 'standalone', appId: string, appUrl: string, source: string}}
 * @throws {Error} fail-loud when the app cannot be named, or names nothing real
 */
export function resolveServeBinding(workspaceRoot, config, options = {}) {
  const { app, cwd = process.cwd(), gatewayPort } = options;
  if (!gatewayPort) throw new Error('[serve binding] gatewayPort is required — resolve it with resolveGatewayPort first');

  const apps = bindableApps(config);
  const names = apps.map((a) => a.appId).sort();

  let appId, source;
  if (app) {
    const hit = apps.find((a) => a.appId === app);
    if (!hit) {
      throw new Error(
        `[serve binding] --app '${app}' is not in this workspace.\n` +
        `  Apps here: ${names.join(', ') || '(none)'}\n` +
        `  Add it with: descix app init`
      );
    }
    if (hit.isPlatform) {
      throw new Error(
        `[serve binding] --app '${app}' is the PLATFORM shell itself, which cannot be its own standalone app.\n` +
        `  Serve one of the product apps instead: ${apps.filter((a) => !a.isPlatform).map((a) => a.appId).join(', ') || '(none)'}`
      );
    }
    appId = hit.appId;
    source = '--app';
  } else {
    const detected = detectAppFromCwd(workspaceRoot, config, cwd);
    if (!detected || detected.isPlatform) {
      throw new Error(
        `[serve binding] cannot tell which app to serve from ${path.resolve(cwd)}.\n` +
        `  ${invokedBin()} serve runs ONE app standalone — there is no store view here.\n` +
        `  Fix it either way:\n` +
        `    cd into your app's directory and re-run, or\n` +
        `    ${invokedBin()} serve --app <id>\n` +
        `  Apps in this workspace: ${names.join(', ') || '(none)'}`
      );
    }
    appId = detected.appId;
    source = 'cwd';
  }

  return {
    mode: 'standalone',
    appId,
    appUrl: gatewayProductUrl(gatewayPort, appId),
    source,
  };
}

/**
 * Serve the binding at APP_BINDING_PATH.
 *
 * Registered as a plugin middleware so it runs BEFORE the gateway's catch-all
 * '/' proxy to the shell origin — otherwise the request would be forwarded to
 * the cloud, which knows nothing about this developer's machine.
 *
 * @param {{mode: string, appId: string, appUrl: string, source: string}} binding
 * @returns {import('vite').Plugin}
 */
export function appBindingPlugin(binding) {
  const body = JSON.stringify(binding);
  return {
    name: 'descix-app-binding',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlPath = (req.url || '').split('?')[0];
        if (urlPath !== APP_BINDING_PATH) return next();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        // The binding is per-serve-session state, never cacheable: a developer
        // switching apps must not be served the previous session's answer.
        res.setHeader('Cache-Control', 'no-store');
        res.end(body);
      });
    },
  };
}
