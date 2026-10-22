/**
 * GATE: WorkspaceConfig.empty(root) is the ONE owner of the empty workspace shape.
 *
 * Four verbs create a workspace where none exists (`config init`, `config set-env`, `init`,
 * `app init`). Each used to hand-build the empty bag, and two of them carried version '2.1'
 * while save() writes '3.0'. A hand-built literal anywhere outside workspace-config.js is the
 * drift this gate refuses.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WorkspaceConfig } from '../lib/workspace-config.js';

const CLI_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OWNER = join('lib', 'workspace-config.js');
const HAND_BUILT = /new\s+WorkspaceConfig\s*\(\s*\{/;
const SITES = [
  ['lib/commands/config.js', 2],
  ['lib/commands/appInit.js', 1],
  ['lib/commands/init.js', 1],
];

async function sourceFiles(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await sourceFiles(p));
    else if (/\.(m?js)$/.test(e.name)) out.push(p);
  }
  return out;
}

test('no source file outside workspace-config.js hand-builds a WorkspaceConfig literal', async () => {
  const files = [...await sourceFiles(join(CLI_ROOT, 'lib')), ...await sourceFiles(join(CLI_ROOT, 'bin'))];
  assert.ok(files.length > 10, `scanned only ${files.length} files: the scan is not reading the tree`);
  const offenders = [];
  for (const f of files) {
    const rel = relative(CLI_ROOT, f);
    if (rel === OWNER) continue;
    const lines = (await readFile(f, 'utf-8')).split('\n');
    lines.forEach((l, i) => { if (HAND_BUILT.test(l)) offenders.push(`${rel}:${i + 1}: ${l.trim()}`); });
  }
  assert.deepEqual(offenders, [], `hand-built workspace bag; use WorkspaceConfig.empty(root):\n${offenders.join('\n')}`);
});

test('the four create-a-workspace sites consume WorkspaceConfig.empty()', async () => {
  for (const [rel, n] of SITES) {
    const src = await readFile(join(CLI_ROOT, rel), 'utf-8');
    const count = (src.match(/WorkspaceConfig\.empty\(/g) || []).length;
    assert.equal(count, n, `${rel}: expected ${n} WorkspaceConfig.empty( call(s), found ${count}`);
  }
});

test('the pattern catches a hand-built literal (the gate can fail)', () => {
  assert.ok(HAND_BUILT.test("new WorkspaceConfig({ version: '2.1', type: 'workspace', env: {} }, process.cwd())"));
  assert.ok(!HAND_BUILT.test('WorkspaceConfig.empty(process.cwd())'));
});

test('empty(root) is v3, rooted, with no app — and saves as v3', async () => {
  const root = await mkdtemp(join(tmpdir(), 'descix-ws-empty-'));
  const cfg = WorkspaceConfig.empty(root);
  assert.equal(cfg.version, '3.0');
  assert.equal(cfg.type, 'workspace');
  assert.deepEqual(cfg.env, {});
  assert.equal(cfg.workspaceRoot, root);

  await cfg.setEnvironment('dev');
  const saved = JSON.parse(await readFile(join(root, '.descix', 'workspace.json'), 'utf-8'));
  assert.equal(saved.version, '3.0');
  assert.equal(saved.type, 'workspace');
  assert.equal(saved.env.environment, 'DEV');
  assert.equal(saved.env.platform, undefined);
  assert.equal(saved.env.products, undefined);

  const reloaded = await WorkspaceConfig.load(root);
  assert.equal(reloaded.version, '3.0');
});

test('empty() with no root is refused, not rooted at an implicit directory', () => {
  assert.throws(() => WorkspaceConfig.empty(), /root is required/);
});
