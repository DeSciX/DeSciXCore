/**
 * `descix kb create` — the verb that creates a KB on an EXISTING app (defect measured 2026-10-19 on
 * cli 4.0.0, PROD: nothing created a second KB, while `kb corpus sync` told developers to run
 * `app init --kb` and `app init` refused exactly that).
 *
 * Drives the REAL binary with the backend mocked (tests/tools/cli-mock-backend.mjs; init_git_mode_kb
 * is answered by CLI_MOCK_INIT_KB). init_git_mode_kb is idempotent on the server (`created: false`
 * for an existing KB), so the CLI is what turns that answer into a refusal.
 *
 * Run: `node --test tests/kb-create.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CANONICAL_KB_CREATE, kbCreateInvocation } from '../lib/commands/kb-sync-surface.js';
import { runAppInit } from '../lib/commands/appInit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(__dirname, '..', 'bin', 'descix.js');
const MOCK = path.resolve(__dirname, 'tools', 'cli-mock-backend.mjs');

function tmp(t, prefix) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** The real binary with the backend mocked; `mode` answers init_git_mode_kb. */
function cli(cwd, args, { home, mode } = {}) {
  const env = { ...process.env, HOME: home || cwd };
  delete env.DESCIX_API_URL;
  delete env.CLI_MOCK_INIT_KB;
  if (mode) env.CLI_MOCK_INIT_KB = mode;
  const r = spawnSync(process.execPath, ['--import', MOCK, CLI, '--env=dev', ...args], { cwd, env, encoding: 'utf8', timeout: 60000 });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
}

const sentParams = (out) => {
  const m = out.match(/^MOCK params init_git_mode_kb (.*)$/m);
  return m ? JSON.parse(m[1]) : null;
};

// ── the verb ────────────────────────────────────────────────────────────────────────────────

test('kb create: OK prints the created KB and its app, sends app_id + kb_name only', (t) => {
  const dir = tmp(t, 'kb-create-ok-');
  const r = cli(dir, ['kb', 'create', '-a', 'egpt', '--kb', 'Second'], { mode: 'created' });
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /Knowledge base created/);
  assert.match(r.out, /KB: Second/);
  assert.match(r.out, /App: mock-comm\/egpt/);
  assert.deepEqual(sentParams(r.out), { app_id: 'egpt', kb_name: 'Second' }, r.out);
});

test('kb create: --system-instructions is sent as system_instructions', (t) => {
  const dir = tmp(t, 'kb-create-si-');
  const r = cli(dir, ['kb', 'create', '-a', 'egpt', '-k', 'Second', '--system-instructions', 'Be terse.'], { mode: 'created' });
  assert.equal(r.code, 0, r.out);
  assert.deepEqual(sentParams(r.out), { app_id: 'egpt', kb_name: 'Second', system_instructions: 'Be terse.' }, r.out);
});

test('kb create (negative control): created:false is a refusal — exit 1 naming the KB and `descix kb list`', (t) => {
  const dir = tmp(t, 'kb-create-exists-');
  const r = cli(dir, ['kb', 'create', '-a', 'egpt', '--kb', 'Corpus'], { mode: 'exists' });
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /KB_EXISTS: KB 'Corpus' already exists on 'egpt'/);
  assert.ok(r.out.includes('descix kb list -a egpt'), r.out);
  assert.doesNotMatch(r.out, /Knowledge base created/);
});

test('kb create: an app the platform cannot find → exit 1, the refusal passed through by code and message', (t) => {
  const dir = tmp(t, 'kb-create-404-');
  const r = cli(dir, ['kb', 'create', '-a', 'nope', '--kb', 'Second'], { mode: 'app-not-found' });
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /APP_NOT_FOUND: Could not resolve community for nope\. Run bootstrap first\./);
  assert.doesNotMatch(r.out, /Knowledge base created/);
});

test('kb create: a caller who does not administer the app → exit 1, PERMISSION_DENIED passed through', (t) => {
  const dir = tmp(t, 'kb-create-403-');
  const r = cli(dir, ['kb', 'create', '-a', 'egpt', '--kb', 'Second'], { mode: 'denied' });
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /PERMISSION_DENIED: init_git_mode_kb requires the app owner/);
});

test('kb create: --kb is required — the server-side default name is never reached', (t) => {
  const dir = tmp(t, 'kb-create-nokb-');
  const r = cli(dir, ['kb', 'create', '-a', 'egpt'], { mode: 'created' });
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /required option '-k, --kb <kb_name>' not specified/);
  assert.doesNotMatch(r.out, /MOCK invoke/);
});

// ── self-description: the constant names a verb that has help ───────────────────────────────

test('CANONICAL_KB_CREATE names a verb that exists: its --help exits 0 (and a misspelling exits 1)', (t) => {
  const dir = tmp(t, 'kb-create-help-');
  const tokens = CANONICAL_KB_CREATE.split(' ');
  assert.equal(tokens[0], 'descix');
  const ok = cli(dir, [...tokens.slice(1), '--help']);
  assert.equal(ok.code, 0, ok.out);
  assert.match(ok.out, /Usage: descix kb create \[options\]/);
  assert.match(ok.out, /-k, --kb <kb_name>/);
  // Negative control for the help guard: a verb that does not exist must not appear to have help.
  const bad = cli(dir, ['kb', 'creat', '--help']);
  assert.equal(bad.code, 1, bad.out);
  assert.match(bad.out, /error: unknown command 'creat'/);
  assert.match(bad.out, /'descix kb' has: .*\bcreate\b/);
});

// ── the two messages that name the verb ─────────────────────────────────────────────────────

function git(cwd, ...args) {
  execFileSync('git', args, { cwd, stdio: 'pipe' });
}

test('kb corpus sync --dry-run with an unregistered KB prints a `descix kb create` Fix line per missing KB', (t) => {
  const repo = tmp(t, 'kb-create-corpus-');
  const write = (rel, content) => {
    fs.mkdirSync(path.dirname(path.join(repo, rel)), { recursive: true });
    fs.writeFileSync(path.join(repo, rel), typeof content === 'string' ? content : JSON.stringify(content, null, 2));
  };
  write('.descix/workspace.json', {
    version: '3.0', type: 'workspace',
    env: { apiUrl: 'https://dev.descix.net', app: { appId: 'solo-app', communityId: 'solo-comm', kbId: 'General' } },
  });
  write('.descix/manifests/Missing.json', { kb_name: 'Missing', sync_mode: 'local', sources: [{ path: 'docs', tier: 1, doc_type: 'documentation' }] });
  write('docs/a.md', '# a\n\nCorpus text.\n');
  git(repo, 'init', '-q', '-b', 'main');
  git(repo, 'config', 'user.email', 'test@test');
  git(repo, 'config', 'user.name', 'test');
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', 'seed');

  const r = cli(repo, ['kb', 'corpus', 'sync', '-a', 'solo-app', '-k', 'Missing', '--dry-run']);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /KnowledgeBase document\(s\) missing in Firestore for app "solo-app": Missing/);
  assert.ok(r.out.includes('Fix: run `descix kb create -a solo-app --kb Missing`'), r.out);
  assert.ok(r.out.includes(`Fix: run \`${kbCreateInvocation('solo-app', 'Missing')}\``), r.out);
  assert.doesNotMatch(r.out, /descix app init -a/);
  assert.doesNotMatch(r.out, /MOCK invoke init_git_mode_kb/, 'a dry-run creates nothing');
});

test('app init --kb <missing> on an existing app still refuses, names `descix kb create`, creates nothing', async (t) => {
  const repo = tmp(t, 'kb-create-appinit-');
  const cwd = process.cwd();
  process.chdir(repo);
  t.after(() => process.chdir(cwd));
  t.mock.method(console, 'log', () => {});
  const calls = [];
  const stub = {
    async invoke(command) {
      calls.push(command);
      if (command === 'get_product_context') return { community_id: 'egpt' };
      if (command === 'list_knowledge_bases') return { knowledge_bases: [{ name: 'Corpus' }] };
      throw new Error(`unexpected platform call: ${command}`);
    },
  };
  await assert.rejects(
    () => runAppInit(stub, { app: 'egpt', kb: 'Missing' }),
    (err) => {
      assert.match(err.message, /App 'egpt' has no KB named 'Missing' — it has: Corpus/);
      assert.ok(err.message.includes('`descix kb create -a egpt --kb Missing`'), err.message);
      assert.doesNotMatch(err.message, /its own verb/);
      return true;
    }
  );
  assert.ok(!calls.includes('init_git_mode_kb'), 'mapping an existing app never creates a KB');
});
