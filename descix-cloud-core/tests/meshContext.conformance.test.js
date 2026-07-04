/**
 * Conformance + behavior tests for the signed `_descix` mesh contract
 * (WS-MESH-SIGNED-CTX). The contract is owned by src/meshContext.js; these tests
 * are DRIVEN OFF the exported MESH_CTX_FIELDS so that a hand-edit to the envelope
 * shape that forgets to update the contract list becomes a CI failure.
 *
 * Run: `node --test tests/meshContext.conformance.test.js` from descix-cloud-core/.
 *
 * No network / Secret Manager — an ephemeral EC P-256 keypair is generated
 * in-test, mirroring the createSign/createVerify('SHA256') primitive the inbound
 * delegate leg already proves.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

import {
    MESH_CTX_FIELDS,
    MESH_CTX_HEADERS,
    normalizeMeshContext,
    serializeMeshContext,
    signMeshContext,
    buildOutboundMeshHeaders,
    verifyMeshContext,
    createMeshContextVerifier,
    MeshContextError,
} from '../src/meshContext.js';

function genKeypair() {
    return crypto.generateKeyPairSync('ec', {
        namedCurve: 'prime256v1',
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
}

const KEY_ID = 'mesh-test-1';
const sampleBag = () => ({
    user: { id: 'u_123', email: 'a@b.com', wallet_address: '0xabc' },
    entitlements: ['daita:member', 'daita:sub'],
    serviceId: 'beast',
    timestamp: Date.now(),
});

// ── 1. Contract drift: normalize yields EXACTLY MESH_CTX_FIELDS ──────────────
test('normalizeMeshContext produces exactly the MESH_CTX_FIELDS key set', () => {
    const keys = Object.keys(normalizeMeshContext({})).sort();
    const contract = [...MESH_CTX_FIELDS].sort();
    assert.deepEqual(keys, contract, 'envelope keys drifted from the exported contract');
});

test('normalizeMeshContext drops non-contract fields and keeps canonical user sub-fields', () => {
    const bag = normalizeMeshContext({
        user: { id: 'x', email: 'e', wallet_address: '0x1', walletAddress: '0xBAD', extra: 1 },
        entitlements: ['a'],
        serviceId: 'svc',
        rogue: 'nope',
    });
    assert.deepEqual(Object.keys(bag).sort(), [...MESH_CTX_FIELDS].sort());
    assert.deepEqual(Object.keys(bag.user).sort(), ['email', 'id', 'wallet_address']);
    assert.equal(bag.user.wallet_address, '0x1');
});

// ── 2. Deterministic serialization (order-independent) ───────────────────────
test('serializeMeshContext is deterministic regardless of input key order', () => {
    const a = serializeMeshContext({ serviceId: 'beast', entitlements: ['x'], user: null, timestamp: 5, signedAt: 5, nonce: 'n' });
    const b = serializeMeshContext({ nonce: 'n', signedAt: 5, timestamp: 5, user: null, entitlements: ['x'], serviceId: 'beast' });
    assert.equal(a, b);
});

// ── 3. Sign → verify round-trip (valid accepted) ─────────────────────────────
test('signMeshContext → verifyMeshContext round-trips valid', () => {
    const { publicKey, privateKey } = genKeypair();
    const { signedContext, signature, keyId } = signMeshContext(sampleBag(), { privateKeyPem: privateKey, keyId: KEY_ID });
    const res = verifyMeshContext(signedContext, signature, { publicKeyPem: publicKey, keyId, presentedKeyId: keyId });
    assert.equal(res.valid, true, res.reason);
});

// ── 4. Tampered bag rejected ─────────────────────────────────────────────────
test('a tampered entitlements field is rejected', () => {
    const { publicKey, privateKey } = genKeypair();
    const { signedContext, signature } = signMeshContext(sampleBag(), { privateKeyPem: privateKey, keyId: KEY_ID });
    const forged = { ...signedContext, entitlements: [...signedContext.entitlements, 'daita:admin'] };
    const res = verifyMeshContext(forged, signature, { publicKeyPem: publicKey, keyId: KEY_ID, presentedKeyId: KEY_ID });
    assert.equal(res.valid, false);
    assert.equal(res.code, 'MESH_CTX_INVALID');
});

// ── 5. Wrong key rejected ────────────────────────────────────────────────────
test('a signature verified against the wrong public key is rejected', () => {
    const signerKeys = genKeypair();
    const attackerKeys = genKeypair();
    const { signedContext, signature } = signMeshContext(sampleBag(), { privateKeyPem: signerKeys.privateKey, keyId: KEY_ID });
    const res = verifyMeshContext(signedContext, signature, { publicKeyPem: attackerKeys.publicKey, keyId: KEY_ID, presentedKeyId: KEY_ID });
    assert.equal(res.valid, false);
});

// ── 6. Expired signedAt rejected ─────────────────────────────────────────────
test('a signature outside the replay window is rejected', () => {
    const { publicKey, privateKey } = genKeypair();
    const { signedContext, signature } = signMeshContext(sampleBag(), { privateKeyPem: privateKey, keyId: KEY_ID });
    // Re-verify with a tiny window and a bag whose signedAt is old — but signedAt
    // is signed, so we cannot alter it; instead assert an old signedAt fails.
    const res = verifyMeshContext(signedContext, signature, { publicKeyPem: publicKey, keyId: KEY_ID, presentedKeyId: KEY_ID, maxSkewMs: -1 });
    assert.equal(res.valid, false);
    assert.equal(res.code, 'MESH_CTX_EXPIRED');
});

// ── 7. Key-id mismatch rejected ──────────────────────────────────────────────
test('an unknown presented key id is rejected before signature check', () => {
    const { publicKey, privateKey } = genKeypair();
    const { signedContext, signature } = signMeshContext(sampleBag(), { privateKeyPem: privateKey, keyId: KEY_ID });
    const res = verifyMeshContext(signedContext, signature, { publicKeyPem: publicKey, keyId: KEY_ID, presentedKeyId: 'mesh-rotated-2' });
    assert.equal(res.valid, false);
    assert.equal(res.code, 'MESH_CTX_KEYID_MISMATCH');
});

// ── 8. Signer fail-loud (no unsigned fallback) ───────────────────────────────
test('signMeshContext throws when no private key configured', () => {
    assert.throws(() => signMeshContext(sampleBag(), { keyId: KEY_ID }), MeshContextError);
});

// ── 9. Verifier middleware: enforce rejects unsigned, warn proceeds ──────────
function fakeReqRes(bag, headers = {}) {
    const req = { body: bag ? { _descix: bag } : {}, headers };
    let statusCode = 200;
    let jsonBody = null;
    const res = {
        status(c) { statusCode = c; return this; },
        json(b) { jsonBody = b; return this; },
    };
    return { req, res, get: () => ({ statusCode, jsonBody }) };
}

test('enforce mode 401s an unsigned request; warn mode proceeds', () => {
    const { publicKey } = genKeypair();
    const enforce = createMeshContextVerifier({ mode: 'enforce', publicKeyPem: publicKey, keyId: KEY_ID, logger: { warn() {} } });
    const warn = createMeshContextVerifier({ mode: 'warn', publicKeyPem: publicKey, keyId: KEY_ID, logger: { warn() {} } });

    // enforce, unsigned → 401, next NOT called
    {
        const { req, res, get } = fakeReqRes(sampleBag(), {});
        let nexted = false;
        enforce(req, res, () => { nexted = true; });
        assert.equal(nexted, false);
        assert.equal(get().statusCode, 401);
        assert.equal(req.meshContextVerified, false);
    }
    // warn, unsigned → next called, verified=false
    {
        const { req, res, get } = fakeReqRes(sampleBag(), {});
        let nexted = false;
        warn(req, res, () => { nexted = true; });
        assert.equal(nexted, true);
        assert.equal(get().statusCode, 200);
        assert.equal(req.meshContextVerified, false);
    }
});

test('enforce mode accepts a validly signed request via middleware', () => {
    const { publicKey, privateKey } = genKeypair();
    const { signedContext, signature, keyId } = signMeshContext(sampleBag(), { privateKeyPem: privateKey, keyId: KEY_ID });
    const enforce = createMeshContextVerifier({ mode: 'enforce', publicKeyPem: publicKey, keyId, logger: { warn() {} } });
    const { req } = fakeReqRes(signedContext, {
        [MESH_CTX_HEADERS.SIGNATURE]: signature,
        [MESH_CTX_HEADERS.KEY_ID]: keyId,
    });
    let nexted = false;
    enforce(req, { status() { return this; }, json() { return this; } }, () => { nexted = true; });
    assert.equal(nexted, true);
    assert.equal(req.meshContextVerified, true);
});

// ── 10b. Outbound header helper (the exact apifront path) ────────────────────
test('buildOutboundMeshHeaders produces headers a mounted verifier accepts end-to-end', () => {
    const { publicKey, privateKey } = genKeypair();
    // apifront side: sign the enriched _descix bag
    const { signedContext, headers } = buildOutboundMeshHeaders(sampleBag(), { privateKeyPem: privateKey, keyId: KEY_ID });
    assert.ok(headers[MESH_CTX_HEADERS.SIGNATURE]);
    assert.equal(headers[MESH_CTX_HEADERS.KEY_ID], KEY_ID);
    assert.equal(headers[MESH_CTX_HEADERS.SIGNED_AT], String(signedContext.signedAt));

    // consumer side: the verifier a service mounts accepts it
    const verifier = createMeshContextVerifier({ mode: 'enforce', publicKeyPem: publicKey, keyId: KEY_ID, logger: { warn() {} } });
    const req = {
        body: { _descix: signedContext },
        headers: {
            [MESH_CTX_HEADERS.SIGNATURE]: headers[MESH_CTX_HEADERS.SIGNATURE],
            [MESH_CTX_HEADERS.KEY_ID]: headers[MESH_CTX_HEADERS.KEY_ID],
        },
    };
    let nexted = false;
    verifier(req, { status() { return this; }, json() { return this; } }, () => { nexted = true; });
    assert.equal(nexted, true);
    assert.equal(req.meshContextVerified, true);
});

test('buildOutboundMeshHeaders throws without a signing key (fail-loud)', () => {
    assert.throws(() => buildOutboundMeshHeaders(sampleBag(), { keyId: KEY_ID }), MeshContextError);
});

// ── 10. Verifier mount guards (fail-loud, no silent default) ─────────────────
test('createMeshContextVerifier hard-fails on bad mode / missing key', () => {
    const { publicKey } = genKeypair();
    assert.throws(() => createMeshContextVerifier({ mode: 'nope', publicKeyPem: publicKey, keyId: KEY_ID }), MeshContextError);
    assert.throws(() => createMeshContextVerifier({ mode: 'enforce', keyId: KEY_ID }), MeshContextError);
    assert.throws(() => createMeshContextVerifier({ mode: 'enforce', publicKeyPem: publicKey }), MeshContextError);
});
