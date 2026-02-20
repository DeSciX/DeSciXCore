/**
 * HTTP+SSE Transport for MCP Server
 * 
 * Handles JSON-RPC 2.0 over HTTP POST with SSE for streaming
 * Used by remote MCP clients like ChatGPT, web-based agents
 * 
 * Authentication: X-DeSciX-Signature header (wallet signature as API key)
 */

import { User } from '../../../lib/api-client.js';

export class HttpSseTransport {
    constructor(mcpServer, options = {}) {
        this.mcpServer = mcpServer;
        this.options = options;
        this.apiClient = options.apiClient || null;
    }

    /**
     * Create Express middleware for MCP HTTP endpoint
     * @returns {Function} Express middleware
     */
    createMiddleware() {
        return async (req, res, next) => {
            // Handle MCP JSON-RPC requests
            if (req.method !== 'POST') {
                return res.status(405).json({
                    jsonrpc: '2.0',
                    id: null,
                    error: { code: -32600, message: 'Only POST requests are supported' }
                });
            }

            try {
                // Extract and validate signature-based auth
                const signature = this.extractSignature(req);
                let walletInfo = null;
                let user = null;

                if (signature) {
                    // Authenticate via API signature (O(1) lookup)
                    const authResult = await this.authenticateBySignature(signature);
                    if (authResult) {
                        user = authResult.user;
                        walletInfo = {
                            userId: user.id,
                            walletAddress: user.wallet_address,
                            signatureId: authResult.signatureRecord.id,
                            permissions: authResult.signatureRecord.permissions,
                            communities: authResult.signatureRecord.communities
                        };
                    }
                }

                // Handle the MCP request
                const request = req.body;
                const response = await this.mcpServer.handleRequest(request, user, walletInfo);

                // Only send response if it's not a notification
                if (response !== null) {
                    res.json(response);
                } else {
                    res.status(204).end();
                }
            } catch (error) {
                console.error('[MCP:HTTP] Error handling request:', error.message);
                res.status(500).json({
                    jsonrpc: '2.0',
                    id: req.body?.id || null,
                    error: {
                        code: -32603,
                        message: 'Internal error',
                        data: error.message
                    }
                });
            }
        };
    }

    /**
     * Create SSE endpoint for streaming responses
     * @returns {Function} Express middleware for SSE
     */
    createSseMiddleware() {
        return async (req, res, next) => {
            // Set SSE headers
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');

            // Extract signature for auth
            const signature = this.extractSignature(req);
            let walletInfo = null;

            if (signature) {
                const authResult = await this.authenticateBySignature(signature);
                if (authResult) {
                    walletInfo = {
                        userId: authResult.user.id,
                        walletAddress: authResult.user.wallet_address,
                        signatureId: authResult.signatureRecord.id,
                        permissions: authResult.signatureRecord.permissions
                    };
                }
            }

            // Send initial connection event
            res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected' })}\n\n`);

            // Store connection info for potential use
            req.mcpConnection = {
                walletInfo,
                sendEvent: (event, data) => {
                    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
                }
            };

            // Handle client disconnect
            req.on('close', () => {
                console.error('[MCP:SSE] Client disconnected');
            });

            // Keep connection alive with heartbeat
            const heartbeat = setInterval(() => {
                res.write(`: heartbeat\n\n`);
            }, 30000);

            req.on('close', () => {
                clearInterval(heartbeat);
            });
        };
    }

    /**
     * Extract signature from request
     * Supports header: X-DeSciX-Signature or Authorization: Bearer <signature>
     */
    extractSignature(req) {
        // Check X-DeSciX-Signature header
        const sigHeader = req.headers['x-descix-signature'];
        if (sigHeader) return sigHeader;

        // Check Authorization header
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Signature ')) {
            return authHeader.substring(10);
        }

        // Check query param (for SSE)
        if (req.query?.signature) {
            return req.query.signature;
        }

        return null;
    }

    /**
     * Authenticate by signature via /apifront/
     * @param {string} signature - Wallet signature
     * @returns {Promise<{user, signatureRecord}|null>}
     */
    async authenticateBySignature(signature) {
        if (!this.apiClient) {
            console.error('[MCP:HTTP] No API client configured for signature auth');
            return null;
        }

        try {
            const result = await this.apiClient.invoke('authenticate_by_signature', {
                signature
            }, { allowGuest: true });

            if (result?.success) {
                return {
                    user: { id: result.user_id },
                    signatureRecord: {
                        id: result.signature_id,
                        name: result.signature_name,
                        permissions: result.permissions,
                        communities: result.communities
                    }
                };
            }
        } catch (error) {
            console.error('[MCP:HTTP] Signature auth failed:', error.message);
        }

        return null;
    }
}

export default HttpSseTransport;



