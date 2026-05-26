/**
 * Tests for multi-manifest KB support (WS-CLI-V2.1-PURGE DN-2 validation).
 *
 * Coverage:
 *  - An app with TWO manifests (Corpus.json + Training.json) can be enumerated
 *  - ManifestLoader correctly loads both manifests for a single app
 *  - WorkspaceConfig correctly resolves kbId (default) while both manifests exist
 *  - The platform model: N KBs per app via N manifest files is correctly expressed
 *
 * Design: synthesizes a temp app directory with two manifest files.
 * Does NOT test actual Pinecone sync (requires live platform) — tests the
 * manifest enumeration and loading layer only (ManifestLoader + WorkspaceConfig).
 *
 * Per CEO directive 2026-05-09: gaps are reported non-blocking.
 *
 * Run: `node --test tests/multi-manifest.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { WorkspaceConfig } from '../lib/workspace-config.js';
import { loadManifests } from '../lib/core/ManifestLoader.js';

/**
 * Create a temp workspace + app directory with two manifest files.
 * Returns: { wsRoot, appRoot, appId }
 */
async function makeMultiManifestFixture(t) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-multimf-'));
  const appId = 'testapp-multimanifest';
  const appRoot = path.join(wsRoot, 'apps', appId);

  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
  await fs.mkdir(path.join(appRoot, '.descix', 'manifests'), { recursive: true });
  await fs.mkdir(path.join(appRoot, 'docs'), { recursive: true });

  // Write a test source file for manifests to reference
  await fs.writeFile(
    path.join(appRoot, 'docs', 'intro.md'),
    '# Introduction\n\nThis is a test document for Corpus KB.\n'
  );
  await fs.writeFile(
    path.join(appRoot, 'docs', 'training-notes.md'),
    '# Training Notes\n\nThis is a test document for Training KB.\n'
  );

  // Corpus manifest — uses canonical ManifestLoader schema (kb_name, sources[].path)
  const corpusManifest = {
    kb_name: 'Corpus',
    sync_mode: 'local',
    sources: [{ path: 'docs', tier: 1, doc_type: 'documentation' }]
  };
  await fs.writeFile(
    path.join(appRoot, '.descix', 'manifests', 'Corpus.json'),
    JSON.stringify(corpusManifest, null, 2)
  );

  // Training manifest — uses canonical ManifestLoader schema
  const trainingManifest = {
    kb_name: 'Training',
    sync_mode: 'local',
    sources: [{ path: 'docs', tier: 2, doc_type: 'training' }]
  };
  await fs.writeFile(
    path.join(appRoot, '.descix', 'manifests', 'Training.json'),
    JSON.stringify(trainingManifest, null, 2)
  );

  // Workspace config
  const workspace = {
    version: '2.1',
    workspaceRoot: wsRoot,
    type: 'workspace',
    env: {
      products: [{ appId, localPath: path.join('apps', appId), kbId: 'Corpus' }]
    }
  };
  await fs.writeFile(
    path.join(wsRoot, '.descix', 'workspace.json'),
    JSON.stringify(workspace, null, 2)
  );

  t.after(async () => {
    await fs.rm(wsRoot, { recursive: true, force: true });
  });

  return { wsRoot, appRoot, appId };
}

// ─────────────────────────────────────────────────────────────────────────────

test('multi-manifest — app directory with two manifests: Corpus.json + Training.json', async (t) => {
  const { appRoot } = await makeMultiManifestFixture(t);
  const manifestsDir = path.join(appRoot, '.descix', 'manifests');

  const entries = await fs.readdir(manifestsDir);
  const jsonFiles = entries.filter(e => e.endsWith('.json')).sort();

  assert.deepEqual(
    jsonFiles,
    ['Corpus.json', 'Training.json'],
    'fixture must have exactly Corpus.json and Training.json in manifests dir'
  );
});

test('multi-manifest — ManifestLoader loads both manifests when kb is omitted', async (t) => {
  const { wsRoot, appRoot, appId } = await makeMultiManifestFixture(t);

  // loadManifests(appRoot, workspaceRoot, filterKbName?) — omit filterKbName to load all
  const manifests = await loadManifests(appRoot, wsRoot);

  assert.ok(Array.isArray(manifests), 'loadManifests must return an array');
  assert.ok(manifests.length >= 2, `must load at least 2 manifests; got ${manifests.length}`);

  const kbIds = manifests.map(m => m.kb_name).sort();
  assert.ok(kbIds.includes('Corpus'), 'Corpus manifest must be loaded');
  assert.ok(kbIds.includes('Training'), 'Training manifest must be loaded');
});

test('multi-manifest — ManifestLoader loads only Corpus manifest when kb=Corpus', async (t) => {
  const { wsRoot, appRoot } = await makeMultiManifestFixture(t);

  const manifests = await loadManifests(appRoot, wsRoot, 'Corpus');

  assert.ok(Array.isArray(manifests), 'loadManifests must return an array');
  assert.equal(manifests.length, 1, 'must load exactly 1 manifest for kb=Corpus');
  assert.equal(manifests[0].kb_name, 'Corpus', 'loaded manifest must be Corpus');
});

test('multi-manifest — ManifestLoader loads only Training manifest when kb=Training', async (t) => {
  const { wsRoot, appRoot } = await makeMultiManifestFixture(t);

  const manifests = await loadManifests(appRoot, wsRoot, 'Training');

  assert.ok(Array.isArray(manifests), 'loadManifests must return an array');
  assert.equal(manifests.length, 1, 'must load exactly 1 manifest for kb=Training');
  assert.equal(manifests[0].kb_name, 'Training', 'loaded manifest must be Training');
});

test('multi-manifest — WorkspaceConfig kbId is default chat target only, not a constraint', async (t) => {
  const { wsRoot, appRoot, appId } = await makeMultiManifestFixture(t);

  const config = await WorkspaceConfig.load(wsRoot);
  const appConfig = config.getAppByAppId(appId);

  // kbId in workspace.json is "Corpus" — the DEFAULT chat target
  assert.equal(
    appConfig.kbId,
    'Corpus',
    'workspace.json kbId must be the default KB (Corpus)'
  );

  // But the manifests directory still has Training.json too
  const manifestsDir = path.join(appRoot, '.descix', 'manifests');
  const entries = await fs.readdir(manifestsDir);
  const hasTraining = entries.includes('Training.json');
  assert.ok(
    hasTraining,
    'Training.json must exist independently of kbId default — multi-KB model is file-system enumeration, not workspace.json constraint'
  );
});

test('multi-manifest — each manifest carries correct kbId for Pinecone bucket routing', async (t) => {
  const { wsRoot, appRoot } = await makeMultiManifestFixture(t);

  const allManifests = await loadManifests(appRoot, wsRoot);

  for (const manifest of allManifests) {
    assert.ok(
      manifest.kb_name && manifest.kb_name.length > 0,
      `every manifest must have a non-empty kb_name for Pinecone bucket routing; got: ${JSON.stringify(manifest.kb_name)}`
    );
  }
});
