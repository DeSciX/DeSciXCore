/**
 * Unit tests for `descix app init --local-only --service-wallet emit`.
 *
 * WS-SMILE-4APP Phase 1 / WS-A — verifies:
 *   1. wallet.json is emitted at {app}/microservice/.descix/wallet.json.
 *   2. File mode is exactly 0600.
 *   3. Content passes WalletFileManager.validateWalletFile().
 *   4. Address is a valid 0x-checksummed hex string.
 *   5. signature and signature_message are both present (reconnect_by_wallet contract).
 *
 * Run: `node --test tests/app-init-local-only-wallet.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { fileURLToPath } from 'node:url';
import { WalletFileManager } from '../lib/wallet-file.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLI_PATH = path.resolve(__dirname, '..', 'bin', 'descix.js');

async function mkTempWorkspace() {
  return await fs.mkdtemp(path.join(os.tmpdir(), 'descix-app-init-wallet-test-'));
}

async function runCli(args, cwd) {
  return new Promise((resolve) => {
    const env = { ...process.env, DESCIX_API_URL: 'http://127.0.0.1:1' };
    const child = spawn(process.execPath, [CLI_PATH, ...args], { cwd, env });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (b) => { stdout += b.toString(); });
    child.stderr.on('data', (b) => { stderr += b.toString(); });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

test('app init --local-only --service-wallet emit writes wallet.json at mode 0600 with valid structure', async () => {
  const cwd = await mkTempWorkspace();
  try {
    const result = await runCli(
      ['app', 'init', '-a', 'smile-test', '-c', 'smile', '--local-only', '--service-wallet', 'emit'],
      cwd
    );

    assert.equal(result.code, 0, `CLI exit != 0. stderr=${result.stderr}\nstdout=${result.stdout}`);

    const walletPath = path.join(cwd, 'microservice', '.descix', 'wallet.json');

    // File exists
    const stat = await fs.stat(walletPath);
    assert.ok(stat.isFile());

    // Mode is exactly 0600
    const mode = stat.mode & 0o777;
    assert.equal(mode, 0o600, `wallet.json mode must be 0600, got ${mode.toString(8)}`);

    // Content validates
    const contents = JSON.parse(await fs.readFile(walletPath, 'utf-8'));
    assert.equal(WalletFileManager.validateWalletFile(contents), true, 'validateWalletFile must pass');

    // Required fields
    assert.ok(/^0x[a-fA-F0-9]{40}$/.test(contents.walletAddress), 'address must be 0x-prefixed 40-hex');
    assert.ok(typeof contents.signature === 'string' && contents.signature.startsWith('0x'), 'signature must be 0x-prefixed');
    assert.ok(typeof contents.signature_message === 'string' && contents.signature_message.length > 0, 'signature_message must be present');
    assert.equal(contents.walletType, 'service', 'walletType must be "service"');
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
});

test('WalletFileManager.generateAndSaveServiceWallet — direct invocation', async () => {
  const tmp = await mkTempWorkspace();
  try {
    const saved = await WalletFileManager.generateAndSaveServiceWallet(tmp);
    assert.equal(saved, path.join(tmp, '.descix', 'wallet.json'));

    const stat = await fs.stat(saved);
    assert.equal(stat.mode & 0o777, 0o600);

    const contents = JSON.parse(await fs.readFile(saved, 'utf-8'));
    assert.ok(WalletFileManager.validateWalletFile(contents));
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('generateAndSaveServiceWallet throws on bad input (no silent fallbacks)', async () => {
  await assert.rejects(
    () => WalletFileManager.generateAndSaveServiceWallet(null),
    /microservicePath is required/
  );
  await assert.rejects(
    () => WalletFileManager.generateAndSaveServiceWallet(''),
    /microservicePath is required/
  );
});
