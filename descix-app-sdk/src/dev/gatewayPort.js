/**
 * gatewayPort — the ONE owner of "which port is the local gateway on".
 *
 * Both the SERVER (`descix serve` → runGateway) and the MAP the shell bakes
 * (`buildWorkspaceProducts`, `resolveAppGatewayUrl` → `descix app open`) must
 * answer this the same way. They did not: the map read `env.gateway.port` while
 * the server took a hardcoded CLI flag default, so a workspace with
 * `env.gateway.port: 5599` printed `https://localhost:5599/p/<app>` while the
 * gateway listened on 5173. The map and the server disagreed and nothing said so.
 *
 * Resolution chain, explicit-first:
 *   1. an explicit override (the `--port` flag)
 *   2. env.gateway.port in .descix/workspace.json
 *   3. DEFAULT_GATEWAY_PORT
 *
 * Every answer carries the SOURCE, so a port-in-use failure can name where the
 * number came from instead of just the number.
 */

/** The built-in gateway port, used only when nothing names one. */
export const DEFAULT_GATEWAY_PORT = 5173;

/**
 * Resolve the gateway port and where it came from.
 *
 * @param {Object} [config] - parsed .descix/workspace.json
 * @param {Object} [overrides]
 * @param {number|string} [overrides.port] - explicit override (the --port flag)
 * @param {string} [overrides.portSource] - human label for the override
 * @returns {{ port: number, portSource: string }}
 */
export function resolveGatewayPort(config = {}, overrides = {}) {
  if (overrides.port !== undefined && overrides.port !== null && overrides.port !== '') {
    return { port: assertPort(overrides.port, overrides.portSource || '--port'), portSource: overrides.portSource || '--port' };
  }

  const configured = config?.env?.gateway?.port;
  if (configured !== undefined && configured !== null && configured !== '') {
    return { port: assertPort(configured, 'env.gateway.port'), portSource: 'env.gateway.port' };
  }

  return { port: DEFAULT_GATEWAY_PORT, portSource: `built-in default (${DEFAULT_GATEWAY_PORT})` };
}

/**
 * A port is a number or it is a configuration error — never a silent NaN that
 * Vite turns into a random port.
 * @param {number|string} value
 * @param {string} source
 * @returns {number}
 */
export function assertPort(value, source) {
  const port = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`[Gateway] Not a valid port: ${JSON.stringify(value)} (from ${source}). Expected an integer 1-65535.`);
  }
  return port;
}

/**
 * The message a port collision gets. Names BOTH the configured source and the
 * flag that overrides it, so the developer knows which knob to turn.
 * @param {number} port
 * @param {string} portSource
 * @returns {string}
 */
export function portInUseMessage(port, portSource) {
  return `[Gateway] port ${port} (from ${portSource}) in use — pass --port <n> or free it`;
}
