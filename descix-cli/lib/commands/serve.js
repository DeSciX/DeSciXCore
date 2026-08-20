/**
 * descix serve — thin CLI wrapper around @descix/app-sdk gateway.
 *
 * The API target follows the SAME channel every other CLI command uses: the
 * global `--api-url` / `--env` flags are normalized into DESCIX_API_URL by the
 * program's preAction hook, and this command consumes that one value. There is
 * no second `--api-url` flag on `serve`.
 *
 * The port follows the same shape: this wrapper passes ONLY what the developer
 * explicitly asked for (`--port`). It does NOT substitute a default — the
 * gateway's resolveGatewayPort owns the chain (--port > env.gateway.port >
 * built-in default), so the server and the product map the shell bakes cannot
 * name different ports.
 *
 * `cwd` is passed SEPARATELY from `workspaceRoot` on purpose. workspaceRoot is
 * walked UP from to find .descix/workspace.json, so by the time the gateway has
 * it, the directory the developer was actually standing in is gone — and that
 * directory is exactly what picks the app to serve (AMB-2).
 */

import { runGateway } from '@descix/app-sdk/dev';

export async function runServe(options = {}) {
  const apiUrl = process.env.DESCIX_API_URL || undefined;

  await runGateway({
    port: options.port,
    portSource: options.port !== undefined ? '--port' : undefined,
    workspaceRoot: options.workspaceRoot || process.cwd(),
    apiUrl,
    apiSource: apiUrl ? 'CLI --api-url/--env (DESCIX_API_URL)' : undefined,
    siteUrl: options.siteUrl,
    siteSource: options.siteUrl ? 'CLI --site-url' : undefined,
    app: options.app,
    cwd: process.cwd(),
  });
}
