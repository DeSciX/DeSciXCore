/**
 * Unit tests for @descix/platform-api/naming — canonical token<->community<->app id derivation.
 * Authority: CEO-D-2026-06-08-CANONICAL-TOKEN-COMMUNITY-APP-MODEL.
 *
 * Pure module, zero deps. Run: node --test tests/naming.test.js (from descix-platform-api/).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    communityIdFromTokenSymbol,
    assertValidAppShortName,
    composeAppId,
    composeUserAppId,
} from '../src/naming/index.js';

test('communityIdFromTokenSymbol: id derived from SYMBOL not name (descix/daita root cause)', () => {
    // The split bug: community NAME "DeSciX" + token "DAITA" must yield id 'daita', NOT 'descix'.
    // Regression guard for WS-DESCIX-DAITA-CANON: the bootstrap "already exists" fallback at
    // admin/bootstrap.js:1238 previously derived community_id from the NAME (-> 'descix'); it now
    // derives from the token symbol (tokenSymbol.toLowerCase()), matching this contract.
    assert.equal(communityIdFromTokenSymbol('DAITA'), 'daita');
    // Symbol-only derivation: a free-text display name can never re-enter the id.
    assert.equal(communityIdFromTokenSymbol('EGPT'), 'egpt');
    assert.equal(communityIdFromTokenSymbol('smile'), 'smile'); // accepts any case
});

test('communityIdFromTokenSymbol: name != symbol no longer splits', () => {
    // Two different display names with the SAME token symbol resolve to the SAME id.
    const fromBrandName = communityIdFromTokenSymbol('DAITA'); // token for "DeSciX" brand
    const fromOther = communityIdFromTokenSymbol('daita');
    assert.equal(fromBrandName, fromOther);
    assert.equal(fromBrandName, 'daita');
});

test('communityIdFromTokenSymbol: rejects invalid symbols', () => {
    assert.throws(() => communityIdFromTokenSymbol(''), /required/);
    assert.throws(() => communityIdFromTokenSymbol('TOOLONGSYMBOL'), /1-7/);
    assert.throws(() => communityIdFromTokenSymbol('!!!'), /1-7/); // strips to empty
});

test('assertValidAppShortName: rejects the reserved hyphen separator', () => {
    assert.throws(() => assertValidAppShortName('egpt-frqtl'), /reserved/);
    assert.throws(() => assertValidAppShortName('a-b'), /reserved/);
});

test('assertValidAppShortName: rejects spaces and punctuation', () => {
    assert.throws(() => assertValidAppShortName('my app'), /lowercase/);
    assert.throws(() => assertValidAppShortName('App'), /lowercase/); // uppercase not allowed
    assert.throws(() => assertValidAppShortName('app!'), /lowercase/);
    assert.throws(() => assertValidAppShortName(''), /required/);
});

test('assertValidAppShortName: accepts valid short names', () => {
    assert.equal(assertValidAppShortName('frqtl'), 'frqtl');
    assert.equal(assertValidAppShortName('docs'), 'docs');
    assert.equal(assertValidAppShortName('v2_beta'), 'v2_beta');
    assert.equal(assertValidAppShortName('app1'), 'app1');
});

test('composeAppId: sub-app = {community}-{short}', () => {
    assert.equal(composeAppId('egpt', 'frqtl'), 'egpt-frqtl');
    assert.equal(composeAppId('daita', 'docs'), 'daita-docs');
    assert.equal(composeAppId('EGPT', 'FRQTL'), 'egpt-frqtl'); // normalizes case
});

test('composeAppId: default app (short == community) returns bare community id', () => {
    assert.equal(composeAppId('daita', 'daita'), 'daita');
    assert.equal(composeAppId('egpt', 'egpt'), 'egpt');
});

test('composeAppId: tolerates an already-prefixed id but re-validates the tail', () => {
    assert.equal(composeAppId('egpt', 'egpt-frqtl'), 'egpt-frqtl');
    // a double-prefixed / double-hyphen tail must still fail loud
    assert.throws(() => composeAppId('egpt', 'egpt-fr-qtl'), /reserved/);
});

test('composeAppId: a short name containing - fails loud', () => {
    assert.throws(() => composeAppId('egpt', 'fr-qtl'), /reserved/);
});

test('composeAppId: requires community_id', () => {
    assert.throws(() => composeAppId('', 'frqtl'), /community_id is required/);
});

// ─── composeUserAppId (CEO-D-2026-07-18-PER-USER-APP): self-scoping per-user app id ───

test('composeUserAppId: {community}-{uid}, uid kept VERBATIM (injective self-scope)', () => {
    // A passkey uid (sanitized credentialId) legitimately carries '-', '_', and case — it must NOT
    // be lowercased/rewritten, else two case-distinct credential ids could collide onto one app.
    assert.equal(composeUserAppId('daita', 'AbC-_dEf'), 'daita-AbC-_dEf');
    assert.equal(composeUserAppId('daita', 'Zm9vYmFy_-QQ'), 'daita-Zm9vYmFy_-QQ');
});

test('composeUserAppId: email-fallback uid (@/.) is allowed (opaque identity tail)', () => {
    assert.equal(composeUserAppId('daita', 'sam@descix.net'), 'daita-sam@descix.net');
});

test('composeUserAppId: community prefix is normalized (token-derived)', () => {
    assert.equal(composeUserAppId('DAITA', 'Xy'), 'daita-Xy');
});

test('composeUserAppId: rejects Firestore-doc-id-unsafe / empty uids', () => {
    assert.throws(() => composeUserAppId('daita', 'a/b'), /not allowed in a Firestore doc id/);
    assert.throws(() => composeUserAppId('daita', 'a b'), /whitespace/);
    assert.throws(() => composeUserAppId('daita', '.'), /reserved doc ids/);
    assert.throws(() => composeUserAppId('daita', '..'), /reserved doc ids/);
    assert.throws(() => composeUserAppId('daita', ''), /uid .* is required/);
    assert.throws(() => composeUserAppId('', 'x'), /community_id is required/);
    assert.throws(() => composeUserAppId('daita', 'a'.repeat(300)), /exceeds/);
});
