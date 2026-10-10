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
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolvePowchUrl, POWCH_APP_ID } from '../src/dev/powchUrl.js';
import { buildWorkspaceProducts, gatewayOrigin } from '../src/dev/workspaceProducts.js';
import { withV3Tree } from './support/v3Tree.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SDK_ROOT = path.resolve(__dirname, '..');
const GW = 5173;

// v3: the gateway workspace lists the shell and the app repos (Powch is one of them); each
// repo's OWN workspace.json carries its appId and site.
const TREE = {
  gateway: { port: GW, shell: 'cloud', appRepos: ['powch', 'egpt-frqtl'] },
  repos: {
    cloud: { appId: 'daita', site: { port: 5174 } },
    powch: { appId: 'powch', site: { port: 5175 } },
    'egpt-frqtl': { appId: 'egpt-frqtl', site: { port: 5511 } },
  },
};
const withWorkspace = (fn) => withV3Tree(TREE, fn);

// ------------------------------------------------------------ THE INVARIANT

test('Powch resolves to a DIFFERENT origin than the shell — the whole point', () => {
  withWorkspace(({ dir, config }) => {
    const powch = resolvePowchUrl(config, { workspaceRoot: dir });
    assert.equal(new URL(powch).origin, 'https://localhost:5175');
    assert.notEqual(new URL(powch).origin, gatewayOrigin(GW),
      'Powch on the gateway origin means every hosted app can read the wallet');
  });
});

test('Powch is NOT in the shell-origin product map', () => {
  withWorkspace(({ dir }) => {
    const map = buildWorkspaceProducts(dir);
    assert.equal(map[POWCH_APP_ID], undefined,
      'anything in this map is same-origin with the shell; Powch must never be');
    // the ordinary app is still there and still gateway-origin
    assert.equal(map['egpt-frqtl'], `${gatewayOrigin(GW)}/p/egpt-frqtl`);
  });
});

test('no entry in the product map could ever BE Powch by another name', () => {
  withWorkspace(({ dir }) => {
    const map = buildWorkspaceProducts(dir);
    for (const url of Object.values(map)) {
      assert.ok(!url.includes('5175'), `the product map leaks Powch's origin: ${url}`);
    }
  });
});

// --------------------------------------------------------------- precedence

test('explicit env.powchUrl wins', () => {
  // wins over the listed local Powch repo too
  withV3Tree({ ...TREE, env: { powchUrl: 'https://powch.dev.descix.net' } }, ({ dir, config }) => {
    assert.equal(resolvePowchUrl(config, { workspaceRoot: dir }), 'https://powch.dev.descix.net/');
  });
});

test('an explicit override (VITE_POWCH_APP_URL) beats everything', () => {
  withV3Tree({ ...TREE, env: { powchUrl: 'https://powch.dev.descix.net' } }, ({ dir, config }) => {
    assert.equal(
      resolvePowchUrl(config, { workspaceRoot: dir, override: 'https://powch.example.com/' }),
      'https://powch.example.com/',
    );
  });
});

test('the product\'s OWN origin is the fallback — never the gateway route', () => {
  withWorkspace(({ dir, config }) => {
    const url = resolvePowchUrl(config, { workspaceRoot: dir });
    assert.equal(url, 'https://localhost:5175/');
    assert.ok(!url.includes('/p/powch'), 'the gateway route would be same-origin with the shell');
  });
});

test('unknown is null — not a guess', () => {
  assert.equal(resolvePowchUrl({ env: {} }), null);
  // A workspace that lists no Powch repo has no local Powch candidate.
  withV3Tree({ gateway: { shell: 'cloud' }, repos: { cloud: TREE.repos.cloud } }, ({ dir, config }) => {
    assert.equal(resolvePowchUrl(config, { workspaceRoot: dir }), null);
  });
  // Without the workspace root the caller has named no local candidate at all.
  withWorkspace(({ config }) => assert.equal(resolvePowchUrl(config), null));
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
