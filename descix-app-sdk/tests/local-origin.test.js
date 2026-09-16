/**
 * localOrigin — the ONE owner of a local upstream's origin — and the sites that consume it.
 *
 * WHY (measured 2026-09-16): `/s/<appId>/…` through the gateway returned 500 while the same
 * endpoint direct returned 200. createViteProxyConfig hardcoded `http://localhost:${port}` for
 * service routes ("Services are usually HTTP") while resolveGatewayTargets built the SAME
 * microservice as `protocol || 'https'`; powchUrl and the site-route branch carried their own
 * copies of that default. Five derivations of one fact, two of them disagreeing. These tests
 * pin the owner and prove every consumer goes through it.
 *
 * Run: `node --test tests/local-origin.test.js` from descix-app-sdk/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { localUpstreamOrigin, LOCAL_DEFAULT_PROTOCOL } from '../src/dev/localOrigin.js';
import { createViteProxyConfig } from '../src/dev/createViteProxyConfig.js';
import { resolveApiTarget, resolveSiteTarget } from '../src/dev/resolveGatewayTargets.js';
import { resolvePowchUrl } from '../src/dev/powchUrl.js';

// ------------------------------------------------------------------ the owner

test('the invariant: a local entry with no declared protocol is HTTPS', () => {
  assert.equal(LOCAL_DEFAULT_PROTOCOL, 'https');
  assert.equal(localUpstreamOrigin({ port: 4000 }, 'x'), 'https://localhost:4000');
  assert.equal(localUpstreamOrigin({ port: '5175' }, 'x'), 'https://localhost:5175');
});

test('a declared protocol is the only thing that changes the scheme', () => {
  assert.equal(localUpstreamOrigin({ port: 8081, protocol: 'http' }, 'x'), 'http://localhost:8081');
});

test('a missing port fails loud, naming the entry — there is no port to default to', () => {
  for (const entry of [undefined, null, {}, { port: '' }, { protocol: 'http' }]) {
    assert.throws(() => localUpstreamOrigin(entry, 'env.products[demo].microservice'),
      /env\.products\[demo\]\.microservice names no port/);
  }
});

// ------------------------------------------------------------------ the consumers

function withWorkspace(fn) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'local-origin-')));
  try {
    fs.mkdirSync(path.join(dir, '.descix'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.descix', 'workspace.json'), JSON.stringify({
      version: '2.1', type: 'workspace',
      env: {
        apiUrl: 'https://localhost:4000',
        gateway: { port: 5601 },
        platform: { appId: 'daita', site: { port: 5174 }, microservice: { port: 4000 } },
        products: [
          { appId: 'svc',   microservice: { port: 4000 } },
          { appId: 'plain', microservice: { port: 8081, protocol: 'http' } },
          { appId: 'site1', site: { port: 5180 } },
          { appId: 'powch', site: { port: 5175 }, microservice: { port: 3003 } },
        ],
      },
    }, null, 2));
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('service routes /s/<appId> proxy to HTTPS unless the entry declares http (the measured defect)', () => {
  withWorkspace((dir) => {
    const proxy = createViteProxyConfig(dir);
    assert.equal(proxy['/s/daita'].target, 'https://localhost:4000', 'platform microservice');
    assert.equal(proxy['/s/svc'].target,   'https://localhost:4000', 'product microservice, no protocol');
    assert.equal(proxy['/s/plain'].target, 'http://localhost:8081',  'product microservice, declared http');
  });
});

test('site routes /p/<appId> go through the same owner', () => {
  withWorkspace((dir) => {
    const proxy = createViteProxyConfig(dir);
    assert.equal(proxy['/p/site1'].target, 'https://localhost:5180');
    assert.equal(proxy['/p/powch'].target, 'https://localhost:5175');
  });
});

test('negative control: an app that is not in the workspace has no /s/ route at all', () => {
  withWorkspace((dir) => {
    const proxy = createViteProxyConfig(dir);
    assert.equal(proxy['/s/no-such-app'], undefined);
  });
});

test('resolveApiTarget and resolveSiteTarget build local platform origins through the owner', () => {
  const config = { env: { platform: { site: { port: 5174 }, microservice: { port: 4000 } } } };
  assert.equal(resolveApiTarget(config).apiUrl, 'https://localhost:4000');
  assert.equal(resolveSiteTarget(config).siteUrl, 'https://localhost:5174');
  const http = { env: { platform: { site: { port: 5174, protocol: 'http' }, microservice: { port: 4000, protocol: 'http' } } } };
  assert.equal(resolveApiTarget(http).apiUrl, 'http://localhost:4000');
  assert.equal(resolveSiteTarget(http).siteUrl, 'http://localhost:5174');
});

test("resolvePowchUrl builds the product's own origin through the owner (trailing slash kept)", () => {
  assert.equal(resolvePowchUrl({ env: { products: [{ appId: 'powch', site: { port: 5175 } }] } }), 'https://localhost:5175/');
  assert.equal(resolvePowchUrl({ env: { products: [{ appId: 'powch', site: { port: 5175, protocol: 'http' } }] } }), 'http://localhost:5175/');
});
