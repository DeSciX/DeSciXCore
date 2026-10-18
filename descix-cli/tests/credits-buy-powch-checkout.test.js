/**
 * `descix credits buy` starts Powch's checkout ceremony (eabadir/DeSciXCloud#39, "cloud rails: A").
 *
 * Cloud no longer creates Stripe sessions. The verb calls Powch's `create_checkout_session` through
 * /apifront (the mesh proxies it to Powch under the caller's identity) with the catalogue request
 * { purchase_type, amount_usd }, and prints the Stripe Checkout `url` Powch returns. A response with
 * no url is an error, never a success line.
 *
 * The api-client and auth guard are mocked at module scope (mock.module refuses a second
 * registration of one specifier), so `plan` is swapped per test.
 *
 * Run: node --experimental-test-module-mocks --test tests/credits-buy-powch-checkout.test.js
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

const calls = [];
let plan = {};

mock.module(new URL('../lib/api-client.js', import.meta.url).href, {
  namedExports: {
    DeSciXApiClient: class {
      async invoke(command, params) {
        calls.push({ command, params });
        if (!(command in plan)) throw new Error(`unexpected backend command: ${command}`);
        const r = plan[command];
        if (r instanceof Error) throw r;
        return r;
      }
    },
  },
});
mock.module(new URL('../lib/auth-guard.js', import.meta.url).href, {
  namedExports: { requireAuth: async () => {} },
});

const credits = await import('../lib/commands/credits.js');

function captureLog() {
  const lines = [];
  const orig = console.log;
  console.log = (...a) => lines.push(a.join(' '));
  return { lines, restore: () => { console.log = orig; } };
}

const SESSION = {
  session_id: 'cs_test_123',
  url: 'https://checkout.stripe.com/c/pay/cs_test_123',
  charge_cents: 1000,
  currency: 'usd',
  purchase_type: 'ai_credits',
};

test('credits buy calls Powch create_checkout_session with the catalogue request and prints its url', async () => {
  calls.length = 0;
  plan = { create_checkout_session: { status: 'OK', message: SESSION } };
  const log = captureLog();
  let result;
  try {
    result = await credits.buyCredits({ usd: '10' });
  } finally {
    log.restore();
  }
  assert.deepEqual(calls, [{ command: 'create_checkout_session', params: { purchase_type: 'ai_credits', amount_usd: 10 } }]);
  assert.equal(result.url, SESSION.url);
  assert.ok(log.lines.some((l) => l.includes(SESSION.url)), `the checkout url must be printed:\n${log.lines.join('\n')}`);
});

test('a response without a url fails loud naming the command, and prints no success', async () => {
  calls.length = 0;
  plan = { create_checkout_session: { status: 'OK', message: { session_id: 'cs_x' } } };
  const log = captureLog();
  try {
    await assert.rejects(credits.buyCredits({ usd: '25' }), /create_checkout_session.*url/);
  } finally {
    log.restore();
  }
  assert.equal(log.lines.filter((l) => /✓|created/i.test(l)).length, 0, `no success line:\n${log.lines.join('\n')}`);
});

test('a refusal from Powch propagates (no partial behaviour)', async () => {
  calls.length = 0;
  plan = { create_checkout_session: Object.assign(new Error('ai_credits amount_usd must be a listed bundle'), { code: 'PURCHASE_AMOUNT_NOT_LISTED' }) };
  await assert.rejects(credits.buyCredits({ usd: '7' }), /listed bundle/);
  assert.equal(calls.length, 1);
});

test('a non-numeric or non-positive --usd is refused before any call', async () => {
  for (const usd of ['abc', '0', '-5', '10abc', '']) {
    calls.length = 0;
    plan = {};
    const err = captureLog();
    const origErr = console.error;
    console.error = () => {};
    try {
      await assert.rejects(credits.buyCredits({ usd }), /usd/i, `--usd ${JSON.stringify(usd)} must be refused`);
    } finally {
      err.restore();
      console.error = origErr;
    }
    assert.equal(calls.length, 0, `--usd ${JSON.stringify(usd)} reached the backend`);
  }
});
