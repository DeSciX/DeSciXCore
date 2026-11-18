/**
 * `descix site upload` refuses a site manifest that names a source path that does not exist or an
 * include entry that matches no file — dry run AND real — with a non-zero exit, naming every one,
 * and BEFORE any network call. A deploy replaces the site, so the old silent skip removed the
 * missing source's files from the server on confirm.
 *
 * Where the check sits (bin/descix.js site upload → lib/core/SiteWalker.js walkSite):
 *  - no buildCommand, or a dry run (which skips the build): right after the site source is resolved,
 *    before sign-in (requireAuth) and before any backend call;
 *  - a buildCommand on a real upload: the sources the build produces exist only after it runs, so
 *    the walk runs after get_site_build_config and the build, before get_site_deploy_token.
 *
 * Runs the real binary with the backend mocked (tests/tools/cli-mock-backend.mjs): sign-in prints
 * `MOCK requireAuth`, every backend call `MOCK invoke <command> <files>`, every PUT `MOCK put <path>`.
 * "No network call was attempted" is measured as none of those lines appearing.
 *
 * Run: `node --test tests/site-upload-missing-source.test.js` from descix-cli/.
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

const CONFIRMED = {
  success: true, site_url: 'https://mock.invalid/index.html', deployed_at: '2026-11-18T00:00:00.000Z',
  files_count: 1, pruned_files: [], prune_status: 'complete', preview: false,
  purge: { status: 'ok', attempted: 1, purged: 1 },
};

/** A v3 single-app workspace whose root is the app root, holding `files` and a site manifest. */
function withApp(files, manifest, fn) {
  const parent = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'site-missing-')));
  try {
    const app = path.join(parent, 'app');
    fs.mkdirSync(path.join(app, '.descix', 'manifests'), { recursive: true });
    fs.writeFileSync(path.join(app, '.descix', 'workspace.json'), JSON.stringify({
      version: '3.0', type: 'workspace',
      env: { apiUrl: 'https://dev.descix.net', app: { appId: 'solo-app', communityId: 'solo-app', kbId: 'General' } },
    }));
    fs.writeFileSync(path.join(app, '.descix', 'manifests', 'site.json'), JSON.stringify(manifest));
    for (const [rel, content] of Object.entries(files)) {
      const abs = path.join(app, rel);
      if (rel.endsWith('/')) { fs.mkdirSync(abs, { recursive: true }); continue; }
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content);
    }
    return fn({ parent, app });
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
}

/** The real CLI; a real (non-dry) run has CLI_MOCK_CONFIRM set so it WOULD reach confirm. */
function upload({ parent, app }, { dryRun }) {
  const env = { ...process.env, HOME: parent, CLI_MOCK_CONFIRM: JSON.stringify(CONFIRMED) };
  delete env.DESCIX_API_URL;
  const args = ['--import', MOCK, CLI, '--env=dev', 'site', 'upload', '-a', 'solo-app', ...(dryRun ? ['--dry-run'] : [])];
  const r = spawnSync(process.execPath, args, { cwd: app, env, encoding: 'utf8', timeout: 60000 });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
}

function assertNoNetwork(out) {
  assert.doesNotMatch(out, /MOCK requireAuth/, `refused before sign-in:\n${out}`);
  assert.doesNotMatch(out, /MOCK invoke/, `no backend call:\n${out}`);
  assert.doesNotMatch(out, /MOCK put/, `nothing uploaded:\n${out}`);
}

const TWO_SOURCES = { sources: [{ path: 'site' }, { path: 'docs' }], buildCommand: null };
const TWO_SOURCES_ONE = { sources: [{ path: 'site' }], buildCommand: null };

for (const dryRun of [true, false]) {
  const mode = dryRun ? 'dry run' : 'real upload';

  test(`${mode}: one of two sources missing → exit 1, names it, no network call`, () => {
    withApp({ 'site/index.html': '<p>a</p>', 'site/app.js': 'x' }, TWO_SOURCES, (t) => {
      const r = upload(t, { dryRun });
      assert.equal(r.code, 1, r.out);
      assert.match(r.out, /Site upload refused: the site manifest .*site\.json names 1 entry that cannot be uploaded\./);
      assert.ok(r.out.includes(`missing source: sources[1].path "docs" -> ${path.join(t.app, 'docs')} (does not exist)`), r.out);
      assert.doesNotMatch(r.out, /Found \d+ files/);
      assertNoNetwork(r.out);
    });
  });

  test(`${mode}: an include entry naming a missing file → exit 1, names it, no network call`, () => {
    withApp({ 'site/index.html': '<p>a</p>' }, { sources: [{ path: 'site', include: ['index.html', 'about.html'] }] }, (t) => {
      const r = upload(t, { dryRun });
      assert.equal(r.code, 1, r.out);
      assert.ok(r.out.includes(`missing include: sources[0].include[1] "about.html" (source "site") -> no file matches ${path.join(t.app, 'site', 'about.html')}`), r.out);
      assertNoNetwork(r.out);
    });
  });

  test(`${mode}: a GLOB include that matches nothing is allowed, and the run prints the line naming it`, () => {
    withApp({ 'site/index.html': '<p>a</p>' }, { sources: [{ path: 'site', include: ['**/*.html', 'img/*.png'] }] }, (t) => {
      const r = upload(t, { dryRun });
      assert.equal(r.code, 0, r.out);
      assert.ok(r.out.includes('Include pattern sources[0].include[1] "img/*.png" of source "site" matches no file: ' +
        'it adds nothing to this deploy, so any server files it supplied before will be removed.'), r.out);
      assert.match(r.out, /MOCK invoke get_site_deploy_token \["index\.html"\]/);
    });
  });

  test(`${mode}: a directory named as a literal include is refused, saying what to write`, () => {
    withApp({ 'site/index.html': '<p>a</p>', 'site/assets/a.png': 'p' }, { sources: [{ path: 'site', include: ['index.html', 'assets/'] }] }, (t) => {
      const r = upload(t, { dryRun });
      assert.equal(r.code, 1, r.out);
      assert.ok(r.out.includes('"assets" is a directory; to include its files write "assets/**"'), r.out);
      assertNoNetwork(r.out);
    });
  });

  for (const [rel, target] of [
    ['site/x', '../.env'], ['site/assets/config.txt', '../../.env'], ['site/g', '../.git'],
    ['site/secrets', '../.descix'], ['site/nm', '../node_modules'], ['site/all', '..'], ['site/copy.html', 'index.html'],
  ]) {
    test(`${mode}: symlink ${rel} -> ${target} is refused before any network call; no linked path reaches the deploy token`, () => {
      withApp({ '.env': 'SECRET=1', '.git/config': '[core]', 'node_modules/x/i.js': 'x', 'site/index.html': '<p>a</p>' }, TWO_SOURCES_ONE, (t) => {
        fs.mkdirSync(path.dirname(path.join(t.app, rel)), { recursive: true });
        fs.symlinkSync(target, path.join(t.app, rel));
        const r = upload(t, { dryRun });
        assert.equal(r.code, 1, r.out);
        assert.ok(r.out.includes(`symlink refused: sources[0] "site" entry "${rel.slice(5)}" (${path.join(t.app, rel)} -> ${target})`), r.out);
        assert.doesNotMatch(r.out, /get_site_deploy_token/, 'the deploy token is never asked for');
        assertNoNetwork(r.out);
      });
    });
  }

  test(`${mode}: the two-hop link site/a -> ../b with b/c -> ../.git is refused; nothing is sent`, () => {
    withApp({ '.git/config': '[core]', 'b/': '', 'site/index.html': '<p>a</p>' }, TWO_SOURCES_ONE, (t) => {
      fs.symlinkSync('../.git', path.join(t.app, 'b', 'c'));
      fs.symlinkSync('../b', path.join(t.app, 'site', 'a'));
      const r = upload(t, { dryRun });
      assert.equal(r.code, 1, r.out);
      assert.match(r.out, /symlink refused: sources\[0\] "site" entry "a" /);
      assertNoNetwork(r.out);
    });
  });

  test(`${mode}: a FILE source path that is a link (site/config.txt -> ../.env) is refused; config.txt is never sent`, () => {
    withApp({ '.env': 'SECRET=1', 'site/index.html': '<p>a</p>' }, { sources: [{ path: 'site/index.html' }, { path: 'site/config.txt' }] }, (t) => {
      fs.symlinkSync('../.env', path.join(t.app, 'site', 'config.txt'));
      const r = upload(t, { dryRun });
      assert.equal(r.code, 1, r.out);
      assert.ok(r.out.includes(`source refused: sources[1].path "site/config.txt" -> ${path.join(t.app, 'site', 'config.txt')} is a symbolic link to ../.env;`), r.out);
      assert.doesNotMatch(r.out, /get_site_deploy_token/);
      assertNoNetwork(r.out);
    });
  });

  test(`${mode}: a DIRECTORY source path that is a link (site -> ..) is refused before any network call`, () => {
    withApp({ '.env': 'SECRET=1', 'real/index.html': '<p>a</p>' }, TWO_SOURCES_ONE, (t) => {
      fs.symlinkSync('..', path.join(t.app, 'site'));
      const r = upload(t, { dryRun });
      assert.equal(r.code, 1, r.out);
      assert.match(r.out, /source refused: sources\[0\]\.path "site" -> .* is a symbolic link to \.\.;/);
      assertNoNetwork(r.out);
    });
  });

  test(`${mode}: a manifest whose sources supply no file is refused (exit 1), the server unchanged, no network call`, () => {
    withApp({ 'site/': '' }, TWO_SOURCES_ONE, (t) => {
      const r = upload(t, { dryRun });
      assert.equal(r.code, 1, r.out);
      assert.match(r.out, /No files to deploy: the site manifest .* supplies no file\. A deploy of zero files would remove every file of the site, so the upload stops here; the site on the server was not changed\./);
      assert.doesNotMatch(r.out, /will be removed/);
      assertNoNetwork(r.out);
    });
  });

  test(`${mode}: an EMPTY source is allowed, and the run prints the line naming it`, () => {
    withApp({ 'site/index.html': '<p>a</p>', 'docs/': '' }, TWO_SOURCES, (t) => {
      const r = upload(t, { dryRun });
      assert.equal(r.code, 0, r.out);
      assert.ok(r.out.includes(`Source sources[1].path "docs" (${path.join(t.app, 'docs')}) is empty: it supplies no files ` +
        'to this deploy, so any server files it supplied before will be removed.'), r.out);
      const token = r.out.match(/MOCK invoke get_site_deploy_token (.*)/);
      assert.ok(token, r.out);
      assert.deepEqual(JSON.parse(token[1]), ['index.html']);
      if (!dryRun) assert.match(r.out, /MOCK put index\.html/);
    });
  });
}

// ── buildCommand ordering ────────────────────────────────────────────────────────────────────

/** A build that writes dist/index.html (or, `produce: false`, writes nothing) in the app root. */
function buildApp(produce) {
  const script = produce
    ? "import fs from 'node:fs'; fs.mkdirSync('dist', { recursive: true }); fs.writeFileSync('dist/index.html', '<p>built</p>');"
    : '';
  return {
    files: { 'build.mjs': script, 'static/robots.txt': 'r' },
    manifest: { sources: [{ path: 'dist' }, { path: 'static' }], buildCommand: `"${process.execPath}" build.mjs` },
  };
}

test('buildCommand, dry run, build output not on disk → refused before sign-in, telling the caller to build first', () => {
  const { files, manifest } = buildApp(true);
  withApp(files, manifest, (t) => {
    const r = upload(t, { dryRun: true });
    assert.equal(r.code, 1, r.out);
    assert.ok(r.out.includes(`missing source: sources[0].path "dist" -> ${path.join(t.app, 'dist')} (does not exist)`), r.out);
    assert.ok(r.out.includes(`build first (run \`${manifest.buildCommand}\` in ${t.app}), then re-run the dry run.`), r.out);
    assert.ok(!fs.existsSync(path.join(t.app, 'dist')), 'the dry run did not build');
    assertNoNetwork(r.out);
  });
});

test('buildCommand, real upload: the check runs AFTER the build, so the build output is uploaded', () => {
  const { files, manifest } = buildApp(true);
  withApp(files, manifest, (t) => {
    const r = upload(t, { dryRun: false });
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /MOCK invoke get_site_build_config/);
    const token = r.out.match(/MOCK invoke get_site_deploy_token (.*)/);
    assert.ok(token, r.out);
    assert.deepEqual(JSON.parse(token[1]).sort(), ['index.html', 'robots.txt']);
    assert.doesNotMatch(r.out, /refused/);
  });
});

test('buildCommand, real upload, the build does not produce its source → refused after the build, before the deploy token', () => {
  const { files, manifest } = buildApp(false);
  withApp(files, manifest, (t) => {
    const r = upload(t, { dryRun: false });
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /MOCK invoke get_site_build_config/, 'the build env was fetched for the build');
    assert.ok(r.out.includes(`The manifest's buildCommand (${manifest.buildCommand}) ran and completed, and did not produce them.`), r.out);
    assert.doesNotMatch(r.out, /MOCK invoke get_site_deploy_token/);
    assert.doesNotMatch(r.out, /MOCK put/);
  });
});

test('-p directory with no files is refused (exit 1) before any deploy token, the server unchanged', () => {
  const parent = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'site-empty-p-')));
  try {
    const ws = path.join(parent, 'ws');
    fs.mkdirSync(path.join(ws, '.descix'), { recursive: true });
    fs.writeFileSync(path.join(ws, '.descix', 'workspace.json'), JSON.stringify({
      version: '3.0', type: 'workspace',
      env: { apiUrl: 'https://dev.descix.net', app: { appId: 'solo-app', communityId: 'solo-app', kbId: 'General' } },
    }));
    const empty = path.join(parent, 'empty');
    fs.mkdirSync(empty);
    const env = { ...process.env, HOME: parent };
    delete env.DESCIX_API_URL;
    const r = spawnSync(process.execPath, ['--import', MOCK, CLI, '--env=dev', 'site', 'upload', '-a', 'solo-app', '-p', empty, '--dry-run'],
      { cwd: ws, env, encoding: 'utf8', timeout: 60000 });
    const out = `${r.stdout || ''}${r.stderr || ''}`;
    assert.equal(r.status, 1, out);
    assert.ok(out.includes(`No files to deploy: the directory ${empty} supplies no file.`), out);
    assert.match(out, /the site on the server was not changed/);
    assert.doesNotMatch(out, /MOCK invoke/);
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

test('-p naming a symbolic link is refused, naming its target; nothing is sent', () => {
  const parent = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'site-link-p-')));
  try {
    const ws = path.join(parent, 'ws');
    fs.mkdirSync(path.join(ws, '.descix'), { recursive: true });
    fs.writeFileSync(path.join(ws, '.descix', 'workspace.json'), JSON.stringify({
      version: '3.0', type: 'workspace',
      env: { apiUrl: 'https://dev.descix.net', app: { appId: 'solo-app', communityId: 'solo-app', kbId: 'General' } },
    }));
    fs.mkdirSync(path.join(parent, 'real'));
    fs.writeFileSync(path.join(parent, 'real', 'index.html'), '<p>r</p>');
    const link = path.join(parent, 'dist');
    fs.symlinkSync('real', link);
    const env = { ...process.env, HOME: parent };
    delete env.DESCIX_API_URL;
    const r = spawnSync(process.execPath, ['--import', MOCK, CLI, '--env=dev', 'site', 'upload', '-a', 'solo-app', '-p', link, '--dry-run'],
      { cwd: ws, env, encoding: 'utf8', timeout: 60000 });
    const out = `${r.stdout || ''}${r.stderr || ''}`;
    assert.equal(r.status, 1, out);
    assert.ok(out.includes(`Site upload refused: source refused: -p -> ${link} is a symbolic link to real;`), out);
    assert.doesNotMatch(out, /MOCK invoke/);
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});
