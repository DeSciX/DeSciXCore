/**
 * `descix plugin check [dir]` — the executing binary, run against plugin directories laid out on
 * disk. Exit codes: 0 clean, 1 a violation, 2 a file that cannot be read. Over-limit values are
 * built from CLAUDE_PLUGIN_LIMITS, so this file names no limit of its own.
 *
 * Run: `node --test tests/plugin-check.test.js` from descix-cli/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CLAUDE_PLUGIN_LIMITS } from '../lib/core/ClaudePluginLimits.js';

const BIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'descix.js');
const pluginMax = CLAUDE_PLUGIN_LIMITS.find((r) => r.surface === 'plugin' && r.check === 'max-length');

async function tmp(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-plugin-check-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}
async function put(root, rel, content) {
  const f = path.join(root, rel);
  await fs.mkdir(path.dirname(f), { recursive: true });
  await fs.writeFile(f, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
}
const skill = (description) => `---\nname: s\ndescription: ${JSON.stringify(description)}\n---\n\nbody\n`;

/** Run `descix plugin check [dir]` with cwd, an empty HOME and no DESCIX_* variables. */
async function check(t, { cwd, dir }) {
  const home = await tmp(t);
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('DESCIX_')));
  Object.assign(env, { HOME: home, NO_COLOR: '1' });
  const args = [BIN, 'plugin', 'check', ...(dir === undefined ? [] : [dir])];
  const r = spawnSync(process.execPath, args, { cwd, env, encoding: 'utf8', timeout: 60_000 });
  return { status: r.status, out: r.stdout, err: r.stderr };
}

async function cleanPlugin(root) {
  await put(root, '.claude-plugin/plugin.json', { name: 'p', description: 'A plugin.' });
  await put(root, 'skills/s/SKILL.md', skill('Use this skill for owner/repo lookups.'));
  await put(root, 'agents/a.md', skill('An agent.'));
}

test('plugin check: a clean plugin dir (the cwd, no argument) exits 0 with a one-line OK', async (t) => {
  const root = await tmp(t);
  await cleanPlugin(root);
  const r = await check(t, { cwd: root });
  assert.equal(r.status, 0, `stdout:\n${r.out}\nstderr:\n${r.err}`);
  const lines = r.out.trim().split('\n').filter((l) => l.startsWith('plugin check:'));
  assert.equal(lines.length, 1);
  assert.match(lines[0], /^plugin check: OK/);
});

test('plugin check: an over-limit plugin.json description exits 1, naming file, field, rule and length', async (t) => {
  const root = await tmp(t);
  await cleanPlugin(root);
  const len = pluginMax.limit + 1;
  await put(root, '.claude-plugin/plugin.json', { name: 'p', description: 'x'.repeat(len) });
  const r = await check(t, { cwd: os.tmpdir(), dir: root });
  assert.equal(r.status, 1, `stdout:\n${r.out}\nstderr:\n${r.err}`);
  const line = r.out.split('\n').find((l) => l.includes(pluginMax.id));
  assert.ok(line, `no line names ${pluginMax.id}:\n${r.out}`);
  assert.match(line, new RegExp(`${path.join('.claude-plugin', 'plugin.json').replace(/\./g, '\\.')}\\s+description\\s+${pluginMax.id}\\s+length ${len}\\b`));
});

test('plugin check: an angle bracket in a skill description exits 1, naming the offending characters', async (t) => {
  const root = await tmp(t);
  await cleanPlugin(root);
  await put(root, 'skills/s/SKILL.md', skill('Look up <owner/repo>.'));
  const r = await check(t, { cwd: root, dir: '.' });
  assert.equal(r.status, 1, `stdout:\n${r.out}\nstderr:\n${r.err}`);
  assert.match(r.out, /skills\/s\/SKILL\.md\s+description\s+skill-description-no-angle-brackets\s+offending '<' '>'/);
});

test('plugin check: unreadable frontmatter exits 2, naming the file it could not read', async (t) => {
  const root = await tmp(t);
  await cleanPlugin(root);
  await put(root, 'skills/s/SKILL.md', 'name: s\ndescription: no opening fence\n');
  const r = await check(t, { cwd: root });
  assert.equal(r.status, 2, `stdout:\n${r.out}\nstderr:\n${r.err}`);
  assert.match(r.err, /plugin check: could not read .*skills\/s\/SKILL\.md: no YAML frontmatter/);
  assert.doesNotMatch(r.out, /OK/);
});

test('plugin check: a file the process cannot read exits 2, naming the file and EACCES', {
  skip: typeof process.getuid === 'function' && process.getuid() === 0
    ? 'running as root: chmod 000 does not stop root from reading, so EACCES cannot be produced'
    : false,
}, async (t) => {
  const root = await tmp(t);
  await cleanPlugin(root);
  const file = path.join(root, 'agents', 'a.md');
  await fs.chmod(file, 0o000);
  const r = await check(t, { cwd: root });
  assert.equal(r.status, 2, `stdout:\n${r.out}\nstderr:\n${r.err}`);
  assert.match(r.err, /plugin check: could not read .*agents\/a\.md: read failed with EACCES/);
});
