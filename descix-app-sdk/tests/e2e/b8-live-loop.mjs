/**
 * WS-B8 — LIVE reproduction of the CodeSite action-result return path.
 *
 * This is the script that produced the B8 hand-back evidence. It drives the REAL
 * loop against the LIVE DEV backend — no mock of the widget, the ingress, or the
 * chat call:
 *
 *   Run clicked -> CodeSiteWidget.handleExecuteAction -> action executes ->
 *   chatIngress contribution -> ChatWidget.contribute -> submitTurn ->
 *   real metered ask_question_to_app -> AI answers the result.
 *
 * Auth: a REAL platform session is minted node-side via reconnect_by_wallet (the
 * same wallet-sig rail the CLI uses) and seeded into localStorage. Only the Powch
 * biometric ceremony is bypassed (covered by journey1 specs); every backend check
 * (session, entitlement, credits gate, debit) is live and authoritative.
 *
 * The AI turn is SEEDED with a real ```json:call:<fn> block so the Run gate renders
 * deterministically — that block is exactly what the model emits, so everything
 * downstream of it is the production path.
 *
 * PREREQS
 *   1. split-view harness on :5199 running THIS checkout's app-sdk:
 *        cd descix-app-sdk/demo && VITE_POWCH_APP_URL=https://powch.dev.descix.net/ npx vite
 *      NOTE: demo/splitview.jsx points at `descix-docs`, which is NOT registered on
 *      DEV — retarget DEMO_APP to a registered app (e.g. daita-splitviewdemo/daita)
 *      or the metered call returns "App ... not found in community ...".
 *   2. an HTTPS shim on :4000 forwarding to https://dev.descix.net (the harness
 *      hardcodes localhost:4000 as its /apifront target).
 *   3. /Users/essam/Code/Unkamon/.descix/wallet.json admin credential.
 *
 * USAGE
 *   node b8-live-loop.mjs           # result-reaches-conversation leg
 *   node b8-live-loop.mjs --huge    # size-policy / truncation leg
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import https from 'node:https';

const HARNESS = process.env.B8_HARNESS || 'https://localhost:5199/splitview.html';
const APIFRONT = process.env.B8_APIFRONT || 'https://dev.descix.net/apifront/';
const WALLET = process.env.B8_WALLET || '/Users/essam/Code/Unkamon/.descix/wallet.json';
const APP = process.env.B8_APP || 'daita-splitviewdemo';
const COMMUNITY = process.env.B8_COMMUNITY || 'daita';
const HUGE = process.argv.includes('--huge');

function apifront(command, params) {
  const body = JSON.stringify({ command, params, user_id: null, access_token: null, guild_id: null });
  return new Promise((resolve, reject) => {
    const req = https.request(APIFRONT, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, rejectUnauthorized: false,
    }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({ raw: d }); } });
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

async function mintSession() {
  const w = JSON.parse(fs.readFileSync(WALLET, 'utf8'));
  const r = await apifront('reconnect_by_wallet', {
    wallet_address: w.address ?? w.walletAddress, signature: w.signature,
  });
  const s = r?.message?.sessionInfo || r?.message;
  if (!s?.access_token) throw new Error(`reconnect_by_wallet failed: ${JSON.stringify(r).slice(0, 300)}`);
  return s;
}

/** A thread whose latest AI turn carries a real action block, so Run renders. */
function seededThread(fnName, args) {
  const now = new Date().toISOString();
  return {
    active_thread_id: 't_b8',
    threads: {
      t_b8: {
        thread_id: 't_b8', title: 'B8', community_id: COMMUNITY, app_id: APP,
        created_at: now, updated_at: now, is_saved: false, drive_file_id: null,
        interaction_id: null,
        messages: [{
          id: 'm1',
          question: HUGE ? 'Dump the whole field.' : 'Maxi, run the counterfactual and tell me what happened.',
          answer: 'Running it.\n\n```json:call:' + fnName + '\n' + JSON.stringify(args) + '\n```',
          sources: [], checked: true, timestamp: now,
        }],
      },
    },
  };
}

const sess = await mintSession();
console.log('SESSION:', sess.email || sess.user_id);

const fnName = HUGE ? 'b8_huge' : 'ide_set_status';
const thread = seededThread(fnName, HUGE ? {} : { status: 'counterfactual-complete' });

const browser = await chromium.launch();
const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await ctx.newPage();
await page.addInitScript(([s, t, com, app]) => {
  localStorage.setItem('sessionInfo', JSON.stringify(s));
  localStorage.setItem('loginStatus', JSON.stringify('CONNECTED'));
  localStorage.setItem(`descix_threads_${com}_${app}`, JSON.stringify(t));
}, [sess, thread, COMMUNITY, APP]);

const logs = [];
page.on('console', (m) => logs.push(m.text()));

await page.goto(HARNESS, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(9000);

if (HUGE) {
  // children mode => actions live on the HOST window. Register an oversized result
  // on the documented extension point (window.DeSciX_Actions).
  await page.evaluate(() => { window.DeSciX_Actions.b8_huge = () => 'Z'.repeat(100000); });
  console.log('raw result the action will return: 100000 chars');
}

await page.getByRole('button', { name: /Run/i }).first().click();

const marker = HUGE ? /TRUNCATED by DeSciX chat ingress/ : /CodeSite action result/;
let ok = false;
for (let i = 0; i < 45; i++) {
  await page.waitForTimeout(2000);
  if (marker.test(await page.locator('body').innerText())) { ok = true; break; }
}

const text = await page.locator('body').innerText();
console.log(HUGE ? 'TRUNCATION MARKER PRESENT:' : 'RESULT ENTERED CONVERSATION:', ok);
if (HUGE) {
  console.log('MARKER:', (text.match(/TRUNCATED by DeSciX chat ingress[^\]]*/) || ['(none)'])[0]);
  console.log('PREFIX warning present:', /PREFIX of the result/.test(text));
  console.log('conversation chars rendered:', text.length, '(raw payload was 100000)');
} else {
  console.log('--- conversation tail ---\n' + text.slice(-1800));
  console.log('--- host action really ran, ide-status =',
    await page.locator('[data-testid="ide-status"]').innerText().catch(() => 'n/a'));
}
console.log('--- widget console ---\n' + logs.filter((l) => /CodeSiteWidget/.test(l)).slice(0, 4).join('\n'));

await page.screenshot({ path: `b8-${HUGE ? 'huge' : 'result'}.png` });
await browser.close();
if (!ok) process.exitCode = 1;
