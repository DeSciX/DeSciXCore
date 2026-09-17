/**
 * formatDevCertBanner — the exact `descix serve` banner wording for dev-cert
 * trust status. A pure function (gateway.js), so this is tested directly
 * without booting a Vite server. devx-evangelist's docs quote this line
 * verbatim: "Passkey sign-in will fail: <reason>. Run: descix dev-certs trust".
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDevCertBanner } from '../src/dev/gateway.js';

test('trusted cert -> one quiet confirmation line, no warning', () => {
  const line = formatDevCertBanner({ status: 'trusted', detail: 'irrelevant' }, '/path/to/cert.pem');
  assert.match(line, /Dev cert: \/path\/to\/cert\.pem\s+\(trusted\)/);
  assert.doesNotMatch(line, /Passkey sign-in will fail/);
});

test('untrusted cert -> exact wording, reason inlined, single trailing period', () => {
  const line = formatDevCertBanner({ status: 'untrusted', detail: 'CSSMERR_TP_NOT_TRUSTED' }, '/path/to/cert.pem');
  assert.equal(line, '  ⚠ Passkey sign-in will fail: CSSMERR_TP_NOT_TRUSTED. Run: descix dev-certs trust\n');
});

test('a detail that already ends in a period does not get doubled', () => {
  const line = formatDevCertBanner({ status: 'missing', detail: 'No certificate at /x/cert.pem.' }, '/x/cert.pem');
  assert.match(line, /No certificate at \/x\/cert\.pem\. Run: descix dev-certs trust\n$/);
  assert.doesNotMatch(line, /\.\./);
});

test('every non-trusted status prints the warning, not just untrusted', () => {
  for (const status of ['missing', 'no_localhost_san', 'expired', 'unverifiable']) {
    const line = formatDevCertBanner({ status, detail: `${status} reason` }, '/cert.pem');
    assert.match(line, /Passkey sign-in will fail: .*\. Run: descix dev-certs trust/);
  }
});

// NEGATIVE CONTROL: prove the assertion actually discriminates by checking a
// deliberately WRONG expectation fails — guards against a vacuously-true regex.
test('negative control: the untrusted line does NOT equal the trusted line', () => {
  const untrusted = formatDevCertBanner({ status: 'untrusted', detail: 'x' }, '/cert.pem');
  const trusted = formatDevCertBanner({ status: 'trusted', detail: 'x' }, '/cert.pem');
  assert.notEqual(untrusted, trusted);
});
