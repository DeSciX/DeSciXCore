/**
 * DeSciX service api-client — the CLI's REST api-client running in THIS microservice.
 *
 * AUTH MODEL — the microservice IS the CLI's api-client running in the cloud
 * (CEO-D-2026-06-02-APP-MICROSERVICE-IS-CLI-CLIENT-WALLET-SIG):
 *   This service authenticates to /apifront EXACTLY like the CLI: it holds the DEVELOPER'S OWN
 *   durable credential (wallet_address + signature, from the developer's .descix/wallet.json),
 *   presents it to `reconnect_by_wallet` to mint a session access_token, and calls /apifront AS
 *   THE DEVELOPER. There is NO SA-OIDC, NO delegate signature, NO X-NFT-ID, NO SERVICE_KEY, NO
 *   Signer. The packaged `@descix/cli` `createServiceApiClient` does all of this.
 *
 * CREDENTIAL PLACEMENT (org rule — no checked-in credentials):
 *   The developer copies their wallet `signature` + `wallet_address` into the service config as
 *   `DEVELOPER_SIGNATURE` / `DEVELOPER_WALLET_ADDRESS`, in the GITIGNORED dev-overrides.json (dev)
 *   / a SECRET (prod) — NEVER the checked-in defaults-config.json (the signature is a credential).
 *   We HARD-FAIL (no fallback) if either is absent.
 */

import { createServiceApiClient } from '@descix/cli/service-api-client';
import { utils } from './utils.js';

let _service = null;

/**
 * Build (once) the developer-authed service api-client for this microservice.
 * Reads the developer credential from config and HARD-FAILS if absent (no fallback).
 */
function getService() {
    if (_service) return _service;
    if (!utils.CORE_API_URL) {
        throw new Error('CORE_API_URL not configured.');
    }
    if (!utils.DEVELOPER_WALLET_ADDRESS || !utils.DEVELOPER_SIGNATURE) {
        throw new Error(
            'Developer credential missing: set DEVELOPER_WALLET_ADDRESS + DEVELOPER_SIGNATURE in the ' +
            'GITIGNORED dev-overrides.json (dev) / a secret (prod) — never defaults-config.json. ' +
            'These are the developer\'s own wallet_address + signature (from .descix/wallet.json). No fallback.'
        );
    }
    _service = createServiceApiClient({
        baseUrl: utils.CORE_API_URL,
        walletAddress: utils.DEVELOPER_WALLET_ADDRESS,
        signature: utils.DEVELOPER_SIGNATURE,
    });
    return _service;
}

class McpClient {
    /**
     * Call a Core command via /apifront, authenticated AS the developer.
     * @param {string} command - Command name (e.g. 'app_records_put', 'get_app_asset')
     * @param {Object} args    - Command params
     * @returns {Promise<any>} - Core's `message` payload on success
     */
    async callTool(command, args = {}) {
        return getService().invoke(command, args);
    }
}

export const mcpClient = new McpClient();

/**
 * The raw `invoke(command, params) => Promise<message>` — the exact shape `fetchAppAsset`
 * (from `@descix/sdk`) and other mesh helpers expect. Prefer this for new code.
 */
export function getInvoke() {
    return getService().invoke;
}
