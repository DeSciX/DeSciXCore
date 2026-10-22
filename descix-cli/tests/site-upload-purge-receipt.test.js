/**
 * `descix site upload` shows the edge purge receipt confirm_site_deploy returns, and a purge that is
 * not complete is a FAILED command.
 *
 * The backend (DeSciX_Cloud appCommands confirm_site_deploy) returns, on every non-preview deploy,
 *   purge: { status: 'ok'|'failed', attempted, purged, failed?: string[] }
 * Measured on DEV: `{"status":"ok","attempted":33,"purged":33}`, which the CLI never
 * printed. A failed purge leaves the edge serving stale bytes for the cache TTL; a command that exits 0
 * over it decided success without asking.
 *
 * Runs the REAL binary with the backend mocked (tests/tools/cli-mock-backend.mjs, CLI_MOCK_CONFIRM):
 * the signed-URL PUTs answer 200 in-process and confirm_site_deploy answers the receipt under test.
 * The owner of the verdict is lib/core/SitePurgeReceipt.js; its own unit cases follow.
 *
 * Run: `node --test tests/site-upload-purge-receipt.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { assessPurgeReceipt } from '../lib/core/SitePurgeReceipt.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(__dirname, '..', 'bin', 'descix.js');
const MOCK = path.resolve(__dirname, 'tools', 'cli-mock-backend.mjs');

const CONFIRMED = {
  success: true,
  site_url: 'https://mock.invalid/index.html',
  deployed_at: '2026-10-22T00:00:00.000Z',
  files_count: 2,
  pruned_files: [],
  prune_status: 'complete',
  preview: false,
};

/** Upload a two-file site from a v3 single-app workspace; confirm answers `confirm`. */
function upload(confirm, extra = []) {
  const parent = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'site-purge-')));
  try {
    const ws = path.join(parent, 'ws');
    fs.mkdirSync(path.join(ws, '.descix'), { recursive: true });
    fs.writeFileSync(path.join(ws, '.descix', 'workspace.json'), JSON.stringify({
      version: '3.0', type: 'workspace',
      env: { apiUrl: 'https://dev.descix.net', app: { appId: 'solo-app', communityId: 'solo-app', kbId: 'General' } },
    }));
    const site = path.join(parent, 'site');
    fs.mkdirSync(path.join(site, 'assets'), { recursive: true });
    fs.writeFileSync(path.join(site, 'index.html'), '<p>solo</p>');
    fs.writeFileSync(path.join(site, 'assets', 'app.js'), 'console.log(1)');
    const env = { ...process.env, HOME: parent, CLI_MOCK_CONFIRM: typeof confirm === 'string' ? confirm : JSON.stringify(confirm) };
    delete env.DESCIX_API_URL;
    const r = spawnSync(process.execPath, ['--import', MOCK, CLI, '--env=dev', 'site', 'upload', '-a', 'solo-app', '-p', site, ...extra],
      { cwd: ws, env, encoding: 'utf8', timeout: 60000 });
    return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
}

test('a full receipt: one receipt line and exit 0', () => {
  const r = upload({ ...CONFIRMED, purge: { status: 'ok', attempted: 33, purged: 33 } });
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /MOCK invoke confirm_site_deploy/, 'the upload reached confirm');
  assert.match(r.out, /edge purge: ok, 33\/33 cache keys/);
  assert.equal(r.out.match(/edge purge:/g).length, 1, `exactly one receipt line:\n${r.out}`);
  assert.match(r.out, /Site uploaded successfully!/);
});

test('NEGATIVE CONTROL: purged < attempted fails the command and names the stale batches', () => {
  const r = upload({ ...CONFIRMED, purge: {
    status: 'failed', attempted: 33, purged: 30,
    failed: ['batch 2 (3 files): HTTP 500 [{"code":10000,"message":"Authentication error"}]'],
  } });
  assert.notEqual(r.code, 0, `a partial purge must not exit 0:\n${r.out}`);
  assert.match(r.out, /edge purge: FAILED, 30\/33 cache keys purged, 3 not purged/);
  assert.match(r.out, /batch 2 \(3 files\): HTTP 500/);
  assert.match(r.out, /re-run `descix site upload`/i);
  assert.doesNotMatch(r.out, /Site uploaded successfully!/, 'never a bare success');
});

test('status ok but purged < attempted is still a partial purge: exit non-zero', () => {
  const r = upload({ ...CONFIRMED, purge: { status: 'ok', attempted: 33, purged: 32 } });
  assert.notEqual(r.code, 0, r.out);
  assert.match(r.out, /edge purge: FAILED, 32\/33 cache keys purged, 1 not purged/);
});

test('no purge field on a non-preview deploy fails loud, naming the missing field', () => {
  const r = upload({ ...CONFIRMED });
  assert.notEqual(r.code, 0, r.out);
  assert.match(r.out, /edge purge: NO RECEIPT/);
  assert.match(r.out, /no `purge` field/);
  assert.doesNotMatch(r.out, /Site uploaded successfully!/);
});

test('a preview deploy is not purged by the server: says so, exit 0', () => {
  const r = upload({ ...CONFIRMED, preview: true }, ['--preview']);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /edge purge: not run \(preview deploy\)/);
});

test('a lost confirm response on a confirmed deploy: the purge is UNKNOWN and the command fails', () => {
  const r = upload('lost');
  assert.match(r.out, /Deploy CONFIRMED/, r.out);
  assert.match(r.out, /edge purge: UNKNOWN/);
  assert.notEqual(r.code, 0, r.out);
});

test('a lost confirm response on a confirmed PREVIEW deploy: no purge was due, exit 0', () => {
  const r = upload('lost', ['--preview']);
  assert.match(r.out, /Deploy CONFIRMED/, r.out);
  assert.doesNotMatch(r.out, /edge purge/);
  assert.equal(r.code, 0, r.out);
});

// ── the owner, unit ──

test('assessPurgeReceipt: a full receipt is ok with one line', () => {
  assert.deepEqual(assessPurgeReceipt({ purge: { status: 'ok', attempted: 0, purged: 0 } }, { preview: false }),
    { ok: true, lines: ['edge purge: ok, 0/0 cache keys'] });
});

test('assessPurgeReceipt: a malformed receipt is not ok and quotes what came back', () => {
  for (const purge of [{ status: 'ok' }, { status: 'ok', attempted: '33', purged: 33 }, { attempted: 3, purged: 3 }, 'ok', null]) {
    const v = assessPurgeReceipt({ purge }, { preview: false });
    assert.equal(v.ok, false, JSON.stringify(purge));
    assert.match(v.lines[0], /edge purge: (MALFORMED|NO RECEIPT)/, JSON.stringify(purge));
  }
});

test('assessPurgeReceipt: a receipt on a preview deploy is still assessed', () => {
  const v = assessPurgeReceipt({ purge: { status: 'failed', attempted: 3, purged: 0, failed: ['x'] } }, { preview: true });
  assert.equal(v.ok, false);
});

test('assessPurgeReceipt: a failed status with purged == attempted is not ok', () => {
  const v = assessPurgeReceipt({ purge: { status: 'failed', attempted: 3, purged: 3 } }, { preview: false });
  assert.equal(v.ok, false);
  assert.match(v.lines[0], /edge purge: FAILED, 3\/3 cache keys purged, 0 not purged \(status failed\)/);
});
