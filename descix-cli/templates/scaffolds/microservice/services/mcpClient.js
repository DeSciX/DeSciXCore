/**
 * DeSciX MCP Loopback Client
 * 
 * Enables the service to call Core Tools (e.g. RAG, Purchase) or other Service Tools
 * via the Federated MCP Broker (DeSciX_Cloud).
 */

import axios from 'axios';
import https from 'https';
import { utils } from './utils.js';
import { Signer } from '@descix/sdk'; // Assuming descix-sdk is available in the container

/**
 * In local dev the Core broker is served over HTTPS with a self-signed cert
 * (https://localhost:4000). Node's axios will reject it ('self-signed certificate
 * in certificate chain'). Trust it ONLY in dev AND only when the target is a
 * localhost loopback — NEVER in demo/prod, and NEVER for a non-local host.
 *
 * Gated, not unconditional: prod traffic keeps full TLS verification.
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

// Built once at module load — reflects DEPLOY_ENV + CORE_API_URL at boot.
const devLoopbackAgent = buildDevLoopbackAgent();

class McpClient {
    constructor() {
        // Initialize signer if key is available
        if (utils.SERVICE_KEY) {
            this.signer = new Signer(utils.SERVICE_KEY.privateKey, utils.SERVICE_KEY.slotId);
        }
    }

    /**
     * Call a tool via the Core Broker
     * @param {string} toolName - Name of the tool to call (e.g., 'query_knowledge_base')
     * @param {Object} args - Tool arguments
     * @param {Object} context - User context object (from _descix) to pass identity
     * @returns {Promise<any>} - Tool result
     */
    async callTool(toolName, args, context) {
        if (!utils.CORE_API_URL) {
            throw new Error('CORE_API_URL not configured');
        }

        // Construct the payload simulating a PWA or internal request
        const payload = {
            command: toolName,
            params: {
                ...args,
                // Critical: Pass the original user context back to Core
                // The Core trusts this service (authenticated via Service Secret or VPC)
                // In this simplified template, we pass the user ID we received
                user_id: context?.user?.id || utils.OWNER_USER_ID,
                // If we have owner credentials, use them as fallback for auth
                wallet_address: utils.OWNER_WALLET_ADDRESS,
                signature: utils.OWNER_SIGNATURE
            }
        };

        try {
            console.log(`[McpClient] Calling ${toolName} on ${utils.CORE_API_URL}`);
            
            // Get headers (Signature or Legacy Secret)
            const headers = {
                'Content-Type': 'application/json'
            };

            if (this.signer) {
                // Sign the payload string
                const signatureHeaders = this.signer.getHeaders(JSON.stringify(payload));
                Object.assign(headers, signatureHeaders);
            } else if (utils.SERVICE_SECRET) {
                // Fallback to legacy secret
                headers['Authorization'] = `Bearer ${utils.SERVICE_SECRET}`;
            }
            
            const response = await axios.post(utils.CORE_API_URL, payload, {
                headers,
                // dev-only: trust the localhost self-signed cert. undefined in prod.
                ...(devLoopbackAgent ? { httpsAgent: devLoopbackAgent } : {})
            });

            if (response.data?.status === 'OK') {
                return response.data.message;
            } else {
                throw new Error(response.data?.message || 'Unknown error from Core');
            }
        } catch (error) {
            console.error(`[McpClient] Error calling ${toolName}:`, error.message);
            throw error;
        }
    }
}

export const mcpClient = new McpClient();
