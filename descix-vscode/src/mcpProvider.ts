import * as vscode from 'vscode';
import * as path from 'path';
import { checkWalletExists } from './workspace';

/** Event emitter to signal MCP server definition changes (e.g., after login) */
export const mcpDidChange = new vscode.EventEmitter<void>();

/**
 * Resolve the path to mcp-server.js from the bundled @descix/cli.
 */
function getMcpServerPath(context: vscode.ExtensionContext): string {
  // Bundled CLI lives in extension's node_modules
  return path.join(context.extensionPath, 'node_modules', '@descix', 'cli', 'bin', 'mcp-server.js');
}

/**
 * Register the DeSciX MCP server definition provider with VS Code.
 *
 * VS Code calls provideMcpServerDefinitions to learn about available servers,
 * and resolveMcpServerDefinition before actually starting a server (auth gate).
 */
export function registerMcpProvider(context: vscode.ExtensionContext) {
  const provider = vscode.lm.registerMcpServerDefinitionProvider('descix-mcp', {
    onDidChangeMcpServerDefinitions: mcpDidChange.event,

    provideMcpServerDefinitions: async () => {
      const mcpServerPath = getMcpServerPath(context);

      // Determine workspace root (first workspace folder or cwd)
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        return []; // No workspace open — can't run MCP server
      }

      const server = new vscode.McpStdioServerDefinition(
        'DeSciX Platform',
        'node',
        [mcpServerPath],
        {},
        '1.0.0'
      );
      server.cwd = workspaceFolder.uri;
      return [server];
    },

    resolveMcpServerDefinition: async (
      server: vscode.McpServerDefinition
    ): Promise<vscode.McpServerDefinition | undefined> => {
      // Auth gate: check wallet.json before starting MCP server
      const hasWallet = await checkWalletExists();
      if (!hasWallet) {
        const action = await vscode.window.showWarningMessage(
          'DeSciX: Authentication required to start MCP server',
          'Connect'
        );
        if (action === 'Connect') {
          await vscode.commands.executeCommand('descix.login');
        }
        // Re-check after login attempt
        const walletNow = await checkWalletExists();
        if (!walletNow) {
          return undefined; // Don't start server without auth
        }
      }
      return server;
    },
  });

  context.subscriptions.push(provider);
}
