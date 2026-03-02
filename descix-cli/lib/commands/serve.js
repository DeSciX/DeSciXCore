/**
 * descix serve — thin CLI wrapper around @descix/app-sdk gateway.
 */

import { runGateway } from '@descix/app-sdk/dev';

export async function runServe(options = {}) {
  await runGateway({
    port: options.port || 5173,
    workspaceRoot: options.workspaceRoot || process.cwd(),
  });
}
