/**
 * GATE: the app-store purchase/join call shape.
 *
 * THE DEFECT THIS CATCHES. `purchaseProduct` destructures a SINGLE options bag
 * (`purchaseProduct({ community_id, product_id, product_type, ... })`). `handlePurchase` is the
 * (item, type) POSITIONAL owner that maps a community/app object onto those named params. Two
 * AppContext call sites passed the object POSITIONALLY straight into `purchaseProduct`, so every
 * named param except `community_id` arrived undefined and the second argument was discarded
 * entirely. For a community that also flipped the command: `product_type !== ProductTypes.COMMUNITY`
 * compared `undefined` against 'COMMUNITY', came out true, and dispatched `purchase_product`
 * instead of `join_community` — with a null user_id. It is invisible by reading either function
 * alone; it only exists in the relationship between them, which is why this gate measures the
 * DISPATCHED COMMAND AND PARAMS rather than either signature.
 *
 * WHY THE RED CONTROL IS IN THE TEST. A check verified only in the passing direction is not a
 * gate. The first test below deliberately makes the ORIGINAL, BROKEN call and asserts the broken
 * outcome. If someone "fixes" purchaseProduct to accept positional args, that test fails and says
 * so — the gate cannot silently stop discriminating.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..', 'src');

// ---------------------------------------------------------------------------
// Browser/Vite seams. These exist so the REAL modules load under node; none of
// them sits on the argument-passing path this gate measures.
// ---------------------------------------------------------------------------
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
    // AppData.jsx holds no JSX; node only refuses the extension. Load it as ESM.
    const r = nextLoad(url, { ...context, format: 'module' });
    let src = typeof r.source === 'string' ? r.source : Buffer.from(r.source).toString('utf8');
    // `import.meta.env` is a Vite build-time global with no node equivalent. This is the ONLY
    // rewrite performed on the source under test.
    src = src.replaceAll('import.meta.env', 'globalThis.__VITE_ENV__');
    return { ...r, source: src };
  },
});

const captured = [];
globalThis.fetch = async (_url, init) => {
  captured.push(JSON.parse(init.body));
  return {
    ok: true,
    status: 200,
    json: async () => ({ status: 'OK', message: { joined: true } }),
    text: async () => JSON.stringify({ status: 'OK', message: { joined: true } }),
    headers: { get: () => 'application/json' },
  };
};

const AppDataMod = await import(join(SRC, 'util', 'AppData.jsx'));
const Payments = await import(join(SRC, 'util', 'api', 'ApiPayments.js'));
const { ProductTypes, AppData } = AppDataMod;

AppData.sessionInfo = { id: 'user-123', access_token: 'tok' };

const COMMUNITY = { community_id: 'egpt', price: 0, token_symbol: 'EGPT' };
const APP = { community_id: 'egpt', app_id: 'egpt-frqtl', price: 0, token_symbol: 'EGPT' };

async function dispatchOf(fn) {
  captured.length = 0;
  await fn();
  assert.equal(captured.length, 1, 'expected exactly one outbound request');
  return captured[0];
}

test('RED CONTROL: the original positional call into purchaseProduct really is broken', async () => {
  const req = await dispatchOf(() => Payments.purchaseProduct(COMMUNITY, ProductTypes.COMMUNITY));

  // The whole defect, asserted. If any of these start passing, the gate has stopped
  // discriminating and the GREEN test below no longer proves anything.
  assert.equal(req.command, 'purchase_product',
    'the broken shape must still mis-dispatch, or this gate is no longer measuring the defect');
  assert.equal(req.params.product_type, undefined, 'second positional arg must be discarded');
  assert.equal(req.params.user_id, undefined, 'user_id must arrive undefined');
  assert.equal(req.params.product_id, undefined, 'product_id must arrive undefined');
});

test('GREEN: handlePurchase dispatches join_community with the fields mapped', async () => {
  const req = await dispatchOf(() => Payments.handlePurchase(COMMUNITY, ProductTypes.COMMUNITY));

  assert.equal(req.command, 'join_community');
  assert.equal(req.params.product_type, ProductTypes.COMMUNITY);
  assert.equal(req.params.user_id, 'user-123');
  assert.equal(req.params.product_id, 'egpt');
});

test('GREEN: handlePurchase dispatches purchase_product for an APP, with real params', async () => {
  const req = await dispatchOf(() => Payments.handlePurchase(APP, ProductTypes.APP));

  // The app path produced the RIGHT command by accident even when broken, so the command alone
  // never discriminated here — the params are what prove it.
  assert.equal(req.command, 'purchase_product');
  assert.equal(req.params.product_type, ProductTypes.APP);
  assert.equal(req.params.user_id, 'user-123');
  assert.equal(req.params.product_id, 'egpt-frqtl');
});

test('CALL SITES: AppContext must route both purchases through the (item, type) owner', () => {
  // The behavioural tests above prove handlePurchase is correct; they cannot prove AppContext
  // CALLS it. AppContext.jsx is real JSX and does not load under node, so this leg is a source
  // assertion by necessity — and it is the leg that actually regressed.
  const src = readFileSync(join(SRC, 'AppContext.jsx'), 'utf8');

  assert.ok(!/Api\.purchaseProduct\s*\(/.test(src),
    'AppContext must not call Api.purchaseProduct directly: it destructures one options bag, so a ' +
    'positional (item, type) call silently drops every param. Use Api.handlePurchase.');

  const joins = src.match(/Api\.handlePurchase\s*\(/g) || [];
  assert.equal(joins.length, 2,
    'expected exactly two handlePurchase call sites (installApp and joinCommunity)');
});

test('COVERAGE BOUNDARY (prints on green as well as red)', () => {
  console.log(`
  ── GATE COVERAGE BOUNDARY ─────────────────────────────────────────────────
  WHAT IT COMPARES : the command name + params actually put on the wire by
                     ApiPayments, captured at the global fetch seam, for the
                     broken call shape vs the fixed one.
  DEFECT CLASS     : positional args passed into a destructured-options
                     signature — params silently undefined, command mis-routed.
  WHAT IT DOES NOT READ:
    - the SERVER's handling of join_community / purchase_product. This proves
      what is SENT, never what the platform does with it.
    - AppContext.jsx behaviourally. It is real JSX and does not load under
      node, so its call sites are asserted from SOURCE TEXT only. A rename of
      the Api facade would defeat that leg.
    - any built/bundled artifact. This runs against src/, not dist/.
    - the Cloud PWA, which consumes this package via a file: dependency and
      must be REBUILT for either fix to reach a user.
  AUTOMATION       : runs under this package's \`npm test\`
                     (node --test "tests/*.test.js"). Nothing else invokes it.
  ───────────────────────────────────────────────────────────────────────────`);
});
