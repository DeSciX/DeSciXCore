/**
 * PowchClient.signTypedData + the one converter toSignableTypedData.
 * ethers v6 signTypedData(domain, types, value) REJECTS an explicit EIP712Domain entry in
 * `types`; the full EIP-712 object { domain, types, primaryType, message } must be converted.
 *
 * Run: `node --test tests/powch-sign-typed-data.test.js` from descix-app-sdk/.
 */
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { TypedDataEncoder } from 'ethers';

import { PowchClient } from '../src/powch/PowchClient.js';
import { toSignableTypedData } from '../src/powch/typedData.js';

const ORIGIN = 'https://powch.test';
const ADDR = '0x1111111111111111111111111111111111111111';

const permit2 = () => ({
  domain: { name: 'Permit2', chainId: 137, verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3' },
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    TokenPermissions: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    PermitTransferFrom: [
      { name: 'permitted', type: 'TokenPermissions' },
      { name: 'spender', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  },
  primaryType: 'PermitTransferFrom',
  message: {
    permitted: { token: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', amount: '1000000' },
    spender: '0x2222222222222222222222222222222222222222',
    nonce: '7',
    deadline: '1900000000',
  },
});

test('converter: drops EIP712Domain, value = message, domain/types preserved', () => {
  const td = permit2();
  const out = toSignableTypedData(td);
  assert.deepEqual(Object.keys(out).sort(), ['domain', 'types', 'value']);
  assert.equal('EIP712Domain' in out.types, false);
  assert.deepEqual(Object.keys(out.types).sort(), ['PermitTransferFrom', 'TokenPermissions']);
  assert.deepEqual(out.domain, td.domain);
  assert.deepEqual(out.value, td.message);
  assert.ok('EIP712Domain' in td.types, 'input is not mutated');
});

test('converter: nothing is lost - hash equals the EIP-712 hash of the original', () => {
  const td = permit2();
  const out = toSignableTypedData(td);
  const converted = TypedDataEncoder.hash(out.domain, out.types, out.value);
  // original digest, computed independently: domain separator from the declared EIP712Domain fields
  const { EIP712Domain, ...rest } = td.types;
  const expected = TypedDataEncoder.hash(td.domain, rest, td.message);
  assert.equal(converted, expected);
  assert.match(converted, /^0x[0-9a-f]{64}$/);
});

test('negative control: leaving EIP712Domain in types is rejected by ethers (the failure the converter prevents)', () => {
  const td = permit2();
  assert.throws(() => TypedDataEncoder.hash(td.domain, td.types, td.message));
  const out = toSignableTypedData(td);
  assert.doesNotThrow(() => TypedDataEncoder.hash(out.domain, out.types, out.value));
  assert.equal(Object.hasOwn(out.types, 'EIP712Domain'), false);
});

test('converter: refuses missing fields, naming the field', () => {
  for (const field of ['domain', 'types', 'primaryType', 'message']) {
    const td = permit2();
    delete td[field];
    assert.throws(() => toSignableTypedData(td), (e) => e.name === 'TypedDataError' && e.message.includes(field), field);
  }
  assert.throws(() => toSignableTypedData(undefined), (e) => e.name === 'TypedDataError');
  assert.throws(() => toSignableTypedData(null), (e) => e.name === 'TypedDataError');
});

test('converter: refuses a primaryType that is not a key of the remaining types', () => {
  const td = permit2();
  td.primaryType = 'EIP712Domain'; // only present before the drop
  assert.throws(() => toSignableTypedData(td), (e) => e.name === 'TypedDataError' && e.message.includes('EIP712Domain'));
  const td2 = permit2();
  td2.primaryType = 'Nope';
  assert.throws(() => toSignableTypedData(td2), (e) => e.name === 'TypedDataError' && e.message.includes('Nope'));
});

// --- PowchClient routing ---------------------------------------------------------------
let listeners; let iframe;
function installDom() {
  listeners = [];
  iframe = { style: {}, delivered: [], contentWindow: { postMessage(m) { iframe.delivered.push(m); } } };
  globalThis.window = {
    location: { origin: 'https://host.test' },
    addEventListener: (t, fn) => { if (t === 'message') listeners.push(fn); },
  };
  globalThis.window.parent = globalThis.window;
  globalThis.window.top = globalThis.window;
  globalThis.document = { body: { appendChild() {} }, createElement: () => iframe };
}
const fromIframe = (data) => { for (const fn of listeners) fn({ origin: ORIGIN, source: iframe.contentWindow, data }); };
beforeEach(installDom);
afterEach(() => { delete globalThis.window; delete globalThis.document; });

test('embedded: routes to shellBridge.signTypedData(domain, types, value, address) with converted args', async () => {
  const calls = [];
  globalThis.window.DeSciX = {
    powch: { signTypedData: async (...a) => { calls.push(a); return { signature: '0xsig' }; } },
    bridge: { version: 1, ready: true },
  };
  const client = new PowchClient({});
  const td = permit2();
  const res = await client.signTypedData({ typedData: td, address: ADDR });
  assert.deepEqual(res, { signature: '0xsig' });
  const exp = toSignableTypedData(td);
  assert.deepEqual(calls, [[exp.domain, exp.types, exp.value, ADDR]]);
  assert.equal('EIP712Domain' in calls[0][1], false);
});

test('embedded: invalid typedData fails loud before reaching the bridge', async () => {
  let called = false;
  globalThis.window.DeSciX = { powch: { signTypedData: async () => { called = true; } }, bridge: { version: 1, ready: true } };
  const client = new PowchClient({});
  await assert.rejects(client.signTypedData({ typedData: { domain: {} }, address: ADDR }), (e) => e.name === 'TypedDataError');
  assert.equal(called, false);
});

test('standalone: opens, then posts POWCH_SIGN_TYPED_DATA with the converted payload', { timeout: 3000 }, async () => {
  const client = new PowchClient({ bridgeUrl: ORIGIN });
  let opened = 0;
  const realOpen = client.open.bind(client);
  client.open = () => { opened++; return realOpen(); };
  fromIframe({ type: 'POWCH_READY' });
  const td = permit2();
  const p = client.signTypedData({ typedData: td, address: ADDR });
  assert.equal(opened, 1, 'same open()/PII behaviour as signMessage');
  assert.equal(iframe.delivered.length, 1);
  const [req] = iframe.delivered;
  assert.equal(req.type, 'POWCH_SIGN_TYPED_DATA');
  const exp = toSignableTypedData(td);
  assert.deepEqual(req.payload, { domain: exp.domain, types: exp.types, value: exp.value, address: ADDR });
  fromIframe({ requestId: req.requestId, success: true, payload: { signature: '0xabc' } });
  assert.deepEqual(await p, { signature: '0xabc' });
});

test('standalone: invalid typedData rejects without posting or opening', async () => {
  const client = new PowchClient({ bridgeUrl: ORIGIN });
  let opened = 0;
  client.open = () => { opened++; };
  await assert.rejects(client.signTypedData({ typedData: { ...permit2(), primaryType: 'Nope' }, address: ADDR }), (e) => e.name === 'TypedDataError');
  assert.equal(opened, 0);
  assert.equal(iframe.delivered.length, 0);
});
