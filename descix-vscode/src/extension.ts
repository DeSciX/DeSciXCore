import * as vscode from 'vscode';
import { registerMcpProvider } from './mcpProvider';
import { registerCommands } from './auth';
import { createStatusBar } from './statusBar';
import { checkWalletExists, checkWorkspaceConfigExists } from './workspace';

export function activate(context: vscode.ExtensionContext) {
  console.log('[DeSciX] Extension activating...');

  // 1. Register MCP server provider (always — VS Code manages server lifecycle)
  registerMcpProvider(context);

  // 2. Register commands (login, init, status, logout)
  registerCommands(context);

  // 3. Create status bar item
  createStatusBar(context);

  // 4. Check auth state — show welcome or setup guidance if not fully configured
  Promise.all([checkWalletExists(), checkWorkspaceConfigExists()]).then(([hasWallet, hasWorkspace]) => {
    if (!hasWallet) {
      vscode.window
        .showInformationMessage(
          'DeSciX: Connect to enable AI-assisted app development',
          'Connect'
        )
        .then((action) => {
          if (action === 'Connect') {
            vscode.commands.executeCommand('descix.login');
          }
        });
    } else if (!hasWorkspace) {
      vscode.window
        .showInformationMessage(
          'DeSciX: Connected but workspace not configured. Ask your AI agent: "Help me get started with DeSciX"',
          'Open Chat',
          'Re-connect'
        )
        .then((action) => {
          if (action === 'Open Chat') {
            vscode.commands.executeCommand('workbench.action.chat.open');
          } else if (action === 'Re-connect') {
            vscode.commands.executeCommand('descix.login');
          }
        });
    }
  });

  console.log('[DeSciX] Extension activated');
}

export function deactivate() {
  console.log('[DeSciX] Extension deactivated');
}
