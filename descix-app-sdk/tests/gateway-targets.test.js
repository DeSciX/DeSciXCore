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
  CLOUD_DEV_URL,
} from '../src/dev/resolveGatewayTargets.js';
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

test('CLOUD_DEV_URL is the stable cloud DEV origin', () => {
  assert.equal(CLOUD_DEV_URL, 'https://dev.descix.net');
});

test('mode 2 — consumer workspace with no platform defaults API to cloud DEV', () => {
  const { apiUrl, apiSource } = resolveApiTarget(CONSUMER);
  assert.equal(apiUrl, CLOUD_DEV_URL);
  assert.match(apiSource, /default \(cloud DEV\)/);
});

test('mode 2 — root serves the cloud shell from the same origin as the API', () => {
  const { siteUrl, siteSource } = resolveSiteTarget(CONSUMER);
  assert.equal(siteUrl, CLOUD_DEV_URL);
  assert.match(siteSource, /same origin as API/);
});

test('mode 2 — an empty workspace object still resolves (no platform block at all)', () => {
  const t = resolveGatewayTargets({});
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

test('mode 1 — a local platform checkout is the EXPLICIT localhost opt-in', () => {
  const t = resolveGatewayTargets(LOCAL_PLATFORM);
  assert.equal(t.apiUrl, 'https://localhost:4000');
  assert.match(t.apiSource, /local platform/);
  assert.equal(t.siteUrl, 'https://localhost:5174');
  assert.match(t.siteSource, /local shell/);
});

test('local API with NO local shell fails loud instead of proxying root to the API port', () => {
  const config = { env: { platform: { appId: 'daita', microservice: { port: 4000 } } } };
  assert.equal(resolveApiTarget(config).apiUrl, 'https://localhost:4000');
  assert.throws(() => resolveSiteTarget(config), (err) => {
    assert.match(err.message, /Cannot determine the site \(root "\/"\) target/);
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

test('mode-2 route table: root AND /apifront both point at cloud DEV', () => {
  withWorkspace(CONSUMER, (dir) => {
    const targets = resolveGatewayTargets(CONSUMER);
    const proxy = buildGatewayProxy(dir, targets);

    assert.equal(proxy['/'].target, CLOUD_DEV_URL);
    assert.equal(proxy['/'].ws, true);
    assert.equal(proxy['/'].changeOrigin, true);
    assert.equal(proxy['/'].secure, true);
    assert.equal(proxy['/apifront'].target, CLOUD_DEV_URL);
    assert.equal(proxy['/mcp'].target, CLOUD_DEV_URL);
    assert.equal(proxy['/oauth'].target, CLOUD_DEV_URL);
    assert.equal(proxy['/.well-known/oauth-protected-resource/mcp'].target, CLOUD_DEV_URL);
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
    assert.equal(proxy['/'].target, CLOUD_DEV_URL);
    assert.equal(
      proxy._staticRoutes['egpt-godsworld'],
      path.resolve(dir, 'godsworld/codesite')
    );
  });
});
