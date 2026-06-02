/**
 * Mesh asset client — SERVICE-SIDE fetch-by-reference for app media/assets.
 *
 * The platform half of media-via-API-surface (WS-V1-PURGE Phase 1, item 2). An app
 * microservice running on Cloud Run does NOT share a filesystem with the CLI that
 * uploaded the media, so it cannot read a local path. Instead:
 *
 *   1. The app developer uploads media via the API surface:
 *        descix app media-upload -a <appId> -f cover.jpg -f episode.mp3
 *      which returns ASSET REFERENCES (gs:// URIs under {env}/{appId}/assets/...).
 *   2. The app handler receives a ref and fetches the bytes over the Core broker:
 *        const meshLoopback = createMeshLoopback({ coreApiUrl, getDescixUser });
 *        const { buffer } = await fetchAppAsset(meshLoopback, { appId, ref });
 *
 * AUTH MODEL — SA-OIDC-establishes-caller (CEO-D-2026-06-02-DATAPLANE-LOOPBACK-OPTION-A-SA-APP-BINDING):
 * `invoke` is any `(command, params) => Promise<message>` that routes to the Core broker
 * (/apifront) as the INJECTED CALLER — i.e. a `meshLoopback` from `createMeshLoopback`
 * (`@descix/sdk` → `./mesh/meshLoopback.js`). The app service mints an OIDC ID-token from
 * its OWN Cloud Run service account and threads the acting user via `_descix.user.id`. There
 * is NO delegate signature, NO X-NFT-ID, NO SERVICE_KEY. Core verifies the SA matches the
 * app_id's registered SA (the SA<->app_id binding) and enforces the user's COMMUNITY_MANAGE_APPS
 * entitlement before serving the asset.
 *
 * The Core `get_app_asset` command enforces that `ref` resolves under THIS app's own assets
 * prefix (community is derived server-side from Products/{appId}); an out-of-prefix or
 * cross-app ref is rejected — defense-in-depth on top of the SA<->app_id binding.
 *
 * @param {(command: string, params: object) => Promise<any>} invoke
 *        Caller-authed broker invoker — a `meshLoopback(command, params)` from
 *        `createMeshLoopback`. (Historically a delegate-signed `mcpClient.callTool`; the
 *        delegate path is REMOVED for the app data plane.)
 * @param {object} opts
 * @param {string} opts.appId - The app that owns the asset.
 * @param {string} opts.ref   - A gs:// URI (from media-upload) OR a relative path under assets/.
 * @returns {Promise<{ buffer: Buffer, contentType: string, size: number, gcsUri: string }>}
 */
export async function fetchAppAsset(invoke, { appId, ref } = {}) {
  if (typeof invoke !== 'function') {
    throw new Error('fetchAppAsset: invoke must be a function (command, params) => Promise<message> (a meshLoopback)');
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
