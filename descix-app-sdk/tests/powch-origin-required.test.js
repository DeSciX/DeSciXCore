/**
 * SECURITY INVARIANT: the SDK never guesses where Powch is.
 *
 * THE BUG CLASS THIS EXISTS TO STOP: `config.bridgeUrl || 'https://powch.descix.net/'`.
 * Four modules carried that tail. Any of them, in a dev or DEMO build with the
 * origin unconfigured, mounted the PRODUCTION wallet — the iframe where a user
 * types a passkey and unlocks an HD wallet — with nothing on screen saying so.
 * That is a silent cross-environment leak on the most sensitive origin we have,
 * and it is exactly what a hardcoded fallback is for: making a misconfiguration
 * look like a working system.
 *
 * So: unknown origin THROWS, and it throws a message that names every legitimate
 * way to set it. These tests pin both halves — the behaviour of the one owner,
 * and the absence of any private copy of it in the modules that consume it.
 *
 * Run: `node --test tests/powch-origin-required.test.js` from descix-app-sdk/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  requirePowchUrl,
  powchUrlFromBuild,
  normalizePowchUrl,
  powchUrlUnknownMessage,
  POWCH_APP_ID,
} from '../src/powch/powchOrigin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SDK_ROOT = path.resolve(__dirname, '..');

/** source with comments stripped — a rule must live in CODE, not in prose about code */
function code(...rel) {
  return fs.readFileSync(path.join(SDK_ROOT, ...rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

// ------------------------------------------------------------- the one owner

test('an explicit origin is taken, and normalised', () => {
  assert.equal(requirePowchUrl('https://powch.dev.descix.net', 'T'), 'https://powch.dev.descix.net/');
  assert.equal(requirePowchUrl('https://powch.dev.descix.net/', 'T'), 'https://powch.dev.descix.net/');
});

test('an UNKNOWN origin throws — it never resolves to production', () => {
  for (const absent of [undefined, null, '']) {
    assert.throws(
      () => requirePowchUrl(absent, 'T'),
      (err) => {
        assert.ok(!/powch\.descix\.net/.test(err.message),
          'even the ERROR must not hand someone the production origin to paste');
        return /Powch's origin is unknown/.test(err.message);
      },
      `requirePowchUrl(${JSON.stringify(absent)}) must throw, not default`
    );
  }
});

test('the failure is ACTIONABLE — it names every legitimate way to set the origin', () => {
  const msg = powchUrlUnknownMessage('T');
  assert.match(msg, /^\[T\]/, 'the message says which module failed');
  for (const way of ['config.powch.bridgeUrl', 'env.powchUrl', 'env.products[]', 'VITE_POWCH_APP_URL']) {
    assert.ok(msg.includes(way), `the message must name ${way}`);
  }
  assert.match(msg, /no default/, 'and must say the absence is deliberate');
});

test('powchUrlFromBuild is null when no build injected one', () => {
  // __POWCH_APP_URL__ is a Vite define; under node it is simply not declared.
  assert.equal(powchUrlFromBuild(), null);
});

test('normalisation is idempotent and POWCH_APP_ID is the shared constant', () => {
  assert.equal(normalizePowchUrl(normalizePowchUrl('https://x.test')), 'https://x.test/');
  assert.equal(POWCH_APP_ID, 'powch');
});

// -------------------------------------------- no consumer keeps a private copy

const CONSUMERS = [
  ['src', 'AppShell.jsx'],
  ['src', 'providers', 'PowchBridgeProvider.jsx'],
  ['src', 'components', 'PowchSideBarWidget.jsx'],
  ['src', 'util', 'PowchBridgeClient.js'],
  ['src', 'powch', 'PowchClient.js'],
  ['src', 'util', 'SdkInitializer.jsx'],
];

for (const rel of CONSUMERS) {
  test(`${path.join(...rel)} carries NO hardcoded Powch origin`, () => {
    assert.ok(!/powch\.descix\.net/.test(code(...rel)),
      'a hardcoded prod wallet origin in a dev build is a silent cross-environment leak');
  });
}

test('every module that MOUNTS Powch resolves through the one owner', () => {
  const mounters = CONSUMERS.filter(([, ...r]) => !r.includes('SdkInitializer.jsx'));
  for (const rel of mounters) {
    assert.match(code(...rel), /requirePowchUrl\(/,
      `${path.join(...rel)} must ask the one owner rather than resolve the origin itself`);
  }
});

test('nobody re-implements the fallback chain by hand', () => {
  for (const rel of CONSUMERS) {
    const src = code(...rel);
    assert.ok(!/typeof\s+__POWCH_APP_URL__\s*!==\s*'undefined'\s*\?\s*__POWCH_APP_URL__\s*:\s*'/.test(src),
      `${path.join(...rel)} re-implements the define-or-default chain`);
  }
  // powchOrigin.js is the ONLY module allowed to read the build define directly.
  const readers = ['src/AppShell.jsx', 'src/providers/PowchBridgeProvider.jsx',
    'src/components/PowchSideBarWidget.jsx', 'src/util/PowchBridgeClient.js',
    'src/powch/PowchClient.js']
    .filter((f) => /__POWCH_APP_URL__/.test(code(...f.split('/'))));
  assert.deepEqual(readers, [], 'these read the build define instead of asking powchOrigin');
});

// ------------------------------------------------------- ONE owner, two layers

test('the dev-time resolver consumes the runtime owner rather than duplicating it', () => {
  const src = code('src', 'dev', 'powchUrl.js');
  assert.match(src, /from '\.\.\/powch\/powchOrigin\.js'/, 'dev/powchUrl.js must import the shared owner');
  assert.ok(!/const POWCH_APP_ID\s*=/.test(src), 'the app id has one definition');
  assert.ok(!/function withSlash/.test(src), 'normalisation has one definition');
});

test('the runtime owner imports NOTHING — it must be safe in a browser bundle', () => {
  const src = fs.readFileSync(path.join(SDK_ROOT, 'src', 'powch', 'powchOrigin.js'), 'utf8');
  assert.ok(!/^import\s/m.test(src), 'a node import here would break the browser build');
  assert.ok(!/require\(/.test(src));
});

test('the splitview harness asks the owner instead of the SHELL-ORIGIN product map', () => {
  // buildWorkspaceProducts deliberately excludes Powch, so `workspaceProducts.powch`
  // is always undefined — this config read it and therefore ALWAYS fell through to a
  // hardcoded origin, silently, while claiming to use the real one.
  const src = code('demo', 'vite.config.js');
  assert.ok(!/workspaceProducts\?\.powch/.test(src),
    'that map can never contain Powch; reading it only ever reaches the fallback');
  assert.match(src, /resolvePowchUrl\(/);
  assert.ok(!/powchAppUrl\s*=[^;]*\|\|\s*'https?:\/\//.test(src),
    'no hardcoded origin fallback for the wallet, not even a localhost one');
  assert.match(src, /throw new Error\(/, 'an unknown origin must fail the harness loudly');
});

test('the vite proxy does not re-derive Powch by hand either', () => {
  const src = code('src', 'dev', 'createViteProxyConfig.js');
  assert.match(src, /resolvePowchUrl\(/);
  assert.ok(!/appId\s*===\s*'powch'/.test(src), 'createViteProxyConfig re-implements powch discovery');
});
