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
 * Resolution is EXPLICIT-FIRST and never lands on localhost silently. The DEFAULT
 * SDK user wins the defaults: an unconfigured workspace talks to the published
 * platform (PROD) and serves the shell from that same origin, so `descix serve`
 * works with no platform checkout and no configuration. Naming another environment
 * is one command (`descix config set-env dev`); a LOCAL shell or a LOCAL API is an
 * expert opt-in, reached only by naming it (`--site-url`, `env.siteUrl`,
 * `env.apiUrl`, or a local platform checkout when the API is already local).
 */

import { URL } from 'url';

export { ENV_ORIGINS, DEFAULT_ENV, DEFAULT_API_URL, PROD_URL, CLOUD_DEV_URL } from './envOrigins.js';
import { DEFAULT_API_URL, DEFAULT_ENV } from './envOrigins.js';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '::1', '0.0.0.0']);

/**
 * Parse a target URL, failing loud on a typo instead of deep inside the proxy.
 * @param {string} url
 * @returns {URL}
 */
export function assertTargetUrl(url) {
  try {
    return new URL(url);
  } catch {
    throw new Error(`[Gateway] Not a valid URL: ${JSON.stringify(url)}`);
  }
}

/**
 * True when the URL points at this machine.
 * @param {string} url
 * @returns {boolean}
 */
export function isLocalOrigin(url) {
  if (!url) return false;
  return LOCAL_HOSTNAMES.has(assertTargetUrl(url).hostname);
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
 *   2. env.apiUrl                   explicit workspace setting (what `set-env` writes)
 *   3. env.platform.microservice    LOCAL platform checkout — the expert opt-in
 *   4. DEFAULT_API_URL              default: the published platform (PROD)
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
    apiSource = options.apiSource || 'caller option apiGatewayUrl';
  } else if (env.apiUrl) {
    apiUrl = env.apiUrl;
    apiSource = 'workspace env.apiUrl';
  } else if (env.platform?.microservice?.port) {
    const ms = env.platform.microservice;
    const proto = ms.protocol || 'https';
    apiUrl = `${proto}://localhost:${ms.port}`;
    apiSource = 'workspace env.platform.microservice (local platform)';
  } else {
    apiUrl = DEFAULT_API_URL;
    apiSource = `default (${DEFAULT_ENV.toUpperCase()})`;
  }
  assertTargetUrl(apiUrl); // fail on a typo here, not deep inside the proxy

  return { apiUrl, apiSource };
}

/**
 * Resolve the site target — the origin behind the gateway's root route '/'.
 *
 * Precedence — the DEFAULT SDK user wins: whenever the API is a real platform
 * origin, the shell comes from that same origin, so one origin carries shell +
 * app + /apifront with nothing configured. A platform developer opts IN to a
 * local shell by naming it; owning a platform checkout is not by itself a request
 * to serve it.
 *
 *   1. options.siteUrl              explicit caller override (--site-url)
 *   2. env.siteUrl                  explicit workspace setting
 *   3. apiUrl, when it is REMOTE    the cloud shell shares the API origin
 *   4. env.platform.site.port       LOCAL shell — reachable only once the API is
 *                                   itself local (the all-local mode-1 stack)
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
    assertTargetUrl(options.siteUrl);
    return { siteUrl: options.siteUrl, siteSource: options.siteSource || 'caller option siteUrl' };
  }
  if (env.siteUrl) {
    assertTargetUrl(env.siteUrl);
    return { siteUrl: env.siteUrl, siteSource: 'workspace env.siteUrl' };
  }

  const { apiUrl, apiSource } = resolveApiTarget(config, options);
  if (!isLocalOrigin(apiUrl)) {
    return { siteUrl: apiUrl, siteSource: `same origin as API (${apiSource})` };
  }

  if (env.platform?.site?.port) {
    const site = env.platform.site;
    const proto = site.protocol || 'https';
    return {
      siteUrl: `${proto}://localhost:${site.port}`,
      siteSource: 'workspace env.platform.site (local shell, local API)',
    };
  }

  throw new Error(
    '[Gateway] Cannot determine the site (root "/") target. The API resolved to the local ' +
    `origin ${apiUrl} (${apiSource}) and there is no shell to serve at "/".\n` +
    `  Serve a PLATFORM shell: descix serve --site-url ${DEFAULT_API_URL}\n` +
    '                          (or set env.siteUrl in .descix/workspace.json to make it permanent)\n' +
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
