/**
 * `descix referral create` — the caller's share link to one page.
 *
 * THE DEFECT (measured on cli 4.3.1): the verb sent { community_id, app_id } to generate_referral_code, which
 * reads neither, and printed `result.referral_code || result.code` — fields the reply never carries, so it
 * always printed "Code: undefined" and no link. The reply's link is `share_url` (`<page>?ref=<custom_id>`),
 * minted for a WEB_PAGE target with a channel.
 *
 * Drives the REAL binary with the backend mocked (tests/tools/cli-mock-backend.mjs; generate_referral_code is
 * answered by CLI_MOCK_REFERRAL).
 *
 * Run: `node --test tests/referral-create.test.js` from descix-cli/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(__dirname, '..', 'bin', 'descix.js');
const MOCK = path.resolve(__dirname, 'tools', 'cli-mock-backend.mjs');
const PAGE = 'https://egpt.descix.net/letter';

function cli(t, args, mode) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'referral-create-')));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const env = { ...process.env, HOME: dir };
  delete env.DESCIX_API_URL;
  delete env.CLI_MOCK_REFERRAL;
  if (mode) env.CLI_MOCK_REFERRAL = mode;
  const r = spawnSync(process.execPath, ['--import', MOCK, CLI, '--env=dev', ...args], { cwd: dir, env, encoding: 'utf8', timeout: 60000 });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
}
const sentParams = (out) => {
  const m = out.match(/^MOCK params generate_referral_code (.*)$/m);
  return m ? JSON.parse(m[1]) : null;
};
const ARGS = ['referral', 'create', '--url', PAGE, '--channel', 'web_share', '-c', 'egpt'];

test('referral create: sends the share-link contract and prints the share_url', (t) => {
  const r = cli(t, ARGS, 'created');
  assert.equal(r.code, 0, r.out);
  assert.deepEqual(sentParams(r.out), { target_type: 'WEB_PAGE', target_identifier: PAGE, channel: 'web_share', target_community_id: 'egpt' }, r.out);
  assert.match(r.out, /Share link created/);
  assert.ok(r.out.includes(`${PAGE}?ref=shr_mock`), r.out);
  assert.doesNotMatch(r.out, /: undefined/, "no field prints undefined (the 4.3.1 Code: undefined)");
});

test('referral create: an existing link is reported as the same link, not a new one', (t) => {
  const r = cli(t, ARGS, 'existing');
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /already yours; the same link as before/);
  assert.doesNotMatch(r.out, /Share link created/);
  assert.ok(r.out.includes(`${PAGE}?ref=shr_mock`), r.out);
});

test('referral create (negative control): a reply without a share_url exits 1 and prints no link', (t) => {
  const r = cli(t, ARGS, 'no-share-url');
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /generate_referral_code returned no share_url/);
  assert.doesNotMatch(r.out, /Share link/);
});

test('referral create: a server refusal exits 1 with its code, once', (t) => {
  const r = cli(t, ARGS, 'off-domain');
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /PROMOTION_TARGET_HOST: a WEB_PAGE target must be on descix\.net/);
  assert.doesNotMatch(r.out, /PROMOTION_TARGET_HOST: PROMOTION_TARGET_HOST/);
});

test('referral create: --url and --channel are required; the deleted --app flag is refused', (t) => {
  const r1 = cli(t, ['referral', 'create', '-c', 'egpt', '--channel', 'web_share'], 'created');
  assert.notEqual(r1.code, 0, r1.out);
  assert.match(r1.out, /required option '--url <page>' not specified/);
  const r2 = cli(t, ['referral', 'create', '-c', 'egpt', '--url', PAGE], 'created');
  assert.match(r2.out, /required option '--channel <channel>' not specified/);
  const r3 = cli(t, [...ARGS, '-a', 'egpt'], 'created');
  assert.notEqual(r3.code, 0, r3.out);
  assert.match(r3.out, /unknown option '-a'/);
  for (const r of [r1, r2, r3]) assert.equal(sentParams(r.out), null, 'nothing was sent');
});

test('referral create: the invoked literal is the share-link contract\'s MINT_COMMAND (one owner)', async () => {
  const { MINT_COMMAND } = await import('@descix/app-sdk/share-link');
  const src = fs.readFileSync(path.resolve(__dirname, '..', 'lib', 'commands', 'referral-create.js'), 'utf8');
  assert.match(src, new RegExp(`apiClient\\.invoke\\('${MINT_COMMAND}', params\\)`));
});
