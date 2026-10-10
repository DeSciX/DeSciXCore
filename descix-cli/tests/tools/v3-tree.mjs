/**
 * v3-tree — fixture builder for workspace-v3 (fork (b)) directory trees.
 *
 * A v3 gateway workspace never restates its apps: it LISTS sibling repo paths, and each listed
 * repo holds its OWN single-app workspace.json (the sole authority on that app's id, site and
 * microservice — see @descix/app-sdk/dev resolveWorkspaceApps). A fixture for any consumer of
 * the local app set is therefore a real directory tree, not an inline config object.
 *
 * This helper only WRITES the files a developer would have on disk. It deliberately does NOT
 * expand them into an app list — that expansion has exactly one owner (resolveWorkspaceApps),
 * and a test that rebuilt it by hand would be a second derivation of the same fact. Assertions
 * go through the consumers under test.
 *
 * Layout (one realpath'd temp base, so cwd-containment checks are stable on macOS where
 * os.tmpdir() is a symlink):
 *
 *   <base>/gateway/.descix/workspace.json    the workspace under test (spec.env + spec.gateway)
 *   <base>/<repoName>/.descix/workspace.json one per spec.repos entry ({ env: { app } })
 *
 * Spec:
 *   env      extra env keys for the gateway workspace (environment, apiUrl, app, ...)
 *   gateway  { port?, shell?: repoName, appRepos?: [repoName] } — repo NAMES, written as
 *            '../<name>' paths exactly as a developer would
 *   repos    { [repoName]: <that repo's env.app block> }
 *   extra    top-level keys merged into the gateway workspace.json (version stays '3.0')
 *
 * @param {import('node:test').TestContext} t - registers removal of the tree
 * @param {Object} spec
 * @returns {Promise<{ base: string, dir: string, repos: Object<string,string> }>}
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

async function writeWorkspace(dir, doc) {
  await fs.mkdir(path.join(dir, '.descix'), { recursive: true });
  await fs.writeFile(path.join(dir, '.descix', 'workspace.json'), JSON.stringify(doc, null, 2));
}

export async function makeV3Tree(t, spec = {}) {
  const base = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'v3tree-')));
  t.after(() => fs.rm(base, { recursive: true, force: true }));

  const repos = {};
  for (const [name, app] of Object.entries(spec.repos || {})) {
    repos[name] = path.join(base, name);
    await writeWorkspace(repos[name], { version: '3.0', env: { app } });
  }

  const dir = path.join(base, 'gateway');
  const env = { ...(spec.env || {}) };
  if (spec.gateway) {
    const { shell, appRepos, ...rest } = spec.gateway;
    env.gateway = {
      ...rest,
      ...(shell ? { shell: `../${shell}` } : {}),
      ...(appRepos ? { appRepos: appRepos.map((n) => `../${n}`) } : {}),
    };
  }
  await writeWorkspace(dir, { version: '3.0', ...(spec.extra || {}), env });
  return { base, dir, repos };
}
