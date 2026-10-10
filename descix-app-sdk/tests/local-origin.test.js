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
import { localUpstreamOrigin, LOCAL_DEFAULT_PROTOCOL } from '../src/dev/localOrigin.js';
import { createViteProxyConfig } from '../src/dev/createViteProxyConfig.js';
import { resolveApiTarget, resolveSiteTarget } from '../src/dev/resolveGatewayTargets.js';
import { resolvePowchUrl } from '../src/dev/powchUrl.js';
import { withV3Tree } from './support/v3Tree.js';

// ------------------------------------------------------------------ the owner

test('the invariant: a local entry with no declared protocol is HTTPS', () => {
  assert.equal(LOCAL_DEFAULT_PROTOCOL, 'https');
  assert.equal(localUpstreamOrigin({ port: 4000 }, 'x'), 'https://localhost:4000');
  assert.equal(localUpstreamOrigin({ port: '5175' }, 'x'), 'https://localhost:5175');
});

test('a declared protocol is the only thing that changes the scheme', () => {
  assert.equal(localUpstreamOrigin({ port: 8081, protocol: 'http' }, 'x'), 'http://localhost:8081');
});

test('a protocol that is not http/https fails loud naming the entry — no silent dead target', () => {
  for (const protocol of ['ftp', 'HTTPS', 'ws', ' ']) {
    assert.throws(
      () => localUpstreamOrigin({ port: 5612, protocol }, 'env.app.site (egpt)'),
      /env\.app\.site \(egpt\) declares protocol .* only "http" or "https" are valid/s,
    );
  }
});

test('a missing port fails loud, naming the entry — there is no port to default to', () => {
  for (const entry of [undefined, null, {}, { port: '' }, { protocol: 'http' }]) {
    assert.throws(() => localUpstreamOrigin(entry, 'env.app.microservice (demo)'),
      /env\.app\.microservice \(demo\) names no port/);
  }
});

// ------------------------------------------------------------------ the consumers

// v3: the gateway workspace lists the platform shell and each app repo; every repo's OWN
// workspace.json carries its site/microservice. The same app roster the v2.1 inline
// registry held, now as a directory tree.
function withWorkspace(fn) {
  return withV3Tree({
    env: { apiUrl: 'https://localhost:4000' },
    gateway: { port: 5601, shell: 'cloud', appRepos: ['svc', 'plain', 'site1', 'powch'] },
    repos: {
      cloud: { appId: 'daita', site: { port: 5174 }, microservice: { port: 4000 } },
      svc: { appId: 'svc', microservice: { port: 4000 } },
      plain: { appId: 'plain', microservice: { port: 8081, protocol: 'http' } },
      site1: { appId: 'site1', site: { port: 5180 } },
      powch: { appId: 'powch', site: { port: 5175 }, microservice: { port: 3003 } },
    },
  }, ({ dir }) => fn(dir));
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
  const shell = (site, microservice) => ({ gateway: { shell: 'cloud' }, repos: { cloud: { appId: 'daita', site, microservice } } });
  withV3Tree(shell({ port: 5174 }, { port: 4000 }), ({ dir, config }) => {
    assert.equal(resolveApiTarget(config, { workspaceRoot: dir }).apiUrl, 'https://localhost:4000');
    assert.equal(resolveSiteTarget(config, { workspaceRoot: dir }).siteUrl, 'https://localhost:5174');
  });
  withV3Tree(shell({ port: 5174, protocol: 'http' }, { port: 4000, protocol: 'http' }), ({ dir, config }) => {
    assert.equal(resolveApiTarget(config, { workspaceRoot: dir }).apiUrl, 'http://localhost:4000');
    assert.equal(resolveSiteTarget(config, { workspaceRoot: dir }).siteUrl, 'http://localhost:5174');
  });
});

test("resolvePowchUrl builds the product's own origin through the owner (trailing slash kept)", () => {
  const powchRepo = (site) => ({ gateway: { appRepos: ['powch'] }, repos: { powch: { appId: 'powch', site } } });
  withV3Tree(powchRepo({ port: 5175 }), ({ dir, config }) => {
    assert.equal(resolvePowchUrl(config, { workspaceRoot: dir }), 'https://localhost:5175/');
  });
  withV3Tree(powchRepo({ port: 5175, protocol: 'http' }), ({ dir, config }) => {
    assert.equal(resolvePowchUrl(config, { workspaceRoot: dir }), 'http://localhost:5175/');
  });
});
