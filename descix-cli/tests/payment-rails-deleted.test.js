/**
 * GATE: Cloud's payment rails are gone from every Core surface (eabadir/DeSciXCloud#39, "cloud rails: A").
 *
 * Cloud deleted its Stripe checkout command, its Stripe config/status reads and the whole CryptoAPIs
 * crypto-purchase rail; buying is Powch's `create_checkout_session` (the Powch Buy menu, and
 * `descix credits buy`). A Core facade, MCP description, guest list, verb or doc that still names a
 * deleted command sends its reader to a command the platform no longer serves. This gate scans every
 * file Core tracks (tests included, this file excepted) for each deleted name, as a whole identifier.
 *
 * Run: node --test tests/payment-rails-deleted.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const THIS_FILE = fileURLToPath(import.meta.url);
const CORE_ROOT = path.resolve(path.dirname(THIS_FILE), '..', '..');

/** The deleted Cloud commands and route, and the Core facades/helpers that existed only to reach them. */
export const DELETED_PAYMENT_RAIL_NAMES = Object.freeze([
  // Cloud commands
  'create_stripe_checkout_session', 'get_stripe_config', 'get_stripe_status',
  'create_crypto_quote', 'get_quote_status', 'get_crypto_deposit_info',
  'verify_crypto_payment', 'get_chain_watcher_status',
  // Cloud route
  'cryptoapis/webhook',
  // app-sdk facades
  'initiateStripeCheckout', 'getCryptoDepositInfo', 'verifyCryptoPayment', 'createCryptoQuote', 'getQuoteStatus',
  // platform-api quote-rail emails (their one caller was Cloud's quote rail)
  'sendPaymentPending', 'sendPaymentConfirmation',
]);

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
// Whole identifier only: `powch_get_stripe_config` is Powch's own command, not Cloud's deleted one.
const PATTERN = new RegExp(`(?<![A-Za-z0-9_])(${DELETED_PAYMENT_RAIL_NAMES.map(escape).join('|')})(?![A-Za-z0-9_])`, 'g');

function trackedFiles() {
  const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: CORE_ROOT });
  return out.toString('utf8').split('\0').filter(Boolean)
    .filter((rel) => !rel.endsWith('package-lock.json'))
    .map((rel) => path.join(CORE_ROOT, rel))
    .filter((abs) => abs !== THIS_FILE && fs.existsSync(abs) && fs.statSync(abs).isFile());
}

test('the gate scans a real tree (a scan of nothing passes everything)', () => {
  const files = trackedFiles();
  assert.ok(files.length > 500, `expected the Core tree, got ${files.length} files under ${CORE_ROOT}`);
  for (const must of ['descix-cli/bin/descix.js', 'descix-app-sdk/src/util/api/ApiPayments.js', 'descix-platform-api/src/mcp-tools/nativeTools.js', 'descix-cloud-core/src/config.js']) {
    assert.ok(files.includes(path.join(CORE_ROOT, must)), `the scan must cover ${must}`);
  }
});

test('the pattern matches a deleted name and not the Powch command that shares its suffix', () => {
  assert.match('invoke("create_crypto_quote")', new RegExp(PATTERN.source));
  assert.match('Api.getQuoteStatus(id)', new RegExp(PATTERN.source));
  assert.doesNotMatch('powch_get_stripe_config', new RegExp(PATTERN.source));
});

test('no Core file names a deleted payment-rail command, route or facade', () => {
  const offenders = [];
  for (const file of trackedFiles()) {
    const src = fs.readFileSync(file, 'utf8');
    if (src.includes('\0')) continue; // binary
    src.split('\n').forEach((line, i) => {
      for (const m of line.matchAll(PATTERN)) offenders.push(`${path.relative(CORE_ROOT, file)}:${i + 1}: ${m[1]}`);
    });
  }
  assert.deepEqual(offenders, [], `deleted payment-rail names still present:\n${offenders.join('\n')}`);
});
