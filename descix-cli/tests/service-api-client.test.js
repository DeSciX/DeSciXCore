/**
 * Tests for the packaged service-context api-client — `createServiceApiClient`
 * (lib/service-api-client.js).
 *
 * The microservice IS the CLI's api-client running in the cloud
 * (CEO-D-2026-06-02-APP-MICROSERVICE-IS-CLI-CLIENT-WALLET-SIG). It authenticates AS the
 * developer: wallet_address + signature -> reconnect_by_wallet -> session -> /apifront calls.
 *
 * Coverage:
 *  - HARD-FAIL (no fallback) when baseUrl / walletAddress / signature is absent
 *  - builds a client seeded with the developer credential (no wallet-file/workspace walk)
 *  - serviceMode is set (never falls back to interactive device login on 401)
 *  - invoke(command, params) returns Core's `message` payload (the fetchAppAsset contract)
 *  - invoke threads command/params through the underlying api-client
 *  - baseUrl normalization: a `.../apifront` URL is reduced to its origin (no double-append)
 *  - anti-regression: the package exposes createServiceApiClient as a function
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createServiceApiClient } from '../lib/service-api-client.js';

const CRED = {
  baseUrl: 'https://localhost:4000',
  walletAddress: '0xDEVWALLET',
  signature: 'DEV_DURABLE_SIGNATURE',
};

describe('createServiceApiClient — credential hard-fails (no fallback)', () => {
  it('throws when baseUrl is missing', () => {
    assert.throws(() => createServiceApiClient({ walletAddress: '0x1', signature: 's' }), /baseUrl is required/);
  });
  it('throws when walletAddress is missing', () => {
    assert.throws(() => createServiceApiClient({ baseUrl: CRED.baseUrl, signature: 's' }), /walletAddress is required/);
  });
  it('throws when signature is missing', () => {
    assert.throws(() => createServiceApiClient({ baseUrl: CRED.baseUrl, walletAddress: '0x1' }), /signature is required/);
  });
});

describe('createServiceApiClient — seeds the developer credential + serviceMode', () => {
  it('client carries wallet_address + signature and is in serviceMode', () => {
    const { client } = createServiceApiClient(CRED);
    assert.equal(client.serviceMode, true, 'serviceMode must be true (no device-login fallback)');
    assert.equal(client.credentials.walletAddress, '0xDEVWALLET');
    assert.equal(client.credentials.signature, 'DEV_DURABLE_SIGNATURE');
    assert.equal(client.credentials.accessToken, null, 'access token minted lazily via reconnect_by_wallet');
    assert.equal(client._initialized, true, 'no workspace/wallet-file discovery in a service');
  });

  it('normalizes a /apifront baseUrl to its origin (no double-append)', () => {
    const { client } = createServiceApiClient({ ...CRED, baseUrl: 'https://core.example.net/apifront/' });
    assert.equal(client.baseUrl, 'https://core.example.net');
  });
});

describe('createServiceApiClient — invoke returns Core message (fetchAppAsset contract)', () => {
  it('invoke(command, params) calls the underlying api-client and unwraps `message`', async () => {
    const { client, invoke } = createServiceApiClient(CRED);
    const calls = [];
    // Stub the underlying api-client invoke (the network layer is exercised by api-client's own tests;
    // here we assert the service wrapper threads command/params and unwraps `message`).
    client.invoke = async (command, params) => {
      calls.push({ command, params });
      return { status: 'OK', message: { record_id: 'rec-1', app_id: params.app_id } };
    };
    const msg = await invoke('app_records_put', { app_id: 'descix-ssgpod', record: { x: 1 } });
    assert.deepEqual(msg, { record_id: 'rec-1', app_id: 'descix-ssgpod' });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].command, 'app_records_put');
    assert.equal(calls[0].params.app_id, 'descix-ssgpod');
  });

  it('invoke rejects a non-string command', async () => {
    const { invoke } = createServiceApiClient(CRED);
    await assert.rejects(() => invoke(null), /command \(string\) is required/);
  });
});

describe('createServiceApiClient — package shape', () => {
  it('createServiceApiClient is a function', () => {
    assert.equal(typeof createServiceApiClient, 'function');
  });
});
