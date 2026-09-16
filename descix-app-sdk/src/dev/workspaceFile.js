/**
 * workspaceFile — THE ONE OWNER of "where is .descix/workspace.json, and read it".
 *
 * The gateway walked up the tree for the workspace file with a private helper; the CLI has its
 * own loader; the Playwright harness needed the same walk. A third copy of "walk up until you
 * find .descix/workspace.json" is how three surfaces end up finding three different files
 * (measured 2026-09-01: one seat's notes resolved to four paths that way). Pure fs/path, no
 * other imports, so any surface — including a test harness that cannot resolve the package by
 * name — can import it by relative path.
 */

import fs from 'fs';
import path from 'path';

/**
 * The workspace file's path under a root. The one place the `.descix/workspace.json` name is
 * spelled — every existence check and read joins through here.
 * @param {string} workspaceRoot
 * @returns {string}
 */
export function workspaceFilePath(workspaceRoot) {
  return path.join(workspaceRoot, '.descix', 'workspace.json');
}

/**
 * Find the workspace root by walking up from startDir looking for .descix/workspace.json.
 * @param {string} startDir
 * @returns {string|null} the directory that holds `.descix/workspace.json`, or null
 */
export function findWorkspaceRoot(startDir) {
  let dir = path.resolve(startDir);
  while (true) {
    if (fs.existsSync(workspaceFilePath(dir))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Read and parse `.descix/workspace.json` under a workspace root. Throws on a missing or
 * unparseable file — a workspace that cannot be read is never silently `{}`.
 * @param {string} workspaceRoot
 * @returns {Object}
 */
export function readWorkspaceConfig(workspaceRoot) {
  return JSON.parse(fs.readFileSync(workspaceFilePath(workspaceRoot), 'utf8'));
}
