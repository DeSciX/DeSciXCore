/**
 * watchWorkspaceConfig - Watches .descix/workspace.json for changes.
 *
 * Used by descix-serve to hot-reload proxy rules when microservices
 * register/unregister by writing their ports into workspace.json.
 *
 * Debounces rapid writes (e.g., concurrent service startups) into
 * a single callback invocation.
 */

import fs from 'fs';
import path from 'path';

/**
 * @param {string} workspacePath - Path to workspace root (contains .descix/workspace.json)
 * @param {function} onChange - Callback invoked with the parsed config when workspace.json changes
 * @param {Object} [options]
 * @param {number} [options.debounceMs=300] - Debounce interval in ms
 * @returns {{ close: function }} Watcher handle with close() to stop watching
 */
export function watchWorkspaceConfig(workspacePath, onChange, options = {}) {
  const debounceMs = options.debounceMs ?? 300;
  const configPath = path.resolve(workspacePath, '.descix/workspace.json');

  let debounceTimer = null;
  let lastContent = null;

  try {
    lastContent = fs.readFileSync(configPath, 'utf8');
  } catch {
    // File may not exist yet
  }

  const watcher = fs.watch(path.dirname(configPath), (eventType, filename) => {
    if (filename !== 'workspace.json') return;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      try {
        const content = fs.readFileSync(configPath, 'utf8');
        if (content === lastContent) return;
        lastContent = content;
        const config = JSON.parse(content);
        onChange(config);
      } catch (e) {
        console.warn('[watchWorkspaceConfig] Error reading workspace.json:', e.message);
      }
    }, debounceMs);
  });

  return {
    close() {
      if (debounceTimer) clearTimeout(debounceTimer);
      watcher.close();
    },
  };
}
