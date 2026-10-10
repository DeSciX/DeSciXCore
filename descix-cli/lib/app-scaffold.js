/**
 * THE ONE OWNER of the files `descix app init` stamps into an app repo beyond the workspace and
 * the agent instruction files (proposal 2026-10-09-standard-app-repo-form, items 3 and 5):
 *
 *   .descix/manifests/site.json   the deployable site set (`descix site upload` reads it)
 *   .claude-plugin/plugin.json    the Claude plugin stub
 *   site/index.html               the front-page template (templates/scaffolds/frontpage/)
 *
 * ONLY-IF-ABSENT: a file that exists is never read-modified, never overwritten, never reported as
 * written. The agent files (CLAUDE.md …) stay with lib/agent-files.js; this module does not write
 * them.
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const FRONTPAGE_TEMPLATE = path.join(
  path.dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'scaffolds', 'frontpage', 'index.html',
);

const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function writeIfAbsent(file, content) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  try {
    await fs.writeFile(file, content, { encoding: 'utf8', flag: 'wx' });
    return true;
  } catch (err) {
    if (err.code === 'EEXIST') return false;
    throw err;
  }
}

/**
 * @param {string} appPath the app repo root
 * @param {{appId: string, communityId: string}} identity
 * @returns {Promise<string[]>} repo-relative paths actually created
 */
export async function scaffoldAppRepo(appPath, { appId, communityId }) {
  if (!appId || !communityId) {
    throw new Error('scaffoldAppRepo: appId and communityId are required (no default would be true).');
  }
  const siteManifest = {
    _purpose: `Deployable site set for the ${appId} app; sources are uploaded by descix site upload.`,
    sources: [{ path: 'site' }],
    buildCommand: null,
  };
  const plugin = {
    name: appId,
    description: `${appId}, an app of the ${communityId} community on DeSciX.`,
    version: '0.1.0',
    author: { name: communityId },
  };
  const frontpage = (await fs.readFile(FRONTPAGE_TEMPLATE, 'utf8'))
    .replace(/\{\{APP_ID\}\}/g, escapeHtml(appId))
    .replace(/\{\{COMMUNITY_ID\}\}/g, escapeHtml(communityId));

  const files = [
    ['.descix/manifests/site.json', JSON.stringify(siteManifest, null, 2) + '\n'],
    ['.claude-plugin/plugin.json', JSON.stringify(plugin, null, 2) + '\n'],
    ['site/index.html', frontpage],
  ];
  const created = [];
  for (const [rel, content] of files) {
    if (await writeIfAbsent(path.join(appPath, rel), content)) created.push(rel);
  }
  return created;
}
