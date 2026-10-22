/**
 * GATE: the ChatWidget's Powch sign-in request is session-only (it requests no field).
 *
 * powch/sessionRequest.js is the one owner of the request: `{ purpose, registerDeSciX: true }`, no
 * `require`. The ChatWidget sends exactly that and names no field (verified_email, wallet_address,
 * wallet_signature): Powch registers the email and master wallet with DeSciX itself at ToS acceptance.
 *
 * Run: `node --test tests/chatwidget-session-only-request.test.js` from descix-app-sdk/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SDK_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIELDS = ['verified_email', 'wallet_address', 'wallet_signature'];

/** source with comments stripped — the rule lives in CODE */
function code(...rel) {
  return fs.readFileSync(path.join(SDK_ROOT, ...rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

/** the ChatWidget's handleSignIn body */
function handleSignIn() {
  const src = code('src', 'components', 'ChatWidget.jsx');
  const start = src.indexOf('const handleSignIn = async');
  assert.ok(start >= 0, 'ChatWidget defines handleSignIn');
  const end = src.indexOf('const refreshCredits', start);
  assert.ok(end > start, 'handleSignIn is followed by refreshCredits');
  return src.slice(start, end);
}

test('descixSessionRequest is the session alone: no requested field', async () => {
  const { descixSessionRequest } = await import('../src/powch/sessionRequest.js');
  const req = descixSessionRequest();
  assert.deepEqual(req, { purpose: 'Sign in to DeSciX', registerDeSciX: true });
  assert.equal('require' in req, false, 'the session request carries no require list');
  assert.notEqual(descixSessionRequest(), req, 'each call returns a fresh object');
});

test('descixSessionRequest is exported from the package root', async () => {
  assert.match(code('src', 'index.js'), /export \{ descixSessionRequest \} from '\.\/powch\/sessionRequest\.js';/);
});

test('ChatWidget sign-in names no requested field', () => {
  const body = handleSignIn();
  for (const f of FIELDS) {
    assert.equal(body.includes(f), false, `ChatWidget handleSignIn names '${f}' in its Powch sign-in request`);
  }
  assert.equal(/\brequire\s*:/.test(body), false, 'ChatWidget handleSignIn sends a require list');
});

test('ChatWidget sign-in sends the one owner\'s request', () => {
  const src = code('src', 'components', 'ChatWidget.jsx');
  assert.match(src, /import \{ descixSessionRequest \} from '\.\.\/powch\/sessionRequest';/);
  assert.match(handleSignIn(), /powchBridge\.login\(descixSessionRequest\(\)\)/,
    'ChatWidget handleSignIn calls powchBridge.login(descixSessionRequest())');
});

test('ChatWidget reads no email off the session (the session Powch hands the host carries none)', () => {
  assert.doesNotMatch(code('src', 'components', 'ChatWidget.jsx'), /sessionInfo\??\.email/, 'ChatWidget reads sessionInfo.email');
});
