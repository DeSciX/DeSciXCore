/**
 * createViteServerConfig - Full Vite server config (HTTPS + proxy).
 *
 * Standardized dev server for apps using @descix/app-sdk.
 * Combines shared HTTPS certs with createViteProxyConfig.
 *
 * @param {string} workspacePath - Path to workspace root (contains .descix/workspace.json)
 * @param {Object} options
 * @param {string} [options.apiGatewayUrl='https://localhost:4000'] - API gateway URL
 * @param {number} [options.port] - Dev server port
 * @returns {Object} Vite server config
 */
import { getViteHttpsConfig } from './getViteHttpsConfig.js';
import { createViteProxyConfig } from './createViteProxyConfig.js';

export function createViteServerConfig(workspacePath, options = {}) {
  const { port, ...proxyOptions } = options;
  const config = {
    ...getViteHttpsConfig(),
    proxy: createViteProxyConfig(workspacePath, proxyOptions),
  };
  if (port != null) {
    config.port = port;
  }
  return config;
}
