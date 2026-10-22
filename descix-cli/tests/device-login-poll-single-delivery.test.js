/**
 * GATE: the CLI's device-login poll matches the platform's single-delivery contract
 * (device_check_status delivers a completed login's credential once).
 *
 * device_check_status now delivers a completed login's credential exactly once; a later read is
 * refused with DEVICE_LOGIN_CONSUMED, and a completion missing a credential field is refused by the
 * server with DEVICE_LOGIN_INCOMPLETE. The poll must stop on both instead of re-polling until
 * timeout, and it must not default token_symbol (the wallet-file owner validates the credential).
 *
 * Measured by driving the REAL pollDeviceLogin with a fake api client (no network, no sleep: every
 * case below ends on its first poll).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

const { pollDeviceLogin } = await import('../lib/commands/auth.js');

const full = {
  status: 'complete', user_id: 'u1', email: 'owner@example.invalid', session_token: 'fixture-session',
  wallet_address: '0x' + 'a'.repeat(40), signature: 'fixture-sig', community_id: 'daita', token_symbol: 'DAITA',
};

function client(behaviour) {
  const calls = [];
  return {
    calls,
    invoke: async (command, params) => {
      calls.push({ command, params });
      return behaviour(calls.length);
    },
  };
}

test('a complete read returns the credential, read from the response with no defaults', async () => {
  const c = client(() => ({ status: 'OK', message: { ...full } }));
  const creds = await pollDeviceLogin(c, 'dc-1');
  assert.equal(creds.session_token, 'fixture-session');
  assert.equal(creds.token_symbol, 'DAITA');
  assert.equal(creds.community_id, 'daita');
  assert.deepEqual(c.calls, [{ command: 'device_check_status', params: { device_code: 'dc-1' } }]);
});

test('DEVICE_LOGIN_CONSUMED ends the poll on the first refusal', async () => {
  const c = client(() => {
    throw Object.assign(new Error('This device login was already delivered'), { code: 'DEVICE_LOGIN_CONSUMED' });
  });
  await assert.rejects(() => pollDeviceLogin(c, 'dc-2'), (e) => e.code === 'DEVICE_LOGIN_CONSUMED');
  assert.equal(c.calls.length, 1, 'the poll must not retry a consumed request');
});

test('DEVICE_LOGIN_INCOMPLETE (the server refusing an incomplete credential) ends the poll', async () => {
  const c = client(() => {
    throw Object.assign(new Error('The completed device login is missing token_symbol'), { code: 'DEVICE_LOGIN_INCOMPLETE' });
  });
  await assert.rejects(() => pollDeviceLogin(c, 'dc-3'), (e) => e.code === 'DEVICE_LOGIN_INCOMPLETE');
  assert.equal(c.calls.length, 1);
});

test('token_symbol is read from the response, never defaulted', async () => {
  const c = client(() => ({ status: 'OK', message: { ...full, token_symbol: undefined } }));
  const creds = await pollDeviceLogin(c, 'dc-4');
  assert.equal(creds.token_symbol, undefined, 'the CLI must not invent a token symbol');
});
