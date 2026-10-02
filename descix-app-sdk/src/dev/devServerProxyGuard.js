/**
 * devServerProxyGuard — THE ONE OWNER of "the /p/{appId} dev-server proxy failed: say so".
 *
 * WHY (measured 2026-10-02, EGPT-Evidence, CLI 1.0.18): a product's dev-server proxy target
 * that is dead, or that speaks plain HTTP while the composed target says https://, surfaced
 * as an EMPTY 500 body — nothing in the response named the target, the app, or the fix, and
 * the only evidence was a vite stack trace on the gateway console. A wrong `site.protocol`
 * must fail LOUD, never silently (no auto-detection, no try-both fallback — the org rule
 * forbids silent fallbacks).
 *
 * This is a Vite proxy `configure` hook. Vite calls `configure(proxy, opts)` BEFORE it
 * attaches its own 'error' listener, so this handler runs first: it answers the request with
 * a plain-text 502 naming the exact target URL, the app id, and the remedy, and Vite's own
 * handler then sees `headersSent`/`writableEnded` and skips its empty 500. One console line
 * is printed per failure so the gateway terminal says the same thing the response does.
 */

import { invokedBin } from './invokedBin.js';

/**
 * The exact 502 body for an unreachable / protocol-mismatched dev-server upstream.
 * A pure function so the wording is unit-testable without booting a proxy.
 *
 * @param {string} appId - the product whose /p/{appId} route failed
 * @param {string} target - the composed upstream origin, e.g. `https://localhost:5612`
 * @param {Error} err - the proxy error
 * @returns {string}
 */
export function devServerUnreachableBody(appId, target, err) {
  const bin = invokedBin();
  const reason = err?.code || err?.message || String(err);
  const scheme = String(target).split(':')[0];
  const protocolHint = scheme === 'https'
    ? `if the dev server speaks plain HTTP, declare it: ${bin} app set-site -a ${appId} --port <port> --protocol http`
    : `if the dev server speaks HTTPS, declare it: ${bin} app set-site -a ${appId} --port <port> --protocol https`;
  return (
    `502 Bad Gateway — /p/${appId}\n` +
    `\n` +
    `The gateway could not get a response from this app's dev server.\n` +
    `  app:    ${appId}\n` +
    `  target: ${target}   (workspace.json env.products[${appId}].site.port` +
    (scheme === 'https' ? ', default protocol https' : ` + site.protocol "${scheme}"`) + `)\n` +
    `  error:  ${reason}\n` +
    `\n` +
    `Fix one of:\n` +
    `  - start the dev server at ${target}, or\n` +
    `  - ${protocolHint}, or\n` +
    `  - serve the built site instead (static mode): ${bin} app set-site -a ${appId} --static <dir>\n`
  );
}

/**
 * Build the `configure` hook for a /p/{appId} dev-server proxy entry.
 *
 * @param {string} appId
 * @param {string} target - the composed upstream origin (localUpstreamOrigin)
 * @param {{ log?: Function }} [options] - log defaults to console.error
 * @returns {(proxy: import('http-proxy').Server) => void}
 */
export function devServerProxyGuard(appId, target, options = {}) {
  const log = options.log || console.error;
  return (proxy) => {
    proxy.on('error', (err, _req, res) => {
      const body = devServerUnreachableBody(appId, target, err);
      log(`[Gateway] /p/${appId} → ${target} failed (${err?.code || err?.message}): answering 502, not an empty body.`);
      // `res` is a ServerResponse for HTTP requests, a raw Socket for ws upgrades.
      if (typeof res?.writeHead === 'function') {
        if (!res.headersSent && !res.writableEnded) {
          res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
        }
        if (!res.writableEnded) res.end(body);
      } else if (typeof res?.end === 'function') {
        res.end();
      }
    });
  };
}
