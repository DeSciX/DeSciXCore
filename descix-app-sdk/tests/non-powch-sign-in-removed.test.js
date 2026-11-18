/**
 * EVERY GUEST SIGN-IN OUTSIDE POWCH IS REMOVED FROM THE SDK SURFACE.
 *
 * Cloud deleted register_native_user, register_email_tos, login_wallet_session, auth_google,
 * get_google_config, auth_discord and get_discord_config (each now a named 410). Web users and
 * Discord-embedded apps alike sign in through Powch. The SDK drops:
 *   - ApiAuth.js: the Google and Discord OAuth clients and checkAuthenticationStatus (auth_discord);
 *   - SdkInitializer.jsx: the OAuth-callback detection, the Discord `authorize` code, the `?code=`
 *     URL sign-in and the DiscordSDKMock debug sign-in (the Discord SDK itself stays for channel and
 *     share-link features);
 *   - AppContext.jsx: the auth_discord re-checks; the shell reads the session it holds;
 *   - AppData.jsx: sdkCode.
 * cloud-core drops the seven from GUEST_ALLOWED_COMMANDS.
 *
 * These files import JSX modules node cannot load, so the SDK half reads their source; the guest
 * list is imported. Run from descix-app-sdk/:
 *   node --test tests/non-powch-sign-in-removed.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CORE = path.resolve(PKG, '..');
const read = (rel) => fs.readFileSync(path.join(PKG, rel), 'utf8');
const REMOVED = [
  'register_native_user', 'register_email_tos', 'login_wallet_session',
  'auth_google', 'get_google_config', 'auth_discord', 'get_discord_config',
];

test('ApiAuth.js has no OAuth sign-in client and invokes none of the removed commands', () => {
  const src = read('src/util/api/ApiAuth.js');
  assert.match(src, /export async function completeDeviceLogin/, 'control: the file read is ApiAuth');
  for (const name of ['getGoogleOAuthConfig', 'initiateGoogleOAuth', 'checkGoogleAuthenticationStatus',
    'getDiscordOAuthConfig', 'initiateDiscordOAuth', 'checkDiscordAuthenticationStatus', 'checkAuthenticationStatus']) {
    assert.doesNotMatch(src, new RegExp(`\\b${name}\\b`), name);
  }
  for (const cmd of REMOVED) assert.doesNotMatch(src, new RegExp(`'${cmd}'`), cmd);
});

test('SdkInitializer.jsx has no OAuth callback, Discord authorize, URL-code or mock sign-in', () => {
  const src = read('src/util/SdkInitializer.jsx');
  assert.match(src, /DISCORD_SDK\.ready\(\)/, 'control: the Discord SDK still boots in an activity');
  assert.match(src, /storePendingRef\(window\.sessionStorage, launchCustomId\)/, 'control: the share-link launch param is still held');
  assert.doesNotMatch(src, /oauth_state|detectOAuthCallback|processOAuthCallback|commands\.authorize|DiscordSDKMock|VITE_DEBUG_KEY|sdkCode|codeFromUrl/);
});

test('AppContext.jsx and AppData.jsx carry no Discord sign-in check', () => {
  const ctx = read('src/AppContext.jsx');
  assert.match(ctx, /const currentSessionStatus = \(\) =>/, 'control: the session-status owner is there');
  assert.doesNotMatch(ctx, /checkAuthenticationStatus|verifyAuthenticationStatus/);
  // VITE_DEBUG_KEY meant only the deleted DiscordSDKMock debug sign-in; a context flag keyed off it
  // advertises a mode that no longer exists.
  assert.doesNotMatch(ctx, /VITE_DEBUG_KEY|isDebugWallet/);
  assert.doesNotMatch(read('src/util/AppData.jsx'), /sdkCode/);
});

test('cloud-core GUEST_ALLOWED_COMMANDS drops every removed sign-in command', async () => {
  const { GUEST_ALLOWED_COMMANDS } = await import(path.join(CORE, 'descix-cloud-core', 'src', 'config.js'));
  assert.ok(GUEST_ALLOWED_COMMANDS.includes('reconnect_by_wallet'), 'control: the list is the guest allow-list');
  for (const cmd of REMOVED) assert.equal(GUEST_ALLOWED_COMMANDS.includes(cmd), false, cmd);
});
