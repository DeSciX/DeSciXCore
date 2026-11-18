/**
 * The served app binding's appUrl is on the origin the shell was opened on.
 *
 * HTTP/1.1 and the owner's unit cases. The HTTP/2 transport the gateway really serves is
 * covered by binding-gateway-transport.test.js.
 *
 * WHY: `descix serve` listens on every interface, but the binding answered
 * `https://localhost:<port>/p/<appId>` whatever Host the request came in on. A shell opened
 * through a tunnel hostname, or on another device, framed `localhost`: the shell and the
 * Powch sidebar loaded and the app never did. The binding's appUrl now has ONE derivation,
 * serveBinding.bindingAppUrl, on the request's authority (`:authority` under HTTP/2, `Host`
 * under HTTP/1.x); localhost answers exactly what it always answered; a malformed authority is
 * a 400 naming the problem, never a guessed origin.
 *
 * Drives the exact middleware the gateway installs (gateway.js → appBindingPlugin) over HTTP
 * with raw sockets, so the Host header reaches it byte for byte.
 * Run: `node --test tests/binding-request-origin.test.js` from descix-app-sdk/.
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

import { appBindingPlugin, bindingAppUrl, servedBinding, APP_BINDING_PATH } from '../src/dev/serveBinding.js';
import { requestOrigin, originOfAuthority, MalformedAuthorityError } from '../src/dev/requestOrigin.js';
import { gatewayProductUrl } from '../src/dev/workspaceProducts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SDK_ROOT = path.resolve(__dirname, '..');

const PORT = 5599;
const APP = 'egpt-frqtl';
const SESSION = Object.freeze({ appId: APP, source: 'cwd', defaultView: null });

/** Request stand-ins with the fields the owner reads (node http / http2-compat shapes). */
const h1 = (host) => ({ httpVersionMajor: 1, headers: host === undefined ? {} : { host } });
const h2 = (authority, host) => ({ httpVersionMajor: 2, headers: { ':authority': authority, ...(host === undefined ? {} : { host }) } });
/** A logger spy standing in for Vite's server.config.logger. */
const loggerSpy = () => { const errors = []; return { errors, error: (msg) => errors.push(msg) }; };

const MALFORMED = [
  ['', /missing or empty/],
  ['dev local.example.test', /whitespace/],
  ['user:pw@dev-local.example.test', /credentials/],
  ['dev-local.example.test/p/x', /path, query or fragment/],
  ['dev-local.example.test?x=1', /path, query or fragment/],
  ['dev-local.example.test#x', /path, query or fragment/],
  ['dev-local.example.test:', /port is not 1-65535/],
  ['dev-local.example.test:0', /port is not 1-65535/],
  ['dev-local.example.test:65536', /port is not 1-65535/],
  ['dev-local.example.test:05599', /port is not 1-65535/],
  ['dev-local.example.test:abc', /port is not 1-65535/],
  ['dev-local.example.test..', /not a valid hostname/],
  ['.', /not a valid hostname/],
  ['-dev.example.test', /not a valid hostname/],
  ['dev-.example.test', /not a valid hostname/],
  ['::1', /more than one colon/],
  ['[::1', /unterminated IPv6/],
  ['[not-ipv6]:5599', /not an IPv6 address/],
  // what the WHATWG URL parser (the browser's) rejects, or reads as a different host
  ['[fe80::1%en0]:5173', /not a host the URL parser accepts/],
  ['999.999.999.999', /not a host the URL parser accepts/],
  ['1.2.3.4.5', /not a host the URL parser accepts/],
  ['127.1', /the URL parser reads it as "127\.0\.0\.1"/],
  ['[0:0::1]:5599', /the URL parser reads it as "\[::1\]:5599"/],
];

// ------------------------------------------------------------------ the owner, unit

test('requestOrigin: localhost:<port> is the origin it always was, on either transport', () => {
  assert.equal(requestOrigin(h1(`localhost:${PORT}`)), `https://localhost:${PORT}`);
  assert.equal(requestOrigin(h2(`localhost:${PORT}`)), `https://localhost:${PORT}`);
});

test('requestOrigin: a tunnel hostname, a host:port, underscores, IPv4 and bracketed IPv6 are their own origin', () => {
  for (const a of ['dev-local.example.test', 'dev-local.example.test:8443', 'dev_local.example.test',
    '_tunnel.example.test', '127.0.0.1:5599', '[::1]:5599']) {
    assert.equal(requestOrigin(h1(a)), `https://${a}`);
    assert.equal(requestOrigin(h2(a)), `https://${a}`);
  }
});

test('requestOrigin: one trailing dot is kept — the browser treats example.test. as its own origin', () => {
  assert.equal(requestOrigin(h2('dev-local.example.test.')), 'https://dev-local.example.test.');
  assert.equal(requestOrigin(h1('dev-local.example.test.:8443')), 'https://dev-local.example.test.:8443');
});

test('requestOrigin: the output is the URL origin — hostname lowercased, the default :443 dropped', () => {
  assert.equal(requestOrigin(h2('Dev-Local.Example.Test')), 'https://dev-local.example.test');
  assert.equal(requestOrigin(h2('dev-local.example.test:443')), 'https://dev-local.example.test');
  assert.equal(requestOrigin(h1('[::1]:443')), 'https://[::1]');
});

test('requestOrigin: every malformed authority fails loud naming the field and the problem — no fallback', () => {
  for (const [value, reason] of MALFORMED) {
    for (const [req, field] of [[h1(value), 'Host header'], [h2(value), ':authority']]) {
      assert.throws(() => requestOrigin(req), (e) => {
        assert.ok(e instanceof MalformedAuthorityError, `${JSON.stringify(value)}: wrong error type ${e.name}`);
        assert.equal(e.statusCode, 400);
        assert.match(e.message, reason, `${JSON.stringify(value)}: ${e.message}`);
        assert.ok(e.message.includes(`${field} ${JSON.stringify(value)}`), `names the field and value: ${e.message}`);
        return true;
      });
    }
  }
  assert.throws(() => originOfAuthority(undefined, 'Host header'), /Host header undefined .*missing or empty/);
  assert.throws(() => requestOrigin(h1(undefined)), /Host header undefined .*missing or empty/);
});

test('requestOrigin: the authority is :authority, else host — host alone is accepted, a differing host is ignored', () => {
  assert.equal(requestOrigin({ httpVersionMajor: 2, headers: { host: 'dev-local.example.test' } }), 'https://dev-local.example.test');
  assert.equal(requestOrigin(h2(`localhost:${PORT}`, 'dev-local.example.test')), `https://localhost:${PORT}`);
  // a malformed :authority is refused even when host is fine: :authority is the one read
  assert.throws(() => requestOrigin(h2('a@b', 'dev-local.example.test')), /:authority "a@b"/);
});

test('bindingAppUrl: localhost answers exactly the local gateway route; other hosts their own', () => {
  assert.equal(bindingAppUrl(h2(`localhost:${PORT}`), APP), gatewayProductUrl(PORT, APP));
  assert.equal(bindingAppUrl(h1(`localhost:${PORT}`), APP), `https://localhost:${PORT}/p/${APP}`);
  assert.equal(bindingAppUrl(h2('dev-local.example.test'), APP), `https://dev-local.example.test/p/${APP}`);
  assert.equal(bindingAppUrl(h1('dev-local.example.test:8443'), APP), `https://dev-local.example.test:8443/p/${APP}`);
});

test('servedBinding keeps the contract shape and stays absolute', () => {
  const b = servedBinding(SESSION, h2('dev-local.example.test'));
  assert.deepEqual(b, { mode: 'standalone', appId: APP, appUrl: `https://dev-local.example.test/p/${APP}`, source: 'cwd' });
  assert.match(b.appUrl, /^https:\/\//, 'deployed shells pass appUrl straight to the frame: it must stay absolute');
});

// ------------------------------------------------------------ the gateway middleware

let server;
let port;
let logger;

before(async () => {
  const middlewares = [];
  logger = loggerSpy();
  appBindingPlugin(SESSION).configureServer({ middlewares: { use: (fn) => middlewares.push(fn) }, config: { logger } });
  assert.equal(middlewares.length, 1, 'the plugin installs exactly one middleware');
  server = http.createServer((req, res) =>
    middlewares[0](req, res, (err) => {
      res.statusCode = err ? 500 : 599;
      res.end(err ? String(err.message) : 'fell through to next()');
    }),
  );
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  port = server.address().port;
});

after(() => {
  server?.close();
});

// Raw socket GET, so the Host header is sent exactly as written (fetch would set its own).
function rawGet(requestPath, host) {
  return new Promise((resolve, reject) => {
    const sock = net.connect(port, '127.0.0.1', () => {
      sock.write(`GET ${requestPath} HTTP/1.1\r\nHost: ${host}\r\nConnection: close\r\n\r\n`);
    });
    let buf = '';
    sock.on('data', (d) => (buf += d.toString('utf8')));
    sock.on('end', () => {
      const [head, ...rest] = buf.split('\r\n\r\n');
      const status = Number(head.split(' ')[1]);
      let body = rest.join('\r\n\r\n');
      if (/transfer-encoding: chunked/i.test(head)) {
        let out = '';
        let s = body;
        for (;;) {
          const nl = s.indexOf('\r\n');
          const n = parseInt(s.slice(0, nl), 16);
          if (!n) break;
          out += s.slice(nl + 2, nl + 2 + n);
          s = s.slice(nl + 2 + n + 2);
        }
        body = out;
      }
      resolve({ status, head, body });
    });
    sock.on('error', reject);
  });
}

test('gateway (HTTP/1.1): Host localhost:<port> gets the binding it always got', async () => {
  const r = await rawGet(APP_BINDING_PATH, `localhost:${PORT}`);
  assert.equal(r.status, 200);
  assert.deepEqual(JSON.parse(r.body), { mode: 'standalone', appId: APP, appUrl: `https://localhost:${PORT}/p/${APP}`, source: 'cwd' });
  assert.match(r.head, /cache-control: no-store/i);
  assert.match(r.head, /x-content-type-options: nosniff/i);
});

test('gateway (HTTP/1.1): Host of a tunnel hostname gets appUrl on that hostname, not localhost', async () => {
  const r = await rawGet(APP_BINDING_PATH, 'dev-local.example.test');
  assert.equal(r.status, 200);
  assert.equal(JSON.parse(r.body).appUrl, `https://dev-local.example.test/p/${APP}`);
});

test('gateway (HTTP/1.1): Host host:port keeps its port', async () => {
  const r = await rawGet(APP_BINDING_PATH, 'dev-local.example.test:8443');
  assert.equal(r.status, 200);
  assert.equal(JSON.parse(r.body).appUrl, `https://dev-local.example.test:8443/p/${APP}`);
});

test('gateway (HTTP/1.1): a malformed Host is a 400 naming the problem, never a binding', async () => {
  // Only values a raw HTTP/1.1 request can carry to the middleware; whitespace inside a header
  // value and an empty Host are covered by the unit test above.
  const overTheWire = MALFORMED.filter(([h]) => h && !/\s/.test(h));
  assert.ok(overTheWire.length >= 10, 'the fixture must exercise the malformed shapes');
  for (const [host, reason] of overTheWire) {
    const r = await rawGet(APP_BINDING_PATH, host);
    assert.equal(r.status, 400, `${JSON.stringify(host)} answered ${r.status}: ${r.body}`);
    assert.match(r.body, reason, `${JSON.stringify(host)}: ${r.body}`);
    assert.match(r.head, /content-type: text\/plain/i);
    assert.match(r.head, /x-content-type-options: nosniff/i);
    assert.doesNotMatch(r.body, /"appUrl"/);
    assert.ok(logger.errors.some((m) => m.includes(r.body.trim())), `the serve terminal must show the 400 for ${JSON.stringify(host)}`);
  }
});

test('gateway: a refusal is printed once per distinct message on the serve terminal', async () => {
  const before = logger.errors.length;
  await rawGet(APP_BINDING_PATH, 'once@dev-local.example.test');
  await rawGet(APP_BINDING_PATH, 'once@dev-local.example.test');
  const printed = logger.errors.slice(before);
  assert.equal(printed.length, 1, printed.join('\n'));
  assert.match(printed[0], /answered 400: .*Host header "once@dev-local\.example\.test".*credentials/);
});

test('gateway (HTTP/1.1): other paths still pass through, whatever the Host', async () => {
  assert.equal((await rawGet('/', 'dev-local.example.test')).status, 599);
  assert.equal((await rawGet(`/p/${APP}/`, 'user@bad')).status, 599, 'only the binding route reads Host');
});

// --------------------------------------------------------------------- ONE owner

test('exactly one site derives the binding appUrl, and nothing in the binding module spells localhost', () => {
  const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const src = strip(fs.readFileSync(path.join(SDK_ROOT, 'src', 'dev', 'serveBinding.js'), 'utf8'));
  assert.doesNotMatch(src, /localhost/, 'the binding module must not compose a localhost URL');
  assert.doesNotMatch(src, /gatewayProductUrl|gatewayOrigin/, 'the binding must not be built on the local gateway origin');
  assert.equal([...src.matchAll(/appUrl:/g)].length, 1, 'one place puts appUrl into a binding');
  assert.match(src, /appUrl: bindingAppUrl\(req, session\.appId\)/);
  const gw = strip(fs.readFileSync(path.join(SDK_ROOT, 'src', 'dev', 'gateway.js'), 'utf8'));
  assert.doesNotMatch(gw, /binding\.appUrl/, 'the gateway must not hold a pre-built binding appUrl');
});
