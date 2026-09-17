/**
 * resolveGatewayCertContext — the CLI-side mirror of which cert `descix serve`
 * will load for a given cwd. ONE owner within the CLI: `doctor.js` and
 * `dev-certs.js` both call this instead of re-deriving workspace lookup +
 * resolveDevCertOptions + resolveCertPaths by hand — the same two-derivations
 * risk `getViteHttpsConfig.js` names for the gateway itself.
 *
 * Mirrors gateway.js exactly: resolveDevCertOptions(workspaceRoot, {}, config)
 * then resolveCertPaths(certOpts) — both from @descix/app-sdk/dev, the actual
 * owner of "which TLS cert a local dev server uses". This module only supplies
 * the workspaceRoot/config a CLI command has to hand; it never re-derives the
 * precedence itself.
 */
import {
  findWorkspaceRoot,
  readWorkspaceConfig,
  resolveDevCertOptions,
  resolveCertPaths,
  resolveGatewayPort,
} from '@descix/app-sdk/dev';

/**
 * @param {string} cwd
 * @returns {{
 *   certPath: string,
 *   keyPath: string,
 *   workspaceRoot: string|null,
 *   config: Object|null,
 *   port: number,
 *   portSource: string,
 * }}
 */
export function resolveGatewayCertContext(cwd) {
  const workspaceRoot = findWorkspaceRoot(cwd);
  let config = null;
  if (workspaceRoot) {
    try {
      config = readWorkspaceConfig(workspaceRoot);
    } catch {
      // A malformed workspace is the workspace resolver's problem to report
      // elsewhere; this resolver just falls back to "no workspace opinion",
      // same as resolveDevCertOptions does for a missing/malformed file.
      config = null;
    }
  }
  const certOpts = resolveDevCertOptions(workspaceRoot || cwd, {}, config);
  const { certPath, keyPath } = resolveCertPaths(certOpts);
  const { port, portSource } = resolveGatewayPort(config || {}, {});
  return { certPath, keyPath, workspaceRoot, config, port, portSource };
}
