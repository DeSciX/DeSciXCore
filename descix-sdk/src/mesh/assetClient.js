/**
 * Mesh asset client — SERVICE-SIDE fetch-by-reference for app media/assets.
 *
 * The platform half of media-via-API-surface (WS-V1-PURGE Phase 1, item 2;
 * CEO-D-2026-06-02-SSGPOD-PROD-PUBLISH-TWO-ROOT-CAUSES). An app microservice running on
 * Cloud Run does NOT share a filesystem with the CLI that uploaded the media, so it cannot
 * read a local path. Instead:
 *
 *   1. The app developer uploads media via the API surface:
 *        descix app media-upload -a <appId> -f cover.jpg -f episode.mp3
 *      which returns ASSET REFERENCES (gs:// URIs under {env}/{appId}/assets/...).
 *   2. The app handler receives a ref and fetches the bytes over the Core broker:
 *        const { buffer } = await fetchAppAsset(mcpClient.callTool.bind(mcpClient),
 *                                               { appId, ref });
 *
 * `callTool` is any function `(command, params) => Promise<message>` that routes to the Core
 * broker (/apifront) authenticated as the service's delegate — e.g. the service's own
 * `mcpClient.callTool`. This keeps the helper decoupled from any specific client transport.
 *
 * The Core `get_app_asset` command enforces that `ref` resolves under THIS app's own assets
 * prefix (community is derived server-side from Products/{appId}); an out-of-prefix or
 * cross-app ref is rejected.
 *
 * @param {(command: string, params: object) => Promise<any>} callTool
 *        Delegate-authed broker invoker (e.g. mcpClient.callTool.bind(mcpClient)).
 * @param {object} opts
 * @param {string} opts.appId - The app that owns the asset.
 * @param {string} opts.ref   - A gs:// URI (from media-upload) OR a relative path under assets/.
 * @returns {Promise<{ buffer: Buffer, contentType: string, size: number, gcsUri: string }>}
 */
export async function fetchAppAsset(callTool, { appId, ref } = {}) {
  if (typeof callTool !== 'function') {
    throw new Error('fetchAppAsset: callTool must be a function (command, params) => Promise<message>');
  }
  if (!appId) throw new Error('fetchAppAsset: appId is required');
  if (!ref) throw new Error('fetchAppAsset: ref is required (gs:// URI or relative assets/ path)');

  const message = await callTool('get_app_asset', { app_id: appId, ref });
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
