#!/usr/bin/env node

/**
 * DeSciX MCP Server - Using Official MCP SDK
 * 
 * Model Context Protocol server for Cursor/VS Code integration.
 * Uses the official @modelcontextprotocol/sdk for proper protocol handling.
 * All operations are HTTP-only - no direct backend imports.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  ListToolsRequestSchema, 
  CallToolRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import { WorkspaceConfig } from '../lib/workspace-config.js';
import { DeSciXApiClient } from '../lib/api-client.js';
import { WalletFileManager } from '../lib/wallet-file.js';

// Import tool definitions from vendor
import DeSciXMCPTools from '../vendor/mcp/tools.js';

// Log to stderr (for debugging, won't interfere with JSON-RPC on stdout)
console.error('[MCP] Starting DeSciX MCP server (official SDK)...');

try {
  // Find workspace root
  const workspaceRoot = process.cwd();
  console.error(`[MCP] Workspace root: ${workspaceRoot}`);

  // Load workspace config
  const workspaceConfig = await WorkspaceConfig.load(workspaceRoot);
  console.error(`[MCP] Loaded config for community: ${workspaceConfig.primaryCommunity}`);

  // Create HTTP-only API client
  const apiClient = new DeSciXApiClient({
    projectRoot: workspaceRoot,
    baseUrl: workspaceConfig.apiUrl || null
  });

  // Load wallet file if available
  const walletPath = await WalletFileManager.findWalletFile(workspaceRoot);
  let walletInfo = null;
  
  if (walletPath) {
    walletInfo = await WalletFileManager.loadWalletFile(walletPath);
    if (walletInfo) {
      console.error(`[MCP] Loaded wallet credentials for: ${walletInfo.userId || walletInfo.walletAddress?.substring(0, 10)}...`);
      
      // Set credentials in API client
      apiClient.setCredentials({
        userId: walletInfo.userId || null,
        accessToken: walletInfo.sessionToken || null,
        walletAddress: walletInfo.walletAddress || null,
        signature: walletInfo.signature || null
      });
    }
  } else {
    console.error('[MCP] No wallet file found - some operations may require authentication');
  }

  // Default context for tools
  const defaultContext = workspaceConfig.defaultContext || {
    communityId: 'descix',
    appId: 'docs',
    kbId: 'sdk'
  };

  // Initialize tools handler
  const toolsHandler = new DeSciXMCPTools(defaultContext, apiClient);

  // Create MCP server using official SDK
  const server = new Server(
    {
      name: 'DeSciX RAG MCP Server',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  // Register tool list handler using the proper schema
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = toolsHandler.getTools();
    console.error(`[MCP] tools/list - returning ${tools.length} tools`);
    return { tools };
  });

  // Register tool call handler using the proper schema
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    console.error(`[MCP] tools/call - ${name}`);
    
    try {
      const result = await toolsHandler.execute(name, args || {}, walletInfo);
      return {
        content: [
          {
            type: 'text',
            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error(`[MCP] Tool error: ${error.message}`);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  });

  // Create stdio transport
  const transport = new StdioServerTransport();
  
  console.error('[MCP] Server ready - connecting stdio transport...');
  
  // Connect and run
  await server.connect(transport);
  
  console.error('[MCP] Server connected and running');

} catch (error) {
  console.error(`[MCP] Fatal error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
}
