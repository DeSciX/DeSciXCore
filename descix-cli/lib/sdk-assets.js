/**
 * The SDK's agent assets (instructions, guides, reference) ship inside this package at
 * agent-assets/. `pullSdkAssets` copies them into a workspace at .descix/sdk-assets/ so a local AI
 * agent can read them. A missing source is a broken install and throws; it is never skipped.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

/** agent-assets/ at the package root, one level above lib/. */
export const SDK_ASSETS_SOURCE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'agent-assets');

/**
 * Copy the package's agent-assets/ to <workspaceRoot>/.descix/sdk-assets/.
 * @param {string} workspaceRoot
 * @returns {Promise<string>} the target directory
 * @throws when the package's agent-assets/ is absent or the copy fails
 */
export async function pullSdkAssets(workspaceRoot) {
  const target = path.join(workspaceRoot, '.descix', 'sdk-assets');
  try {
    await fs.access(SDK_ASSETS_SOURCE);
  } catch {
    throw new Error(`SDK agent assets are missing from this install (${SDK_ASSETS_SOURCE}). Reinstall @descix/cli.`);
  }
  await fs.cp(SDK_ASSETS_SOURCE, target, { recursive: true });
  return target;
}
