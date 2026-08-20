/**
 * SECURITY INVARIANT: Powch is CROSS-ORIGIN from the shell, and stays that way.
 *
 * The platform's origin model is deliberately asymmetric:
 *   shell <-> app    SAME origin  — direct interframe scripting IS the feature
 *   shell <-> Powch  CROSS origin — postMessage bridge only
 * Powch holds passkeys, the HD wallet and the ZK-SSO silo. Same-origin would let
 * every app the shell hosts read its DOM and memory through exactly the reach
 * SplitView depends on.
 *
 * THE REGRESSION THIS EXISTS TO STOP (introduced and caught in this workstream,
 * 2026-08-19, never shipped): the G-1 fix routed every product through the
 * gateway origin so SplitView would work. Applied blindly it caught 'powch' too,
 * and the shell's Vite config derived __POWCH_APP_URL__ from that map — so the
 * wallet iframe would have loaded SAME-ORIGIN with the shell. The rule "apps are
 * always shell-origin when iframed" is about APPS; Powch is not one, and the
 * asymmetry is the security design rather than an inconsistency to tidy up.
 *
 * Run: `node --test tests/powch-origin-isolation.test.js` from descix-app-sdk/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolvePowchUrl, POWCH_APP_ID } from '../src/dev/powchUrl.js';
import { buildWorkspaceProducts, gatewayOrigin } from '../src/dev/workspaceProducts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SDK_ROOT = path.resolve(__dirname, '..');
const GW = 5173;

const CONFIG = {
  env: {
    gateway: { port: GW },
    platform: { appId: 'daita', site: { port: 5174 } },
    products: [
      { appId: 'powch', localPath: 'DeSciX/DeSciX_Powch', site: { port: 5175 } },
      { appId: 'egpt-frqtl', localPath: 'FRAQTL', site: { port: 5511 } },
    ],
  },
};

function withWorkspace(config, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'powch-iso-'));
  try {
    fs.mkdirSync(path.join(dir, '.descix'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.descix', 'workspace.json'), JSON.stringify(config, null, 2));
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// ------------------------------------------------------------ THE INVARIANT

test('Powch resolves to a DIFFERENT origin than the shell — the whole point', () => {
  const powch = resolvePowchUrl(CONFIG);
  assert.equal(new URL(powch).origin, 'https://localhost:5175');
  assert.notEqual(new URL(powch).origin, gatewayOrigin(GW),
    'Powch on the gateway origin means every hosted app can read the wallet');
});

test('Powch is NOT in the shell-origin product map', () => {
  withWorkspace(CONFIG, (dir) => {
    const map = buildWorkspaceProducts(dir);
    assert.equal(map[POWCH_APP_ID], undefined,
      'anything in this map is same-origin with the shell; Powch must never be');
    // the ordinary app is still there and still gateway-origin
    assert.equal(map['egpt-frqtl'], `${gatewayOrigin(GW)}/p/egpt-frqtl`);
  });
});

test('no entry in the product map could ever BE Powch by another name', () => {
  withWorkspace(CONFIG, (dir) => {
    const map = buildWorkspaceProducts(dir);
    for (const url of Object.values(map)) {
      assert.ok(!url.includes('5175'), `the product map leaks Powch's origin: ${url}`);
    }
  });
});

// --------------------------------------------------------------- precedence

test('explicit env.powchUrl wins', () => {
  const cfg = { env: { ...CONFIG.env, powchUrl: 'https://powch.dev.descix.net' } };
  assert.equal(resolvePowchUrl(cfg), 'https://powch.dev.descix.net/');
});

test('an explicit override (VITE_POWCH_APP_URL) beats everything', () => {
  const cfg = { env: { ...CONFIG.env, powchUrl: 'https://powch.dev.descix.net' } };
  assert.equal(resolvePowchUrl(cfg, { override: 'https://powch.example.com/' }), 'https://powch.example.com/');
});

test('the product\'s OWN origin is the fallback — never the gateway route', () => {
  const url = resolvePowchUrl(CONFIG);
  assert.equal(url, 'https://localhost:5175/');
  assert.ok(!url.includes('/p/powch'), 'the gateway route would be same-origin with the shell');
});

test('unknown is null — not a guess', () => {
  assert.equal(resolvePowchUrl({ env: { products: [] } }), null);
  assert.equal(resolvePowchUrl({}), null);
  assert.equal(resolvePowchUrl(null), null);
});

test('a trailing slash is normalised so callers never double it', () => {
  assert.equal(resolvePowchUrl({ env: { powchUrl: 'https://p.example.com' } }), 'https://p.example.com/');
  assert.equal(resolvePowchUrl({ env: { powchUrl: 'https://p.example.com/' } }), 'https://p.example.com/');
});

// ------------------------------------------------------------- ONE owner

test('the gateway does not re-derive Powch by hand', () => {
  const src = fs.readFileSync(path.join(SDK_ROOT, 'src', 'dev', 'gateway.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.match(src, /resolvePowchUrl\(/);
  assert.ok(!/appId\s*===\s*'powch'/.test(src), 'gateway re-implements powch discovery');
});

test('AppShell keeps NO fallback origin for the wallet', () => {
  const src = fs.readFileSync(path.join(SDK_ROOT, 'src', 'AppShell.jsx'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/powch\.descix\.net/.test(src),
    'a hardcoded prod Powch origin in a dev build is a silent cross-environment leak');
  assert.ok(!/__WORKSPACE_PRODUCTS__\?\.powch/.test(src),
    'AppShell must not read Powch out of the shell-origin map');
  // The fail-loud policy itself now lives in ONE place (src/powch/powchOrigin.js,
  // pinned by powch-origin-required.test.js); AppShell must call it, not carry a copy.
  assert.match(src, /requirePowchUrl\(config\.powch\?\.bridgeUrl, 'AppShell'\)/,
    'an unknown Powch origin must fail loud, via the one owner');
});
