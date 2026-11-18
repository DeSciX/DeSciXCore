/**
 * requestOrigin — the ONE owner of "which origin was this gateway request made on".
 *
 * The gateway listens on every interface, so the shell can be opened as
 * `https://localhost:<port>/`, through a tunnel hostname, or from another device. Anything the
 * gateway hands back for the browser to load must be on THAT origin: a phone has no
 * `localhost`, and a shell opened by a tunnel hostname that frames `localhost` shows an error
 * page where the app should be.
 *
 * The origin is `https://` + the request's AUTHORITY: `headers[':authority'] ?? headers.host`.
 * The gateway serves HTTP/2 (Vite's https server allows HTTP/1.1 too). Browsers send
 * `:authority` there and no `host`; a translating intermediary may send `host` alone (RFC 9113
 * §8.3.1); HTTP/1.x has only `host`. When both are present `:authority` is used and `host` is
 * not compared: the value feeds no trust decision, so a comparison would protect nothing.
 * The scheme is always https: the gateway serves nothing else. X-Forwarded-Host /
 * X-Forwarded-Proto are deliberately NOT read: a tunnel that forwards the public hostname as the
 * authority needs neither, and a second source of the same fact would be one more header any
 * client can set.
 *
 * The output is the WHATWG URL serialization of that origin (`new URL(...).origin`): what the
 * browser itself calls the page's origin, so the app frame is same-origin with the shell. It
 * lowercases the hostname and drops the default port (`example.test:443` → `https://example.test`).
 *
 * OUTPUT CONVENIENCE ONLY. The value names where the browser should load something; it is never
 * an input to a trust, auth or signing decision. The authority is client-controlled.
 *
 * A malformed authority fails loud (MalformedAuthorityError, which the gateway answers as 400
 * naming the problem). There is no fallback origin: answering `localhost` for a request that did
 * not come in on localhost is the defect this module exists to remove.
 */
import net from 'node:net';

/** Thrown for an authority that is not hostname[:port]; the gateway answers it with 400. */
export class MalformedAuthorityError extends Error {
  /**
   * @param {string} field - `:authority` or `Host header`
   * @param {*} value - the value refused, verbatim
   * @param {string} reason - what is wrong
   */
  constructor(field, value, reason) {
    super(
      `[gateway] the request's ${field} ${JSON.stringify(value)} is not hostname[:port] (${reason}). ` +
      'The gateway answers on the origin the shell was opened on, so it needs a well-formed ' +
      'request authority: open the gateway by a hostname, e.g. https://localhost:<port>/ or a ' +
      'tunnel hostname.'
    );
    this.name = 'MalformedAuthorityError';
    this.statusCode = 400;
  }
}

// One DNS-style label: letters, digits, underscores and hyphens, 1-63 characters, no hyphen at
// either end. Underscores are accepted because browsers send them and some tunnel and internal
// names carry them.
const LABEL = '[A-Za-z0-9_](?:[A-Za-z0-9_-]{0,61}[A-Za-z0-9_])?';
const HOSTNAME = new RegExp(`^${LABEL}(?:\\.${LABEL})*$`);
const PORT = /^[1-9][0-9]{0,4}$/;
const DEFAULT_HTTPS_PORT = '443';

/**
 * Validate one authority value and serialize the https origin it names.
 *
 * Accepted: a hostname (one trailing dot allowed, kept: the browser treats `example.test.` as
 * its own origin) or IPv4 address, or a bracketed IPv6 address, each with an optional `:port`
 * (1-65535, no leading zero). Refused, each with its reason: a missing or empty value,
 * whitespace, userinfo, a path, query or fragment, an invalid label, an empty or out-of-range
 * port, and anything the WHATWG URL parser rejects or rewrites into a different host (an
 * out-of-range or five-part IPv4, an IPv6 zone id, a non-canonical address such as `127.1`).
 *
 * @param {*} value - the authority, verbatim
 * @param {string} field - its name for the error: `:authority` or `Host header`
 * @returns {string} the origin, e.g. `https://localhost:5599`
 * @throws {MalformedAuthorityError} naming the field, the value and what is wrong
 */
export function originOfAuthority(value, field) {
  const refuse = (reason) => new MalformedAuthorityError(field, value, reason);
  if (typeof value !== 'string' || value.length === 0) throw refuse('missing or empty');
  if (/\s/.test(value)) throw refuse('contains whitespace');
  if (value.includes('@')) throw refuse('carries credentials');
  if (/[/?#\\]/.test(value)) throw refuse('carries a path, query or fragment');

  let name;
  let port;
  if (value.startsWith('[')) {
    const m = value.match(/^\[([^\]]*)\](?::(.*))?$/);
    if (!m) throw refuse('unterminated IPv6 literal');
    if (!net.isIPv6(m[1])) throw refuse('not an IPv6 address inside the brackets');
    name = `[${m[1]}]`;
    port = m[2];
  } else {
    const parts = value.split(':');
    if (parts.length > 2) throw refuse('more than one colon; an IPv6 address must be bracketed');
    [name, port] = parts;
    const bare = name.endsWith('.') ? name.slice(0, -1) : name;
    if (!(bare.length <= 253 && HOSTNAME.test(bare))) throw refuse('not a valid hostname');
  }
  if (port !== undefined && !(PORT.test(port) && Number(port) <= 65535)) throw refuse('port is not 1-65535');

  // Last step: the WHATWG parser — the browser's own — must accept it and name the same host.
  let url;
  try {
    url = new URL(`https://${value}`);
  } catch {
    throw refuse('not a host the URL parser accepts');
  }
  const samePort = url.port === (port === DEFAULT_HTTPS_PORT ? '' : (port ?? ''));
  if (url.hostname !== name.toLowerCase() || !samePort) {
    throw refuse(`the URL parser reads it as ${JSON.stringify(url.host)}`);
  }
  return url.origin;
}

/**
 * The https origin a gateway request was made on: `headers[':authority'] ?? headers.host`.
 *
 * Read explicitly rather than through `req.authority`: node's HTTP/2 compat request derives
 * `authority` the same way, but an HTTP/1.1 request object has no `authority` at all, and the
 * gateway answers both.
 *
 * @param {{headers: Object}} req - a node http or http2-compat request
 * @returns {string} e.g. `https://localhost:5599`, `https://dev-local.example.test`
 * @throws {MalformedAuthorityError}
 */
export function requestOrigin(req) {
  const headers = req.headers || {};
  const authority = headers[':authority'];
  return authority !== undefined
    ? originOfAuthority(authority, ':authority')
    : originOfAuthority(headers.host, 'Host header');
}
