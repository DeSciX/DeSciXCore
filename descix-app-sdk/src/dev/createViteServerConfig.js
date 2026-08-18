/**
 * createViteServerConfig - Full Vite server config (HTTPS + proxy).
 *
 * Standardized dev server for apps using @descix/app-sdk.
 * Combines shared HTTPS certs with createViteProxyConfig.
 *
 * @param {string} workspacePath - Path to workspace root (contains .descix/workspace.json)
 * @param {Object} options
 * @param {string} [options.apiGatewayUrl] - API gateway URL (else resolveApiTarget)
 * @param {number} [options.port] - Dev server port
 * @param {string} [options.certDir] - Override dir holding cert.pem + key.pem
 * @param {string} [options.certFile] - Override certificate path
 * @param {string} [options.keyFile] - Override private key path
 * @returns {Object} Vite server config
 */
import { getViteHttpsConfig } from './getViteHttpsConfig.js';
import { createViteProxyConfig } from './createViteProxyConfig.js';

export function createViteServerConfig(workspacePath, options = {}) {
  const { port, certDir, certFile, keyFile, ...proxyOptions } = options;
  const config = {
    ...getViteHttpsConfig({ certDir, certFile, keyFile }),
    proxy: createViteProxyConfig(workspacePath, proxyOptions),
  };
  if (port != null) {
    config.port = port;
  }
  return config;
}
