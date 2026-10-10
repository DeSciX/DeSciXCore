/**
 * v3Tree — test fixture builder for workspace-v3 (fork (b)) directory trees.
 *
 * A v3 gateway workspace never restates its apps: it LISTS sibling repo paths, and each
 * listed repo holds its OWN single-app workspace.json (the sole authority on that app's id,
 * site and microservice — see src/dev/workspaceApps.js). A fixture for any consumer of the
 * local app set therefore has to be a real directory tree, not an inline config object.
 *
 * This helper only WRITES the files a developer would have on disk. It deliberately does
 * NOT expand them into an app list — that expansion has exactly one owner
 * (resolveWorkspaceApps), and a test that rebuilt it by hand would be a second derivation
 * of the same fact. Assertions go through the consumers under test.
 *
 * Layout (all under one realpath'd temp base, so cwd-containment checks are stable on macOS
 * where os.tmpdir() is a symlink):
 *
 *   <base>/gateway/.descix/workspace.json   the workspace under test (spec.env + spec.gateway)
 *   <base>/<repoName>/.descix/workspace.json one per spec.repos entry ({ env: { app } })
 *
 * A repo name may contain slashes ('FRAQTL/packages/inner') to nest one app's directory
 * inside another's.
 *
 * Spec:
 *   env      extra env keys for the gateway workspace (apiUrl, siteUrl, powchUrl, app, ...)
 *   gateway  { port?, shell?: repoName, appRepos?: [repoName] } — repo NAMES, written as
 *            '../<name>' paths exactly as a developer would
 *   repos    { [repoName]: <that repo's env.app block> }
 *
 * fn receives { dir, repos: { [name]: absDir }, config } where config is the parsed
 * gateway workspace.json — for the consumers that still take the parsed config alongside
 * the workspace root.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function writeWorkspace(dir, env) {
  fs.mkdirSync(path.join(dir, '.descix'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.descix', 'workspace.json'),
    JSON.stringify({ version: '3.0', env }, null, 2),
  );
}

export function withV3Tree(spec, fn) {
  const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'v3tree-')));
  try {
    const repos = {};
    for (const [name, app] of Object.entries(spec.repos || {})) {
      repos[name] = path.join(base, name);
      writeWorkspace(repos[name], { app });
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
    writeWorkspace(dir, env);

    const config = JSON.parse(fs.readFileSync(path.join(dir, '.descix', 'workspace.json'), 'utf8'));
    return fn({ dir, repos, config });
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
}
