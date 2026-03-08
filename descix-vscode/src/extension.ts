import * as vscode from 'vscode';
import { registerMcpProvider } from './mcpProvider';
import { registerCommands } from './auth';
import { createStatusBar } from './statusBar';
import { checkWalletExists } from './workspace';

export function activate(context: vscode.ExtensionContext) {
  console.log('[DeSciX] Extension activating...');

  // 1. Register MCP server provider (always — VS Code manages server lifecycle)
  registerMcpProvider(context);

  // 2. Register commands (login, init, status, logout)
  registerCommands(context);

  // 3. Create status bar item
  createStatusBar(context);

  // 4. Check auth state — show welcome if not connected
  checkWalletExists().then((exists) => {
    if (!exists) {
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
    }
  });

  console.log('[DeSciX] Extension activated');
}

export function deactivate() {
  console.log('[DeSciX] Extension deactivated');
}
