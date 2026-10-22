/**
 * GATE: `descix whoami` reads the signed-in account from validate_session's `account`
 * (Cloud commandHandlers/userCommands.js validate_session → User#accountView), and refuses a reply
 * that carries none. validate_session never sent a top-level `email`; Powch hands the host the
 * session alone (no email on it), so neither the session nor the wallet file is an email source.
 *
 * Run: node --test tests/whoami-reads-account.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';


const AUTH_SRC = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'lib', 'commands', 'auth.js'), 'utf8');

/** whoami's body */
function whoamiBody() {
  const start = AUTH_SRC.indexOf('export async function whoami(');
  assert.ok(start >= 0, 'auth.js defines whoami');
  const end = AUTH_SRC.indexOf('\n}\n', start);
  return AUTH_SRC.slice(start, end);
}

test('accountFromValidateSession returns the account of the backend contract', async () => {
  const { accountFromValidateSession } = await import('../lib/commands/auth.js');
  const account = { id: 'user-123', email: 'owner@example.invalid', username: 'owner', wallet_address: '0xabc', base_folder_id: null };
  assert.deepEqual(accountFromValidateSession({ reason: 'session_valid', user_id: 'user-123', account }), account);
});

test('accountFromValidateSession refuses a reply with no account, naming the contract', async () => {
  const { accountFromValidateSession } = await import('../lib/commands/auth.js');
  for (const message of [{ reason: 'session_valid', user_id: 'user-123' }, { account: {} }, null, undefined]) {
    assert.throws(() => accountFromValidateSession(message),
      /validate_session returned no account .*The backend contract is \{ reason, user_id, account: \{ id, email, username, wallet_address, base_folder_id \} \}/);
  }
});

test('whoami reads the account through accountFromValidateSession, and no email off the message or the wallet file', () => {
  const body = whoamiBody();
  assert.match(body, /const account = accountFromValidateSession\(response\.message\);/);
  assert.match(body, /account\.email/);
  assert.doesNotMatch(body, /userInfo|walletInfo\?\.email|message\??\.email/, 'whoami reads an email outside validate_session\'s account');
});

test('reconnect prints no email off the session it is handed', () => {
  assert.doesNotMatch(AUTH_SRC, /sessionInfo\?\.email/, 'auth.js reads sessionInfo?.email');
});
