/**
 * meshLoopback test — WS-V1-PURGE data-plane caller-auth (SA-OIDC-establishes-caller, no service key).
 * CEO-D-2026-06-02-DATAPLANE-LOOPBACK-OPTION-A-SA-APP-BINDING.
 *
 * Verifies the SERVICE-SIDE invoker contract used by app microservices to write their data plane:
 *   - posts { command, params } to coreApiUrl with the acting user threaded via params._descix.user
 *   - returns Core's `message` on { status: 'OK' }, throws on error
 *   - sends NO slotId / private key / X-NFT-ID (no delegate signature)
 *   - getDescixUser==null => _descix.user==null (fail-closed: Core rejects user-scoped cmds)
 *
 * The `post` seam stands in for the OIDC IdTokenClient (which in production attaches the Bearer
 * token minted from the Cloud Run SA). We assert on the body, not the token, here.
 *
 * Run: node --test tests/mesh-loopback.test.mjs   (from descix-sdk/)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMeshLoopback, meshLoopback } from '../src/mesh/meshLoopback.js';

const CORE = 'https://descix.net/apifront/';

test('posts { command, params } with _descix.user and returns Core message on OK', async () => {
  const calls = [];
  const post = async (url, bodyString, headers) => {
    calls.push({ url, body: JSON.parse(bodyString), headers });
    return { status: 200, data: { status: 'OK', message: { upserted_count: 2 } } };
  };
  const invoke = createMeshLoopback({
    coreApiUrl: CORE,
    getDescixUser: () => ({ id: 'user-1', email: 'a@b.c', walletAddress: '0xabc' }),
    post,
  });

  const result = await invoke('app_records_put', { app_id: 'app-a', kb_id: 'k', records: [{ file_id: 'f' }] });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, CORE);
  assert.equal(calls[0].body.command, 'app_records_put');
  assert.equal(calls[0].body.params.app_id, 'app-a');
  // acting user threaded through _descix
  assert.deepEqual(calls[0].body.params._descix.user, { id: 'user-1', email: 'a@b.c', walletAddress: '0xabc' });
  // NO delegate signature artifacts
  assert.equal(calls[0].body.params.slotId, undefined);
  assert.equal(calls[0].headers['X-NFT-ID'], undefined);
  assert.equal(calls[0].headers['X-Signature'], undefined);
  // returns Core's message
  assert.deepEqual(result, { upserted_count: 2 });
});

test('getDescixUser==null => _descix.user is null (fail-closed)', async () => {
  let body;
  const post = async (url, bodyString) => { body = JSON.parse(bodyString); return { status: 200, data: { status: 'OK', message: {} } }; };
  const invoke = createMeshLoopback({ coreApiUrl: CORE, getDescixUser: () => null, post });
  await invoke('get_asset_upload_token', { app_id: 'app-a', files: [] });
  assert.equal(body.params._descix.user, null);
});

test('throws on a non-OK Core response (surfaces the message)', async () => {
  const post = async () => ({ status: 403, data: { status: 'ERROR', message: 'Forbidden: not bound to app' } });
  const invoke = createMeshLoopback({ coreApiUrl: CORE, getDescixUser: () => ({ id: 'u' }), post });
  await assert.rejects(() => invoke('app_records_put', { app_id: 'app-b' }), /not bound to app/);
});

test('hard-fails without coreApiUrl / command (no silent fallback)', async () => {
  assert.throws(() => createMeshLoopback({}), /coreApiUrl is required/);
  const invoke = createMeshLoopback({ coreApiUrl: CORE, post: async () => ({ status: 200, data: { status: 'OK', message: {} } }) });
  await assert.rejects(() => invoke(''), /command \(string\) is required/);
});

test('one-shot meshLoopback() convenience uses the same path', async () => {
  let seen;
  const post = async (u, b) => { seen = JSON.parse(b); return { status: 200, data: { status: 'OK', message: 'ok' } }; };
  const r = await meshLoopback('get_app_asset', { app_id: 'a', ref: 'r' }, { coreApiUrl: CORE, getDescixUser: () => ({ id: 'u' }), post });
  assert.equal(r, 'ok');
  assert.equal(seen.command, 'get_app_asset');
});
