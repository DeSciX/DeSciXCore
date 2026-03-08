import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Get the workspace root directory.
 */
export function getWorkspaceRoot(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

/**
 * Check if .descix/wallet.json exists in the workspace root.
 */
export async function checkWalletExists(): Promise<boolean> {
  const root = getWorkspaceRoot();
  if (!root) return false;

  try {
    const fs = await import('fs/promises');
    await fs.access(path.join(root, '.descix', 'wallet.json'));
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if .descix/workspace.json exists.
 */
export async function checkWorkspaceConfigExists(): Promise<boolean> {
  const root = getWorkspaceRoot();
  if (!root) return false;

  try {
    const fs = await import('fs/promises');
    await fs.access(path.join(root, '.descix', 'workspace.json'));
    return true;
  } catch {
    return false;
  }
}

/**
 * Read workspace.json and return parsed config.
 */
export async function readWorkspaceConfig(): Promise<any | null> {
  const root = getWorkspaceRoot();
  if (!root) return null;

  try {
    const fs = await import('fs/promises');
    const raw = await fs.readFile(path.join(root, '.descix', 'workspace.json'), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Initialize workspace: run quickstart via terminal if workspace.json is missing.
 * Generates agent instruction files using the CLI's agent-files module.
 */
export async function initWorkspace(context: vscode.ExtensionContext): Promise<void> {
  const root = getWorkspaceRoot();
  if (!root) {
    vscode.window.showErrorMessage('DeSciX: Open a folder first');
    return;
  }

  const hasConfig = await checkWorkspaceConfigExists();
  if (hasConfig) {
    // Workspace already initialized — just regenerate agent files
    await generateAgentFilesViaTerminal(context, root);
    return;
  }

  // Run descix quickstart in terminal for full init
  const cliPath = path.join(
    context.extensionPath,
    'node_modules', '@descix', 'cli', 'bin', 'descix.js'
  );

  const terminal = vscode.window.createTerminal({
    name: 'DeSciX Init',
    cwd: root,
  });
  terminal.show();
  terminal.sendText(`node "${cliPath}" quickstart --dev`);
}

/**
 * Generate agent instruction files by running a quick node script.
 */
async function generateAgentFilesViaTerminal(
  context: vscode.ExtensionContext,
  workspaceRoot: string
): Promise<void> {
  const agentFilesPath = path.join(
    context.extensionPath,
    'node_modules', '@descix', 'cli', 'lib', 'agent-files.js'
  );

  // Use a simple inline node command to generate files
  const terminal = vscode.window.createTerminal({
    name: 'DeSciX Agent Files',
    cwd: workspaceRoot,
  });
  terminal.sendText(
    `node -e "import('${agentFilesPath.replace(/\\/g, '/')}').then(m => m.generateAgentFiles('${workspaceRoot.replace(/\\/g, '/')}').then(f => { console.log('Generated:', f.join(', ')); process.exit(0); }))"`
  );

  // Terminal auto-closes; no need to wait
  vscode.window.showInformationMessage('DeSciX: Agent instruction files generated');
}
