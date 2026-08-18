/**
 * descix serve — thin CLI wrapper around @descix/app-sdk gateway.
 *
 * The API target follows the SAME channel every other CLI command uses: the
 * global `--api-url` / `--env` flags are normalized into DESCIX_API_URL by the
 * program's preAction hook, and this command consumes that one value. There is
 * no second `--api-url` flag on `serve`.
 */

import { runGateway } from '@descix/app-sdk/dev';

export async function runServe(options = {}) {
  const apiUrl = process.env.DESCIX_API_URL || undefined;

  await runGateway({
    port: options.port || 5173,
    workspaceRoot: options.workspaceRoot || process.cwd(),
    apiUrl,
    apiSource: apiUrl ? 'CLI --api-url/--env (DESCIX_API_URL)' : undefined,
    siteUrl: options.siteUrl,
    siteSource: options.siteUrl ? 'CLI --site-url' : undefined,
  });
}
