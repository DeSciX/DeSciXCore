/**
 * serve site modes — the gateway's /p/{appId} behavior for site.{port,static,protocol}.
 *
 * WHY (measured 2026-10-02, EGPT-Evidence, CLI 1.0.18):
 *  1. A product carrying BOTH site.port and site.static had the dev-server port win
 *     SILENTLY — /p/{app} proxied to a dead https://localhost:{port} and answered an empty
 *     500 body. The write path (`descix app set-site`) is now one-active-mode-per-write; the
 *     gateway's part of the contract is (a) the preference is port-first and (b) a both-set
 *     product is SAID OUT LOUD (_modeNotes → serve banner), never implicit.
 *  2. A plain-http dev server behind the default https target failed with an EMPTY body and
 *     no hint. The /p/ dev-server proxy entries now carry devServerProxyGuard: an
 *     unreachable/protocol-mismatched upstream answers a plain-text 502 naming the exact
 *     target, the app id, and the remedy. site.protocol ("http"|"https") declares the
 *     upstream scheme — no auto-detection, no try-both fallback.
 *
 * Run: `node --test tests/serve-site-modes.test.js` from descix-app-sdk/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createViteProxyConfig } from '../src/dev/createViteProxyConfig.js';
import { devServerProxyGuard, devServerUnreachableBody } from '../src/dev/devServerProxyGuard.js';
import { resolveAppGatewayUrl } from '../src/dev/workspaceProducts.js';

function withWorkspace(config, fn) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'serve-modes-')));
  try {
    fs.mkdirSync(path.join(dir, '.descix'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.descix', 'workspace.json'), JSON.stringify(config, null, 2));
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const BOTH_SET = {
  version: '2.1',
  env: {
    apiUrl: 'https://descix.net',
    gateway: { port: 5599 },
    products: [
      { appId: 'egpt', localPath: 'apps/egpt', site: { port: 5612, static: 'site' } },
      { appId: 'plain', localPath: 'apps/plain', site: { port: 6001, protocol: 'http' } },
      { appId: 'built', localPath: 'apps/built', site: { static: 'dist' } },
    ],
  },
};

// ---------------------------------------------------------------- mode preference

test('both-set product: the gateway serves the DEV SERVER (site.port wins), not the static dir', () => {
  withWorkspace(BOTH_SET, (dir) => {
    const proxy = createViteProxyConfig(dir);
    assert.equal(proxy['/p/egpt']?.target, 'https://localhost:5612', 'dev-server route must exist for the both-set product');
    assert.equal(proxy._staticRoutes['egpt'], undefined, 'the both-set product must NOT also be a static route');
    assert.ok(proxy._staticRoutes['built'], 'a static-only product still gets its static route');
  });
});

test('both-set product is SAID OUT LOUD: _modeNotes names the winner, the loser, and the switch command', () => {
  withWorkspace(BOTH_SET, (dir) => {
    const proxy = createViteProxyConfig(dir);
    const note = (proxy._modeNotes || []).find((n) => n.includes('/p/egpt'));
    assert.ok(note, 'a both-set product must produce a mode note');
    assert.match(note, /DEV SERVER/, 'the note names which mode is served');
    assert.match(note, /5612/, 'the note names the winning port');
    assert.match(note, /site\.static "site" is ignored/, 'the note names what is ignored');
    assert.match(note, /set-site -a egpt --static site/, 'the note names the command that switches modes');
  });
});

test('single-mode products produce NO mode note', () => {
  withWorkspace(BOTH_SET, (dir) => {
    const notes = createViteProxyConfig(dir)._modeNotes || [];
    assert.equal(notes.length, 1, 'only the both-set product may produce a note');
  });
});

test('resolveAppGatewayUrl reports the SAME mode the gateway serves for a both-set product', () => {
  withWorkspace(BOTH_SET, (dir) => {
    const resolved = resolveAppGatewayUrl(dir, 'egpt');
    assert.equal(resolved.kind, 'dev-server', 'app open must report the mode the gateway actually routes');
    assert.match(resolved.via, /https:\/\/localhost:5612/);
  });
});

// ---------------------------------------------------------------- site.protocol

test('site.protocol http composes an http:// upstream target for the /p route', () => {
  withWorkspace(BOTH_SET, (dir) => {
    const proxy = createViteProxyConfig(dir);
    assert.equal(proxy['/p/plain']?.target, 'http://localhost:6001');
  });
});

test('default (no site.protocol) still targets https — behavior preserved exactly', () => {
  withWorkspace(BOTH_SET, (dir) => {
    const proxy = createViteProxyConfig(dir);
    assert.equal(proxy['/p/egpt']?.target, 'https://localhost:5612');
  });
});

test('resolveAppGatewayUrl `via` carries the declared protocol (one origin owner)', () => {
  withWorkspace(BOTH_SET, (dir) => {
    assert.match(resolveAppGatewayUrl(dir, 'plain').via, /http:\/\/localhost:6001/);
  });
});

// ---------------------------------------------------------------- loud 502 guard

test('every /p dev-server route carries the loud-502 configure hook', () => {
  withWorkspace(BOTH_SET, (dir) => {
    const proxy = createViteProxyConfig(dir);
    for (const appId of ['egpt', 'plain']) {
      assert.equal(typeof proxy[`/p/${appId}`].configure, 'function', `/p/${appId} must carry devServerProxyGuard`);
    }
  });
});

test('the 502 body names the exact target, the app id, the error, and both remedies', () => {
  const err = Object.assign(new Error('socket hang up'), { code: 'EPROTO' });
  const body = devServerUnreachableBody('egpt', 'https://localhost:5612', err);
  assert.match(body, /502 Bad Gateway/);
  assert.match(body, /\/p\/egpt/);
  assert.match(body, /https:\/\/localhost:5612/, 'the exact target URL is named');
  assert.match(body, /EPROTO/, 'the proxy error is named');
  assert.match(body, /set-site -a egpt --static <dir>/, 'the static-mode remedy is named');
  assert.match(body, /--protocol http/, 'an https target names the http-protocol remedy');
});

test('an http target names the https-protocol remedy instead', () => {
  const body = devServerUnreachableBody('plain', 'http://localhost:6001', new Error('ECONNREFUSED'));
  assert.match(body, /--protocol https/);
});

test('the guard answers 502 with the body — never an empty response', () => {
  const logged = [];
  const guard = devServerProxyGuard('egpt', 'https://localhost:5612', { log: (l) => logged.push(l) });

  const listeners = {};
  const fakeProxy = { on: (ev, fn) => { listeners[ev] = fn; } };
  guard(fakeProxy);
  assert.equal(typeof listeners.error, 'function', 'guard must attach an error listener');

  let head = null;
  let ended = null;
  const res = {
    headersSent: false,
    writableEnded: false,
    writeHead(status, headers) { head = { status, headers }; this.headersSent = true; },
    end(body) { ended = body; this.writableEnded = true; },
  };
  listeners.error(Object.assign(new Error('dead'), { code: 'ECONNREFUSED' }), {}, res);

  assert.equal(head?.status, 502, 'must answer 502');
  assert.match(head?.headers?.['Content-Type'] || '', /text\/plain/);
  assert.ok(ended && ended.includes('https://localhost:5612'), 'the body must name the target');
  assert.equal(logged.length, 1, 'exactly one console line per failure');
  assert.match(logged[0], /\/p\/egpt/, 'the console line names the route');
});

test('the guard never double-writes: headers already sent → body only; ended → nothing', () => {
  const guard = devServerProxyGuard('egpt', 'https://localhost:5612', { log: () => {} });
  const listeners = {};
  guard({ on: (ev, fn) => { listeners[ev] = fn; } });

  let wroteHead = false;
  let ended = false;
  listeners.error(new Error('x'), {}, {
    headersSent: true,
    writableEnded: false,
    writeHead() { wroteHead = true; },
    end() { ended = true; },
  });
  assert.equal(wroteHead, false, 'must not writeHead after headers are sent');
  assert.equal(ended, true, 'must still end the response');

  // A ws upgrade hands the handler a raw socket (no writeHead): just end it, do not throw.
  let socketEnded = false;
  assert.doesNotThrow(() => listeners.error(new Error('x'), {}, { end() { socketEnded = true; } }));
  assert.equal(socketEnded, true);
});
