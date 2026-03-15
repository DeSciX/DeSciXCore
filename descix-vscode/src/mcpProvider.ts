import * as vscode from 'vscode';
import { checkWalletExists } from './workspace';
import { getCliBinPath } from './cliResolver';

/** Event emitter to signal MCP server definition changes (e.g., after login) */
export const mcpDidChange = new vscode.EventEmitter<void>();

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
      const mcpServerPath = await getCliBinPath('mcp-server.js');
      if (!mcpServerPath) {
        vscode.window.showWarningMessage(
          'DeSciX: @descix/cli not found. Install with: npm install -g @descix/cli'
        );
        return [];
      }

      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        return [];
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
      const hasWallet = await checkWalletExists();
      if (!hasWallet) {
        const action = await vscode.window.showWarningMessage(
          'DeSciX: Authentication required to start MCP server',
          'Connect'
        );
        if (action === 'Connect') {
          await vscode.commands.executeCommand('descix.login');
        }
        const walletNow = await checkWalletExists();
        if (!walletNow) {
          return undefined;
        }
      }
      return server;
    },
  });

  context.subscriptions.push(provider);
}
