/**
 * watchWorkspaceConfig - Watches the workspace's config surface for changes.
 *
 * Used by descix-serve to hot-reload proxy rules when a served app's config moves.
 * v3 (fork (b)): that surface is MORE than one file — the gateway workspace's own
 * .descix/workspace.json AND each gateway-listed repo's own workspace.json, because
 * `descix app set-site` / `set-port` write the APP REPO'S file, not the gateway's.
 * The watch set comes from its owner (workspaceApps.workspaceWatchDirs) and is
 * RE-DERIVED whenever the gateway's own file changes, so a newly listed repo is
 * covered from that moment on.
 *
 * Debounces rapid writes (e.g., concurrent service startups) into a single callback
 * invocation. onChange always receives the GATEWAY workspace's parsed config — the
 * callers rebuild everything from the workspace root either way.
 */

import fs from 'fs';
import path from 'path';
import { workspaceWatchDirs } from './workspaceApps.js';

/**
 * @param {string} workspacePath - Path to workspace root (contains .descix/workspace.json)
 * @param {function} onChange - Callback invoked with the parsed config when any watched workspace.json changes
 * @param {Object} [options]
 * @param {number} [options.debounceMs=300] - Debounce interval in ms
 * @returns {{ close: function }} Watcher handle with close() to stop watching
 */
export function watchWorkspaceConfig(workspacePath, onChange, options = {}) {
  const debounceMs = options.debounceMs ?? 300;
  const ownConfigPath = path.resolve(workspacePath, '.descix/workspace.json');

  let debounceTimer = null;
  let watchers = [];
  const lastContent = new Map(); // configPath -> last seen bytes

  const readQuiet = (p) => {
    try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
  };

  const snapshot = (dirs) => {
    for (const d of dirs) {
      const p = path.join(d, 'workspace.json');
      if (!lastContent.has(p)) lastContent.set(p, readQuiet(p));
    }
  };

  const arm = () => {
    for (const w of watchers) w.close();
    watchers = [];
    const dirs = workspaceWatchDirs(workspacePath);
    snapshot(dirs);
    for (const dir of dirs) {
      // Watch the DIRECTORY: atomic writes replace the file, and watching the file
      // directly misses those events.
      const w = fs.watch(dir, (_event, filename) => {
        if (filename !== 'workspace.json') return;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          let changed = false;
          for (const d of workspaceWatchDirs(workspacePath)) {
            const p = path.join(d, 'workspace.json');
            const content = readQuiet(p);
            if (content !== lastContent.get(p)) {
              lastContent.set(p, content);
              changed = true;
            }
          }
          if (!changed) return;
          // The gateway's own file may have changed the LISTING — re-derive the watch set
          // before reporting, so the callback's rebuild and our coverage agree.
          arm();
          try {
            const config = JSON.parse(fs.readFileSync(ownConfigPath, 'utf8'));
            onChange(config);
          } catch (e) {
            console.warn('[watchWorkspaceConfig] Error reading workspace.json:', e.message);
          }
        }, debounceMs);
      });
      watchers.push(w);
    }
  };

  arm();

  return {
    close() {
      if (debounceTimer) clearTimeout(debounceTimer);
      for (const w of watchers) w.close();
      watchers = [];
    },
  };
}
