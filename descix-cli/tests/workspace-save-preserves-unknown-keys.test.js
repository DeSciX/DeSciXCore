/**
 * GATE: saving workspace.json does not destroy keys this writer does not understand.
 *
 * THE DEFECT. WorkspaceConfig.save() built its output from a fixed field list held in memory
 * (version / workspaceRoot / type / env / driveConfig) and wrote it over the whole file. Any OTHER
 * top-level key on disk was silently deleted by the next `descix app set-port`. It is the writer
 * form of schema-mirror drift — a serializer that re-enumerates a known shape and discards the
 * rest — and it fails toward SILENCE: the write succeeds, the JSON stays well-formed, and the loss
 * surfaces only when whoever owned the missing key comes looking.
 *
 * WHY THE UNKNOWN KEY IS THE FIXTURE. A test using only known keys cannot exhibit this failure
 * however green it runs, because known keys were always re-written. The fixture must carry
 * something the writer has never heard of.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WorkspaceConfig } from '../lib/workspace-config.js';

/** A v2.1 workspace carrying keys this writer owns AND keys it has never heard of. */
async function seedWorkspace(extra = {}) {
  const root = await mkdtemp(join(tmpdir(), 'descix-ws-'));
  await mkdir(join(root, '.descix'), { recursive: true });
  const doc = {
    version: '2.1',
    workspaceRoot: root,
    type: 'workspace',
    env: {
      platform: { appId: 'daita', communityId: 'daita', localPath: '.', kbId: 'General' },
      products: [{ appId: 'egpt-frqtl', communityId: 'egpt', localPath: 'frqtl', kbId: 'General' }],
    },
    ...extra,
  };
  await writeFile(join(root, '.descix', 'workspace.json'), JSON.stringify(doc, null, 2));
  return root;
}

const readDoc = async (root) =>
  JSON.parse(await readFile(join(root, '.descix', 'workspace.json'), 'utf8'));

test('an unknown top-level key survives a save', async () => {
  const root = await seedWorkspace({
    someFutureFeature: { enabled: true, note: 'written by a tool this CLI has never heard of' },
  });

  const cfg = await WorkspaceConfig.load(root);
  await cfg.save();

  const after = await readDoc(root);
  assert.deepEqual(
    after.someFutureFeature,
    { enabled: true, note: 'written by a tool this CLI has never heard of' },
    'save() destroyed a top-level key it does not own'
  );
});

test('an unknown key survives the canonical mutating verb, not just a bare save', async () => {
  // setMicroservicePort is a real write path a developer hits (`descix app set-port`), and it
  // auto-saves. The bare-save test above could pass while every real verb still ate the key.
  const root = await seedWorkspace({ customRegistry: ['a', 'b'] });

  const cfg = await WorkspaceConfig.load(root);
  await cfg.setMicroservicePort('egpt-frqtl', 4310);

  const after = await readDoc(root);
  assert.deepEqual(after.customRegistry, ['a', 'b'], 'set-port destroyed an unowned key');
  const product = after.env.products.find((p) => p.appId === 'egpt-frqtl');
  assert.equal(product.microservice.port, 4310, 'the port write itself must still land');
});

test('the keys this writer OWNS are still authored from memory, not carried stale', async () => {
  // The fix must not overcorrect into preserving everything: an owned key has to reflect the
  // in-memory state, or a legitimate change would be silently reverted by the carry-through.
  const root = await seedWorkspace({ version: '2.1', type: 'stale-type-on-disk' });

  const cfg = await WorkspaceConfig.load(root);
  cfg.type = 'workspace';
  await cfg.save();

  const after = await readDoc(root);
  assert.equal(after.type, 'workspace', 'an OWNED key must come from memory, not from disk');
  assert.equal(after.version, '2.1');
});

test('FAIL LOUD: an unreadable existing file is not silently overwritten', async () => {
  // Carrying on here would destroy content we could not read — the same loss the gate exists to
  // prevent, arrived at from the other direction.
  const root = await mkdtemp(join(tmpdir(), 'descix-ws-bad-'));
  await mkdir(join(root, '.descix'), { recursive: true });
  await writeFile(join(root, '.descix', 'workspace.json'), '{ this is not json');

  const cfg = new WorkspaceConfig({ version: '2.1', type: 'workspace', env: {} }, root);
  await assert.rejects(() => cfg.save(), /could not be read as JSON/);

  // and the bytes are still there
  const raw = await readFile(join(root, '.descix', 'workspace.json'), 'utf8');
  assert.equal(raw, '{ this is not json');
});

test('a first save with no existing file still works', async () => {
  const root = await mkdtemp(join(tmpdir(), 'descix-ws-new-'));
  const cfg = new WorkspaceConfig({ version: '2.1', type: 'workspace', env: {} }, root);
  await cfg.save();
  const after = await readDoc(root);
  assert.equal(after.type, 'workspace');
});

test('COVERAGE BOUNDARY (prints on green as well as red)', () => {
  console.log(`
  ── GATE COVERAGE BOUNDARY ─────────────────────────────────────────────────
  WHAT IT COMPARES : the JSON on disk before and after a save, using a fixture
                     that carries a top-level key the writer has never heard of
                     (a known-keys-only fixture cannot exhibit this failure).
  DEFECT CLASS     : a serializer re-enumerating a known schema and silently
                     discarding everything else.
  WHAT IT DOES NOT READ:
    - CONCURRENCY. This is the unknown-key half only. Two processes holding the
      same workspace still race: save() re-reads at write time, which narrows
      the window but is not a lock. The locking/multi-writer half is filed
      separately and is NOT covered by anything here.
    - nested keys inside env/driveConfig, which the writer does own and does
      overwrite wholesale from memory.
    - any writer other than WorkspaceConfig.save (nothing else should write
      this file, but this gate does not prove that).
  AUTOMATION       : runs under this package's \`npm test\`
                     (node --test "tests/*.test.js"). Nothing else invokes it.
  ───────────────────────────────────────────────────────────────────────────`);
});
