/**
 * media-list-delete.test.js — `descix app media-list` and `descix app media-delete`
 * (lib/commands/media-assets.js).
 *
 * Contract (Cloud owns the commands; the CLI is an HTTP-only client over /apifront):
 *   list_app_assets  {app_id, prefix?}          → { objects: [{ path, size, content_type, updated, public_url }], total_bytes, quota_bytes }
 *   delete_app_asset {app_id, path, dry_run?}   → { path, existed, deleted, freed_bytes, purged }
 *
 * Stubbed apiClient (no network). Gates:
 *   - list renders the rows and the storage total from a fixture response;
 *   - list --json emits the backend object unchanged;
 *   - delete loops ONE call per path with the exact params;
 *   - --dry-run passes dry_run:true and reports nothing deleted;
 *   - a not-found path does not stop the rest and does not fail the run;
 *   - a backend error on one path fails the run (thrown Error → bin exits 1), the rest still run;
 *   - an older Cloud that does not know the command fails loud naming it, never an empty list.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { runMediaList, runMediaDelete } from '../lib/commands/media-assets.js';

/** The exact message Cloud apiFront returns for a command it does not register. */
const invalidCommand = (cmd) => `Invalid command: ${cmd}`;

class StubApiClient {
  /**
   * @param {{ responses?: Record<string, (payload:object)=>object>, throwOn?: Record<string, (payload:object)=>string|null> }} opts
   */
  constructor({ responses = {}, throwOn = {} } = {}) {
    this.baseUrl = 'https://stub.example';
    this.calls = [];
    this.responses = responses;
    this.throwOn = throwOn;
  }
  async invoke(command, payload) {
    this.calls.push({ command, payload });
    const thrower = this.throwOn[command];
    const msg = thrower ? thrower(payload) : null;
    if (msg) {
      const err = new Error(msg);
      err.status = 400;
      throw err;
    }
    const responder = this.responses[command];
    if (!responder) throw new Error(`StubApiClient: unexpected command ${command}`);
    return { status: 'OK', message: responder(payload) };
  }
}

function captureConsole(t) {
  const origLog = console.log;
  const origError = console.error;
  const stdout = [];
  const stderr = [];
  console.log = (...args) => { stdout.push(args.join(' ')); };
  console.error = (...args) => { stderr.push(args.join(' ')); };
  t.after(() => { console.log = origLog; console.error = origError; });
  return { stdout, stderr };
}

const LIST_FIXTURE = Object.freeze({
  objects: [
    { path: 'shows/ep1.mp3', size: 3 * 1024 * 1024, content_type: 'audio/mpeg', updated: '2026-11-10T12:00:00.000Z', public_url: 'https://myapp.descix.net/assets/shows/ep1.mp3' },
    { path: 'cover.png', size: 2048, content_type: 'image/png', updated: '2026-11-09T08:30:00.000Z', public_url: 'https://myapp.descix.net/assets/cover.png' }
  ],
  total_bytes: 3 * 1024 * 1024 + 2048,
  quota_bytes: 200 * 1024 * 1024,
  // A field the CLI does not know about: --json must ferry it untouched.
  server_extra: { note: 'kept verbatim' }
});

// ───────────────────────────── media-list ─────────────────────────────

test('media-list renders each row (path, size, content type, updated, public_url) and the storage total', async (t) => {
  const apiClient = new StubApiClient({ responses: { list_app_assets: () => structuredClone(LIST_FIXTURE) } });
  const { stdout } = captureConsole(t);

  await runMediaList(apiClient, { app: 'myapp' });

  assert.deepEqual(apiClient.calls, [{ command: 'list_app_assets', payload: { app_id: 'myapp' } }],
    'one call, no prefix key when --prefix is not given');
  const out = stdout.join('\n');
  for (const o of LIST_FIXTURE.objects) {
    const row = stdout.find((l) => l.includes(o.path));
    assert.ok(row, `a row for ${o.path}`);
    assert.ok(row.includes(o.content_type), `row carries content type ${o.content_type}`);
    assert.ok(row.includes(o.updated), `row carries updated ${o.updated}`);
    assert.ok(out.includes(o.public_url), `output carries public_url ${o.public_url}`);
  }
  assert.match(stdout.find((l) => l.includes('shows/ep1.mp3')), /3\.0 MB/);
  const storage = stdout.find((l) => l.includes('Storage:'));
  assert.ok(storage, 'a storage line is printed');
  assert.match(storage, /3\.0 MB \/ 200\.0 MB/);
  assert.match(storage, new RegExp(`${LIST_FIXTURE.total_bytes} / ${LIST_FIXTURE.quota_bytes} bytes`));
});

test('media-list --prefix passes the prefix through unchanged', async (t) => {
  const apiClient = new StubApiClient({ responses: { list_app_assets: () => ({ objects: [], total_bytes: 0, quota_bytes: 1 }) } });
  captureConsole(t);
  await runMediaList(apiClient, { app: 'myapp', prefix: '/shows/' });
  assert.deepEqual(apiClient.calls[0].payload, { app_id: 'myapp', prefix: '/shows/' });
});

test('media-list --json emits the backend object unchanged, and nothing else on stdout', async (t) => {
  const apiClient = new StubApiClient({ responses: { list_app_assets: () => structuredClone(LIST_FIXTURE) } });
  const { stdout } = captureConsole(t);

  await runMediaList(apiClient, { app: 'myapp', json: true });

  assert.deepEqual(JSON.parse(stdout.join('\n')), LIST_FIXTURE);
});

test('media-list against a Cloud without list_app_assets fails loud naming the command, never an empty list', async (t) => {
  const apiClient = new StubApiClient({ throwOn: { list_app_assets: () => invalidCommand('list_app_assets') } });
  const { stdout } = captureConsole(t);

  await assert.rejects(() => runMediaList(apiClient, { app: 'myapp', json: true }), (err) => {
    assert.match(err.message, /list_app_assets/);
    assert.match(err.message, /https:\/\/stub\.example/, 'names the backend origin that lacks it');
    assert.match(err.message, /does not have the backend command/);
    return true;
  });
  assert.equal(stdout.join(''), '', 'no list (empty or otherwise) is printed');
});

test('media-list refuses a response without the contract fields instead of printing an empty list', async (t) => {
  const apiClient = new StubApiClient({ responses: { list_app_assets: () => ({ ok: true }) } });
  const { stdout } = captureConsole(t);
  await assert.rejects(() => runMediaList(apiClient, { app: 'myapp' }), /list_app_assets returned an unexpected shape/);
  assert.equal(stdout.join(''), '');
});

// ──────────────────────────── media-delete ────────────────────────────

function deleteResponder(existing) {
  return ({ path, dry_run }) => {
    const size = existing[path];
    if (size === undefined) return { path, existed: false, deleted: false, freed_bytes: 0, purged: false };
    return dry_run
      ? { path, existed: true, deleted: false, freed_bytes: size, purged: false }
      : { path, existed: true, deleted: true, freed_bytes: size, purged: true };
  };
}

test('media-delete loops ONE delete_app_asset call per path with the exact params', async (t) => {
  const apiClient = new StubApiClient({ responses: { delete_app_asset: deleteResponder({ 'a.png': 10, 'b/c.mp3': 20 }) } });
  captureConsole(t);

  await runMediaDelete(apiClient, ['a.png', 'b/c.mp3'], { app: 'myapp' });

  assert.deepEqual(apiClient.calls, [
    { command: 'delete_app_asset', payload: { app_id: 'myapp', path: 'a.png' } },
    { command: 'delete_app_asset', payload: { app_id: 'myapp', path: 'b/c.mp3' } }
  ]);
});

test('media-delete prints the summary line: N deleted, M not found, bytes freed', async (t) => {
  const apiClient = new StubApiClient({ responses: { delete_app_asset: deleteResponder({ 'a.png': 1000, 'b.png': 24 }) } });
  const { stdout } = captureConsole(t);

  const result = await runMediaDelete(apiClient, ['a.png', 'gone.png', 'b.png'], { app: 'myapp' });

  assert.deepEqual(result.summary, { deleted: 2, not_found: 1, failed: 0, freed_bytes: 1024 });
  assert.ok(stdout.some((l) => /2 deleted, 1 not found, 1024 bytes freed/.test(l)), stdout.join('\n'));
});

test('media-delete --dry-run passes dry_run:true and reports nothing deleted', async (t) => {
  const apiClient = new StubApiClient({ responses: { delete_app_asset: deleteResponder({ 'a.png': 10 }) } });
  const { stdout } = captureConsole(t);

  const result = await runMediaDelete(apiClient, ['a.png', 'gone.png'], { app: 'myapp', dryRun: true });

  assert.deepEqual(apiClient.calls.map((c) => c.payload), [
    { app_id: 'myapp', path: 'a.png', dry_run: true },
    { app_id: 'myapp', path: 'gone.png', dry_run: true }
  ]);
  assert.equal(result.summary.deleted, 0);
  const out = stdout.join('\n');
  assert.match(out, /Dry run: nothing deleted/);
  assert.match(out, /0 deleted, 1 not found/);
  assert.match(out, /1 would be deleted/);
});

test('a not-found path does not stop the rest and does not fail the run', async (t) => {
  const apiClient = new StubApiClient({ responses: { delete_app_asset: deleteResponder({ 'b.png': 5 }) } });
  captureConsole(t);

  const result = await runMediaDelete(apiClient, ['missing.png', 'b.png'], { app: 'myapp' });

  assert.equal(apiClient.calls.length, 2, 'the path after the missing one still runs');
  assert.deepEqual(result.summary, { deleted: 1, not_found: 1, failed: 0, freed_bytes: 5 });
});

test('a backend error on one path fails the run, the remaining paths still run', async (t) => {
  const apiClient = new StubApiClient({
    responses: { delete_app_asset: deleteResponder({ 'a.png': 1, 'c.png': 2 }) },
    throwOn: { delete_app_asset: ({ path }) => (path === 'b.png' ? 'Permission denied: not an owner of myapp' : null) }
  });
  const { stdout } = captureConsole(t);

  await assert.rejects(
    () => runMediaDelete(apiClient, ['a.png', 'b.png', 'c.png'], { app: 'myapp', json: true }),
    (err) => {
      assert.match(err.message, /1 of 3 path\(s\) failed/);
      assert.match(err.message, /b\.png: Permission denied: not an owner of myapp/);
      return true;
    }
  );
  assert.equal(apiClient.calls.length, 3, 'c.png still ran after b.png failed');
  const doc = JSON.parse(stdout.join('\n'));
  assert.deepEqual(doc.summary, { deleted: 2, not_found: 0, failed: 1, freed_bytes: 3 });
  assert.deepEqual(doc.results[1], { path: 'b.png', error: 'Permission denied: not an owner of myapp' });
  assert.deepEqual(doc.results[0], { path: 'a.png', existed: true, deleted: true, freed_bytes: 1, purged: true },
    'a backend result is ferried verbatim');
});

test('media-delete against a Cloud without delete_app_asset fails loud naming the command and stops', async (t) => {
  const apiClient = new StubApiClient({ throwOn: { delete_app_asset: () => invalidCommand('delete_app_asset') } });
  captureConsole(t);

  await assert.rejects(() => runMediaDelete(apiClient, ['a.png', 'b.png'], { app: 'myapp' }), (err) => {
    assert.match(err.message, /delete_app_asset/);
    assert.match(err.message, /does not have the backend command/);
    return true;
  });
  assert.equal(apiClient.calls.length, 1, 'no point asking again for the next path');
});

test('media-delete counts a response without the contract fields as a failure for that path', async (t) => {
  const apiClient = new StubApiClient({ responses: { delete_app_asset: () => ({ ok: true }) } });
  captureConsole(t);
  await assert.rejects(() => runMediaDelete(apiClient, ['a.png'], { app: 'myapp' }), /delete_app_asset returned an unexpected shape/);
});

// ─────────────── backend semantics: prefix totals, purge warnings ───────────────

test('media-list WITHOUT --prefix prints the total against the quota', async (t) => {
  const apiClient = new StubApiClient({ responses: { list_app_assets: () => structuredClone(LIST_FIXTURE) } });
  const { stdout } = captureConsole(t);
  await runMediaList(apiClient, { app: 'myapp' });
  const line = stdout.find((l) => l.includes('Storage:'));
  assert.ok(line, 'a storage line is printed');
  assert.match(line, /3\.0 MB \/ 200\.0 MB used/);
  assert.ok(!stdout.some((l) => /Total under/.test(l)), 'no prefix-total line without --prefix');
});

test('media-list WITH --prefix labels total_bytes as the total under the prefix and shows no used/quota ratio', async (t) => {
  // Cloud: with a prefix, total_bytes sums only the listed objects; quota_bytes is still the whole app's.
  const fixture = { objects: [LIST_FIXTURE.objects[0]], total_bytes: 3 * 1024 * 1024, quota_bytes: 200 * 1024 * 1024 };
  const apiClient = new StubApiClient({ responses: { list_app_assets: () => structuredClone(fixture) } });
  const { stdout } = captureConsole(t);
  await runMediaList(apiClient, { app: 'myapp', prefix: 'shows' });
  const out = stdout.join('\n');
  const line = stdout.find((l) => l.includes('Total under assets/shows'));
  assert.ok(line, `a prefix-total line is printed:\n${out}`);
  assert.match(line, /3\.0 MB \(3145728 bytes\)/);
  assert.ok(!/Storage:/.test(out), 'no storage-against-quota line under --prefix');
  assert.ok(!/200\.0 MB/.test(out) && !/209715200/.test(out), 'the quota is not set against a prefix sum');
});

test('a real delete that reports purged:false prints a visible warning and keeps exit 0', async (t) => {
  const apiClient = new StubApiClient({
    responses: { delete_app_asset: ({ path }) => ({ path, existed: true, deleted: true, freed_bytes: 7, purged: false }) }
  });
  const { stdout, stderr } = captureConsole(t);
  const result = await runMediaDelete(apiClient, ['ep1.mp3'], { app: 'myapp' });
  assert.deepEqual(result.summary, { deleted: 1, not_found: 0, failed: 0, freed_bytes: 7 });
  const all = [...stdout, ...stderr].join('\n');
  assert.match(all, /ep1\.mp3.*deleted, but the edge cache purge failed \(purged:false\)/);
  assert.match(all, /may still be served until its cache lifetime ends/);
});

test('a real delete that reports purged:true prints no purge warning', async (t) => {
  const apiClient = new StubApiClient({ responses: { delete_app_asset: deleteResponder({ 'a.png': 1 }) } });
  const { stdout, stderr } = captureConsole(t);
  await runMediaDelete(apiClient, ['a.png'], { app: 'myapp' });
  assert.ok(![...stdout, ...stderr].some((l) => /purge failed/.test(l)));
});

test('--dry-run reports the bytes a real delete WOULD free (freed_bytes on a dry run)', async (t) => {
  const apiClient = new StubApiClient({ responses: { delete_app_asset: deleteResponder({ 'a.png': 2048 }) } });
  const { stdout } = captureConsole(t);
  const result = await runMediaDelete(apiClient, ['a.png'], { app: 'myapp', dryRun: true });
  assert.equal(result.summary.would_free_bytes, 2048);
  assert.match(stdout.join('\n'), /1 would be deleted \(2048 bytes/);
});

// Help text rendered OFFLINE from the command definitions: cli-verbs.generated.json is dumped from
// the live commander tree (scripts/lib/cli-verb-list.mjs) and cli-verbs-generated.test.js fails
// when it is stale — so this pins the shipped usage without a --help run (which calls the origin).
test('the generated verb list carries both verbs with their usage', async () => {
  const { default: verbs } = await import('../../descix-platform-api/src/mcp-tools/cli-verbs.generated.json', { with: { type: 'json' } });
  const byPath = Object.fromEntries(verbs.map((v) => [v.verbPath, v]));
  const flags = (v) => v.options.map((o) => o.flags);
  assert.deepEqual(flags(byPath['app media-list']), ['-a, --app <id>', '--prefix <relPath>', '--json']);
  assert.deepEqual(flags(byPath['app media-delete']), ['-a, --app <id>', '--dry-run', '--json']);
  assert.deepEqual(byPath['app media-delete'].arguments.map((a) => [a.name, a.required, a.variadic]), [['path', true, true]]);
});
