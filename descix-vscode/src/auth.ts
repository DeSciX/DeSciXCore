import * as vscode from 'vscode';
import * as path from 'path';
import { mcpDidChange } from './mcpProvider';
import { checkWalletExists, checkWorkspaceConfigExists, getWorkspaceRoot, initWorkspace } from './workspace';
import { updateStatusBar } from './statusBar';

/**
 * Resolve the descix CLI entry point from the bundled package.
 */
function getCliPath(context: vscode.ExtensionContext): string {
  return path.join(
    context.extensionPath,
    'node_modules',
    '@descix',
    'cli',
    'bin',
    'descix.js'
  );
}

/**
 * Run `descix login --dev` in a VS Code terminal and watch for wallet.json
 * creation to detect completion.
 */
async function login(context: vscode.ExtensionContext): Promise<boolean> {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    vscode.window.showErrorMessage('DeSciX: Open a folder first');
    return false;
  }

  const cliPath = getCliPath(context);
  const terminal = vscode.window.createTerminal({
    name: 'DeSciX Login',
    cwd: workspaceRoot,
  });
  terminal.show();
  terminal.sendText(`node "${cliPath}" login --dev`);

  // Watch for wallet.json creation/modification
  const walletPattern = new vscode.RelativePattern(workspaceRoot, '.descix/wallet.json');
  const watcher = vscode.workspace.createFileSystemWatcher(walletPattern);

  return new Promise<boolean>((resolve) => {
    let resolved = false;

    const onWalletReady = async () => {
      if (resolved) return;
      resolved = true;
      watcher.dispose();

      updateStatusBar();
      mcpDidChange.fire(); // Trigger MCP server (re)start

      // Generate agent instruction files (bootstrap mode — no CLI wizard)
      await initWorkspace(context);

      // Guide user to their AI agent — the agent handles project setup.
      // The agent instruction files (CLAUDE.md etc.) are already written,
      // so the agent will know to call descix_doctor and guide the user.
      const hasWorkspace = await checkWorkspaceConfigExists();
      const message = hasWorkspace
        ? 'DeSciX ready! In the chat, ask: "Help me get started with DeSciX"'
        : 'DeSciX connected! Workspace not yet configured — ask your AI agent: "Help me set up my DeSciX workspace"';
      vscode.window.showInformationMessage(message, 'Open Chat').then((action) => {
        if (action === 'Open Chat') {
          vscode.commands.executeCommand('workbench.action.chat.open');
        }
      });

      resolve(true);
    };

    watcher.onDidCreate(onWalletReady);
    watcher.onDidChange(onWalletReady);

    // Handle terminal close (user cancelled)
    const terminalListener = vscode.window.onDidCloseTerminal((t) => {
      if (t === terminal && !resolved) {
        resolved = true;
        watcher.dispose();
        terminalListener.dispose();
        resolve(false);
      }
    });

    context.subscriptions.push(watcher, terminalListener);
  });
}

/**
 * Show connection status.
 */
async function showStatus(context: vscode.ExtensionContext) {
  const hasWallet = await checkWalletExists();
  const workspaceRoot = getWorkspaceRoot();

  if (!hasWallet) {
    vscode.window.showInformationMessage('DeSciX: Not connected. Run "DeSciX: Connect" to authenticate.');
    return;
  }

  // Read wallet for user info
  try {
    const fs = await import('fs/promises');
    const walletPath = path.join(workspaceRoot!, '.descix', 'wallet.json');
    const raw = await fs.readFile(walletPath, 'utf-8');
    const wallet = JSON.parse(raw);
    vscode.window.showInformationMessage(
      `DeSciX: Connected as ${wallet.userId || wallet.walletAddress?.substring(0, 10)} ` +
      `(${wallet.communityId || 'descix'})`
    );
  } catch {
    vscode.window.showInformationMessage('DeSciX: Connected');
  }
}

/**
 * Disconnect — remove wallet.json.
 */
async function logout() {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) return;

  const confirm = await vscode.window.showWarningMessage(
    'DeSciX: Disconnect? This removes your saved credentials.',
    { modal: true },
    'Disconnect'
  );

  if (confirm !== 'Disconnect') return;

  try {
    const fs = await import('fs/promises');
    await fs.unlink(path.join(workspaceRoot, '.descix', 'wallet.json'));
    vscode.window.showInformationMessage('DeSciX: Disconnected');
    updateStatusBar();
    mcpDidChange.fire(); // MCP server will stop
  } catch {
    // Already gone
  }
}

/**
 * Register all extension commands.
 */
export function registerCommands(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('descix.login', () => login(context)),
    vscode.commands.registerCommand('descix.init', () => initWorkspace(context)),
    vscode.commands.registerCommand('descix.status', () => showStatus(context)),
    vscode.commands.registerCommand('descix.logout', () => logout()),
  );

  // Watch for workspace.json creation (written by AI agent's `descix init` command).
  // This watcher lives for the full extension lifetime so the status bar updates
  // as soon as the agent completes setup — even if login was done in a prior session.
  const workspaceRoot = getWorkspaceRoot();
  if (workspaceRoot) {
    const wsPattern = new vscode.RelativePattern(workspaceRoot, '.descix/workspace.json');
    const wsWatcher = vscode.workspace.createFileSystemWatcher(wsPattern);
    wsWatcher.onDidCreate(() => {
      updateStatusBar();
      mcpDidChange.fire();
    });
    context.subscriptions.push(wsWatcher);
  }
}
