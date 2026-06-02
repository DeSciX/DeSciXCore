/**
 * DeSciX MCP Loopback Client
 *
 * Enables the service to call Core Tools (e.g. RAG, kb_records) or other Service Tools
 * via the Federated MCP Broker (DeSciX_Cloud) at /apifront.
 *
 * AUTH MODEL — DELEGATE SIGNATURE (CEO-D-2026-06-01-MESH-AUTH-DRIVE-REMOVAL, Fix A):
 *   This service authenticates as the DELEGATE of its service slot. At `descix microservice
 *   register-delegate` time, an EC key pair was generated; the PUBLIC key was stored in the
 *   Core VirtualRegistry against the slot id, and the PRIVATE key was saved as SERVICE_KEY.
 *   To call /apifront we sign the EXACT request-body JSON string with that private key and
 *   present three headers the Core validates against the registered public key:
 *       X-NFT-ID    = SERVICE_KEY.slotId   (the slot the delegate was registered against)
 *       X-Signature = base64(SHA256 sign(bodyString))
 *       X-Timestamp = Date.now()
 *   The signature IS the auth. We do NOT send user_id / access_token, and we do NOT stuff a
 *   static OWNER_SIGNATURE into params. The Core resolves the slot owner and runs the command
 *   on their behalf.
 *
 * CRITICAL: we must sign the byte-for-byte string we send. So we serialize the body ONCE
 * (bodyString), sign THAT, and POST THAT raw string — never let axios re-serialize a separate
 * object (key order / spacing could diverge and break verification).
 */

import axios from 'axios';
import https from 'https';
import { utils } from './utils.js';
import { Signer } from '@descix/sdk';

/**
 * In local dev the Core broker is served over HTTPS with a self-signed cert
 * (https://localhost:4000). Trust it ONLY in dev AND only when the target is a
 * localhost loopback — NEVER in demo/prod, and NEVER for a non-local host.
 */
function buildDevLoopbackAgent() {
    const isDev = !utils.DEPLOY_ENV || utils.DEPLOY_ENV === 'dev';
    const coreUrl = utils.CORE_API_URL || '';
    const isLocalhost = /^https:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(coreUrl);
    if (isDev && isLocalhost) {
        return new https.Agent({ rejectUnauthorized: false });
    }
    return undefined; // prod / non-local: default agent, full cert verification
}

const devLoopbackAgent = buildDevLoopbackAgent();

class McpClient {
    /**
     * Build the delegate Signer LAZILY (on first use), not in the constructor.
     * mcpClient is imported (and constructed) before initializeServiceConfig() runs,
     * and SERVICE_KEY is loaded from dev-overrides.json during initialize() — so a
     * constructor-time Signer would always be missing the key. Memoize after init.
     */
    _getSigner() {
        if (this._signer === undefined) {
            this._signer = utils.SERVICE_KEY?.privateKey
                ? new Signer(utils.SERVICE_KEY.privateKey, utils.SERVICE_KEY.slotId)
                : null;
        }
        return this._signer;
    }

    /**
     * Call a command via the Core Broker (/apifront), authenticated as this service's delegate.
     * @param {string} command - Command name (e.g. 'kb_records_put', 'ask_question_to_app')
     * @param {Object} args    - Command params
     * @returns {Promise<any>} - Core's `message` payload on success
     */
    async callTool(command, args = {}) {
        if (!utils.CORE_API_URL) {
            throw new Error('CORE_API_URL not configured');
        }
        const signer = this._getSigner();
        if (!signer) {
            throw new Error('SERVICE_KEY not configured — run `descix microservice register-delegate` to provision a delegate before making mesh calls.');
        }

        // Build the request body. Auth is the delegate signature in headers — NOT in params.
        const body = {
            command,
            params: { ...args }
        };

        // Serialize ONCE and sign exactly what we send (byte-for-byte).
        const bodyString = JSON.stringify(body);
        const signatureHeaders = signer.getHeaders(bodyString); // X-NFT-ID / X-Signature / X-Timestamp

        if (!signatureHeaders['X-Signature']) {
            throw new Error('Signer produced no signature — SERVICE_KEY.privateKey is missing or invalid.');
        }

        const headers = {
            'Content-Type': 'application/json',
            ...signatureHeaders
        };

        try {
            console.log(`[McpClient] Calling ${command} on ${utils.CORE_API_URL} (delegate slot ${utils.SERVICE_KEY.slotId})`);

            const response = await axios.post(utils.CORE_API_URL, bodyString, {
                headers,
                ...(devLoopbackAgent ? { httpsAgent: devLoopbackAgent } : {})
            });

            if (response.data?.status === 'OK') {
                return response.data.message;
            }
            throw new Error(response.data?.message || 'Unknown error from Core');
        } catch (error) {
            const status = error.response?.status;
            const coreMsg = error.response?.data?.message;
            console.error(`[McpClient] Error calling ${command}:`, status ? `HTTP ${status} — ${coreMsg || error.message}` : error.message);
            throw error;
        }
    }
}

export const mcpClient = new McpClient();
