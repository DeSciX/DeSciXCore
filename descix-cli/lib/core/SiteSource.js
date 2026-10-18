/**
 * THE ONE OWNER of "which files does `descix site upload -a <appId>` deploy".
 *
 * The app's repo comes from WorkspaceConfig.resolveAppRepo (the gateway's own entries, or this
 * workspace's env.app). Then, in order:
 *
 *  1. The repo holds a site manifest → the manifest names the files; an explicit -p is IGNORED and
 *     the run says so.
 *  2. A gateway workspace holds no repo for the app, and the caller named a directory with -p →
 *     that directory is uploaded for appId, and the run says "App repo: none listed".
 *  3. A gateway workspace holds no repo for the app and no -p was given → resolveAppRepo's refusal,
 *     with the -p remedy added. A gateway repo with no site manifest and no -p is refused too. The
 *     -p DEFAULT ('./site', the cwd's tree) is never a choice in a gateway workspace.
 *  4. Otherwise (single-app workspace, no manifest) → the -p directory, default included.
 *
 * Env, API origin and credential are not decided here — they stay with the workspace the command
 * runs in (lib/origin.js).
 */

import path from 'path';
import { APP_NOT_IN_GATEWAY } from '../workspace-config.js';
import { loadSiteManifest, siteManifestPath } from './ManifestLoader.js';

export const NOT_HELD_PATH_REMEDY = 'or pass -p <built dist> to upload a directory for an app this workspace does not hold.';

/**
 * @param {import('../workspace-config.js').WorkspaceConfig} workspaceConfig
 * @param {string} appId
 * @param {{ path: string, pathExplicit: boolean }} opts — the -p value and whether the CALLER gave
 *   it (commander's option source === 'cli'); the default value is not explicit
 * @returns {Promise<{
 *   appRepo: object|null, appRoot: string|null, communityId: string|null,
 *   siteManifest: object|null, siteManifestPath: string|null, uploadDir: string|null, lines: string[]
 * }>} uploadDir is set exactly when siteManifest is null; lines are printed before any sign-in
 */
export async function resolveSiteSource(workspaceConfig, appId, { path: localPath, pathExplicit }) {
  const explicitDir = pathExplicit ? path.resolve(localPath) : null;

  let appRepo;
  try {
    appRepo = workspaceConfig.resolveAppRepo(appId);
  } catch (err) {
    if (err.code !== APP_NOT_IN_GATEWAY) throw err;
    if (!explicitDir) throw new Error(`${err.message}\n${NOT_HELD_PATH_REMEDY}`, { cause: err });
    return {
      appRepo: null, appRoot: null, communityId: null,
      siteManifest: null, siteManifestPath: null, uploadDir: explicitDir,
      lines: [`App repo: none listed; uploading --path ${explicitDir} for app ${appId}`],
    };
  }

  const appRoot = appRepo?.dir || path.resolve('.');
  const manifest = await loadSiteManifest(appRoot);
  const manifestPath = siteManifestPath(appRoot);

  // A gateway repo with no site manifest has no deployable set of its own; the -p default
  // ('./site', relative to the cwd) would read the GATEWAY's tree.
  if (workspaceConfig.isGateway() && !manifest && !explicitDir) {
    throw new Error(
      `App "${appId}" resolves to ${appRoot} (gateway ${appRepo.role} entry '${appRepo.entry}'), ` +
      `which has no site manifest at ${manifestPath}. Add one there, or name the directory to upload with -p <dir>.`
    );
  }

  const uploadDir = manifest ? null : (explicitDir || path.resolve(localPath));
  const lines = [
    `App repo: ${appRoot} (${appRepo
      ? (appRepo.role === 'self' ? 'this workspace\'s app' : `gateway ${appRepo.role} entry '${appRepo.entry}'`)
      : 'not this workspace\'s app — current directory'})`,
    `Site manifest: ${manifest ? manifestPath : `none at ${manifestPath} — uploading -p ${uploadDir}`}`,
  ];
  if (manifest && explicitDir) lines.push(`-p ${explicitDir} ignored: the site manifest names the files`);

  return {
    appRepo, appRoot, communityId: appRepo?.communityId || null,
    siteManifest: manifest, siteManifestPath: manifestPath, uploadDir, lines,
  };
}

export default { resolveSiteSource, NOT_HELD_PATH_REMEDY };
