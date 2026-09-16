/**
 * GATE: `descix config show` prints the origin commands will USE and who chose it, and warns when
 * something outranks the workspace pin.
 *
 * THE DEFECT (JARVIS-FRAQTL, 2026-09-16): with DESCIX_API_URL inherited in the shell, every command
 * ran against production while `config show` printed the workspace file's dev origin — two
 * derivations of one fact. Both surfaces now consume api-client.js::resolveEffectiveOrigin.
 *
 * Runs the real CLI in a temp workspace with HOME pointed at an empty temp dir, so no real
 * ~/.descix/config.json or credential participates. No network.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'descix.js');

function workspace(t) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cfg-show-')));
  const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cfg-show-home-')));
  fs.mkdirSync(path.join(dir, '.descix'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.descix', 'workspace.json'),
    JSON.stringify({ version: '2.1', type: 'workspace', env: { apiUrl: 'https://dev.descix.net', products: [] } }, null, 2));
  t.after(() => { fs.rmSync(dir, { recursive: true, force: true }); fs.rmSync(home, { recursive: true, force: true }); });
  return { dir, home };
}
function show({ dir, home }, extraEnv = {}, args = []) {
  const env = { ...process.env, HOME: home, ...extraEnv };
  if (!('DESCIX_API_URL' in extraEnv)) delete env.DESCIX_API_URL;
  return execFileSync(process.execPath, [CLI, ...args, 'config', 'show'], { cwd: dir, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

test('control: with nothing overriding, config show prints the workspace pin and names it as the source', (t) => {
  const out = show(workspace(t));
  assert.match(out, /API URL:\s+https:\/\/dev\.descix\.net/);
  assert.match(out, /Chosen by:\s+\.descix\/workspace\.json env\.apiUrl/);
  assert.doesNotMatch(out, /overrides it/);
});

test('an inherited DESCIX_API_URL is shown as the origin in use, with a warning naming the overridden pin', (t) => {
  const out = show(workspace(t), { DESCIX_API_URL: 'https://descix.net' });
  assert.match(out, /API URL:\s+https:\/\/descix\.net/, 'must print the origin commands will use, not the file value');
  assert.match(out, /Environment:\s+prod/);
  assert.match(out, /Chosen by:\s+DESCIX_API_URL environment variable/);
  assert.match(out, /pins https:\/\/dev\.descix\.net \(dev\), but DESCIX_API_URL environment variable overrides it/);
});

test('the --env flag is named as the chooser too', (t) => {
  const out = show(workspace(t), {}, ['--env', 'prod']);
  assert.match(out, /Chosen by:\s+--env flag/);
  assert.match(out, /overrides it/);
});
