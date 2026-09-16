/**
 * `descix config set-url` is RETIRED, and the top-level `apiUrl` it wrote is refused by name.
 *
 * WHY (measured 2026-09-16): `descix config set-url https://localhost:4000` exited 0 and printed
 * "✅ Configuration updated! ... Saved to: .descix/workspace.json" while env.apiUrl stayed
 * https://dev.descix.net. setUrl() assigned a TOP-LEVEL `apiUrl`; save() serializes only its
 * OWNED keys (version, workspaceRoot, type, env, driveConfig) so the value landed nowhere; and
 * getApiUrl()/api-client/workspace-identity still READ that slot as `legacyApiUrl`. A write with
 * no reader on the write path, reported as success. The exit code alone passed on the defect,
 * which is why every assertion below reads the VALUE, never just the code.
 *
 * These run the REAL binary against a temp workspace. Run: `node --test tests/config-set-url-retired.test.js`.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveOrigin, ORIGIN_SOURCE_LABELS } from '../lib/origin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(__dirname, '..', 'bin', 'descix.js');
const CONFIGURED = 'https://dev.descix.net';

function withWorkspace(fn, extraTopLevel = {}) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cfg-set-url-')));
  try {
    fs.mkdirSync(path.join(dir, '.descix'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, '.descix', 'workspace.json'),
      JSON.stringify({ version: '2.1', type: 'workspace', env: { apiUrl: CONFIGURED, products: [] }, ...extraTopLevel }, null, 2),
    );
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** Run the CLI in `cwd` with DESCIX_API_URL unset so only the workspace can name an origin. */
function cli(cwd, args) {
  const env = { ...process.env };
  delete env.DESCIX_API_URL;
  try {
    const out = execFileSync(process.execPath, [CLI, ...args], { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
}

const fileOf = (dir) => JSON.parse(fs.readFileSync(path.join(dir, '.descix', 'workspace.json'), 'utf8'));

// ------------------------------------------------------------------ the retired command

test('config set-url exits non-zero, names the three live surfaces, and moves nothing', () => {
  withWorkspace((dir) => {
    const r = cli(dir, ['config', 'set-url', 'https://localhost:4000']);
    assert.notEqual(r.code, 0, 'a retired command must not exit 0');
    assert.doesNotMatch(r.out, /Configuration updated/, 'the old success banner must be gone');
    assert.match(r.out, /--api-url/, 'must name the per-run surface');
    assert.match(r.out, /config init --env/, 'must name the known-env surface');
    assert.match(r.out, /set-env <name> --url/, 'must name the custom-origin surface');

    const file = fileOf(dir);
    assert.equal(file.env.apiUrl, CONFIGURED, 'env.apiUrl must be untouched');
    assert.equal('apiUrl' in file, false, 'no top-level apiUrl may be written');
  });
});

test('config --help no longer lists set-url (positive control: it still lists set-env)', () => {
  withWorkspace((dir) => {
    const { out } = cli(dir, ['config', '--help']);
    assert.doesNotMatch(out, /set-url/);
    assert.match(out, /set-env/, 'control: the help text is being read at all');
  });
});

// ------------------------------------------------------------------ the retired slot on disk

test('load() refuses a v2.1 file carrying a top-level apiUrl, naming env.apiUrl and the remedy', () => {
  withWorkspace((dir) => {
    const r = cli(dir, ['config', 'show']);
    assert.notEqual(r.code, 0, 'a retired key that nothing reads must not load silently');
    assert.match(r.out, /top-level "apiUrl"/);
    assert.match(r.out, /env\.apiUrl/);
    assert.match(r.out, /--api-url/);
    // the refusal is not destructive: the file is exactly what we wrote
    assert.equal(fileOf(dir).apiUrl, 'https://stale.example');
  }, { apiUrl: 'https://stale.example' });
});

test('control: the same file WITHOUT the retired key loads and config show exits 0', () => {
  withWorkspace((dir) => {
    const r = cli(dir, ['config', 'show']);
    assert.equal(r.code, 0, r.out);
  });
});

// ------------------------------------------------------------------ the origin owner

test('the origin owner has no legacy source: a removed key cannot name an origin', () => {
  assert.equal('legacyApiUrl' in ORIGIN_SOURCE_LABELS, false);
  const r = resolveOrigin({ envVar: null, legacyApiUrl: 'https://legacy.example', globalApiUrl: null });
  assert.equal(r.isDefault, true, 'a key outside PRECEDENCE must not resolve');
  assert.notEqual(r.origin, 'https://legacy.example');
});

test('positive control: env.apiUrl still resolves through the owner with its own label', () => {
  const r = resolveOrigin({ envVar: null, workspaceEnvApiUrl: CONFIGURED, globalApiUrl: null });
  assert.equal(r.origin, CONFIGURED);
  assert.equal(r.source, ORIGIN_SOURCE_LABELS.workspaceEnvApiUrl);
  assert.equal(r.isDefault, false);
});
