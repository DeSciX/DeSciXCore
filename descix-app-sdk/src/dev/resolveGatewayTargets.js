/**
 * resolveGatewayTargets — the ONE owner of "what does the local gateway point at".
 *
 * Two targets, resolved from .descix/workspace.json:
 *
 *   apiUrl   the origin behind /apifront, /api, /mcp, /oauth, /.well-known/*
 *   siteUrl  the origin behind the root route '/' (the App Shell)
 *
 * Both the gateway (gateway.js) and any app's Vite config (createViteProxyConfig.js)
 * consume this resolver — neither re-derives the chain by hand.
 *
 * Resolution is EXPLICIT-FIRST and never lands on localhost silently: a localhost
 * target appears only when the workspace explicitly configures a local platform
 * checkout. With no local platform at all (an SDK consumer workspace — "mode 2",
 * local app dev against cloud DEV), the API resolves to the stable cloud DEV origin
 * and the shell is served from that same origin.
 */

import { URL } from 'url';

/**
 * Stable cloud DEV origin — the default API/shell target for a workspace that
 * configures no local platform. Serves the current PWA, /apifront and /mcp.
 */
export const CLOUD_DEV_URL = 'https://dev.descix.net';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '::1', '0.0.0.0']);

/**
 * True when the URL points at this machine.
 * @param {string} url
 * @returns {boolean}
 */
export function isLocalOrigin(url) {
  if (!url) return false;
  let hostname;
  try {
    hostname = new URL(url).hostname;
  } catch {
    throw new Error(`[Gateway] Not a valid URL: ${JSON.stringify(url)}`);
  }
  return LOCAL_HOSTNAMES.has(hostname);
}

/**
 * Build a Vite proxy entry for a target origin.
 *
 * `secure` is DERIVED, never hand-set per route: remote targets get real TLS
 * verification, local targets tolerate the self-signed dev cert.
 *
 * @param {string} target
 * @param {Object} [extra] - extra Vite proxy options (rewrite, ws, ...)
 * @returns {Object}
 */
export function proxyEntry(target, extra = {}) {
  return {
    target,
    changeOrigin: true,
    secure: !isLocalOrigin(target),
    ...extra,
  };
}

/**
 * Reject workspace keys that no longer exist, instead of silently ignoring them.
 * @param {Object} config
 */
function assertSupportedKeys(config) {
  if (config.apiUrl) {
    throw new Error(
      '[Gateway] Top-level "apiUrl" in workspace.json is not a supported key. ' +
      'Move it to env.apiUrl (v2.1 workspace format).'
    );
  }
}

/**
 * Resolve the API target (behind /apifront, /api, /mcp, /oauth).
 *
 * Precedence:
 *   1. options.apiGatewayUrl        explicit caller override (app Vite configs)
 *   2. env.apiUrl                   explicit workspace setting
 *   3. env.platform.microservice    LOCAL platform checkout — the mode-1 opt-in
 *   4. CLOUD_DEV_URL                default: cloud DEV
 *
 * @param {Object} config - parsed .descix/workspace.json
 * @param {Object} [options]
 * @param {string} [options.apiGatewayUrl]
 * @returns {{apiUrl: string, apiSource: string}}
 */
export function resolveApiTarget(config = {}, options = {}) {
  assertSupportedKeys(config);
  const env = config.env || {};

  let apiUrl;
  let apiSource;
  if (options.apiGatewayUrl) {
    apiUrl = options.apiGatewayUrl;
    apiSource = 'caller option apiGatewayUrl';
  } else if (env.apiUrl) {
    apiUrl = env.apiUrl;
    apiSource = 'workspace env.apiUrl';
  } else if (env.platform?.microservice?.port) {
    const ms = env.platform.microservice;
    const proto = ms.protocol || 'https';
    apiUrl = `${proto}://localhost:${ms.port}`;
    apiSource = 'workspace env.platform.microservice (local platform)';
  } else {
    apiUrl = CLOUD_DEV_URL;
    apiSource = 'default (cloud DEV)';
  }
  // Validate early so a typo fails here, not deep inside the proxy.
  isLocalOrigin(apiUrl);

  return { apiUrl, apiSource };
}

/**
 * Resolve the site target — the origin behind the gateway's root route '/'.
 *
 * Precedence:
 *   1. options.siteUrl              explicit caller override
 *   2. env.siteUrl                  explicit workspace setting
 *   3. env.platform.site.port       LOCAL shell checkout — the mode-1 opt-in
 *   4. apiUrl, when it is REMOTE    the cloud shell shares the API origin
 *   5. throw                        a local API with no local shell has no root
 *
 * @param {Object} config - parsed .descix/workspace.json
 * @param {Object} [options]
 * @param {string} [options.siteUrl]
 * @param {string} [options.apiGatewayUrl]
 * @returns {{siteUrl: string, siteSource: string}}
 */
export function resolveSiteTarget(config = {}, options = {}) {
  assertSupportedKeys(config);
  const env = config.env || {};

  if (options.siteUrl) {
    isLocalOrigin(options.siteUrl);
    return { siteUrl: options.siteUrl, siteSource: 'caller option siteUrl' };
  }
  if (env.siteUrl) {
    isLocalOrigin(env.siteUrl);
    return { siteUrl: env.siteUrl, siteSource: 'workspace env.siteUrl' };
  }
  if (env.platform?.site?.port) {
    const site = env.platform.site;
    const proto = site.protocol || 'https';
    return {
      siteUrl: `${proto}://localhost:${site.port}`,
      siteSource: 'workspace env.platform.site (local shell)',
    };
  }

  const { apiUrl, apiSource } = resolveApiTarget(config, options);
  if (!isLocalOrigin(apiUrl)) {
    return { siteUrl: apiUrl, siteSource: `same origin as API (${apiSource})` };
  }

  throw new Error(
    '[Gateway] Cannot determine the site (root "/") target. The API resolved to the local ' +
    `origin ${apiUrl} (${apiSource}) and there is no shell to serve at "/".\n` +
    '  Serve the CLOUD shell:  set env.siteUrl (e.g. "https://dev.descix.net") in .descix/workspace.json\n' +
    '  Serve a LOCAL shell:    set env.platform.site.port to your platform site dev-server port'
  );
}

/**
 * Resolve both gateway targets at once.
 * @param {Object} config - parsed .descix/workspace.json
 * @param {Object} [options]
 * @returns {{apiUrl: string, apiSource: string, siteUrl: string, siteSource: string}}
 */
export function resolveGatewayTargets(config = {}, options = {}) {
  return {
    ...resolveApiTarget(config, options),
    ...resolveSiteTarget(config, options),
  };
}
