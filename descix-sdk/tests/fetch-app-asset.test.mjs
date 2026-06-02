/**
 * fetchAppAsset test — WS-V1-PURGE Phase 1, item 2 (media-via-API-surface, platform half;
 * service-side fetch-by-reference). CEO-D-2026-06-02-SSGPOD-PROD-PUBLISH-TWO-ROOT-CAUSES.
 *
 * Verifies the asset-reference CONTRACT an app microservice uses to fetch an uploaded asset
 * over the Core broker:
 *   - calls the `get_app_asset` Core command with { app_id, ref }
 *   - decodes content_base64 -> Buffer with the right bytes
 *   - surfaces content_type/size/gcs_uri
 *   - hard-fails on missing args / empty Core payload (no silent fallback)
 *
 * Run: node --test tests/fetch-app-asset.test.mjs   (from descix-sdk/)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchAppAsset } from '../src/mesh/assetClient.js';

test('calls get_app_asset with { app_id, ref } and decodes the bytes', async () => {
  const payloadBytes = Buffer.from('hello-podcast-audio');
  const calls = [];
  const fakeCallTool = async (command, params) => {
    calls.push({ command, params });
    return {
      app_id: params.app_id,
      gcs_uri: 'gs://descix-assets-public/prod/descix-ssgpod/assets/ep1.mp3',
      content_type: 'audio/mpeg',
      size: payloadBytes.length,
      content_base64: payloadBytes.toString('base64')
    };
  };

  const ref = 'gs://descix-assets-public/prod/descix-ssgpod/assets/ep1.mp3';
  const result = await fetchAppAsset(fakeCallTool, { appId: 'descix-ssgpod', ref });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, 'get_app_asset');
  assert.deepEqual(calls[0].params, { app_id: 'descix-ssgpod', ref });

  assert.ok(Buffer.isBuffer(result.buffer));
  assert.equal(result.buffer.toString(), 'hello-podcast-audio');
  assert.equal(result.contentType, 'audio/mpeg');
  assert.equal(result.size, payloadBytes.length);
  assert.equal(result.gcsUri, ref);
});

test('accepts a relative assets/ path as ref (passed through verbatim to Core)', async () => {
  let seen;
  const fakeCallTool = async (command, params) => {
    seen = params;
    return { content_base64: Buffer.from('x').toString('base64'), content_type: 'image/png', size: 1 };
  };
  await fetchAppAsset(fakeCallTool, { appId: 'descix-ssgpod', ref: 'shows/myshow/cover.png' });
  assert.equal(seen.ref, 'shows/myshow/cover.png');
});

test('hard-fails on missing callTool / appId / ref (no silent fallback)', async () => {
  await assert.rejects(() => fetchAppAsset(null, { appId: 'a', ref: 'r' }), /callTool must be a function/);
  await assert.rejects(() => fetchAppAsset(async () => ({}), { ref: 'r' }), /appId is required/);
  await assert.rejects(() => fetchAppAsset(async () => ({}), { appId: 'a' }), /ref is required/);
});

test('hard-fails when Core returns no content', async () => {
  const fakeCallTool = async () => ({ content_type: 'audio/mpeg' }); // no content_base64
  await assert.rejects(
    () => fetchAppAsset(fakeCallTool, { appId: 'descix-ssgpod', ref: 'ep1.mp3' }),
    /no content for ref/
  );
});
