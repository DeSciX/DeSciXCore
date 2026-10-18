/**
 * GATE: the ChatWidget buy-credits path starts Powch's checkout (eabadir/DeSciXCloud#39, "cloud rails: A").
 *
 * Cloud no longer creates Stripe sessions. util/creditsCheckout.js is the one owner of the widget's
 * buy call: Powch's `create_checkout_session` through /apifront with { purchase_type, amount_usd },
 * returning the session whose `url` the widget opens. The amounts offered are the ai_credits bundles of
 * get_credit_balance.purchase_catalogue (Cloud owns the list); there is no list in the SDK.
 *
 * Measured at the global fetch seam, the same seam purchase-call-shape.test.js uses.
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
globalThis.window = { location: { search: '' } };
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
let reply = { status: 'OK', message: {} };
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
const Checkout = await import(join(SRC, 'util', 'creditsCheckout.js'));
AppData.sessionInfo = { id: 'user-123', access_token: 'tok' };

const SESSION = { session_id: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/cs_test_1', charge_cents: 1000, currency: 'usd', purchase_type: 'ai_credits' };

test('startCreditsCheckout dispatches Powch create_checkout_session with the catalogue request', async () => {
  captured.length = 0;
  reply = { status: 'OK', message: SESSION };
  const session = await Checkout.startCreditsCheckout(10);
  assert.equal(captured.length, 1);
  assert.equal(captured[0].command, 'create_checkout_session');
  assert.deepEqual(
    { purchase_type: captured[0].params.purchase_type, amount_usd: captured[0].params.amount_usd },
    { purchase_type: 'ai_credits', amount_usd: 10 },
  );
  assert.equal(session.url, SESSION.url);
});

test('a session without a url fails loud naming the command', async () => {
  reply = { status: 'OK', message: { session_id: 'cs_x' } };
  await assert.rejects(Checkout.startCreditsCheckout(25), /create_checkout_session.*url/);
});

test('the offered amounts are the ai_credits bundles of get_credit_balance.purchase_catalogue', () => {
  const balance = {
    usd_balance: 0,
    purchase_catalogue: [
      { purchase_type: 'ai_credits', bundles: [{ amount_usd: 10 }, { amount_usd: 25 }, { amount_usd: 100 }] },
      { purchase_type: 'patronage', min_usd: 20, max_usd: null },
    ],
  };
  assert.deepEqual(Checkout.creditBundleAmounts(balance), [10, 25, 100]);
});

test('no catalogue means nothing to offer (null), never an SDK-side list', () => {
  assert.equal(Checkout.creditBundleAmounts({ usd_balance: 0 }), null);
  assert.equal(Checkout.creditBundleAmounts(null), null);
  assert.equal(Checkout.creditBundleAmounts({ purchase_catalogue: [{ purchase_type: 'patronage', min_usd: 20 }] }), null);
});

test('ChatWidget buys only through the owner and carries no amount list of its own', () => {
  const widget = readFileSync(join(SRC, 'components', 'ChatWidget.jsx'), 'utf8');
  assert.match(widget, /from '\.\.\/util\/creditsCheckout(\.js)?'/);
  assert.doesNotMatch(widget, /\[\s*5\s*,\s*10\s*,\s*20\s*\]/, 'a hardcoded bundle list mirrors Cloud\'s catalogue');
  assert.doesNotMatch(widget, /makeCommandRequestJSON\(\s*['"]create_checkout_session/, 'the widget must call the owner, not the command');
});
