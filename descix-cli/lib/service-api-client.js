/**
 * Service-context DeSciX api-client — the CLI's REST api-client, packaged for reuse inside
 * an APP MICROSERVICE running in the cloud.
 *
 * AUTH MODEL (CEO-D-2026-06-02-APP-MICROSERVICE-IS-CLI-CLIENT-WALLET-SIG):
 *   "An app microservice is just THE CLI's REST api-client running in the cloud." It
 *   authenticates to /apifront EXACTLY like the CLI does — it holds the DEVELOPER'S OWN
 *   durable credential (wallet_address + the `signature` from .descix/wallet.json), presents
 *   it to `reconnect_by_wallet` to mint a session access_token, and makes /apifront calls AS
 *   THE DEVELOPER. There is NO new apifront auth path: this is the existing CLI wallet-signature
 *   -> session path (api-client buildRequestBody + ensureSession -> reconnect_by_wallet).
 *   NO SA-OIDC, NO delegate signature / X-NFT-ID / SERVICE_KEY, NO Signer, NO OWNER_SIGNATURE.
 *
 * Difference from the CLI: a Cloud Run service has no `.descix/wallet.json` and no TTY. So:
 *   - the developer credential is supplied EXPLICITLY (read from the service's config — the
 *     GITIGNORED dev-overrides.json in dev / a SECRET in prod, NEVER checked-in
 *     defaults-config.json, because the signature is a credential), and
 *   - on a session-refresh failure it HARD-FAILS (serviceMode) — it never tries interactive
 *     device login.
 *
 * The credential is the developer's own / their responsibility (their API call), same risk
 * profile as wallet.json. HARD-FAIL (no fallback) if wallet_address or signature is absent.
 */

import { DeSciXApiClient } from './api-client.js';

/**
 * Build a headless service-context api-client bound to a Core broker URL and the developer's
 * durable wallet credential.
 *
 * @param {object} cfg
 * @param {string} cfg.baseUrl       - Core broker base URL (e.g. utils.CORE_API_URL). The
 *                                      api-client appends `/apifront/`. Required.
 * @param {string} cfg.walletAddress - The developer's wallet address. Required.
 * @param {string} cfg.signature     - The developer's durable `signature` (from their
 *                                      .descix/wallet.json). Required.
 * @param {string} [cfg.userId]      - Optional developer user_id (resolved by reconnect_by_wallet
 *                                      if omitted).
 * @returns {{ client: DeSciXApiClient, invoke: (command: string, params?: object) => Promise<any> }}
 *          `client` is the underlying api-client; `invoke(command, params)` returns Core's
 *          `message` payload (the same shape `fetchAppAsset`'s invoker expects).
 */
export function createServiceApiClient({ baseUrl, walletAddress, signature, userId } = {}) {
  // The api-client appends `/apifront/`; accept either a bare origin or a `.../apifront` URL
  // and normalize to the origin so we never double-append.
  if (!baseUrl || typeof baseUrl !== 'string') {
    throw new Error(
      'createServiceApiClient: baseUrl is required (the Core broker URL, e.g. utils.CORE_API_URL). No fallback.'
    );
  }
  if (!walletAddress || typeof walletAddress !== 'string') {
    throw new Error(
      'createServiceApiClient: walletAddress is required — the developer credential. Put it in the ' +
      'GITIGNORED dev-overrides.json (dev) / a secret (prod), never defaults-config.json. No fallback.'
    );
  }
  if (!signature || typeof signature !== 'string') {
    throw new Error(
      'createServiceApiClient: signature is required — the developer durable credential (from their ' +
      '.descix/wallet.json). Put it in the GITIGNORED dev-overrides.json (dev) / a secret (prod), ' +
      'never defaults-config.json. No fallback.'
    );
  }

  const origin = baseUrl.replace(/\/apifront\/?$/, '').replace(/\/$/, '');

  const client = new DeSciXApiClient({ baseUrl: origin, serviceMode: true });
  // Provide the developer credential directly — NO wallet-file / workspace walk in a service.
  client.setCredentials({
    userId: userId || null,
    accessToken: null,            // minted on first call via reconnect_by_wallet
    walletAddress,
    signature,
    communityId: null,
    tokenSymbol: null,
  });
  // Mark initialized so the client never tries to discover a workspace/wallet on disk.
  client._initialized = true;

  /**
   * Invoke a Core command AS the developer. Returns Core's `message` payload on success
   * (matching the meshLoopback/fetchAppAsset contract it replaces).
   */
  async function invoke(command, params = {}) {
    if (!command || typeof command !== 'string') {
      throw new Error('serviceApiClient.invoke: command (string) is required.');
    }
    const data = await client.invoke(command, params);
    return data?.message ?? data;
  }

  return { client, invoke };
}

export default createServiceApiClient;
