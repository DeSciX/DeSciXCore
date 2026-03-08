import * as vscode from 'vscode';
import { checkWalletExists, readWorkspaceConfig } from './workspace';

let statusBarItem: vscode.StatusBarItem;

/**
 * Create the status bar item and start watching for changes.
 */
export function createStatusBar(context: vscode.ExtensionContext) {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = 'descix.status';
  context.subscriptions.push(statusBarItem);

  // Initial update
  updateStatusBar();

  // Watch for wallet.json and workspace.json changes
  const walletWatcher = vscode.workspace.createFileSystemWatcher('**/.descix/wallet.json');
  const workspaceWatcher = vscode.workspace.createFileSystemWatcher('**/.descix/workspace.json');

  walletWatcher.onDidCreate(() => updateStatusBar());
  walletWatcher.onDidChange(() => updateStatusBar());
  walletWatcher.onDidDelete(() => updateStatusBar());
  workspaceWatcher.onDidCreate(() => updateStatusBar());
  workspaceWatcher.onDidChange(() => updateStatusBar());

  context.subscriptions.push(walletWatcher, workspaceWatcher);
}

/**
 * Update the status bar text based on current auth and workspace state.
 */
export async function updateStatusBar() {
  if (!statusBarItem) return;

  const hasWallet = await checkWalletExists();

  if (!hasWallet) {
    statusBarItem.text = '$(plug) DeSciX: Not Connected';
    statusBarItem.tooltip = 'Click to connect to DeSciX';
    statusBarItem.command = 'descix.login';
  } else {
    const config = await readWorkspaceConfig();
    const appId = config?.env?.platform?.appId || config?.defaultContext?.appId || '';
    const communityId = config?.env?.platform?.communityId || config?.defaultContext?.communityId || '';

    const label = communityId && appId ? `${communityId}/${appId}` : 'Connected';
    statusBarItem.text = `$(plug) DeSciX: ${label}`;
    statusBarItem.tooltip = 'DeSciX connected — click for status';
    statusBarItem.command = 'descix.status';
  }

  statusBarItem.show();
}
