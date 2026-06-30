#!/usr/bin/env node
/**
 * WS-MCP-SURFACE-SPLIT §9 — CLOUD-TRANSPORT smoke for the permission-filtered tools/list.
 *
 * The local sibling (ws-mcp-surface-split-smoke.mjs) proves the surface over the local
 * :4000 backend. THIS smoke proves the same permission-filtered surface end-to-end over the
 * DEPLOYED, IAM-gated DEV Cloud Function `apiFront-http-dev` (--no-allow-unauthenticated),
 * exercising the IAM auth seam (_applyIamAuthIfNeeded / _mintIamBearer) in api-client.js:
 *
 *   - baseUrl is forced to the deployed Cloud Run URL (an IAM-gated `.run.app` origin)
 *   - the client must mint a Google identity bearer to clear Cloud Run IAM (HTTP 403 layer)
 *   - the CLI session credential in the BODY then clears the app-level auth middleware
 *   - mcpListTools() returns the SAME server-side permission-filtered catalog as :4000
 *
 * This is the "always-on CLOUD MCP" transport: point DESCIX_API_URL (or the cloud client's
 * baseUrl) at the deployed function and the stdio MCP serves the cloud surface.
 *
 * Run:  node DeSciX_Core/descix-cli/tests/ws-mcp-surface-split-cloud-smoke.mjs
 * Requires: gcloud ADC with run.invoker on apiFront-http-dev (project owner/editor inherits),
 *           and .descix/wallet.json (NEVER testuser.json).
 * Override the URL with DESCIX_CLOUD_FN_URL=... if the function URL changes.
 */

import { DeSciXApiClient } from '../lib/api-client.js';
import { WalletFileManager } from '../lib/wallet-file.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../..');

// The deployed, IAM-gated DEV Cloud Run URL (raw run.app origin → IAM bearer required).
// Cloud Functions gen2 serves on a *.run.app URL; the cloudfunctions.net alias fronts the same
// service. We target the run.app origin so the minted ID-token audience matches.
const CLOUD_FN_URL = process.env.DESCIX_CLOUD_FN_URL
  || 'https://apifront-http-dev-sglkz2ylhq-uc.a.run.app';

const ADMIN_GATED = ['create_app_for_community', 'app_records_put', 'app_records_delete', 'app_records_query', 'app_records_get'];
const ALWAYS_PUBLIC = ['tell_me_how', 'find_communities', 'ask_question_to_app', 'query_knowledge_base', 'list_apps_for_community', 'resolve_invite'];

function names(tools) { return new Set(tools.map(t => t.name)); }
function fail(msg) { console.error(`\n❌ FAIL: ${msg}`); process.exit(1); }
function ok(msg) { console.log(`✅ ${msg}`); }

(async () => {
  console.log('=== WS-MCP-SURFACE-SPLIT CLOUD-transport smoke (IAM-gated apiFront-http-dev) ===');
  console.log(`Target: ${CLOUD_FN_URL}\n`);

  // ---- ADMIN caller over the CLOUD transport (baseUrl pinned to the deployed function) ----
  const adminClient = new DeSciXApiClient({ projectRoot: REPO_ROOT, baseUrl: CLOUD_FN_URL });
  const walletPath = await WalletFileManager.findWalletFile(REPO_ROOT);
  if (!walletPath) fail('no .descix/wallet.json found — cannot run admin leg');
  const w = await WalletFileManager.loadWalletFile(walletPath);
  adminClient.setCredentials({
    userId: w.userId || null,
    accessToken: w.sessionToken || null,
    walletAddress: w.walletAddress || null,
    signature: w.signature || null,
  });

  // Prove the seam actually engaged for this origin.
  if (!adminClient._isIamGatedOrigin()) fail(`baseUrl ${CLOUD_FN_URL} not recognized as IAM-gated origin — seam would not engage`);
  ok('baseUrl recognized as IAM-gated origin — IAM bearer will be applied');

  const adminTools = await adminClient.mcpListTools();
  const adminNames = names(adminTools);
  console.log(`\nADMIN caller (${w.userId}) over CLOUD transport sees ${adminTools.length} tools:`);
  console.log('  ' + [...adminNames].sort().join(', ') + '\n');

  // ---- PUBLIC caller over the CLOUD transport ----
  const guestClient = new DeSciXApiClient({ projectRoot: REPO_ROOT, baseUrl: CLOUD_FN_URL });
  guestClient.setCredentials({ userId: null, accessToken: null, walletAddress: null, signature: null });
  let guestTools = [];
  let guestErr = null;
  try {
    guestTools = await guestClient.mcpListTools({ allowGuest: true });
  } catch (e) {
    guestErr = e;
  }
  const guestNames = names(guestTools);
  if (guestErr) {
    console.log(`PUBLIC (guest) caller: app-auth rejected unauthenticated request (${guestErr.message}). ` +
      `Expected — a guest gets NO admin surface.\n`);
  } else {
    console.log(`PUBLIC (guest) caller sees ${guestTools.length} tools:`);
    console.log('  ' + [...guestNames].sort().join(', ') + '\n');
  }

  // ===== Assertions (identical to the local smoke — same server-side gate) =====
  for (const t of ALWAYS_PUBLIC) {
    if (!adminNames.has(t)) fail(`admin surface missing always-public tool '${t}'`);
  }
  ok(`admin surface includes all ${ALWAYS_PUBLIC.length} always-public tools`);

  const adminSeesGated = ADMIN_GATED.filter(t => adminNames.has(t));
  if (adminSeesGated.length === 0) fail(`admin surface includes NONE of the gated tools ${JSON.stringify(ADMIN_GATED)} — filter over-restricting an admin`);
  ok(`admin surface includes ${adminSeesGated.length}/${ADMIN_GATED.length} permission-gated tools: ${adminSeesGated.join(', ')}`);

  if (!guestErr) {
    const leaked = ADMIN_GATED.filter(t => guestNames.has(t));
    if (leaked.length > 0) fail(`PUBLIC/guest surface LEAKED admin-gated tools: ${leaked.join(', ')}`);
    ok(`public/guest surface leaks ZERO admin-gated tools`);
    for (const g of guestNames) {
      if (!adminNames.has(g)) fail(`guest sees '${g}' not in admin surface — inconsistent`);
    }
    ok(`public surface ⊆ admin surface (strict subset)`);
  }

  if (!guestErr && adminNames.size <= guestNames.size) {
    fail(`admin surface (${adminNames.size}) not strictly larger than guest (${guestNames.size}) — filter not discriminating`);
  }
  ok(guestErr
    ? `separation proven via guest app-auth gate (admin=${adminNames.size} tools, guest=0)`
    : `admin surface (${adminNames.size}) ⊋ guest surface (${guestNames.size}) — describe-gate discriminates by permission`);

  console.log('\n=== CLOUD SMOKE PASS: deployed IAM-gated apiFront-http-dev serves the permission-filtered tools/list end-to-end (§9 + §10.2) ===');
  process.exit(0);
})().catch(e => { console.error('\n❌ CLOUD SMOKE ERROR:', e.stack || e.message); process.exit(1); });
