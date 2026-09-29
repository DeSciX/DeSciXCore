/**
 * @descix/sdk ships no delegate-key signer.
 *
 * `Signer` signed request bodies with a per-service SERVICE_KEY and sent X-NFT-ID / X-Signature,
 * the inbound delegate authentication Cloud deleted (CEO-D-2026-06-02-APP-DATA-PLANE: an app
 * microservice acts on the injected caller auth, `params._descix`). No caller imported it.
 *
 * Run: node --test tests/no-delegate-signer.test.mjs  (from descix-sdk/)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as sdk from '../src/index.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Signer is neither exported nor present', () => {
  assert.equal('Signer' in sdk, false, 'named export');
  assert.equal('Signer' in sdk.default, false, 'default export');
  assert.equal(typeof sdk.fetchAppAsset, 'function', 'control: the module namespace is being read');
  assert.equal(fs.existsSync(path.join(ROOT, 'src', 'auth', 'signer.js')), false);
});

test('the README does not advertise it', () => {
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  assert.doesNotMatch(readme, /\bSigner\b/);
  assert.match(readme, /fetchAppAsset/, 'control: the export list is being read');
});
