/**
 * The binding route on the transport the gateway actually serves.
 *
 * WHY: Vite serves `https` with `http2.createSecureServer({ allowHTTP1: true })`, so a browser
 * reaches the gateway over HTTP/2, where a request carries its authority in `:authority` and
 * usually no `host` header at all. A binding derived only from `Host` answered 400 to every
 * HTTP/2 request — and the shell treats a non-OK binding as "no binding" and boots the store, so
 * https://localhost:<port>/ would silently have shown the store instead of the app.
 *
 * Mounts the exact middleware the gateway installs (appBindingPlugin) on an HTTP/2 secure server
 * with HTTP/1.1 allowed, as Vite does, with a throwaway self-signed certificate minted in a temp
 * dir, and asks it over real HTTP/2 (node:http2) and real HTTP/1.1 (node:https).
 * Run: `node --test tests/binding-gateway-transport.test.js` from descix-app-sdk/.
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http2 from 'node:http2';
import https from 'node:https';
import { execFileSync } from 'node:child_process';

import { appBindingPlugin, APP_BINDING_PATH } from '../src/dev/serveBinding.js';

const APP = 'egpt-frqtl';
const SESSION = Object.freeze({ appId: APP, source: 'cwd', defaultView: null });

let tmp;
let server;
let port;
const logger = { errors: [], error(msg) { this.errors.push(msg); } };

before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'binding-transport-'));
  const key = path.join(tmp, 'key.pem');
  const cert = path.join(tmp, 'cert.pem');
  execFileSync('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
    '-keyout', key, '-out', cert, '-subj', '/CN=localhost',
    '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1',
  ], { stdio: 'ignore' });

  const middlewares = [];
  appBindingPlugin(SESSION).configureServer({ middlewares: { use: (fn) => middlewares.push(fn) }, config: { logger } });
  assert.equal(middlewares.length, 1, 'the plugin installs exactly one middleware');
  server = http2.createSecureServer(
    { key: fs.readFileSync(key), cert: fs.readFileSync(cert), allowHTTP1: true },
    (req, res) => middlewares[0](req, res, (err) => {
      res.statusCode = err ? 500 : 599;
      res.end(err ? String(err.message) : 'fell through to next()');
    }),
  );
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  port = server.address().port;
});

after(() => {
  server?.close();
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
});

/**
 * A real HTTP/2 request; `authority` (optional) is sent as :authority, `host` (optional) as a host
 * header. Node's client sends no :authority of its own when a host header is given.
 */
function h2Get(authority, { host } = {}) {
  return new Promise((resolve, reject) => {
    const client = http2.connect(`https://127.0.0.1:${port}`, { rejectUnauthorized: false });
    client.on('error', reject);
    const headers = { ':method': 'GET', ':path': APP_BINDING_PATH };
    if (authority !== undefined) headers[':authority'] = authority;
    if (host !== undefined) headers.host = host;
    const req = client.request(headers);
    let status;
    let resHeaders;
    let body = '';
    req.on('response', (h) => { status = h[':status']; resHeaders = h; });
    req.setEncoding('utf8');
    req.on('data', (d) => (body += d));
    req.on('end', () => { client.close(); resolve({ status, headers: resHeaders, body }); });
    req.on('error', (e) => { client.close(); reject(e); });
    req.end();
  });
}

/** A real HTTP/1.1 request over the same TLS server. */
function h1Get(host) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      host: '127.0.0.1', port, path: APP_BINDING_PATH, headers: { Host: host },
      rejectUnauthorized: false, servername: 'localhost', agent: false, ALPNProtocols: ['http/1.1'],
    }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (d) => (body += d));
      res.on('end', () => resolve({ status: res.statusCode, version: res.httpVersion, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

// ------------------------------------------------------------------------- HTTP/2

test('h2: :authority localhost:<port> gets the binding on localhost', async () => {
  const r = await h2Get(`localhost:${port}`);
  assert.equal(r.status, 200, r.body);
  assert.deepEqual(JSON.parse(r.body), { mode: 'standalone', appId: APP, appUrl: `https://localhost:${port}/p/${APP}`, source: 'cwd' });
  assert.equal(r.headers['cache-control'], 'no-store');
  assert.equal(r.headers['x-content-type-options'], 'nosniff');
});

test('h2: a tunnel hostname as :authority gets appUrl on that hostname', async () => {
  const r = await h2Get('dev-local.example.test');
  assert.equal(r.status, 200, r.body);
  assert.equal(JSON.parse(r.body).appUrl, `https://dev-local.example.test/p/${APP}`);
});

test('h2: a malformed :authority is a 400 naming it', async () => {
  const r = await h2Get('dev-local.example.test:99999');
  assert.equal(r.status, 400, r.body);
  assert.match(r.body, /:authority/);
  assert.match(r.body, /port is not 1-65535/);
  assert.match(r.headers['content-type'], /text\/plain/);
  assert.equal(r.headers['x-content-type-options'], 'nosniff');
  assert.ok(logger.errors.some((m) => m.includes(r.body.trim())), 'the serve terminal must show the 400');
});

test('h2: only a host header (a translating intermediary, RFC 9113 8.3.1) is accepted', async () => {
  const r = await h2Get(undefined, { host: 'dev-local.example.test' });
  assert.equal(r.status, 200, r.body);
  assert.equal(JSON.parse(r.body).appUrl, `https://dev-local.example.test/p/${APP}`);
});

test('h2: :authority and a differing host header — :authority is used, nothing is refused', async () => {
  const r = await h2Get(`localhost:${port}`, { host: 'dev-local.example.test' });
  assert.equal(r.status, 200, r.body);
  assert.equal(JSON.parse(r.body).appUrl, `https://localhost:${port}/p/${APP}`);
});

// ----------------------------------------------------------------------- HTTP/1.1

test('h1 over the same TLS server: Host localhost:<port> gets the binding on localhost', async () => {
  const r = await h1Get(`localhost:${port}`);
  assert.equal(r.version, '1.1');
  assert.equal(r.status, 200, r.body);
  assert.equal(JSON.parse(r.body).appUrl, `https://localhost:${port}/p/${APP}`);
  assert.equal(r.headers['x-content-type-options'], 'nosniff');
});

test('h1 over the same TLS server: a tunnel hostname, and a malformed Host is a 400', async () => {
  const ok = await h1Get('dev-local.example.test');
  assert.equal(ok.status, 200, ok.body);
  assert.equal(JSON.parse(ok.body).appUrl, `https://dev-local.example.test/p/${APP}`);
  const bad = await h1Get('user@dev-local.example.test');
  assert.equal(bad.status, 400, bad.body);
  assert.match(bad.body, /Host/);
  assert.match(bad.body, /credentials/);
  assert.equal(bad.headers['x-content-type-options'], 'nosniff');
});
