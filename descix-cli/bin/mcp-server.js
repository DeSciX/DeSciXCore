#!/usr/bin/env node

/**
 * DeSciX MCP Server
 *
 * Thin HTTP relay: curated app-dev tools inline, all calls dispatch
 * to backend via DeSciXApiClient (POST /apifront/).
 *
 * descix_doctor is handled locally (no backend call needed).
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
import * as fs from 'fs/promises';
import * as path from 'path';
// WS-MCP-SSOT-TIER2 (audit §5.B-1): the curated HTTP-valid core tools are the SINGLE SOURCE
// in @descix/platform-api/mcp-tools — shared with the Cloud HTTP MCP path (apiFront.js).
// This stdio server imports them and CONCATENATES its CLI-LOCAL diagnostics (descix_doctor,
// platform_health) which are NOT /apifront commands and are intentionally stdio-only.
// The previously hand-duplicated curated literal in this file is GONE.
import { toMcpToolList, NATIVE_MCP_TOOLS as SHARED_NATIVE_TOOLS } from '@descix/platform-api/mcp-tools';

// ---------------------------------------------------------------------------
// Tool definitions for the stdio MCP transport.
//
// CLI-LOCAL diagnostics (descix_doctor, platform_health) are defined here because they are
// LOCAL CLI operations, not /apifront commands — they must never be advertised over the HTTP
// path. Everything else comes from the shared SSOT (@descix/platform-api/mcp-tools), which is
// the same source the Cloud HTTP MCP path advertises. ONE curated list, two transports.
// ---------------------------------------------------------------------------

const CLI_LOCAL_TOOLS = [
  {
    name: 'descix_doctor',
    description:
      'Startup diagnostic: returns auth state, workspace context, active app/community, ' +
      'available MCP tools by category, and any mismatches between local config and platform. ' +
      'Call this FIRST when starting a new session to understand the environment.',
    inputSchema: {
      type: 'object',
      properties: {
        verify_remote: {
          type: 'boolean',
          description: 'Also verify app exists on the platform (requires network). Default: true',
        },
      },
    },
  },
  {
    name: 'platform_health',
    description:
      'Check platform health. Returns structured pass/fail JSON for core platform (Cloud) and ' +
      'an optional named microservice. The microservice is probed through the existing MCP proxy ' +
      'infrastructure — no direct HTTP or curl. If this command responds, Cloud is healthy.',
    inputSchema: {
      type: 'object',
      properties: {
        microservice: {
          type: 'string',
          description: 'Name of a registered microservice to check (e.g., "beast", "powch"). Omit to check core platform only.',
        },
      },
    },
  },
];

// Final stdio tool list: CLI-local diagnostics + the shared curated core tools (protocol shape).
const TOOLS = [...CLI_LOCAL_TOOLS, ...toMcpToolList(SHARED_NATIVE_TOOLS)];

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
  let walletInfo = null;
  const walletPath = await WalletFileManager.findWalletFile(workspaceRoot);
  if (walletPath) {
    walletInfo = await WalletFileManager.loadWalletFile(walletPath);
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

  // Default context from workspace config — NO hardcoded fallbacks.
  // When workspace isn't configured, defaultContext stays null so tools
  // don't silently target the wrong app.
  const defaultContext = workspaceConfig?.defaultContext || null;

  // -------------------------------------------------------------------------
  // descix_doctor — local diagnostic (no backend call)
  // -------------------------------------------------------------------------

  async function runDoctor(args) {
    const verifyRemote = args?.verify_remote !== false;
    const report = {
      auth: { connected: false },
      workspace: { configured: false },
      app_context: null,
      tools: {
        diagnostic: ['descix_doctor'],
        knowledge: ['ask_question_to_app', 'query_knowledge_base'],
        discovery: ['find_communities', 'list_apps_for_community', 'tell_me_how'],
      },
      warnings: [],
    };

    // Auth state
    if (walletInfo) {
      report.auth = {
        connected: true,
        user_id: walletInfo.userId || null,
        session_valid: WalletFileManager.hasValidSession?.(walletInfo) ?? true,
      };
    } else {
      report.warnings.push('Not authenticated. Run "DeSciX: Connect" or "descix login" to authenticate.');
    }

    // Workspace config — reload fresh so we pick up workspace.json created mid-session
    let freshConfig = null;
    let freshContext = null;
    try {
      freshConfig = await WorkspaceConfig.load(workspaceRoot || process.cwd());
      freshContext = freshConfig.defaultContext || null;
    } catch { /* no workspace.json present */ }

    if (freshConfig) {
      const platform = freshConfig.env?.platform || {};
      const products = freshConfig.env?.products || [];
      report.workspace = {
        configured: true,
        version: freshConfig.version || 'unknown',
        environment: freshConfig.env?.environment || 'unknown',
      };
      if (freshContext) {
        report.app_context = {
          app_id: freshContext.appId,
          community_id: freshContext.communityId,
          kb_id: freshContext.kbId || 'General',
          api_url: freshConfig.apiUrl || apiClient.baseUrl,
          local_apps: [
            platform.appId,
            ...products.map(p => p.appId),
          ].filter(Boolean),
        };
      }
    } else {
      report.workspace = { configured: false };
      report.setup_needed = true;
      report.next_steps = [
        'This project is not configured yet. Guide the user through setup:',
        '',
        '## Before asking questions, scan the repo',
        'List the working directory to detect existing content (docs/, src/, package.json, kb/, site/).',
        'Use findings to tailor your checkpoint questions.',
        '',
        '## Checkpoints (ask the user at each step)',
        '1. **Objective:** "Do you want to explore existing apps, or build something new?"',
        '2. **Community/App:** Use find_communities + list_apps_for_community, then ask: "Which community and app should this project target?"',
        '3. **Environment:** "Should this run against local dev backend (localhost:4000) or hosted API (descix.net)?"',
        '4. **Cloud Brain:** "Which knowledge bases should I always consult when helping you?"',
        '   Use the available_kbs field from this doctor report to show apps the user has access to.',
        '   Present each with its app_id and community.',
        '   User selects which ones to align to.',
        '   Write their selections to .descix/alignment.json:',
        '   { "version": "1.0", "apps": [{ "app_id": "...", "kb": "General", "role": "user\'s description" }],',
        '     "defaults": { "level": 3, "thinking": -1, "tokens": true } }',
        '   If user wants an app they don\'t have: guide them to join the community via find_communities.',
        '',
        '## Canonical setup commands (run in terminal)',
        '```',
        'descix whoami                              # confirm identity',
        'descix app list                            # see available apps',
        'descix init -c <community> -a <app> -p .   # create workspace.json',
        'descix app init -a <app> -c <community>    # register app on platform',
        '```',
        '',
        '## Important: use explicit flags',
        'Always use -c <community> -a <app> flags for all commands until workspace context is verified working.',
        '',
        '## Integrating existing content',
        'If the repo has existing content (HTML app, React app, SDK with docs):',
        '- Do NOT copy files into site/ or kb/. Integrate in place.',
        '- Existing HTML/JS: serve as-is, add DeSciXAppSDK.js for DeSciX integration.',
        '- React/Vite: wrap root in <AppShell appId="app_id"> from @descix/app-sdk/AppShell.',
        '- Existing docs: copy *.md to kb/General/ for sync pipeline. Keep originals as source of truth.',
        '',
        'DeSciX is like a virtual university: communities are departments, apps are courses/textbooks/services.',
      ];
    }

    // Check agent instruction files
    const checkRoot = freshConfig?.getWorkspaceRoot?.() || workspaceRoot || process.cwd();
    const agentFiles = ['CLAUDE.md', '.github/copilot-instructions.md', '.cursorrules', '.clinerules'];
    const foundFiles = [];
    for (const f of agentFiles) {
      try {
        await fs.access(path.join(checkRoot, f));
        foundFiles.push(f);
      } catch { /* not present */ }
    }
    report.agent_files = foundFiles.length > 0 ? foundFiles : null;
    if (!report.agent_files) {
      report.warnings.push('No agent instruction files found. Run "descix quickstart" to generate them.');
    }

    // Cloud brain alignment — read local alignment config
    const alignmentPath = path.join(checkRoot, '.descix', 'alignment.json');
    try {
      const raw = await fs.readFile(alignmentPath, 'utf-8');
      report.alignment = JSON.parse(raw);
    } catch {
      report.alignment = null;
    }

    // Detect Claude Code environment
    try {
      await fs.access(path.join(checkRoot, '.claude'));
      report.claude_code_detected = true;
    } catch {
      report.claude_code_detected = false;
    }

    // Discover available KBs when authenticated and alignment is needed
    if (walletInfo && (report.setup_needed || !report.alignment)) {
      try {
        const purchasesResult = await apiClient.invoke(
          'fetch_my_purchases',
          { product_type: 'APP' },
          { allowGuest: false }
        );
        const purchasedApps = purchasesResult?.message?.apps || [];
        const kbApps = purchasedApps.map(app => ({
          app_id: app.app_id || app.appId || app.id,
          community_id: app.community_id || app.communityId,
          name: app.name || app.app_id || app.appId || app.id,
        })).filter(a => a.app_id);
        report.available_kbs = kbApps;
      } catch {
        report.available_kbs = null;
      }
    }

    // Remote verification (if requested, authenticated, and workspace configured)
    if (verifyRemote && walletInfo && freshContext?.appId) {
      try {
        const apps = await apiClient.invoke('list_apps_for_community', {
          community_id: freshContext.communityId,
        });
        const appList = Array.isArray(apps) ? apps : (apps?.apps || apps?.products || []);
        const appIds = appList.map(a => a.app_id || a.appId || a.id).filter(Boolean);
        report.remote_apps = appIds;

        if (!appIds.includes(freshContext.appId)) {
          report.warnings.push(
            `Local app_id "${freshContext.appId}" not found on platform for community "${freshContext.communityId}". ` +
            `Available: ${appIds.join(', ') || 'none'}. Run "descix app init -a ${freshContext.appId}" to register it.`
          );
        }
      } catch (err) {
        report.warnings.push(`Could not verify remote state: ${err.message}`);
      }
    }

    // Suggest cloud brain alignment when workspace is configured but alignment is missing
    if (!report.alignment && report.workspace?.configured) {
      report.suggestions = report.suggestions || [];
      report.suggestions.push(
        'Cloud brain alignment not configured. Ask the user which knowledge bases to always consult. ' +
        'Write selections to .descix/alignment.json.'
      );
    }

    if (report.warnings.length === 0) {
      report.status = 'healthy';
    } else {
      report.status = 'warnings';
    }

    return report;
  }

  // Create MCP server
  const server = new Server(
    { name: 'DeSciX MCP Server', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  // tools/list — PERMISSION-FILTERED surface (WS-MCP-SURFACE-SPLIT §10.2).
  //
  // The describe IS the permission gate. Rather than advertise a static curated list, the
  // stdio server asks the BACKEND's /mcp tools/list (authenticated with this operator's
  // credentials) so the advertised surface is filtered by the SAME server-side
  // checkCommandPermission gate as the HTTP transport — ONE filter, no parallel taxonomy.
  // `--admin` is simply the local operator's wallet carrying admin entitlements (cred-gated,
  // §9.1): a platform-admin wallet sees admin tools; a public wallet sees public-only.
  //
  // CLI-LOCAL diagnostics (descix_doctor, platform_health) are ALWAYS concatenated — they are
  // local CLI operations, never /apifront commands, so the backend never advertises them.
  //
  // Fallback: if the backend is unreachable, advertise the static curated SSOT core
  // (CLI_LOCAL_TOOLS + NATIVE_MCP_TOOLS) so the operator is never left with an empty toolbox.
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    try {
      const backendTools = await apiClient.mcpListTools();
      const tools = [...CLI_LOCAL_TOOLS, ...backendTools];
      console.error(`[MCP] tools/list — ${backendTools.length} permission-filtered backend tools + ${CLI_LOCAL_TOOLS.length} CLI-local = ${tools.length}`);
      return { tools };
    } catch (err) {
      console.error(`[MCP] tools/list — backend unreachable (${err.message}); falling back to static curated core (${TOOLS.length} tools)`);
      return { tools: TOOLS };
    }
  });

  // tools/call — dispatch to backend via HTTP (except doctor which is local)
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    console.error(`[MCP] tools/call — ${name}`);

    try {
      // descix_doctor is handled locally
      if (name === 'descix_doctor') {
        const report = await runDoctor(args);
        return {
          content: [{ type: 'text', text: JSON.stringify(report, null, 2) }],
        };
      }

      // Merge default context for convenience (caller can override).
      // Only auto-fill when workspace is configured — prevents silently
      // targeting wrong app/community.
      const params = { ...args };
      if (defaultContext) {
        if (!params.app_id && defaultContext.appId) params.app_id = defaultContext.appId;
        if (!params.kb_id && (defaultContext.kbId || 'General')) params.kb_id = params.kb_id || defaultContext.kbId || 'General';
        if (!params.community_id && defaultContext.communityId) params.community_id = defaultContext.communityId;
      }

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
