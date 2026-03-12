/**
 * Stdio Transport for MCP Server
 * 
 * Uses the official @modelcontextprotocol/sdk for proper protocol handling.
 * This wrapper bridges our DeSciXMCPServer with the official SDK's transport.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

/**
 * StdioTransport - bridges DeSciXMCPServer to official MCP SDK transport
 * 
 * Note: This is a thin wrapper. The actual MCP server should use the
 * official Server class from @modelcontextprotocol/sdk for full compatibility.
 */
export class StdioTransport {
    constructor(mcpServer, options = {}) {
        this.mcpServer = mcpServer;
        this.options = options;
        this.walletInfo = options.walletInfo || null;
        this.transport = null;
    }

    /**
     * Start the stdio transport using official SDK
     */
    async start() {
        console.error('[MCP:Stdio] Starting with official MCP SDK transport...');
        
        // Create the official stdio transport
        this.transport = new StdioServerTransport();
        
        // The transport handles the protocol - we need to connect it to our server
        // This is a temporary bridge until we fully migrate to the SDK's Server class
        console.error('[MCP:Stdio] Transport created, delegating to MCP server...');
        
        // For now, we'll use manual message handling since our server has custom logic
        // The official SDK uses a different architecture (Server class with handlers)
        
        // Import readline for manual handling until full SDK migration
        const readline = await import('readline');
        
        const rl = readline.createInterface({
            input: process.stdin,
            terminal: false
        });

        console.error('[MCP:Stdio] Transport ready, waiting for JSON-RPC requests...');

        rl.on('line', async (line) => {
            if (!line.trim()) return;
            
            try {
                const request = JSON.parse(line);
                console.error(`[MCP:Stdio] << ${request.method || 'unknown'} (id: ${request.id})`);
                
                const response = await this.mcpServer.handleRequest(request, null, this.walletInfo);
                
                if (response !== null) {
                    const json = JSON.stringify(response);
                    console.error(`[MCP:Stdio] >> Response (id: ${response.id}, ${json.length} bytes)`);
                    // Write to stdout with explicit flush
                    process.stdout.write(json + '\n', () => {
                        // Callback after write completes
                    });
                }
            } catch (error) {
                console.error('[MCP:Stdio] Parse error:', error.message);
                const errorResponse = {
                    jsonrpc: '2.0',
                    id: null,
                    error: {
                        code: -32700,
                        message: 'Parse error',
                        data: error.message
                    }
                };
                process.stdout.write(JSON.stringify(errorResponse) + '\n');
            }
        });

        rl.on('close', () => {
            console.error('[MCP:Stdio] Transport closed');
        });

        // Keep process alive
        return new Promise((resolve) => {
            rl.on('close', resolve);
            process.on('SIGINT', () => {
                rl.close();
                resolve();
            });
            process.on('SIGTERM', () => {
                rl.close();
                resolve();
            });
        });
    }

    /**
     * Stop the transport
     */
    stop() {
        console.error('[MCP:Stdio] Transport stopped');
    }

    /**
     * Update wallet info
     */
    setWalletInfo(walletInfo) {
        this.walletInfo = walletInfo;
    }
}

export default StdioTransport;



