/**
 * GATE: one share-link parameter (`?ref=<custom_id>`), one claim shape (process_deep_link { custom_id }).
 *
 * THE DEFECT: the shell read `custom_id` + `referrer_id` from the URL (AppContext SDK_CHECKED, SdkInitializer)
 * and from the Discord launch (customId + referrerId), and claimed with Api.validateReferral
 * { custom_id, referrer_id, guild_id } — a caller-named referrer, which the server now refuses
 * (REFERRAL_PARAMS_REMOVED). makeCustomDeepLink emitted `?referrer_id=…&custom_id=…`. A web visitor's `?ref=`
 * was captured by nothing in the SDK, so every shell instance but the platform's lost it.
 *
 * Measured at the fetch seam (what leaves the browser) and sessionStorage (where the held ref lives), through
 * the REAL Api.call: it throws on a refusal with the server's code, so a claim that treats every throw as
 * "retry" keeps a refused ref forever — the REFUSED-THROWN test pins that. AppContext.jsx and
 * SdkInitializer.jsx are JSX and do not load under node; their call sites are pinned by source checks.
 *
 * Run: node --test tests/share-link.test.js
 */
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..', 'src');
const read = (...p) => readFileSync(join(SRC, ...p), 'utf8');

globalThis.__VITE_ENV__ = { VITE_DEBUG_PROXY: '', MODE: 'test' };
const loc = { search: '', pathname: '/', origin: 'https://egpt.descix.net' };
globalThis.window = { location: loc };
Object.defineProperty(globalThis, 'location', { configurable: true, writable: true, value: loc });
function mapStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear() };
}
Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: mapStorage() });
const session = mapStorage();
Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, writable: true, value: session });

registerHooks({
  load(url, context, nextLoad) {
    if (!url.includes('/descix-app-sdk/src/')) return nextLoad(url, context);
    const r = nextLoad(url, { ...context, format: 'module' });
    let src = typeof r.source === 'string' ? r.source : Buffer.from(r.source).toString('utf8');
    src = src.replaceAll('import.meta.env', 'globalThis.__VITE_ENV__');
    return { ...r, source: src };
  },
});

// The server, at the fetch seam.
const sent = [];
let reply = () => ({ status: 'OK', message: {} });
globalThis.fetch = async (_url, init) => {
  const body = JSON.parse(init.body);
  sent.push(body);
  const { httpStatus = 200, ...r } = reply(body);
  return { ok: httpStatus < 400, status: httpStatus, json: async () => r, text: async () => JSON.stringify(r), headers: { get: () => 'application/json' } };
};

const load = () => import(join(SRC, 'util', 'shareLink.js'));
const { Api } = await import(join(SRC, 'util', 'api', 'index.js'));
const { AppData } = await import(join(SRC, 'util', 'AppData.jsx'));

beforeEach(() => {
  session.clear();
  sent.length = 0;
  AppData.sessionInfo = { id: 'u-visitor', access_token: 'tok' };
});

// ── capture ──────────────────────────────────────────────────────────────────────────────────

test('CAPTURE: ?ref is held and removed from the URL; path, other params and fragment stay', async () => {
  const { capturePendingRef, PENDING_REF_KEY } = await load();
  const out = capturePendingRef({ href: 'https://egpt.descix.net/letter?x=1&ref=shr_abc#part-2' }, session);
  assert.deepEqual(out, { ref: 'shr_abc', cleanUrl: 'https://egpt.descix.net/letter?x=1#part-2' });
  assert.equal(session.getItem(PENDING_REF_KEY), 'shr_abc');
  assert.deepEqual(capturePendingRef({ href: 'https://egpt.descix.net/#letter' }, session), { ref: null, cleanUrl: null });
  assert.equal(session.getItem(PENDING_REF_KEY), 'shr_abc', 'no ref leaves the held one alone');
});

// ── claim, through the real Api.call ─────────────────────────────────────────────────────────

test('CLAIM: sends process_deep_link { custom_id } and nothing else, and clears on OK', async () => {
  const { claimPendingRef, storePendingRef, PENDING_REF_KEY, CLAIM_OUTCOMES } = await load();
  storePendingRef(session, 'shr_abc');
  reply = () => ({ status: 'OK', message: { ref_granted: 10 } });
  const r = await claimPendingRef(session, Api.call);
  assert.equal(r.outcome, CLAIM_OUTCOMES.CLAIMED);
  assert.deepEqual(sent.map((b) => [b.command, b.params]), [['process_deep_link', { custom_id: 'shr_abc' }]]);
  assert.equal(session.getItem(PENDING_REF_KEY), null);
});

test('REFUSED-THROWN: a REFERRAL_* refusal (Api.call throws it, coded) is definitive and clears', async () => {
  const { claimPendingRef, storePendingRef, PENDING_REF_KEY, CLAIM_OUTCOMES } = await load();
  for (const [code, httpStatus] of [['REFERRAL_SELF', 400], ['REFERRAL_ALREADY_CLAIMED', 409], ['REFERRAL_NOT_FOUND', 404], ['REFERRAL_INACTIVE', 400]]) {
    storePendingRef(session, 'shr_abc');
    reply = () => ({ httpStatus, status: 'ERROR', code, message: `${code}: refused` });
    const r = await claimPendingRef(session, Api.call);
    assert.equal(r.outcome, CLAIM_OUTCOMES.REFUSED, code);
    assert.equal(session.getItem(PENDING_REF_KEY), null, code);
  }
});

test('RETRY: a network failure or an uncoded server error keeps the ref for the next session', async () => {
  const { claimPendingRef, storePendingRef, PENDING_REF_KEY, CLAIM_OUTCOMES } = await load();
  for (const r0 of [() => { throw new TypeError('Failed to fetch'); }, () => ({ httpStatus: 500, status: 'ERROR', message: 'boom' })]) {
    storePendingRef(session, 'shr_abc');
    reply = r0;
    const r = await claimPendingRef(session, Api.call);
    assert.equal(r.outcome, CLAIM_OUTCOMES.RETRY);
    assert.equal(session.getItem(PENDING_REF_KEY), 'shr_abc');
  }
});

test('CLAIM: nothing held makes no call', async () => {
  const { claimPendingRef, CLAIM_OUTCOMES } = await load();
  assert.equal((await claimPendingRef(session, Api.call)).outcome, CLAIM_OUTCOMES.NONE);
  assert.equal(sent.length, 0);
});

// ── mint ─────────────────────────────────────────────────────────────────────────────────────

test('MINT: generate_referral_code gets a WEB_PAGE target, the page and the channel; the link is the server share_url', async () => {
  const { webPageMintParams, requireShareUrl } = await load();
  reply = (b) => ({ status: 'OK', message: { custom_id: 'shr_1', created: true, share_url: `${b.params.target_identifier}?ref=shr_1`, channel: b.params.channel } });
  const msg = await Api.generateReferralCode(webPageMintParams({ page: 'https://egpt.descix.net/letter', channel: 'web_share', communityId: 'egpt' }));
  assert.deepEqual(sent[0].params, { target_type: 'WEB_PAGE', target_identifier: 'https://egpt.descix.net/letter', channel: 'web_share', target_community_id: 'egpt' });
  assert.equal(requireShareUrl(msg), 'https://egpt.descix.net/letter?ref=shr_1');
});

test('MINT (negative): a reply with no share_url, or one whose ?ref is not its custom_id, is refused; a refusal throws coded', async () => {
  const { requireShareUrl, webPageMintParams } = await load();
  assert.throws(() => requireShareUrl({ custom_id: 'shr_1', share_url: null }), /returned no share_url/);
  assert.throws(() => requireShareUrl({ custom_id: 'shr_1', share_url: 'https://egpt.descix.net/?referrer_id=u&custom_id=shr_1' }), /is not its custom_id/);
  assert.throws(() => webPageMintParams({ page: 'https://egpt.descix.net/' }), /channel is required/);
  reply = () => ({ httpStatus: 400, status: 'ERROR', code: 'PROMOTION_TARGET_HOST', message: 'PROMOTION_TARGET_HOST: off domain' });
  await assert.rejects(() => Api.generateReferralCode({}), (e) => e.code === 'PROMOTION_TARGET_HOST');
});

// ── the old path is gone ─────────────────────────────────────────────────────────────────────

test('DELETED: Api.validateReferral and the AppData referral carriers fail loud naming share-link', () => {
  assert.throws(() => Api.validateReferral({ custom_id: 'x', referrer_id: 'y' }), /Api.validateReferral is deleted.*share-link claimPendingRef/);
  for (const name of ['refCode', 'refType', 'referralData']) {
    assert.throws(() => AppData[name], new RegExp(`AppData.${name} is deleted.*share-link`), name);
    assert.throws(() => { AppData[name] = 'x'; }, new RegExp(`AppData.${name} is deleted`), name);
  }
  assert.equal(sent.length, 0, 'nothing reached the server');
});

test('ONE FORM: no src file reads custom_id / referrer_id from a URL or sends referrer_id; process_deep_link has one sender', () => {
  const files = readdirSync(SRC, { recursive: true }).filter((f) => /\.(js|jsx)$/.test(f));
  const offenders = [];
  const senders = [];
  for (const f of files) {
    const src = readFileSync(join(SRC, f), 'utf8');
    if (/get\(['"](custom_id|referrer_id)['"]\)|custom_id=\(|referrer_id=|referrerId|referrer_id:/.test(src)) offenders.push(f);
    if (/['"]process_deep_link['"]/.test(src)) senders.push(f);
  }
  assert.deepEqual(offenders, [], 'a URL-borne or caller-named referrer survives');
  assert.deepEqual(senders, [join('util', 'shareLink.js')], 'process_deep_link is named by shareLink.js alone');
});

test('WIRING: AppProvider captures ?ref at its first render and claims in ONE effect on READY+CONNECTED', () => {
  const ctx = read('AppContext.jsx');
  assert.equal(ctx.match(/capturePendingRef\(window\.location, window\.sessionStorage\)/g)?.length, 1, 'one capture site');
  assert.match(ctx, /export const AppProvider = \(\{ children \}\) => \{\n\s*useState\(captureShareLinkAtMount\);/, 'the capture is the provider\'s first hook');
  assert.equal(ctx.match(/claimPendingRef\(/g)?.length, 1, 'one claim site');
  assert.match(
    ctx,
    /if \(appState !== AppContextState\.READY \|\| loginStatus !== LoginStatus\.CONNECTED \|\| !sessionIdentity\) return;\s*claimPendingRef\(window\.sessionStorage, Api\.call\)/,
  );
  assert.match(ctx, /return requireShareUrl\(result\);/, 'a web share link is the server share_url');
  assert.doesNotMatch(ctx, /handleReferral|validateReferral|referralData/);
  const init = read('util', 'SdkInitializer.jsx');
  assert.match(init, /storePendingRef\(window\.sessionStorage, launchCustomId\)/, 'the Discord launch custom_id is held for the same claim');
  assert.doesNotMatch(init, /referrerId|referrer_id|referralData|referral:/);
});
