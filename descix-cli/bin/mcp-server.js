#!/usr/bin/env node

/**
 * DeSciX MCP Server
 *
 * Thin HTTP relay: curated app-dev tools inline, all calls dispatch
 * to backend via DeSciXApiClient (POST /apifront/).
 *
 * Uses official @modelcontextprotocol/sdk with stdio transport.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { WorkspaceConfig } from '../lib/workspace-config.js';
import { DeSciXApiClient } from '../lib/api-client.js';
import { WalletFileManager } from '../lib/wallet-file.js';

// ---------------------------------------------------------------------------
// Curated app-dev tool definitions (inline — no external tools.js dependency)
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: 'ask_question_to_app',
    description: 'Ask an AI-powered question to an app\'s knowledge base using RAG',
    inputSchema: {
      type: 'object',
      properties: {
        app_id: { type: 'string', description: 'App ID to query' },
        knowledgebase_name: { type: 'string', description: 'KB name (default: General)' },
        user_input: { type: 'string', description: 'The question to ask' },
      },
      required: ['app_id', 'user_input'],
    },
  },
  {
    name: 'query_knowledge_base',
    description: 'Search a knowledge base using vector similarity (returns raw chunks)',
    inputSchema: {
      type: 'object',
      properties: {
        app_id: { type: 'string', description: 'App ID' },
        kb_id: { type: 'string', description: 'KB name (default: General)' },
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Max results (default: 5)' },
      },
      required: ['app_id', 'query'],
    },
  },
  {
    name: 'find_communities',
    description: 'List available communities on the platform',
    inputSchema: {
      type: 'object',
      properties: {
        filter: { type: 'string', description: 'Optional filter string' },
      },
    },
  },
  {
    name: 'list_apps_for_community',
    description: 'List apps in a community',
    inputSchema: {
      type: 'object',
      properties: {
        community_id: { type: 'string', description: 'Community ID' },
      },
      required: ['community_id'],
    },
  },
  {
    name: 'tell_me_how',
    description:
      'Discover platform tools and services by asking a natural language question. ' +
      'Searches the entire service mesh for relevant capabilities.',
    inputSchema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'What do you want to do?' },
        scope: {
          type: 'string',
          enum: ['project', 'entitlements', 'discovery'],
          description: 'Search scope (default: entitlements)',
        },
      },
      required: ['question'],
    },
  },
];

// ---------------------------------------------------------------------------
// Server bootstrap
// ---------------------------------------------------------------------------

console.error('[MCP] Starting DeSciX MCP server...');

try {
  const workspaceRoot = process.cwd();
  console.error(`[MCP] Workspace root: ${workspaceRoot}`);

  // Load workspace config (optional — server works without it)
  let workspaceConfig = null;
  try {
    workspaceConfig = await WorkspaceConfig.load(workspaceRoot);
    console.error(`[MCP] Loaded config for community: ${workspaceConfig.primaryCommunity}`);
  } catch {
    console.error('[MCP] No workspace config found — using defaults');
  }

  // Create HTTP-only API client
  const apiClient = new DeSciXApiClient({
    projectRoot: workspaceRoot,
    baseUrl: workspaceConfig?.apiUrl || null,
  });

  // Load wallet credentials
  const walletPath = await WalletFileManager.findWalletFile(workspaceRoot);
  if (walletPath) {
    const walletInfo = await WalletFileManager.loadWalletFile(walletPath);
    if (walletInfo) {
      console.error(`[MCP] Authenticated as: ${walletInfo.userId || 'unknown'}`);
      apiClient.setCredentials({
        userId: walletInfo.userId || null,
        accessToken: walletInfo.sessionToken || null,
        walletAddress: walletInfo.walletAddress || null,
        signature: walletInfo.signature || null,
      });
    }
  } else {
    console.error('[MCP] No wallet file — some tools may require authentication');
  }

  // Default context from workspace config
  const defaultContext = workspaceConfig?.defaultContext || {
    communityId: 'descix',
    appId: 'daita',
    kbId: 'General',
  };

  // Create MCP server
  const server = new Server(
    { name: 'DeSciX MCP Server', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  // tools/list — return curated tool definitions
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error(`[MCP] tools/list — returning ${TOOLS.length} tools`);
    return { tools: TOOLS };
  });

  // tools/call — dispatch to backend via HTTP
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    console.error(`[MCP] tools/call — ${name}`);

    try {
      // Merge default context for convenience (caller can override)
      const params = { ...args };
      if (!params.app_id && defaultContext.appId) params.app_id = defaultContext.appId;
      if (!params.kb_id && defaultContext.kbId) params.kb_id = defaultContext.kbId;
      if (!params.community_id && defaultContext.communityId) params.community_id = defaultContext.communityId;

      const result = await apiClient.invoke(name, params);
      return {
        content: [{
          type: 'text',
          text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        }],
      };
    } catch (error) {
      console.error(`[MCP] Tool error: ${error.message}`);
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  });

  // Connect stdio transport
  const transport = new StdioServerTransport();
  console.error('[MCP] Connecting stdio transport...');
  await server.connect(transport);
  console.error('[MCP] Server connected and running');
} catch (error) {
  console.error(`[MCP] Fatal error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
}
