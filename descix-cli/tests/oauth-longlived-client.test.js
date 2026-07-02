/**
 * WS-HEADLESS-MVP-A1 — CLI-side unit tests for the OAuth long-lived token seams
 * (mcp-oauth-longlived-tokens-design-2026-06-30.md §2.2/§4.1/§4.5).
 *
 * Covers, WITHOUT a live backend (the live loop is proven by the Cloud E2E
 * wsOauthLongLivedE2E.test.mjs + the live-DEV CLI run):
 *   - PKCE S256 pair correctness
 *   - the persisted `oauth` credential-block contract + freshness check
 *   - wallet.json: oauth block round-trip + API_KEY alias (read-normalize, write-mirror)
 *   - api-client: gcloud IAM seam REMOVED (anti-regression), OAuth bearer attach,
 *     ensureSession silent-refresh rotation persisted, refresh-failure fails loud once
 *     and never blocks the wallet-sig path
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import http from 'http';
import * as fs from 'fs/promises';
import * as path from 'path';
import os from 'os';

import {
  generatePkcePair,
  buildOAuthCredentialBlock,
  isOAuthAccessTokenFresh,
  OOB_REDIRECT_URI,
  DEFAULT_OAUTH_SCOPE,
} from '../lib/oauth-client.js';
import { WalletFileManager } from '../lib/wallet-file.js';
import { DeSciXApiClient } from '../lib/api-client.js';

const WALLET_ADDR = '0x' + 'ab'.repeat(20);

function makeWalletData(extra = {}) {
  return {
    walletAddress: WALLET_ADDR,
    signature: 'sig-' + crypto.randomBytes(6).toString('hex'),
    userId: 'user-1',
    sessionToken: 'session-token-1',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    ...extra,
  };
}

async function makeTempWorkspace(walletData) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-oauth-test-'));
  await fs.mkdir(path.join(dir, '.descix'), { recursive: true });
  await WalletFileManager.saveWalletFile(path.join(dir, '.descix', 'wallet.json'), walletData);
  return dir;
}

// ---------------------------------------------------------------------------
test('PKCE: challenge is base64url S256 of verifier', () => {
  const { verifier, challenge } = generatePkcePair();
  const expected = crypto.createHash('sha256').update(verifier).digest('base64url');
  assert.equal(challenge, expected);
  assert.match(verifier, /^[A-Za-z0-9_-]{43}$/); // 32 bytes base64url
  const second = generatePkcePair();
  assert.notEqual(second.verifier, verifier);
});

test('credential block contract + freshness (skew-aware)', () => {
  const block = buildOAuthCredentialBlock({
    clientId: 'client-1',
    tokens: { access_token: 'at', expires_in: 3600, refresh_token: 'rt', scope: DEFAULT_OAUTH_SCOPE },
    tokenEndpointBase: 'https://localhost:4000',
  });
  assert.equal(block.client_id, 'client-1');
  assert.equal(block.token_endpoint, 'https://localhost:4000/oauth/token');
  assert.equal(block.scope, DEFAULT_OAUTH_SCOPE);
  assert.ok(isOAuthAccessTokenFresh(block));

  // Within the 60s skew window => NOT fresh (forces refresh before expiry).
  const nearExpiry = { ...block, access_token_expires_at: new Date(Date.now() + 30000).toISOString() };
  assert.equal(isOAuthAccessTokenFresh(nearExpiry), false);
  assert.equal(isOAuthAccessTokenFresh({}), false);
  assert.equal(isOAuthAccessTokenFresh(null), false);
  assert.equal(OOB_REDIRECT_URI, 'urn:ietf:wg:oauth:2.0:oob');
});

test('wallet.json: oauth block round-trips; API_KEY alias mirrored on save', async () => {
  const oauth = buildOAuthCredentialBlock({
    clientId: 'client-2',
    tokens: { access_token: 'at2', expires_in: 3600, refresh_token: 'rt2', scope: 'mcp:read mcp:tools' },
    tokenEndpointBase: 'https://localhost:4000',
  });
  const data = makeWalletData({ oauth });
  const dir = await makeTempWorkspace(data);
  const loaded = await WalletFileManager.loadFromWorkspace(dir);
  assert.deepEqual(loaded.oauth, oauth);
  // Alias-only rename (§2.5/§7 Q4): signature stays canonical, API_KEY mirrors it.
  assert.equal(loaded.API_KEY, data.signature);
  assert.equal(loaded.signature, data.signature);
});

test('wallet.json: a file authored with ONLY API_KEY normalizes to signature on read', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-oauth-test-'));
  const walletPath = path.join(dir, '.descix', 'wallet.json');
  await fs.mkdir(path.dirname(walletPath), { recursive: true });
  await fs.writeFile(walletPath, JSON.stringify({ walletAddress: WALLET_ADDR, API_KEY: 'the-api-key' }));
  const loaded = await WalletFileManager.loadWalletFile(walletPath);
  assert.ok(loaded, 'API_KEY-only wallet file must validate');
  assert.equal(loaded.signature, 'the-api-key');
});

test('api-client: gcloud IAM seam is GONE (anti-regression, design §2.4 Option 4A)', () => {
  const client = new DeSciXApiClient();
  for (const removed of ['_mintIamBearer', '_isIamGatedOrigin', '_applyIamAuthIfNeeded']) {
    assert.equal(typeof client[removed], 'undefined', `${removed} must stay deleted`);
  }
  assert.equal(typeof client._applyOAuthBearerIfAvailable, 'function');
  assert.equal(typeof client._ensureOAuthAccessToken, 'function');
});

test('api-client: OAuth bearer attached only when a cached access token exists', () => {
  const client = new DeSciXApiClient();
  client.credentials = { oauth: null };
  const cfg1 = client._applyOAuthBearerIfAvailable({ headers: {} });
  assert.equal(cfg1.headers.Authorization, undefined);

  client.credentials = { oauth: { access_token: 'cached-at' } };
  const cfg2 = client._applyOAuthBearerIfAvailable({});
  assert.equal(cfg2.headers.Authorization, 'Bearer cached-at');
});

test('ensureSession: expired access token silently refreshes, ROTATED pair persisted (§4.1 verify)', async () => {
  // Stub AS: /oauth/token refresh_token grant returns a rotated pair.
  let refreshCalls = 0;
  let lastForm = null;
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      lastForm = Object.fromEntries(new URLSearchParams(body));
      refreshCalls++;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        access_token: 'new-at-' + refreshCalls,
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'new-rt-' + refreshCalls,
        scope: DEFAULT_OAUTH_SCOPE,
      }));
    });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const expiredOauth = {
    client_id: 'client-3',
    access_token: 'stale-at',
    access_token_expires_at: new Date(Date.now() - 1000).toISOString(), // expired
    refresh_token: 'old-rt',
    scope: DEFAULT_OAUTH_SCOPE,
    token_endpoint: `${baseUrl}/oauth/token`,
  };
  const dir = await makeTempWorkspace(makeWalletData({ oauth: expiredOauth }));

  const client = new DeSciXApiClient({ baseUrl, workspaceRoot: dir });
  await client.loadCredentials();
  await client.ensureSession();

  assert.equal(refreshCalls, 1, 'exactly one refresh call');
  assert.equal(lastForm.grant_type, 'refresh_token');
  assert.equal(lastForm.refresh_token, 'old-rt');
  assert.equal(lastForm.client_id, 'client-3');
  assert.equal(client.credentials.oauth.access_token, 'new-at-1');
  assert.equal(client.credentials.oauth.refresh_token, 'new-rt-1', 'rotated refresh token adopted');

  // Persisted back to wallet.json — losing the rotation would revoke the chain.
  const persisted = await WalletFileManager.loadFromWorkspace(dir);
  assert.equal(persisted.oauth.access_token, 'new-at-1');
  assert.equal(persisted.oauth.refresh_token, 'new-rt-1');

  // Fresh token now cached: a second ensureSession does NOT refresh again.
  await client.ensureSession();
  assert.equal(refreshCalls, 1, 'fresh token is not re-refreshed');

  await new Promise(r => server.close(r));
});

test('ensureSession: refresh rejection fails loud ONCE and never blocks the wallet-sig path', async () => {
  let refreshCalls = 0;
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      refreshCalls++;
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'invalid_grant', error_description: 'refresh token revoked' }));
    });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const revokedOauth = {
    client_id: 'client-4',
    access_token: 'stale',
    access_token_expires_at: new Date(Date.now() - 1000).toISOString(),
    refresh_token: 'revoked-rt',
    scope: 'mcp:read mcp:tools',
    token_endpoint: `${baseUrl}/oauth/token`,
  };
  const dir = await makeTempWorkspace(makeWalletData({ oauth: revokedOauth }));
  const client = new DeSciXApiClient({ baseUrl, workspaceRoot: dir });
  await client.loadCredentials();

  // Does not throw — wallet-sig session path stays viable (sessionToken present).
  await client.ensureSession();
  assert.equal(refreshCalls, 1);
  assert.equal(client._oauthRefreshFailed, true);
  assert.equal(client.credentials.accessToken, 'session-token-1', 'wallet-sig session untouched');

  // Once-per-process: no refresh retry storm.
  await client.ensureSession();
  assert.equal(refreshCalls, 1, 'no second refresh attempt after hard failure');

  await new Promise(r => server.close(r));
});
