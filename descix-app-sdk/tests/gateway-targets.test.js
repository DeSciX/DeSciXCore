/**
 * Conformance: gateway target resolution + route table.
 *
 * The matrix that matters:
 *   mode 2 (consumer workspace, no platform)  → cloud DEV for API and shell
 *   mode 1 (local platform checkout)          → localhost for API and shell
 *   local API, no local shell                 → FAIL LOUD (never a silent localhost root)
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  resolveApiTarget,
  resolveSiteTarget,
  resolveGatewayTargets,
  proxyEntry,
  isLocalOrigin,
} from '../src/dev/resolveGatewayTargets.js';
import { ENV_ORIGINS, DEFAULT_ENV, DEFAULT_API_URL, PROD_URL, CLOUD_DEV_URL } from '../src/dev/envOrigins.js';
import { buildGatewayProxy } from '../src/dev/gateway.js';

const CONSUMER = { version: '2.1', type: 'workspace', env: { products: [] } };
const LOCAL_PLATFORM = {
  version: '2.1',
  type: 'workspace',
  env: {
    platform: {
      appId: 'daita',
      localPath: 'DeSciX_Cloud',
      site: { port: 5174 },
      microservice: { port: 4000 },
    },
    products: [],
  },
};

test('the shipped SDK default is PROD; dev/demo are named, localhost is not an env', () => {
  assert.equal(DEFAULT_ENV, 'prod');
  assert.equal(DEFAULT_API_URL, 'https://descix.net');
  assert.equal(PROD_URL, 'https://descix.net');
  assert.equal(CLOUD_DEV_URL, 'https://dev.descix.net');
  assert.deepEqual(Object.keys(ENV_ORIGINS).sort(), ['demo', 'dev', 'prod']);
  for (const url of Object.values(ENV_ORIGINS)) assert.equal(isLocalOrigin(url), false, url);
});

test('mode 2 — consumer workspace with no platform defaults API to PROD', () => {
  const { apiUrl, apiSource } = resolveApiTarget(CONSUMER);
  assert.equal(apiUrl, PROD_URL);
  assert.match(apiSource, /default \(PROD\)/);
});

test('mode 2 — root serves the platform shell from the same origin as the API', () => {
  const { siteUrl, siteSource } = resolveSiteTarget(CONSUMER);
  assert.equal(siteUrl, PROD_URL);
  assert.match(siteSource, /same origin as API/);
});

test('mode 2 — an empty workspace object still resolves (no platform block at all)', () => {
  const t = resolveGatewayTargets({});
  assert.equal(t.apiUrl, PROD_URL);
  assert.equal(t.siteUrl, PROD_URL);
});

test('set-env dev shape (env.apiUrl = cloud DEV) points BOTH targets at dev', () => {
  const t = resolveGatewayTargets({ env: { environment: 'DEV', apiUrl: CLOUD_DEV_URL, products: [] } });
  assert.equal(t.apiUrl, CLOUD_DEV_URL);
  assert.equal(t.siteUrl, CLOUD_DEV_URL);
});

test('explicit env.apiUrl wins over the cloud default', () => {
  const t = resolveGatewayTargets({ env: { apiUrl: 'https://demo.descix.net' } });
  assert.equal(t.apiUrl, 'https://demo.descix.net');
  assert.equal(t.apiSource, 'workspace env.apiUrl');
  assert.equal(t.siteUrl, 'https://demo.descix.net');
});

test('explicit env.siteUrl wins for the root route', () => {
  const t = resolveGatewayTargets({
    env: { apiUrl: 'https://dev.descix.net', siteUrl: 'https://demo.descix.net' },
  });
  assert.equal(t.apiUrl, 'https://dev.descix.net');
  assert.equal(t.siteUrl, 'https://demo.descix.net');
  assert.equal(t.siteSource, 'workspace env.siteUrl');
});

test('mode 1 — an ALL-LOCAL platform checkout still serves the local shell', () => {
  const t = resolveGatewayTargets(LOCAL_PLATFORM);
  assert.equal(t.apiUrl, 'https://localhost:4000');
  assert.match(t.apiSource, /local platform/);
  assert.equal(t.siteUrl, 'https://localhost:5174');
  assert.match(t.siteSource, /local shell/);
});

test('a platform checkout does NOT hijack the root once the API is remote', () => {
  // CEO ruling: the general SDK user wins the default. Owning a platform checkout
  // is not by itself a request to serve it.
  const config = { env: { apiUrl: CLOUD_DEV_URL, ...LOCAL_PLATFORM.env } };
  const t = resolveGatewayTargets(config);
  assert.equal(t.apiUrl, CLOUD_DEV_URL);
  assert.equal(t.siteUrl, CLOUD_DEV_URL, 'remote API must outrank env.platform.site.port');
  assert.match(t.siteSource, /same origin as API/);
});

test('a platform dev opts IN to the local shell by naming it', () => {
  const config = { env: { apiUrl: CLOUD_DEV_URL, ...LOCAL_PLATFORM.env } };
  const viaFlag = resolveSiteTarget(config, { siteUrl: 'https://localhost:5174' });
  assert.equal(viaFlag.siteUrl, 'https://localhost:5174');
  const viaWorkspace = resolveSiteTarget({ env: { ...config.env, siteUrl: 'https://localhost:5174' } });
  assert.equal(viaWorkspace.siteUrl, 'https://localhost:5174');
  assert.equal(viaWorkspace.siteSource, 'workspace env.siteUrl');
});

test('local API with NO local shell fails loud instead of proxying root to the API port', () => {
  const config = { env: { platform: { appId: 'daita', microservice: { port: 4000 } } } };
  assert.equal(resolveApiTarget(config).apiUrl, 'https://localhost:4000');
  assert.throws(() => resolveSiteTarget(config), (err) => {
    assert.match(err.message, /Cannot determine the site \(root "\/"\) target/);
    assert.match(err.message, /--site-url https:\/\/descix\.net/);
    assert.match(err.message, /env\.siteUrl/);
    assert.match(err.message, /env\.platform\.site\.port/);
    return true;
  });
});

test('an explicit localhost env.apiUrl does not silently become the shell either', () => {
  assert.throws(
    () => resolveSiteTarget({ env: { apiUrl: 'https://localhost:4000' } }),
    /Cannot determine the site/
  );
});

test('a caller-supplied apiGatewayUrl outranks workspace config', () => {
  const t = resolveApiTarget(LOCAL_PLATFORM, { apiGatewayUrl: 'https://dev.descix.net' });
  assert.equal(t.apiUrl, 'https://dev.descix.net');
  assert.equal(t.apiSource, 'caller option apiGatewayUrl');
});

test('the removed top-level apiUrl key fails loud, naming its replacement', () => {
  assert.throws(
    () => resolveApiTarget({ apiUrl: 'https://dev.descix.net' }),
    /Move it to env\.apiUrl/
  );
});

test('a malformed URL fails at resolution, not deep in the proxy', () => {
  assert.throws(() => resolveApiTarget({ env: { apiUrl: 'dev.descix.net' } }), /Not a valid URL/);
});

test('isLocalOrigin distinguishes this machine from a cloud origin', () => {
  for (const local of ['https://localhost:5173', 'http://127.0.0.1:8080', 'https://[::1]:443']) {
    assert.equal(isLocalOrigin(local), true, local);
  }
  for (const remote of ['https://dev.descix.net', 'https://storage.googleapis.com']) {
    assert.equal(isLocalOrigin(remote), false, remote);
  }
});

test('proxyEntry derives TLS verification from the target', () => {
  assert.equal(proxyEntry('https://dev.descix.net').secure, true);
  assert.equal(proxyEntry('https://localhost:4000').secure, false);
  assert.equal(proxyEntry('https://dev.descix.net', { ws: true }).ws, true);
});

// ── Route table, built the way the gateway builds it ────────────────────────

function withWorkspace(config, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'descix-gw-'));
  fs.mkdirSync(path.join(dir, '.descix'));
  fs.writeFileSync(path.join(dir, '.descix', 'workspace.json'), JSON.stringify(config, null, 2));
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('mode-2 route table: root AND /apifront both point at the default platform', () => {
  withWorkspace(CONSUMER, (dir) => {
    const targets = resolveGatewayTargets(CONSUMER);
    const proxy = buildGatewayProxy(dir, targets);

    assert.equal(proxy['/'].target, DEFAULT_API_URL);
    assert.equal(proxy['/'].ws, true);
    assert.equal(proxy['/'].changeOrigin, true);
    assert.equal(proxy['/'].secure, true);
    assert.equal(proxy['/apifront'].target, DEFAULT_API_URL);
    assert.equal(proxy['/mcp'].target, DEFAULT_API_URL);
    assert.equal(proxy['/oauth'].target, DEFAULT_API_URL);
    assert.equal(proxy['/.well-known/oauth-protected-resource/mcp'].target, DEFAULT_API_URL);
  });
});

test('mode-2 route table after set-env dev: every API prefix and root ride cloud DEV', () => {
  const config = { version: '2.1', env: { environment: 'DEV', apiUrl: CLOUD_DEV_URL, products: [] } };
  withWorkspace(config, (dir) => {
    const proxy = buildGatewayProxy(dir, resolveGatewayTargets(config));
    for (const route of ['/', '/apifront', '/api', '/mcp', '/oauth',
                         '/.well-known/oauth-authorization-server/oauth',
                         '/.well-known/oauth-protected-resource/mcp']) {
      assert.equal(proxy[route].target, CLOUD_DEV_URL, route);
      assert.equal(proxy[route].secure, true, route + ' must verify TLS against a cloud origin');
    }
  });
});

test('the root route is LAST so specific prefixes keep priority', () => {
  withWorkspace(CONSUMER, (dir) => {
    const proxy = buildGatewayProxy(dir, resolveGatewayTargets(CONSUMER));
    const keys = Object.keys(proxy).filter((k) => k !== '_staticRoutes');
    assert.equal(keys[keys.length - 1], '/');
  });
});

test('mode-1 route table keeps the local shell at root and the local API on /apifront', () => {
  withWorkspace(LOCAL_PLATFORM, (dir) => {
    const proxy = buildGatewayProxy(dir, resolveGatewayTargets(LOCAL_PLATFORM));
    assert.equal(proxy['/'].target, 'https://localhost:5174');
    assert.equal(proxy['/'].secure, false);
    assert.equal(proxy['/apifront'].target, 'https://localhost:4000');
    assert.equal(proxy['/apifront'].secure, false);
  });
});

test('a static product keeps its /p/<app> static route alongside the cloud root', () => {
  const config = {
    version: '2.1',
    env: { products: [{ appId: 'egpt-godsworld', localPath: 'godsworld/codesite', site: { static: '.' } }] },
  };
  withWorkspace(config, (dir) => {
    const proxy = buildGatewayProxy(dir, resolveGatewayTargets(config));
    assert.equal(proxy['/'].target, DEFAULT_API_URL);
    assert.equal(
      proxy._staticRoutes['egpt-godsworld'],
      path.resolve(dir, 'godsworld/codesite')
    );
  });
});
