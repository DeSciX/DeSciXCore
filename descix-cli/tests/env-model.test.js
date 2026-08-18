/**
 * Conformance for the CLI environment model (CEO ruling, 2026-08-18).
 *
 * The shipped default is PROD. `set-env dev` writes the CLOUD dev URL — it no
 * longer deletes env.apiUrl and it never derives localhost from an environment
 * NAME. A local backend is a URL you name (`set-env dev --url https://localhost:4000`
 * or env.apiUrl direct), because a URL is configuration and an environment is a
 * place. The origins themselves have ONE owner (@descix/app-sdk/dev envOrigins);
 * ENV_MAP adds only the CLI's Secret Manager label.
 *
 * Run: `node --test tests/env-model.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { WorkspaceConfig } from '../lib/workspace-config.js';
import { ENV_ORIGINS, DEFAULT_API_URL } from '@descix/app-sdk/dev';

async function tempWorkspace(t, env = {}) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-test-envmodel-'));
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
  await fs.writeFile(
    path.join(wsRoot, '.descix', 'workspace.json'),
    JSON.stringify({ version: '2.1', workspaceRoot: wsRoot, type: 'workspace', env }, null, 2)
  );
  t.after(async () => { await fs.rm(wsRoot, { recursive: true, force: true }); });
  return wsRoot;
}

test('ENV_MAP consumes the one owner of env origins — no hand-listed URLs', () => {
  assert.equal(WorkspaceConfig.ENV_MAP.dev.url, ENV_ORIGINS.dev);
  assert.equal(WorkspaceConfig.ENV_MAP.demo.url, ENV_ORIGINS.demo);
  assert.equal(WorkspaceConfig.ENV_MAP.prod.url, ENV_ORIGINS.prod);
});

test('every named environment carries a URL — dev is no longer null', () => {
  for (const [name, entry] of Object.entries(WorkspaceConfig.ENV_MAP)) {
    assert.ok(entry.url, `${name} must resolve to a URL`);
    assert.doesNotMatch(entry.url, /localhost|127\.0\.0\.1/, `${name} must not be a local origin`);
  }
  assert.equal(WorkspaceConfig.ENV_MAP.dev.secretLabel, 'DEBUG');
  assert.equal(WorkspaceConfig.ENV_MAP.prod.secretLabel, 'LIVE');
});

test('an unconfigured workspace resolves to the shipped PROD default', async (t) => {
  const wsRoot = await tempWorkspace(t, { products: [] });
  const ws = await WorkspaceConfig.load(wsRoot);
  assert.equal(ws.getApiUrl(), DEFAULT_API_URL);
  assert.equal(ws.getApiUrl(), 'https://descix.net');
});

test('an environment NAME never derives localhost from a platform port', async (t) => {
  // The old behaviour: environment 'DEV' + platform.microservice.port 4000 silently
  // resolved to https://localhost:4000. That derivation is deleted.
  const wsRoot = await tempWorkspace(t, {
    environment: 'DEV',
    platform: { appId: 'daita', localPath: 'p', microservice: { port: 4000 } },
    products: [],
  });
  const ws = await WorkspaceConfig.load(wsRoot);
  assert.equal(ws.getApiUrl(), DEFAULT_API_URL);
});

test('set-env dev WRITES the cloud dev URL (it used to delete the key)', async (t) => {
  const wsRoot = await tempWorkspace(t, { products: [] });
  const ws = await WorkspaceConfig.load(wsRoot);
  const res = await ws.setEnvironment('dev');

  assert.equal(res.apiUrl, ENV_ORIGINS.dev);
  assert.equal(res.environment, 'DEV');
  assert.equal(res.secretLabel, 'DEBUG');

  const onDisk = JSON.parse(await fs.readFile(path.join(wsRoot, '.descix', 'workspace.json'), 'utf8'));
  assert.equal(onDisk.env.apiUrl, ENV_ORIGINS.dev, 'set-env dev must persist a URL');

  const reloaded = await WorkspaceConfig.load(wsRoot);
  assert.equal(reloaded.getApiUrl(), ENV_ORIGINS.dev);
});

test('localhost is reached by naming a URL, not by naming an environment', async (t) => {
  const wsRoot = await tempWorkspace(t, { products: [] });
  const ws = await WorkspaceConfig.load(wsRoot);
  const res = await ws.setEnvironment('dev', 'https://localhost:4000');

  assert.equal(res.apiUrl, 'https://localhost:4000');
  assert.equal(res.secretLabel, 'DEBUG', 'the secret label still follows the env name');

  const onDisk = JSON.parse(await fs.readFile(path.join(wsRoot, '.descix', 'workspace.json'), 'utf8'));
  assert.equal(onDisk.env.apiUrl, 'https://localhost:4000');
});

test('set-env prod and demo persist their canonical origins', async (t) => {
  for (const name of ['prod', 'demo']) {
    const wsRoot = await tempWorkspace(t, { products: [] });
    const ws = await WorkspaceConfig.load(wsRoot);
    const res = await ws.setEnvironment(name);
    assert.equal(res.apiUrl, ENV_ORIGINS[name], name);
  }
});
