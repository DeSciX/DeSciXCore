/**
 * `descix site upload` validates a shipped share.json against the app-sdk share contract
 * (@descix/app-sdk/share) BEFORE anything is uploaded, and refuses the whole upload on a miss.
 *
 * Runs the real binary with the backend mocked (tests/tools/cli-mock-backend.mjs): every backend
 * call is printed as `MOCK invoke <command> <files>`, so "nothing was uploaded" is measured as
 * "get_site_deploy_token was never asked for".
 *
 * Run: `node --test tests/site-upload-share-json.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SHARE_CONTRACT } from '@descix/app-sdk/share';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(__dirname, '..', 'bin', 'descix.js');
const MOCK = path.resolve(__dirname, 'tools', 'cli-mock-backend.mjs');

const VALID_SHARE = {
  title: 'Solo', description: 'A solo app', icon: 'images/share/favicon.ico',
  og_image: 'images/share/share-1200x630.png', apple_touch_icon: 'images/share/icon-180.png',
};

/** A v3 single-app workspace and a built site dir carrying `share` (an object, or raw text). */
function withSite(share, fn) {
  const parent = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'site-share-')));
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
    if (share !== undefined) {
      fs.writeFileSync(path.join(site, 'share.json'), typeof share === 'string' ? share : JSON.stringify(share));
    }
    return fn({ parent, ws, site });
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
}

function upload({ parent, ws, site }, extra = []) {
  const env = { ...process.env, HOME: parent };
  delete env.DESCIX_API_URL;
  const r = spawnSync(process.execPath, ['--import', MOCK, CLI, '--env=dev', 'site', 'upload', '-a', 'solo-app', '-p', site, ...extra],
    { cwd: ws, env, encoding: 'utf8', timeout: 60000 });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
}

test('a valid share.json: the upload proceeds and share.json is in the upload set', () => {
  withSite(VALID_SHARE, (t) => {
    const r = upload(t, ['--dry-run']);
    assert.equal(r.code, 0, r.out);
    const token = r.out.match(/MOCK invoke get_site_deploy_token (.*)/);
    assert.ok(token, `the upload reached get_site_deploy_token:\n${r.out}`);
    assert.deepEqual(JSON.parse(token[1]).sort(), ['assets/app.js', 'index.html', 'share.json']);
    assert.doesNotMatch(r.out, /REFUSED/);
  });
});

test('no share.json: the check does not run and the upload proceeds', () => {
  withSite(undefined, (t) => {
    const r = upload(t, ['--dry-run']);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /MOCK invoke get_site_deploy_token \["/);
    assert.doesNotMatch(r.out, /share\.json/);
  });
});

test('NEGATIVE CONTROL: an empty description refuses the whole upload by field name and file path; nothing is uploaded', () => {
  withSite({ ...VALID_SHARE, description: '' }, (t) => {
    for (const extra of [['--dry-run'], []]) {
      const r = upload(t, extra);
      assert.equal(r.code, 1, r.out);
      assert.ok(r.out.includes(`site upload REFUSED: ${path.join(t.site, 'share.json')} does not meet the share.json contract`), r.out);
      assert.match(r.out, /share\.json: description is empty; it must be a non-empty string/);
      assert.match(r.out, /Nothing was uploaded\./);
      assert.doesNotMatch(r.out, /MOCK invoke get_site_deploy_token/, `nothing may reach the deploy token (${extra}):\n${r.out}`);
      assert.doesNotMatch(r.out, /uploading anyway|Uploading \d+ files/i);
    }
  });
});

test('NEGATIVE CONTROL: a missing title, a non-string icon, and invalid JSON are each refused by name', () => {
  const cases = [
    [{ description: 'D' }, /share\.json: title is required \(a non-empty string\)/],
    [{ ...VALID_SHARE, icon: 5 }, /share\.json: icon must be a string; got a number/],
    ['{ "title": ', /share\.json: not valid JSON/],
  ];
  for (const [share, rx] of cases) {
    withSite(share, (t) => {
      const r = upload(t, ['--dry-run']);
      assert.equal(r.code, 1, r.out);
      assert.match(r.out, rx);
      assert.doesNotMatch(r.out, /MOCK invoke get_site_deploy_token/);
    });
  }
});

test('default_view: CodeSite uploads; FullScreen refuses the whole upload by name before the deploy token', () => {
  withSite({ ...VALID_SHARE, default_view: 'CodeSite' }, (t) => {
    const r = upload(t, ['--dry-run']);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /MOCK invoke get_site_deploy_token \["/);
  });
  withSite({ ...VALID_SHARE, default_view: 'FullScreen' }, (t) => {
    const r = upload(t, ['--dry-run']);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /share\.json: default_view 'FullScreen' is not a view; one of CodeSite, SplitView, Chat, NoChrome/);
    assert.doesNotMatch(r.out, /MOCK invoke get_site_deploy_token/);
  });
});

test('the CLI restates no share rule: the check imports the app-sdk owner', () => {
  const src = fs.readFileSync(path.resolve(__dirname, '..', 'lib', 'core', 'SiteShareCheck.js'), 'utf8');
  assert.match(src, /from '@descix\/app-sdk\/share'/);
  for (const f of SHARE_CONTRACT) assert.doesNotMatch(src, new RegExp(`['"]${f.name}['"]`), `SiteShareCheck names ${f.name}`);
  const cli = fs.readFileSync(CLI, 'utf8');
  const check = cli.indexOf('await assertShareJsonValid(fileList);');
  const token = cli.indexOf("apiClient.invoke('get_site_deploy_token'");
  assert.ok(check > 0 && check < token, 'the share check runs before the deploy token is requested');
});
