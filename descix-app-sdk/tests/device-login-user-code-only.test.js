/**
 * GATE: the browser completes a device login by user_code ONLY (never by device_code).
 *
 * The device_code is the requesting CLI's secret (RFC 8628 §3.2). device_validate no longer returns
 * it, and the browser never holds it: completeDeviceLogin names the request by user_code, and the
 * server resolves it behind the signed-in user. A caller that still passes a device_code is refused
 * loudly, before any request is sent.
 *
 * Measured at the global fetch seam (the bag that actually leaves the browser), and at the SOURCE of
 * the shell's /device capture (util/shellIntents.js, the one place the validated code is captured).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..', 'src');

globalThis.__VITE_ENV__ = { VITE_DEBUG_PROXY: '', MODE: 'test' };
globalThis.window = { location: { search: '', origin: 'https://example.invalid' } };
const _store = new Map();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  writable: true,
  value: {
    getItem: (k) => (_store.has(k) ? _store.get(k) : null),
    setItem: (k, v) => _store.set(k, String(v)),
    removeItem: (k) => _store.delete(k),
    clear: () => _store.clear(),
  },
});

registerHooks({
  load(url, context, nextLoad) {
    if (!url.includes('/descix-app-sdk/src/')) return nextLoad(url, context);
    const r = nextLoad(url, { ...context, format: 'module' });
    let src = typeof r.source === 'string' ? r.source : Buffer.from(r.source).toString('utf8');
    src = src.replaceAll('import.meta.env', 'globalThis.__VITE_ENV__');
    return { ...r, source: src };
  },
});

const captured = [];
const reply = { status: 'OK', message: { message: 'Device login completed successfully', user_code: 'VJW-847', status: 'complete' } };
globalThis.fetch = async (_url, init) => {
  captured.push(JSON.parse(init.body));
  return {
    ok: true,
    status: 200,
    json: async () => reply,
    text: async () => JSON.stringify(reply),
    headers: { get: () => 'application/json' },
  };
};

const { AppData } = await import(join(SRC, 'util', 'AppData.jsx'));
const ApiAuth = await import(join(SRC, 'util', 'api', 'ApiAuth.js'));
AppData.sessionInfo = { id: 'user-123', access_token: 'tok' };

test('completeDeviceLogin sends user_code and no device_code', async () => {
  captured.length = 0;
  const r = await ApiAuth.completeDeviceLogin({ user_code: 'VJW-847', tos_accepted: true });
  assert.equal(r.status, 'OK', JSON.stringify(r));
  const call = captured.find((b) => b.command === 'device_complete');
  assert.ok(call, `device_complete was not sent; sent ${JSON.stringify(captured.map((b) => b.command))}`);
  assert.deepEqual(call.params, { user_code: 'VJW-847', tos_accepted: true }, 'the bag is { user_code, tos_accepted }: no email, no device_code');
  assert.equal('device_code' in call.params, false, `the bag must carry no device_code key: ${JSON.stringify(call.params)}`);
});

test('completeDeviceLogin refuses a device_code loudly, before sending anything', async () => {
  captured.length = 0;
  const r = await ApiAuth.completeDeviceLogin({ device_code: 'secret', user_code: 'VJW-847', tos_accepted: true });
  assert.equal(r.status, 'ERROR');
  assert.match(String(r.message), /device_code/);
  assert.equal(captured.length, 0, 'no request may be sent');
});

test('completeDeviceLogin refuses email and verification_code loudly, before sending anything', async () => {
  for (const key of ['email', 'verification_code']) {
    captured.length = 0;
    const r = await ApiAuth.completeDeviceLogin({ user_code: 'VJW-847', tos_accepted: true, [key]: 'x' });
    assert.equal(r.status, 'ERROR', `${key} was accepted`);
    assert.match(String(r.message), new RegExp(`does not accept ${key}`));
    assert.equal(captured.length, 0, 'no request may be sent');
  }
});

test('completeDeviceLogin requires a user_code', async () => {
  captured.length = 0;
  const r = await ApiAuth.completeDeviceLogin({ tos_accepted: true });
  assert.equal(r.status, 'ERROR');
  assert.match(String(r.message), /user_code/);
  assert.equal(captured.length, 0);
});

test('the shell captures the validated user_code only, never a device_code', () => {
  for (const file of [join(SRC, 'AppContext.jsx'), join(SRC, 'util', 'shellIntents.js')]) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /device_code/, `${file} must not read a device_code off device_validate`);
  }
  assert.match(readFileSync(join(SRC, 'util', 'shellIntents.js'), 'utf8'), /payload: \{ userCode: validation\.message\.user_code \}/);
});
