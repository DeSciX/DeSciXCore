/**
 * DeSciX MCP Loopback Client
 * 
 * Enables the service to call Core Tools (e.g. RAG, Purchase) or other Service Tools
 * via the Federated MCP Broker (DeSciX_Cloud).
 */

import axios from 'axios';
import { utils } from './utils.js';
import { Signer } from '@descix/sdk'; // Assuming descix-sdk is available in the container

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
            
            const response = await axios.post(utils.CORE_API_URL, payload, { headers });

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
