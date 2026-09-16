/**
 * GATE: a wallet credential that cannot be saved STOPS the caller; it never returns quietly.
 *
 * THE DEFECT (JARVIS-FRAQTL, measured on PROD 2026-09-16 in the CEO's terminal). The device login's
 * poll returned an empty wallet field; WalletFileManager.saveWalletFile logged
 * "Invalid wallet data structure" and RETURNED false; every caller ignored the boolean, so
 * `descix login` printed "Login successful!" and "Credentials saved to: …/wallet.json", exited 0,
 * and no file existed. `whoami` then said "Authentication required".
 *
 * These tests run the owner (lib/wallet-file.js) against a temp directory. They never read or print
 * a real credential; every value here is a fixture.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { WalletFileManager } from '../lib/wallet-file.js';

const ADDRESS = '0x' + 'a'.repeat(40);
const FIXTURE_SIGNATURE = 'fixture-signature-not-a-credential';

async function tmpWalletPath(t) {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'wallet-save-'));
  t.after(() => fsp.rm(dir, { recursive: true, force: true }));
  return path.join(dir, '.descix', 'wallet.json');
}
const exists = (p) => fsp.access(p).then(() => true, () => false);

test('an empty signature THROWS naming the field, and writes nothing', async (t) => {
  const p = await tmpWalletPath(t);
  await assert.rejects(
    WalletFileManager.saveWalletFile(p, { walletAddress: ADDRESS, signature: null }),
    (err) => { assert.match(err.message, /signature is empty/); return true; }
  );
  assert.equal(await exists(p), false, 'a refused credential must not leave a file behind');
});

test('an empty walletAddress THROWS naming the field', async (t) => {
  const p = await tmpWalletPath(t);
  await assert.rejects(
    WalletFileManager.saveWalletFile(p, { walletAddress: null, signature: FIXTURE_SIGNATURE }),
    /walletAddress is empty/
  );
});

test('a malformed walletAddress THROWS naming the format', async (t) => {
  const p = await tmpWalletPath(t);
  await assert.rejects(
    WalletFileManager.saveWalletFile(p, { walletAddress: '0x123', signature: FIXTURE_SIGNATURE }),
    /walletAddress is not a 0x-prefixed 40-hex-digit address/
  );
});

test('the refusal message never carries the signature value', async (t) => {
  const p = await tmpWalletPath(t);
  await assert.rejects(
    WalletFileManager.saveWalletFile(p, { walletAddress: '0xnothex', signature: FIXTURE_SIGNATURE }),
    (err) => { assert.ok(!err.message.includes(FIXTURE_SIGNATURE), 'credential value leaked into the message'); return true; }
  );
});

test('control: a valid credential is written with mode 600 and the save resolves true', async (t) => {
  const p = await tmpWalletPath(t);
  assert.equal(await WalletFileManager.saveWalletFile(p, { walletAddress: ADDRESS, signature: FIXTURE_SIGNATURE }), true);
  const st = await fsp.stat(p);
  assert.equal(st.mode & 0o777, 0o600);
});

test('validateWalletFile agrees with the save (one owner of validity)', () => {
  assert.equal(WalletFileManager.validateWalletFile({ walletAddress: ADDRESS, signature: FIXTURE_SIGNATURE }), true);
  assert.equal(WalletFileManager.validateWalletFile({ walletAddress: ADDRESS, signature: '' }), false);
  assert.deepEqual(WalletFileManager.walletFileProblems({ walletAddress: ADDRESS, signature: '' }), ['signature is empty']);
});

test('login does not print success after a failed save, and fails with a named code (source gate)', async () => {
  // loginDevice drives a real browser ceremony, so this leg asserts the source: the success line
  // must sit AFTER a save that is wrapped to throw UNUSABLE_CLI_CREDENTIAL.
  const src = await readFile(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'lib', 'commands', 'auth.js'), 'utf8');
  const save = src.indexOf('await WalletFileManager.saveWalletFile(walletPath, walletData);');
  const code = src.indexOf("code: 'UNUSABLE_CLI_CREDENTIAL'", save);
  const success = src.indexOf("spinner.succeed(chalk.green('Login successful!'))", save);
  assert.ok(save > 0 && code > save && success > code, 'the save must be guarded before the success claim');
});
