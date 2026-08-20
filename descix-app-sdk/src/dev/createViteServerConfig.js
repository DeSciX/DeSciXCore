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
 *
 * Certs come from resolveDevCertOptions, the same owner the gateway uses, so a
 * workspace-configured `env.devCerts` reaches THIS dev server too. It previously
 * did not: only the caller's explicit options were honoured here, so a developer
 * with their own keychain-trusted pair got it on the gateway origin and the
 * SDK-tracked pair on every app behind it — and passkey ceremonies, being
 * origin-bound, then worked on one and failed on the other (redteam G-7).
 */
import { getViteHttpsConfig } from './getViteHttpsConfig.js';
import { createViteProxyConfig } from './createViteProxyConfig.js';
import { resolveDevCertOptions } from './devCerts.js';

export function createViteServerConfig(workspacePath, options = {}) {
  const { port, certDir, certFile, keyFile, ...proxyOptions } = options;
  const config = {
    ...getViteHttpsConfig(resolveDevCertOptions(workspacePath, { certDir, certFile, keyFile })),
    proxy: createViteProxyConfig(workspacePath, proxyOptions),
  };
  if (port != null) {
    config.port = port;
  }
  return config;
}
