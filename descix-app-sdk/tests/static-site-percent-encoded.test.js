/**
 * static site — percent-encoded request paths under /p/{appId}/ (descix serve percent-encoded paths, 2026-10-23).
 *
 * WHY (measured 2026-10-23, cli 4.3.0): `descix serve` answered
 * "Not found: /p/egpt/03_ULAM/Science%20Computers%20And%20People.md" while PROD served the
 * same object 200 — staticSitePlugin joined the RAW pathname onto the site dist. The plugin
 * decodes the pathname exactly once, refuses `..` / NUL after decoding, and fails loud (400)
 * on a malformed escape.
 *
 * Drives the exact middleware the gateway installs (gateway.js → staticSitePlugin) over HTTP.
 * Run: `node --test tests/static-site-percent-encoded.test.js` from descix-app-sdk/.
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';

import { staticSitePlugin } from '../src/dev/staticSitePlugin.js';

let tmp;
let server;
let port;

before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'static-site-pct-'));
  const site = path.join(tmp, 'site');
  fs.mkdirSync(path.join(site, '03_ULAM'), { recursive: true });
  fs.writeFileSync(path.join(site, 'index.html'), '<!doctype html><title>root</title>');
  fs.writeFileSync(path.join(site, '03_ULAM', 'Science Computers And People.md'), '# spaced\n');
  fs.writeFileSync(path.join(tmp, 'secret.txt'), 'outside the site dist');

  const middlewares = [];
  staticSitePlugin({ egpt: site }).configureServer({ middlewares: { use: (fn) => middlewares.push(fn) } });
  assert.equal(middlewares.length, 1, 'the plugin installs exactly one middleware');
  server = http.createServer((req, res) =>
    middlewares[0](req, res, () => {
      res.statusCode = 599;
      res.end('fell through to next()');
    }),
  );
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  port = server.address().port;
});

after(() => {
  server?.close();
  fs.rmSync(tmp, { recursive: true, force: true });
});

// Raw socket GET: fetch/URL would normalize `%2e%2e` and dot segments before sending,
// so the server would never see the bytes a hostile or sloppy client can send.
function rawGet(requestPath) {
  return new Promise((resolve, reject) => {
    const sock = net.connect(port, '127.0.0.1', () => {
      sock.write(`GET ${requestPath} HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n`);
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
      resolve({ status, body });
    });
    sock.on('error', reject);
  });
}

test('a file with a space in its name is served 200 for the %20-encoded URL', async () => {
  const r = await rawGet('/p/egpt/03_ULAM/Science%20Computers%20And%20People.md');
  assert.equal(r.status, 200, `expected 200, got ${r.status}: ${r.body}`);
  assert.equal(r.body, '# spaced\n');
});

test('a genuinely missing encoded path keeps the 404', async () => {
  const r = await rawGet('/p/egpt/03_ULAM/No%20Such%20Doc.md');
  assert.equal(r.status, 404);
  assert.match(r.body, /Not found: \/p\/egpt\/03_ULAM\/No%20Such%20Doc\.md/);
});

test('a %2e%2e traversal is refused before the filesystem is touched', async () => {
  for (const p of ['/p/egpt/%2e%2e/secret.txt', '/p/egpt/%2E%2E%2Fsecret.txt', '/p/egpt/03_ULAM/%2e%2e/%2e%2e/secret.txt']) {
    const r = await rawGet(p);
    assert.equal(r.status, 403, `${p} → expected 403, got ${r.status}: ${r.body}`);
    assert.doesNotMatch(r.body, /outside the site dist/);
    assert.match(r.body, /\.\./, `${p}: the refusal must name the reason`);
  }
});

test('a NUL byte after decoding is refused with 400', async () => {
  const r = await rawGet('/p/egpt/index.html%00.md');
  assert.equal(r.status, 400, `expected 400, got ${r.status}: ${r.body}`);
  assert.match(r.body, /NUL/);
});

test('a malformed escape is a 400 naming the path, never a retry of the raw path', async () => {
  const r = await rawGet('/p/egpt/%E0%A4%A');
  assert.equal(r.status, 400, `expected 400, got ${r.status}: ${r.body}`);
  assert.match(r.body, /\/p\/egpt\/%E0%A4%A/);
});

test('a plain unencoded path still serves (no regression)', async () => {
  const r = await rawGet('/p/egpt/index.html');
  assert.equal(r.status, 200);
  assert.match(r.body, /<title>root<\/title>/);
});
