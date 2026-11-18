/**
 * GATE: `bridge.networkAPI.submitTransaction` / `submitMetaTransaction` resolve ONLY for a
 * confirmed transaction.
 *
 * Powch answers a submit with 200 for `confirmed`, `failed` (mined and reverted) and `pending`
 * (accepted, not yet mined); the Powch submit-answer contract is the table. The SDK
 * resolved on every 200, so an app reading "resolved" as success misread a revert and a pending
 * transaction. A fake shell answers each body of that table the way Cloud's /apifront ferries it
 * (200 -> `{ status: 'OK', message: <body> }`; non-2xx -> `Api.call` throws `status`, `code:
 * 'UPSTREAM_SERVICE_ERROR'`, `data: <body>`, as util/AppData.jsx does).
 *
 * Run: node --test tests/submit-answer-contract.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PowchBridgeClient } from '../src/util/PowchBridgeClient.js';

const HASH = '0x' + 'ab'.repeat(32);
const NEW_HASH = '0x' + 'cd'.repeat(32);

/** The fake shell: `Api.call` answers `command` with one HTTP status and the Powch service's body. */
function bridgeAnswering(httpStatus, body) {
  const calls = [];
  const Api = {
    async call(command, params) {
      calls.push({ command, params });
      if (httpStatus >= 200 && httpStatus < 300) return { status: 'OK', message: body };
      const err = new Error(body.message);
      err.status = httpStatus;
      err.code = 'UPSTREAM_SERVICE_ERROR';
      err.data = body;
      throw err;
    },
  };
  const bridge = new PowchBridgeClient({ bridgeUrl: 'https://powch.test', getApi: () => Api });
  return { api: bridge.networkAPI, calls };
}

const METHODS = [
  ['submitTransaction', 'submit_transaction'],
  ['submitMetaTransaction', 'submit_meta_transaction'],
];

for (const [method, command] of METHODS) {
  test(`${method}: 200 confirmed resolves with the answer`, async () => {
    const body = { status: 'confirmed', txHash: HASH, gasUsed: '21000', blockNumber: 7 };
    const { api, calls } = bridgeAnswering(200, body);
    const res = await api[method]({ signedTx: '0x01' });
    assert.deepEqual(res, { status: 'OK', message: body });
    assert.deepEqual(calls, [{ command, params: { signedTx: '0x01' } }]);
  });

  test(`${method}: 200 failed (reverted) rejects TX_FAILED with the hash`, async () => {
    const { api } = bridgeAnswering(200, { status: 'failed', txHash: HASH, gasUsed: '21000', blockNumber: 7 });
    await assert.rejects(api[method]({}), (err) => {
      assert.equal(err.code, 'TX_FAILED');
      assert.equal(err.data.tx_hash, HASH);
      assert.match(err.message, /revert/i);
      return true;
    });
  });

  test(`${method}: 200 pending rejects TX_PENDING with the hash`, async () => {
    const { api } = bridgeAnswering(200, { status: 'pending', txHash: HASH, gasUsed: null, blockNumber: null });
    await assert.rejects(api[method]({}), (err) => {
      assert.equal(err.code, 'TX_PENDING');
      assert.equal(err.data.tx_hash, HASH);
      assert.match(err.message, /get_transaction_receipt/);
      return true;
    });
  });

  for (const status of ['success', 'CONFIRMED', 'reverted', undefined, null]) {
    test(`${method}: 200 with status ${String(status)} never resolves`, async () => {
      const { api } = bridgeAnswering(200, { status, txHash: HASH });
      await assert.rejects(api[method]({}), (err) => {
        assert.equal(err.code, 'TX_ANSWER_UNRECOGNIZED');
        assert.equal(err.data.tx_hash, HASH);
        return true;
      });
    });
  }

  test(`${method}: 200 with no body never resolves`, async () => {
    const { api } = bridgeAnswering(200, undefined);
    await assert.rejects(api[method]({}), (err) => err.code === 'TX_ANSWER_UNRECOGNIZED');
  });

  // The non-2xx rows keep the shell's rejection as it is: status, code, data (the Powch body).
  const ERROR_ROWS = [
    [500, { status: 'ERROR', code: 'POWCH_INTERNAL', message: 'outcome unknown', data: { tx_hash: HASH, outcome: 'unknown' } }],
    [500, {
      status: 'ERROR', code: 'POWCH_INTERNAL', message: 'replaced',
      data: { tx_hash: HASH, outcome: 'unknown', replaced_by: NEW_HASH, replacement_reason: 'repriced', replacement_status: 'confirmed' },
    }],
    [422, { status: 'ERROR', code: 'BROADCAST_REFUSED', message: 'insufficient funds' }],
    [422, { status: 'ERROR', code: 'BROADCAST_REFUSED', message: 'This request sent nothing new.', data: { tx_hash: HASH } }],
    [400, { status: 'ERROR', code: 'SIGNED_TRANSACTION_INVALID', message: 'not a signed transaction' }],
  ];
  for (const [httpStatus, body] of ERROR_ROWS) {
    test(`${method}: ${httpStatus} ${body.code} (${body.message}) keeps the shell's rejection`, async () => {
      const { api } = bridgeAnswering(httpStatus, body);
      await assert.rejects(api[method]({}), (err) => {
        assert.equal(err.status, httpStatus);
        assert.equal(err.code, 'UPSTREAM_SERVICE_ERROR');
        assert.deepEqual(err.data, body);
        // The hash, where the row names one, is the body's data.tx_hash (nested once more).
        assert.equal(err.data.data?.tx_hash, body.data?.tx_hash);
        return true;
      });
    });
  }
}

test('the bridge exposes exactly the two submit methods', () => {
  const { api } = bridgeAnswering(200, {});
  assert.deepEqual(Object.keys(api).sort(), ['submitMetaTransaction', 'submitTransaction']);
});
