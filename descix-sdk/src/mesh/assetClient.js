/**
 * Mesh asset client — SERVICE-SIDE fetch-by-reference for app media/assets.
 *
 * The platform half of media-via-API-surface. An app microservice running on Cloud Run
 * does NOT share a filesystem with the CLI that uploaded the media, so it cannot read a
 * local path. Instead:
 *
 *   1. The app developer uploads media via the API surface:
 *        descix app media-upload -a <appId> -f cover.jpg -f episode.mp3
 *      which returns ASSET REFERENCES (gs:// URIs under {env}/{appId}/assets/...).
 *   2. The app handler receives a ref and fetches the bytes over the Core broker
 *        (/apifront) via the packaged CLI api-client:
 *        const invoke = makeServiceApiClientInvoke(...);   // @descix/cli service client
 *        const { buffer } = await fetchAppAsset(invoke, { appId, ref });
 *
 * AUTH MODEL — the microservice IS the CLI's api-client running in the cloud
 * (CEO-D-2026-06-02-APP-MICROSERVICE-IS-CLI-CLIENT-WALLET-SIG):
 * `invoke` is any `(command, params) => Promise<message>` that routes to the Core broker
 * (/apifront) AUTHENTICATED AS THE DEVELOPER — i.e. the packaged CLI api-client holding the
 * developer's own durable credential (wallet_address + signature), which calls
 * reconnect_by_wallet to mint a session access_token and then POSTs the command exactly like
 * the CLI. There is NO SA-OIDC, NO delegate signature, NO X-NFT-ID, NO SERVICE_KEY.
 * Core runs `get_app_asset` under the developer's normal COMMUNITY_MANAGE_APPS entitlement.
 *
 * The Core `get_app_asset` command enforces that `ref` resolves under THIS app's own assets
 * prefix (community is derived server-side from Products/{appId}); an out-of-prefix or
 * cross-app ref is rejected — defense-in-depth at the command layer.
 *
 * @param {(command: string, params: object) => Promise<any>} invoke
 *        Developer-authed broker invoker — the packaged CLI api-client's invoke
 *        (a `(command, params) => Promise<message>`).
 * @param {object} opts
 * @param {string} opts.appId - The app that owns the asset.
 * @param {string} opts.ref   - A gs:// URI (from media-upload) OR a relative path under assets/.
 * @returns {Promise<{ buffer: Buffer, contentType: string, size: number, gcsUri: string }>}
 */
export async function fetchAppAsset(invoke, { appId, ref } = {}) {
  if (typeof invoke !== 'function') {
    throw new Error('fetchAppAsset: invoke must be a function (command, params) => Promise<message> (the packaged api-client invoke)');
  }
  if (!appId) throw new Error('fetchAppAsset: appId is required');
  if (!ref) throw new Error('fetchAppAsset: ref is required (gs:// URI or relative assets/ path)');

  const message = await invoke('get_app_asset', { app_id: appId, ref });
  if (!message || !message.content_base64) {
    throw new Error(`fetchAppAsset: Core returned no content for ref '${ref}'`);
  }
  return {
    buffer: Buffer.from(message.content_base64, 'base64'),
    contentType: message.content_type || 'application/octet-stream',
    size: Number(message.size) || 0,
    gcsUri: message.gcs_uri || null
  };
}
