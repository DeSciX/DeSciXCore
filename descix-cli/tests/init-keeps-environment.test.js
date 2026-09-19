/**
 * `descix init` EXTENDS an existing workspace — it never discards the environment a developer
 * chose with `descix config init --env dev`.
 *
 * Measured 2026-09-19 (devx review, reproduced): `config init --env dev` wrote env.apiUrl
 * https://dev.descix.net and environment DEV; `init -c daita -a myapp --force` then wrote a
 * brand-new file over it, and `config show` reported prod. The documented order — pick DEV, then
 * init — ended on PROD, so the developer's next writes went to production.
 *
 * Run: node --test tests/init-keeps-environment.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.resolve(__dirname, '..', 'bin', 'descix.js');
const run = (cwd, ...args) => {
    try { return execFileSync(process.execPath, [BIN, ...args], { cwd, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' }); }
    catch (e) { return (e.stdout || '') + (e.stderr || ''); }
};
const ws = (dir) => JSON.parse(fs.readFileSync(path.join(dir, '.descix', 'workspace.json'), 'utf8'));

function devWorkspace(t) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'descix-init-env-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    run(dir, '--env', 'dev', 'config', 'init');
    assert.equal(ws(dir).env.apiUrl, 'https://dev.descix.net', 'fixture: config init must have chosen DEV');
    return dir;
}

test('init ADDS the app and keeps the chosen environment', (t) => {
    const dir = devWorkspace(t);
    run(dir, 'init', '-c', 'daita', '-a', 'firstapp', '--yes');
    run(dir, 'init', '-c', 'daita', '-a', 'myapp', '--yes');
    const w = ws(dir);
    assert.equal(w.env.apiUrl, 'https://dev.descix.net');
    assert.equal(w.env.environment, 'DEV');
    assert.deepEqual(w.env.products.map((p) => p.appId), ['firstapp', 'myapp']);
});

test('--force restarts the APP registrations and still keeps the environment', (t) => {
    const dir = devWorkspace(t);
    run(dir, 'init', '-c', 'daita', '-a', 'firstapp', '--yes');
    run(dir, 'init', '-c', 'daita', '-a', 'myapp', '--yes', '--force');
    const w = ws(dir);
    assert.equal(w.env.apiUrl, 'https://dev.descix.net', 'THE REGRESSION: --force used to erase this');
    assert.deepEqual(w.env.products.map((p) => p.appId), ['myapp']);
});

test('config show agrees: the environment is still DEV after init', (t) => {
    const dir = devWorkspace(t);
    run(dir, 'init', '-c', 'daita', '-a', 'myapp', '--yes', '--force');
    assert.match(run(dir, 'config', 'show'), /Environment:\s+dev/i);
});

test('a NEW workspace records the environment the run named (descix --env dev init …)', (t) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'descix-init-newenv-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    run(dir, '--env', 'dev', 'init', '-c', 'daita', '-a', 'myapp', '--yes');
    const w = ws(dir);
    assert.equal(w.env.apiUrl, 'https://dev.descix.net', 'without this the next command fell back to PROD');
    assert.equal(w.env.environment, 'DEV');
});

test('NEGATIVE CONTROL: with no --env a new workspace pins nothing — the documented default applies', (t) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'descix-init-noenv-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    run(dir, 'init', '-c', 'daita', '-a', 'myapp', '--yes');
    assert.equal(ws(dir).env.apiUrl, undefined);
});
