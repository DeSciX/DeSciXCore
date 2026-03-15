import * as path from 'path';
import * as vscode from 'vscode';
import { getWorkspaceRoot } from './workspace';

let _cachedCliRoot: string | null = null;
let _installInProgress: Promise<boolean> | null = null;

/**
 * Resolve the root directory of @descix/cli.
 * Search order: workspace node_modules, global npm prefix.
 * Returns null if not found.
 */
export async function resolveCliRoot(): Promise<string | null> {
  if (_cachedCliRoot) return _cachedCliRoot;

  const fs = await import('fs/promises');

  // 1. Workspace node_modules
  const workspaceRoot = getWorkspaceRoot();
  if (workspaceRoot) {
    const wsPath = path.join(workspaceRoot, 'node_modules', '@descix', 'cli');
    try {
      await fs.access(path.join(wsPath, 'package.json'));
      _cachedCliRoot = wsPath;
      return wsPath;
    } catch { /* not here */ }
  }

  // 2. Global npm prefix (npm root -g)
  try {
    const { execSync } = await import('child_process');
    const globalRoot = execSync('npm root -g', { encoding: 'utf-8' }).trim();
    const globalPath = path.join(globalRoot, '@descix', 'cli');
    await fs.access(path.join(globalPath, 'package.json'));
    _cachedCliRoot = globalPath;
    return globalPath;
  } catch { /* not here */ }

  return null;
}

/**
 * Ensure @descix/cli is installed. If not found, auto-install globally
 * with a progress notification. Returns true if CLI is available after this call.
 */
export async function ensureCli(): Promise<boolean> {
  const existing = await resolveCliRoot();
  if (existing) return true;

  // Deduplicate concurrent install attempts
  if (_installInProgress) return _installInProgress;

  _installInProgress = doInstall();
  const result = await _installInProgress;
  _installInProgress = null;
  return result;
}

async function doInstall(): Promise<boolean> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'DeSciX',
      cancellable: false,
    },
    async (progress) => {
      progress.report({ message: 'Installing CLI tools...' });

      try {
        const { execSync } = await import('child_process');
        execSync('npm install -g @descix/cli', {
          encoding: 'utf-8',
          timeout: 120_000,
          stdio: 'pipe',
        });

        clearCliCache();
        const root = await resolveCliRoot();
        if (root) {
          progress.report({ message: 'CLI installed' });
          return true;
        } else {
          vscode.window.showErrorMessage(
            'DeSciX: CLI install completed but not found. Try: npm install -g @descix/cli'
          );
          return false;
        }
      } catch (err: any) {
        const msg = err.stderr?.toString().substring(0, 300) || err.message?.substring(0, 300) || '';
        vscode.window.showErrorMessage(
          'DeSciX: CLI install failed. Run manually: npm install -g @descix/cli\n' + msg
        );
        return false;
      }
    }
  );
}

/**
 * Get the path to a CLI binary (e.g., 'descix.js' or 'mcp-server.js').
 * Auto-installs CLI if missing.
 */
export async function getCliBinPath(binName: string): Promise<string | null> {
  const available = await ensureCli();
  if (!available) return null;
  const root = await resolveCliRoot();
  if (!root) return null;
  return path.join(root, 'bin', binName);
}

/**
 * Get the path to the CLI templates directory.
 * Auto-installs CLI if missing.
 */
export async function getCliTemplatesDir(): Promise<string | null> {
  const available = await ensureCli();
  if (!available) return null;
  const root = await resolveCliRoot();
  if (!root) return null;
  return path.join(root, 'templates');
}

/**
 * Clear the cached CLI root (e.g., after install or update).
 */
export function clearCliCache(): void {
  _cachedCliRoot = null;
}
