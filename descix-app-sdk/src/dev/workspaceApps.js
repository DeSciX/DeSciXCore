/**
 * resolveWorkspaceApps — the ONE owner of "which apps does this workspace serve locally,
 * and from where" (workspace v3, fork (b): CEO 2026-10-09/10).
 *
 * A v3 workspace holds at most ONE app of its own (env.app, served from the workspace root).
 * A GATEWAY workspace additionally lists sibling app-repo roots:
 *
 *   env.gateway.shell      the repo whose app is served at the gateway ROOT (the shell)
 *   env.gateway.appRepos[] repos whose apps are served at /p/{appId}
 *
 * Each listed path must hold its OWN v3 single-app workspace, and THAT file is the sole
 * authority on the app's id, site and microservice config. The gateway workspace never
 * restates any of it — a second copy per app is exactly the registry mirror drift the
 * retired v2.1 env.products registry suffered from.
 *
 * Every consumer of "the local app set" (the gateway, the proxy builder, the product map,
 * health, the Powch origin resolver) ferries the bag this returns, never re-walks
 * workspace.json by hand.
 *
 * @typedef {Object} WorkspaceAppEntry
 * @property {string} appId
 * @property {string|null} communityId
 * @property {string} dir - absolute repo root the app serves from
 * @property {Object} site - the app's own site config ({static}|{port,protocol}|{})
 * @property {Object} microservice - the app's own microservice config ({port,...}|{})
 * @property {'self'|'shell'|'repo'} role
 */

import fs from 'fs';
import path from 'path';
import { workspaceFilePath } from './workspaceFile.js';
import { assertSiteStatic } from './siteStatic.js';
import { invokedBin } from './invokedBin.js';

function readWorkspaceFile(dir) {
  const wsPath = workspaceFilePath(dir);
  if (!fs.existsSync(wsPath)) return null;
  return JSON.parse(fs.readFileSync(wsPath, 'utf8'));
}

/**
 * The app's site config as read from `dir`'s workspace.json, with site.static held to the one
 * rule (siteStatic.js): a stored value that is not a plain relative path fails loud here,
 * naming the file and key, instead of being re-rooted by the gateway's path.join.
 */
function readSite(dir, app) {
  const site = app.site || {};
  if (site.static !== undefined && site.static !== null) {
    assertSiteStatic(site.static, {
      subject: `${workspaceFilePath(dir)}: env.app.site.static`,
      remedy: `Fix it with: ${invokedBin()} app set-site -a ${app.appId} --static <relative path>`,
    });
  }
  return site;
}

function entryFromRepo(gatewayRoot, rel, role) {
  if (path.isAbsolute(rel)) {
    throw new Error(
      `[workspaceApps] env.gateway lists an absolute path (${rel}). Paths are relative to the ` +
      'gateway workspace root so the config is portable across checkouts and machines ' +
      '(sibling checkouts: "../<repo>").'
    );
  }
  const dir = path.resolve(gatewayRoot, rel);
  const ws = readWorkspaceFile(dir);
  if (!ws) {
    throw new Error(
      `[workspaceApps] env.gateway entry '${rel}' has no .descix/workspace.json at ${dir}.\n` +
      'Each listed repo is a v3 single-app workspace of its own — run "descix app init" from ' +
      'that repo\'s root to create it.'
    );
  }
  const app = ws.env?.app;
  if (!app?.appId) {
    throw new Error(
      `[workspaceApps] env.gateway entry '${rel}' (${dir}) holds no env.app in its ` +
      'workspace.json. That file is the authority on the app it serves — run "descix app init" ' +
      'from that repo\'s root.'
    );
  }
  return {
    appId: app.appId,
    communityId: app.communityId || null,
    dir,
    site: readSite(dir, app),
    microservice: app.microservice || {},
    role,
  };
}

/**
 * @param {string} workspaceRoot - directory holding .descix/workspace.json
 * @returns {{ shellApp: WorkspaceAppEntry|null, apps: WorkspaceAppEntry[] }}
 */
export function resolveWorkspaceApps(workspaceRoot) {
  const root = path.resolve(workspaceRoot);
  const ws = readWorkspaceFile(root);
  if (!ws) {
    throw new Error(`[workspaceApps] No .descix/workspace.json found at ${root}`);
  }
  const env = ws.env || {};
  const apps = [];

  if (env.app?.appId) {
    apps.push({
      appId: env.app.appId,
      communityId: env.app.communityId || null,
      dir: root,
      site: readSite(root, env.app),
      microservice: env.app.microservice || {},
      role: 'self',
    });
  }

  let shellApp = null;
  if (env.gateway?.shell) {
    shellApp = entryFromRepo(root, env.gateway.shell, 'shell');
    apps.push(shellApp);
  }

  for (const rel of env.gateway?.appRepos || []) {
    apps.push(entryFromRepo(root, rel, 'repo'));
  }

  const seen = new Map();
  for (const a of apps) {
    if (seen.has(a.appId)) {
      throw new Error(
        `[workspaceApps] app id '${a.appId}' appears twice: ${seen.get(a.appId)} and ${a.dir}. ` +
        'One app, one repo — remove the duplicate from env.gateway.'
      );
    }
    seen.set(a.appId, a.dir);
  }

  return { shellApp, apps };
}

/**
 * The .descix directories a workspace watcher must cover: the workspace's own, plus each
 * gateway-listed repo's (shell and appRepos). v3 moved per-app site/microservice config into
 * each app repo's OWN workspace.json (`descix app set-site` writes THERE), so a watcher that
 * only sees the gateway's directory goes deaf to exactly the writes it exists for.
 *
 * DELIBERATELY LENIENT, unlike resolveWorkspaceApps: this derives a WATCH SET, not an
 * authority read — a listed repo that is missing or mid-edit must not kill the watcher, it
 * just is not watchable until it exists (the next gateway-file change re-derives the set).
 * Only directories that exist are returned.
 *
 * @param {string} workspaceRoot
 * @returns {string[]} absolute .descix directory paths, the workspace's own first
 */
export function workspaceWatchDirs(workspaceRoot) {
  const root = path.resolve(workspaceRoot);
  const dirs = [path.join(root, '.descix')];
  try {
    const ws = readWorkspaceFile(root);
    const gw = ws?.env?.gateway;
    for (const rel of [gw?.shell, ...(gw?.appRepos || [])]) {
      if (!rel || path.isAbsolute(rel)) continue;
      const d = path.join(path.resolve(root, rel), '.descix');
      if (fs.existsSync(d)) dirs.push(d);
    }
  } catch {
    // A broken own file still yields the own dir — the watcher reports the parse error itself.
  }
  return [...new Set(dirs)];
}
