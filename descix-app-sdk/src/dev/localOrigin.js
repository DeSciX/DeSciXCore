/**
 * localOrigin — THE ONE OWNER of "what origin is a local dev server / service reachable at".
 *
 * WHY (measured 2026-09-16): five sites each built `${proto}://localhost:${port}` from a
 * workspace entry, and they disagreed. `resolveGatewayTargets` gave a microservice
 * `protocol || 'https'`; `createViteProxyConfig` hardcoded `http://` for the SAME route
 * ("Services are usually HTTP"). Both local microservices serve HTTPS, so every `/s/<appId>/…`
 * request through the gateway died with a 500 while the identical endpoint answered 200
 * direct. Two derivations of one fact drift silently; this module is the extracted owner.
 *
 * THE INVARIANT, stated once: local dev servers and services are HTTPS. The gateway is HTTPS,
 * the shell needs a secure context for WebAuthn, and every dev server behind the gateway
 * serves the workspace's dev certs. An entry that genuinely serves plain HTTP declares it —
 * `{ port, protocol: 'http' }` — and that declaration is the only thing that changes the
 * scheme. This is not a fallback hiding a misconfiguration: the normal, correct state of every
 * entry is to say nothing and be HTTPS.
 *
 * A missing port is a misconfiguration and fails loud naming the entry — there is no port to
 * default to.
 */

export const LOCAL_HOST = 'localhost';
export const LOCAL_DEFAULT_PROTOCOL = 'https';

/**
 * @param {{ port: number|string, protocol?: string }|null|undefined} entry - a workspace
 *        `site` or `microservice` block (`env.platform.*` or `env.products[].*`)
 * @param {string} what - the entry's name for the error, e.g. `env.products[powch].site`
 * @returns {string} an origin with no trailing slash, e.g. `https://localhost:5175`
 * @throws {Error} when the entry names no port
 */
export function localUpstreamOrigin(entry, what) {
  const port = entry?.port;
  if (port === undefined || port === null || port === '') {
    throw new Error(
      `[localOrigin] ${what} names no port, so it has no local origin. ` +
      'Set `port` on that entry in .descix/workspace.json (via the descix config/app verbs).'
    );
  }
  const proto = entry.protocol || LOCAL_DEFAULT_PROTOCOL;
  return `${proto}://${LOCAL_HOST}:${port}`;
}
