/**
 * ws-prune-504 — verifyDeployOutcome: the honest answer when a confirm response is lost.
 * Measured on prod 2026-10-10: a 744-path serial prune held confirm_site_deploy past the
 * gateway's patience; the CLI printed "Upload failed: HTTP 504" for a deploy that HAD
 * confirmed. The read-back is keyed on the deploy token — the one value no concurrent deploy
 * can echo back by accident.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyDeployOutcome } from '../lib/deploy-outcome.js';

const SENT = { communityId: 'egpt', appId: 'egpt-frqtl', tokenId: 'tok-THIS-UPLOAD' };

function clientServing(manifest, { exists = true, fail = null } = {}) {
    return {
        invoke: async (cmd, params) => {
            assert.equal(cmd, 'get_site_manifest');
            assert.equal(params.community_id, SENT.communityId);
            assert.equal(params.app_id, SENT.appId);
            if (fail) throw new Error(fail);
            return { message: { exists, manifest } };
        },
    };
}

test('confirmed: the served manifest carries THIS upload token', async () => {
    const v = await verifyDeployOutcome(
        clientServing({ deploy: { token_id: 'tok-THIS-UPLOAD', deployed_at: '2026-10-10T14:49:36Z' } }), SENT);
    assert.equal(v.outcome, 'confirmed');
    assert.match(v.detail, /this upload's token/);
});

test('unconfirmed: a DIFFERENT deploy is served (prior build still live)', async () => {
    const v = await verifyDeployOutcome(
        clientServing({ deploy: { token_id: 'tok-OLDER', deployed_at: '2026-10-01T00:00:00Z' } }), SENT);
    assert.equal(v.outcome, 'unconfirmed');
    assert.match(v.detail, /DIFFERENT deploy/);
});

test('unconfirmed: nothing is served at all', async () => {
    const v = await verifyDeployOutcome(clientServing(null, { exists: false }), SENT);
    assert.equal(v.outcome, 'unconfirmed');
});

test('unknown: the read-back itself fails — never claim either way', async () => {
    const v = await verifyDeployOutcome(clientServing(null, { fail: 'HTTP 504' }), SENT);
    assert.equal(v.outcome, 'unknown');
    assert.match(v.detail, /read-back failed/);
});

test('unknown: no token in hand', async () => {
    const v = await verifyDeployOutcome(clientServing({ deploy: { token_id: 'x' } }), { ...SENT, tokenId: null });
    assert.equal(v.outcome, 'unknown');
});
