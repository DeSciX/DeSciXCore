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
 * on the gateway, with no rebuild — which is the whole point of runtime binding.
 * The binding's appUrl is on whatever origin the shell was opened on
 * (bindingAppUrl), so the app frame stays same-origin with the shell behind a
 * tunnel hostname or on another device, as on the deployed host.
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
import fs from 'fs';
import path from 'path';
import { productUrlOn } from './workspaceProducts.js';
import { requestOrigin, MalformedAuthorityError } from './requestOrigin.js';
import { resolveWorkspaceApps } from './workspaceApps.js';
// ONE owner of the bin name: two bins reach this gateway and a hardcoded one misleads half
// the readers. See invokedBin.js.
import { invokedBin } from './invokedBin.js';
// ONE spelling of the path, shared with the browser-side reader. That module is
// deliberately node-free so both sides can import the same constant.
import { APP_BINDING_PATH, standaloneBinding } from '../util/appBinding.js';
// The share.json contract owner: the same parse the upload gate and the edge run.
import { SHARE_JSON_FILE, parseShareJson } from '../util/share.js';
import { siteStaticRoot } from './siteStatic.js';

export { APP_BINDING_PATH };

/**
 * Every app this workspace serves locally, with the directory that means "I am
 * working on this one" — from the ONE owner (workspaceApps, v3 fork (b)).
 * @param {string} workspaceRoot
 * @returns {Array<{appId: string, dir: string, site: Object, isPlatform: boolean}>}
 */
export function bindableApps(workspaceRoot) {
  const { shellApp, apps } = resolveWorkspaceApps(workspaceRoot);
  return apps.map((a) => ({ appId: a.appId, dir: a.dir, site: a.site || {}, isPlatform: a === shellApp }));
}

/**
 * Where this gateway reads the served app's share.json: beside the index.html it serves, the
 * same file `descix site upload` validates and the edge reads beside the deployed index.html.
 * A dev-server site (site.port, which wins over site.static, as the proxy config rules) is
 * served by a process whose file tree the gateway cannot name, so nothing is read there.
 *
 * @param {{appId: string, dir: string, site: Object}} app - a bindableApps entry
 * @returns {{file: string|null, why: string}} file is null when nothing can be read; why says
 *   which case applied, for the serve banner
 */
export function servedShareJsonFile(app) {
  const site = app.site || {};
  if (site.port) {
    return { file: null, why: `not read: /p/${app.appId} is a dev server (site.port ${site.port}); the gateway reads ${SHARE_JSON_FILE} only from a static site` };
  }
  if (site.static === undefined || site.static === null) {
    return { file: null, why: `not read: ${app.appId} has no site.static` };
  }
  const file = path.join(siteStaticRoot(app.dir, site.static), SHARE_JSON_FILE);
  return { file, why: file };
}

/**
 * The served app's declared starting view: share.json `default_view`, parsed by the contract
 * owner. An invalid share.json refuses the serve, as it refuses the upload.
 *
 * @param {{appId: string, dir: string, site: Object}} app
 * @returns {string|null} a VIEW_MODES value, or null when no share.json is read or none declares it
 * @throws {Error} naming the file and the contract's field-named error
 */
function servedDefaultView(app) {
  const { file } = servedShareJsonFile(app);
  if (!file || !fs.existsSync(file)) return null;
  try {
    return parseShareJson(fs.readFileSync(file, 'utf8')).default_view;
  } catch (e) {
    throw new Error(
      `[serve binding] ${file} does not meet the share.json contract (@descix/app-sdk/share):\n` +
      `  ${e.message}\n` +
      `  Fix ${SHARE_JSON_FILE}, or leave it out of the site, then serve again.`,
      { cause: e });
  }
}

/**
 * The app whose directory contains `cwd`. LONGEST match wins, so a product
 * nested inside another product's tree resolves to the inner one.
 * @returns {{appId: string, isPlatform: boolean}|null}
 */
export function detectAppFromCwd(workspaceRoot, cwd) {
  const here = path.resolve(cwd);
  let best = null;
  for (const app of bindableApps(workspaceRoot)) {
    const dir = path.resolve(app.dir);
    if (here === dir || here.startsWith(dir + path.sep)) {
      if (!best || dir.length > best.dir.length) best = { ...app, dir };
    }
  }
  return best ? { appId: best.appId, isPlatform: best.isPlatform } : null;
}

/**
 * Resolve what this serve session is bound to: the facts that hold for every request. The
 * app's URL is NOT one of them; it depends on the origin each request came in on, and
 * servedBinding adds it per request.
 *
 * @param {string} workspaceRoot
 * @param {Object} config - parsed workspace.json
 * @param {Object} [options]
 * @param {string} [options.app] - explicit --app override
 * @param {string} [options.cwd] - directory to detect from (default process.cwd())
 * @returns {{appId: string, source: string, defaultView: string|null}} defaultView from the
 *   served share.json, null when none is read or none declares it
 * @throws {Error} fail-loud when the app cannot be named, or names nothing real, or its served
 *   share.json is invalid
 */
export function resolveServeBinding(workspaceRoot, config, options = {}) {
  const { app, cwd = process.cwd() } = options;
  if (options.gatewayPort !== undefined) {
    throw new Error(
      '[serve binding] resolveServeBinding no longer takes gatewayPort: the app URL depends on the ' +
      'origin each request came in on. Build the binding per request with servedBinding(session, req).'
    );
  }

  const apps = bindableApps(workspaceRoot);
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
    const detected = detectAppFromCwd(workspaceRoot, cwd);
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

  return { appId, source, defaultView: servedDefaultView(apps.find((a) => a.appId === appId)) };
}

/**
 * THE ONE derivation of the binding's appUrl: the app's gateway route on the origin the
 * request came in on (requestOrigin: `:authority`, else `Host`).
 * A shell opened as https://localhost:<port>/ gets
 * https://localhost:<port>/p/<appId>, exactly as before; a shell opened through a tunnel
 * hostname or from another device gets its own origin, so the frame it loads is same-origin
 * with it, as on the deployed host. The value stays absolute: deployed shells pass it straight
 * to the app frame.
 *
 * @param {{httpVersionMajor: number, headers: Object}} req - the request being answered
 * @param {string} appId
 * @returns {string}
 * @throws {MalformedAuthorityError} on a malformed request authority
 */
export function bindingAppUrl(req, appId) {
  return productUrlOn(requestOrigin(req), appId);
}

/**
 * The binding served for one request.
 *
 * @param {{appId: string, source: string, defaultView: string|null}} session - resolveServeBinding
 * @param {{httpVersionMajor: number, headers: Object}} req - the request being answered
 * @returns {{mode: 'standalone', appId: string, appUrl: string, source: string, defaultView?: string}}
 *   built by standaloneBinding (util/appBinding.js)
 * @throws {MalformedAuthorityError} on a malformed request authority
 */
export function servedBinding(session, req) {
  return standaloneBinding({ ...session, appUrl: bindingAppUrl(req, session.appId) });
}

/** How many distinct refusal messages the binding route remembers before it forgets them all. */
const LOGGED_REFUSALS_CAP = 100;

/**
 * Serve the binding at APP_BINDING_PATH.
 *
 * Registered as a plugin middleware so it runs BEFORE the gateway's catch-all
 * '/' proxy to the shell origin — otherwise the request would be forwarded to
 * the cloud, which knows nothing about this developer's machine.
 *
 * A malformed request authority is answered 400 naming the problem, never a binding on a
 * guessed origin, and the same message goes to the serve terminal through Vite's logger
 * (`logger.error`: the request was refused, so it is an error, not a warning) — the shell
 * treats any non-OK binding as "no binding" and boots the store, so the browser alone would
 * not say why. Each distinct message is printed once; the remembered set is cleared past
 * LOGGED_REFUSALS_CAP so a client sending endless distinct values cannot grow it without bound.
 *
 * @param {{appId: string, source: string, defaultView: string|null}} session - resolveServeBinding
 * @returns {import('vite').Plugin}
 */
export function appBindingPlugin(session) {
  return {
    name: 'descix-app-binding',
    configureServer(server) {
      const logged = new Set();
      server.middlewares.use((req, res, next) => {
        const urlPath = (req.url || '').split('?')[0];
        if (urlPath !== APP_BINDING_PATH) return next();
        // The binding is per-serve-session and per-origin state, never cacheable: a developer
        // switching apps must not be served the previous session's answer.
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        let body;
        try {
          body = JSON.stringify(servedBinding(session, req));
        } catch (e) {
          if (!(e instanceof MalformedAuthorityError)) return next(e);
          if (!logged.has(e.message)) {
            if (logged.size >= LOGGED_REFUSALS_CAP) logged.clear();
            logged.add(e.message);
            server.config.logger.error(`${APP_BINDING_PATH} answered 400: ${e.message}`, { timestamp: true });
          }
          res.statusCode = e.statusCode;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(`${e.message}\n`);
          return;
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(body);
      });
    },
  };
}
