/**
 * media-upload.test.js — `descix app media-upload` (lib/commands/media-upload.js).
 *
 * WS-MEDIA-QUOTA: the server (`get_asset_upload_token`) now returns a 200 MB-per-app storage
 * cap alongside signed URLs + per-path `upload_headers`. This suite pins the CLI's half of that
 * contract with a stubbed apiClient (no network to /apifront) and a stubbed global.fetch (no
 * network to GCS):
 *
 *   - PUT sends upload_headers[path] VERBATIM, including x-goog-content-length-range.
 *   - A path with no upload_headers entry errors (never falls back to a re-derived header).
 *   - public_url printed/returned is exactly the server's value (never bucket+gcs_path
 *     reconstructed client-side).
 *   - A server refusal from get_asset_upload_token propagates with its message verbatim and a
 *     non-zero-exit shape (a thrown Error — bin/descix.js turns that into exit 1).
 *   - --json output includes storage.
 *
 * Run: `node --test --test-force-exit tests/media-upload.test.js` from descix-cli/ (the
 * combined test runner hangs; this file must be run standalone).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { runMediaUpload } from '../lib/commands/media-upload.js';

const SERVER_STORAGE = { limit_bytes: 200 * 1024 * 1024, used_bytes: 1024, projected_bytes: 2048 };

/** Stubbed apiClient.invoke — never touches the network. */
class StubApiClient {
  constructor({ tokenResponse, throwOn } = {}) {
    this.calls = [];
    this.tokenResponse = tokenResponse;
    this.throwOn = throwOn || {};
  }
  async invoke(command, payload) {
    this.calls.push({ command, payload });
    if (this.throwOn[command]) {
      const err = new Error(this.throwOn[command]);
      throw err;
    }
    if (command === 'get_asset_upload_token') {
      return { status: 'OK', message: this.tokenResponse };
    }
    throw new Error(`StubApiClient: unexpected command ${command}`);
  }
}

async function makeTempFile(t, name, content = 'hello world') {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'media-upload-test-'));
  const p = path.join(dir, name);
  await fs.writeFile(p, content);
  t.after(async () => { await fs.rm(dir, { recursive: true, force: true }); });
  return p;
}

function makeTokenResponse({ files, publicBase = 'https://myapp.dev.descix.net/assets' } = {}) {
  const signed_urls = {};
  const upload_headers = {};
  const objects = [];
  for (const f of files) {
    signed_urls[f.path] = `https://storage.googleapis.com/signed/${encodeURIComponent(f.path)}`;
    if (f.headers !== null) {
      upload_headers[f.path] = f.headers || {
        'Content-Type': f.content_type || 'text/plain',
        'x-goog-content-length-range': `${f.size},${f.size}`
      };
    }
    objects.push({
      path: f.path,
      gcs_path: `dev/myapp/assets/${f.path}`,
      public_url: `${publicBase}/${f.path}`
    });
  }
  return {
    token_id: 'tok-123',
    expires_at: new Date(Date.now() + 60000).toISOString(),
    bucket: 'descix-assets-public',
    prefix: 'dev/myapp/assets',
    public_base: publicBase,
    signed_urls,
    upload_headers,
    objects,
    storage: SERVER_STORAGE
  };
}

/** Installs a stub global.fetch that records every PUT and restores the original on t.after. */
function stubFetch(t, { fail = new Set() } = {}) {
  const puts = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    puts.push({ url, method: init.method, headers: init.headers, body: init.body });
    if (fail.has(url)) {
      return { ok: false, status: 500, statusText: 'Internal Server Error' };
    }
    return { ok: true, status: 200, statusText: 'OK' };
  };
  t.after(() => { globalThis.fetch = original; });
  return puts;
}

/**
 * Captures stdout and stderr SEPARATELY — the same split the --json contract itself relies on
 * (progress() sends to stderr under --json, the JSON document is the only thing on stdout).
 * Mixing them into one buffer would make the "stdout is pure JSON" assertion untestable.
 */
function silenceConsole(t) {
  const origLog = console.log;
  const origError = console.error;
  const stdout = [];
  const stderr = [];
  console.log = (...args) => { stdout.push(args.join(' ')); };
  console.error = (...args) => { stderr.push(args.join(' ')); };
  t.after(() => { console.log = origLog; console.error = origError; });
  return { stdout, stderr };
}

// ─────────────────────────────────────────────────────────────────────────────

test('PUT sends upload_headers[path] verbatim, including x-goog-content-length-range', async (t) => {
  const filePath = await makeTempFile(t, 'cover.jpg', 'x'.repeat(50));
  const objectPath = 'cover.jpg';

  const tokenResponse = makeTokenResponse({
    files: [{
      path: objectPath,
      size: 50,
      headers: { 'Content-Type': 'image/jpeg', 'x-goog-content-length-range': '50,50', 'x-goog-meta-custom': 'yes' }
    }]
  });
  const apiClient = new StubApiClient({ tokenResponse });
  const puts = stubFetch(t);
  silenceConsole(t);

  await runMediaUpload(apiClient, { app: 'myapp', file: [filePath], prefix: '', json: true });

  assert.equal(puts.length, 1, 'expected exactly one PUT');
  assert.deepEqual(puts[0].headers, {
    'Content-Type': 'image/jpeg',
    'x-goog-content-length-range': '50,50',
    'x-goog-meta-custom': 'yes'
  }, 'headers PUT to GCS must be the server upload_headers bag verbatim');
  assert.equal(puts[0].method, 'PUT');
});

test('a path missing an upload_headers entry errors (RED against the pre-fix "derive locally" behavior)', async (t) => {
  const filePath = await makeTempFile(t, 'episode.mp3', 'y'.repeat(20));
  const objectPath = 'episode.mp3';

  // headers: null tells makeTokenResponse to omit this path from upload_headers entirely —
  // simulating the server forgetting to ferry a header bag for it.
  const tokenResponse = makeTokenResponse({ files: [{ path: objectPath, size: 20, headers: null }] });
  const apiClient = new StubApiClient({ tokenResponse });
  const puts = stubFetch(t);
  silenceConsole(t);

  await assert.rejects(
    () => runMediaUpload(apiClient, { app: 'myapp', file: [filePath], prefix: '', json: true }),
    /No files uploaded/,
    'expected the command to hard-fail when the only file has no ferried headers'
  );
  assert.equal(puts.length, 0, 'must never PUT a file whose upload_headers entry is missing (no locally-derived fallback header)');
});

test('public_url printed/returned is exactly the server value, never reconstructed from bucket+gcs_path', async (t) => {
  const filePath = await makeTempFile(t, 'art.png', 'z'.repeat(10));
  const objectPath = 'art.png';
  const serverPublicUrl = 'https://myapp.dev.descix.net/assets/art.png';

  const tokenResponse = makeTokenResponse({ files: [{ path: objectPath, size: 10 }], publicBase: 'https://myapp.dev.descix.net/assets' });
  const apiClient = new StubApiClient({ tokenResponse });
  stubFetch(t);
  silenceConsole(t);

  const result = await runMediaUpload(apiClient, { app: 'myapp', file: [filePath], prefix: '', json: true });

  assert.equal(result.assets.length, 1);
  assert.equal(result.assets[0].public_url, serverPublicUrl);
  // Negative control: the old client-side derivation was `gs://${bucket}/${gcs_path}` — assert
  // the returned public_url is NOT a gs:// URI (i.e. it really is the server's app-host form).
  assert.ok(!result.assets[0].public_url.startsWith('gs://'), 'public_url must be the app-host form, not a client-reconstructed gs:// URI');
});

test('a server refusal from get_asset_upload_token propagates with its message verbatim', async (t) => {
  const filePath = await makeTempFile(t, 'big.mp4', 'w'.repeat(30));
  const apiClient = new StubApiClient({
    throwOn: { get_asset_upload_token: "App 'myapp' storage would exceed its 200MB limit (used 199MB, requested 5MB)." }
  });
  stubFetch(t);
  silenceConsole(t);

  await assert.rejects(
    () => runMediaUpload(apiClient, { app: 'myapp', file: [filePath], prefix: '', json: true }),
    (err) => {
      assert.equal(err.message, "App 'myapp' storage would exceed its 200MB limit (used 199MB, requested 5MB).");
      return true;
    }
  );
});

test('--json output includes storage (used/limit/projected bytes, verbatim from the server)', async (t) => {
  const filePath = await makeTempFile(t, 'clip.mp4', 'a'.repeat(15));
  const objectPath = 'clip.mp4';

  const tokenResponse = makeTokenResponse({ files: [{ path: objectPath, size: 15 }] });
  const apiClient = new StubApiClient({ tokenResponse });
  stubFetch(t);
  const { stdout } = silenceConsole(t);

  const result = await runMediaUpload(apiClient, { app: 'myapp', file: [filePath], prefix: '', json: true });

  assert.deepEqual(result.storage, SERVER_STORAGE);

  // Under --json, stdout must be the JSON document and NOTHING else (progress goes to
  // stderr) — parse the whole stdout capture to prove that, not just find a field in it.
  const jsonOutput = stdout.join('\n');
  const parsed = JSON.parse(jsonOutput.trim());
  assert.deepEqual(parsed.storage, SERVER_STORAGE, '--json stdout document must carry the storage field');
});

test('--prefix is passed through untouched (no local slash-stripping)', async (t) => {
  const filePath = await makeTempFile(t, 'shownotes.txt', 'b'.repeat(5));
  // A leading slash would previously be silently stripped; now it must reach the server as-is
  // via the object path build (basename joining is still applied on top of the raw prefix).
  const tokenResponse = makeTokenResponse({ files: [{ path: '/shows/shownotes.txt', size: 5 }] });
  const apiClient = new StubApiClient({ tokenResponse });
  stubFetch(t);
  silenceConsole(t);

  const result = await runMediaUpload(apiClient, { app: 'myapp', file: [filePath], prefix: '/shows', json: true });

  assert.equal(apiClient.calls[0].payload.files[0].path, '/shows/shownotes.txt');
  assert.equal(result.assets[0].path, '/shows/shownotes.txt');
});
