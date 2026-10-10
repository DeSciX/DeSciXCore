/**
 * verifyDeployOutcome — the honest answer when a confirm_site_deploy response is LOST.
 *
 * ws-prune-504 (measured on prod 2026-10-10): a large prune held the confirm past the
 * gateway's patience; the client saw "Upload failed: HTTP 504" while the deploy had in fact
 * confirmed and the prune was finishing server-side. A lost RESPONSE is not a failed DEPLOY —
 * and a tool that says "failed" when it does not know is lying in one direction.
 *
 * The read-back is keyed on the deploy TOKEN: get_site_deploy_token minted token_id for THIS
 * upload, and confirm_site_deploy stamps it into the served manifest's deploy.token_id. If the
 * served manifest carries our token, OUR deploy confirmed — no weaker signal (git sha, file
 * count) can be forged by a concurrent deploy into a false positive the token cannot.
 *
 * @param {{invoke: (cmd: string, params: object) => Promise<any>}} apiClient
 * @param {{communityId: string, appId: string, tokenId: string, preview?: boolean}} sent
 * @returns {Promise<{outcome: 'confirmed'|'unconfirmed'|'unknown', detail: string, deploy?: object}>}
 */
export async function verifyDeployOutcome(apiClient, { communityId, appId, tokenId, preview = false }) {
    if (!tokenId) {
        return { outcome: 'unknown', detail: 'no token_id in hand — cannot key the read-back' };
    }
    let response;
    try {
        response = await apiClient.invoke('get_site_manifest', {
            community_id: communityId,
            app_id: appId,
            preview,
        });
    } catch (err) {
        return { outcome: 'unknown', detail: `read-back failed too: ${err.message}` };
    }
    const payload = response?.message ?? response;
    const deploy = payload?.manifest?.deploy;
    if (!payload?.exists || !deploy) {
        return { outcome: 'unconfirmed', detail: 'no deploy manifest is served for this app' };
    }
    if (deploy.token_id === tokenId) {
        return { outcome: 'confirmed', detail: `served manifest carries this upload's token (deployed_at ${deploy.deployed_at})`, deploy };
    }
    return {
        outcome: 'unconfirmed',
        detail: `served manifest is a DIFFERENT deploy (token ${deploy.token_id || 'none'}, deployed_at ${deploy.deployed_at || 'unknown'})`,
        deploy,
    };
}
