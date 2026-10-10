/**
 * GATE: `descix config show` prints every workspace fact a developer would otherwise have to
 * read .descix/workspace.json to verify: the app's kbId, its site block, and env.gateway.port.
 *
 * THE DEFECT (field, 2026-10-10, five-repo v3 migration): after `app init -a egpt --kb Corpus`
 * adopted a KB, and after `config set-gateway-port 5173`, `config show` printed neither — the
 * verbs' effects were unverifiable from any verb, so the developer had to hand-read the file
 * the CLI exists to own.
 *
 * Runs the real CLI in a temp workspace with HOME pointed at an empty temp dir. No network.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'descix.js');

function workspace(t, env) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cfg-show-v3-')));
  const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cfg-show-v3-home-')));
  fs.mkdirSync(path.join(dir, '.descix'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.descix', 'workspace.json'),
    JSON.stringify({ version: '3.0', type: 'workspace', env: { apiUrl: 'https://dev.descix.net', ...env } }, null, 2));
  t.after(() => { fs.rmSync(dir, { recursive: true, force: true }); fs.rmSync(home, { recursive: true, force: true }); });
  return { dir, home };
}
function show({ dir, home }) {
  const env = { ...process.env, HOME: home };
  delete env.DESCIX_API_URL;
  return execFileSync(process.execPath, [CLI, 'config', 'show'], { cwd: dir, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

test('a v3 app workspace shows the app, its KB, and its dev-server site block', (t) => {
  const out = show(workspace(t, {
    app: {
      appId: 'egpt', communityId: 'egpt', kbId: 'Corpus',
      site: { port: 5173, protocol: 'https' },
    },
  }));
  assert.match(out, /App:\s+egpt/);
  assert.match(out, /KB:\s+Corpus/, 'the adopted KB must be verifiable from the verb');
  assert.match(out, /Site:\s+dev server on port 5173 \(https\)/);
});

test('a static site block is shown as its directory', (t) => {
  const out = show(workspace(t, {
    app: { appId: 'daita-docs', communityId: 'daita', kbId: 'General', site: { static: 'site/dist' } },
  }));
  assert.match(out, /Site:\s+static site\/dist/);
});

test('env.gateway.port is shown, so set-gateway-port is verifiable from the verb', (t) => {
  const out = show(workspace(t, { gateway: { port: 5599 } }));
  assert.match(out, /Gateway port:\s+5599/);
});

test('negative control: a workspace with none of these prints none of these lines', (t) => {
  const out = show(workspace(t, {}));
  assert.doesNotMatch(out, /KB:/);
  assert.doesNotMatch(out, /Site:/);
  assert.doesNotMatch(out, /Gateway port:/);
});
