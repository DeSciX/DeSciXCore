/**
 * `descix airdrop execute-queue` IS DELETED, AND REFUSED BY NAME.
 *
 * Lane B (the pending_migrations queue) is struck (CEO word Unkamon 1530eb6, daita-sam#4:
 * "Delete all of it, fail loud at every door, no compat fence (super-DRY)."). The verb was a
 * dry-run preview of that queue. Distributions run through the offers rail on daita-sam.
 *
 * Runs the REAL binary in a temp dir with no credentials. Run:
 *   node --test tests/airdrop-execute-queue-removed.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(PKG_ROOT, 'bin', 'descix.js');

function cli(args) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'no-exq-')));
  const env = { ...process.env, HOME: dir };
  delete env.DESCIX_API_URL;
  try {
    const out = execFileSync(process.execPath, [CLI, ...args], { cwd: dir, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout || ''}${e.stderr || ''}` };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('airdrop execute-queue exits non-zero naming the offers rail on daita-sam', () => {
  for (const args of [
    ['airdrop', 'execute-queue'],
    ['airdrop', 'execute-queue', '--dry-run', '--community', 'smile'],
    ['airdrop', 'execute-queue', '--apply', '--signer-pk-file', './k'],
    ['airdrop', 'execute-queue', '--help'],
  ]) {
    const r = cli(args);
    assert.notEqual(r.code, 0, `${args.join(' ')}: a removed verb must not exit 0`);
    assert.match(r.out, /airdrop execute-queue/, `${args.join(' ')}: refusal must name what was typed`);
    assert.match(r.out, /daita-sam/, `${args.join(' ')}: refusal must name the replacement`);
    assert.match(r.out, /offers/i, `${args.join(' ')}: refusal must name the offers rail`);
  }
});

test('the implementation, its test and its generated verb-invoke row are gone', () => {
  assert.equal(fs.existsSync(path.join(PKG_ROOT, 'lib', 'commands', 'airdrop.js')), false);
  assert.equal(fs.existsSync(path.join(PKG_ROOT, 'tests', 'airdrop.test.js')), false);
  const gen = fs.readFileSync(path.join(PKG_ROOT, 'lib', 'verb-invokes.generated.json'), 'utf8');
  assert.doesNotMatch(gen, /airdrop_execute_queue/);
});
