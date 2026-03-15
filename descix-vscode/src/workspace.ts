import * as vscode from 'vscode';
import * as path from 'path';
import { getCliTemplatesDir } from './cliResolver';

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
 * Check if .descix/app.json exists in the workspace root.
 */
export async function checkAppJsonExists(): Promise<boolean> {
  const root = getWorkspaceRoot();
  if (!root) return false;

  try {
    const fs = await import('fs/promises');
    await fs.access(path.join(root, '.descix', 'app.json'));
    return true;
  } catch {
    return false;
  }
}

/**
 * Read .descix/app.json and return parsed config, or null if missing/invalid.
 */
export async function readAppJson(): Promise<any | null> {
  const root = getWorkspaceRoot();
  if (!root) return null;

  try {
    const fs = await import('fs/promises');
    const raw = await fs.readFile(path.join(root, '.descix', 'app.json'), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
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
 * Initialize workspace: write bootstrap agent instruction files directly.
 * Does NOT run `descix init` — the AI agent handles project setup
 * conversationally using MCP tools (find_communities, descix_doctor, etc.).
 * Does NOT generate mcp.json — the extension handles MCP registration natively.
 */
export async function initWorkspace(context: vscode.ExtensionContext): Promise<void> {
  const root = getWorkspaceRoot();
  if (!root) {
    vscode.window.showErrorMessage('DeSciX: Open a folder first');
    return;
  }

  await writeBootstrapAgentFiles(root, context);
}

/**
 * Write bootstrap agent instruction files directly from the extension.
 * No terminal, no async CLI process — files exist immediately.
 * Uses bundled templates if available, otherwise writes inline bootstrap content.
 */
async function writeBootstrapAgentFiles(
  workspaceRoot: string,
  context: vscode.ExtensionContext
): Promise<void> {
  const fs = await import('fs/promises');

  // Resolve templates from globally installed CLI
  const templatesDir = await getCliTemplatesDir();
  if (!templatesDir) {
    console.warn('[DeSciX] @descix/cli not found - skipping agent file generation');
    return;
  }

  // Template -> output mapping
  const files: Array<{ template: string; output: string }> = [
    { template: 'agent-claude.md', output: 'CLAUDE.md' },
    { template: 'agent-copilot.md', output: path.join('.github', 'copilot-instructions.md') },
    { template: 'agent-cursor.md', output: '.cursorrules' },
    { template: 'agent-cline.md', output: '.clinerules' },
  ];

  // Read workspace.json for context (if it exists)
  let appId = path.basename(workspaceRoot);
  let communityId = 'descix';
  let apiUrl = 'https://descix.net';
  try {
    const raw = await fs.readFile(path.join(workspaceRoot, '.descix', 'workspace.json'), 'utf-8');
    const config = JSON.parse(raw);
    const platform = config.env?.platform || {};
    appId = platform.appId || config.defaultContext?.appId || appId;
    communityId = platform.communityId || config.defaultContext?.communityId || communityId;
    if (platform.microservice?.port) {
      apiUrl = `https://localhost:${platform.microservice.port}`;
    }
  } catch {
    // No workspace.json — try app.json (invite seed), then fall back to folder name
    try {
      const appJsonRaw = await fs.readFile(path.join(workspaceRoot, '.descix', 'app.json'), 'utf-8');
      const appJson = JSON.parse(appJsonRaw);
      if (appJson.app_id) appId = appJson.app_id;
      if (appJson.community_id) communityId = appJson.community_id;
      if (appJson.api_url) apiUrl = appJson.api_url;
    } catch {
      // No app.json either — folder name defaults remain
    }
  }
  const appName = appId.charAt(0).toUpperCase() + appId.slice(1);

  for (const { template, output } of files) {
    const outputPath = path.join(workspaceRoot, output);
    try {
      // Try bundled template first
      const templatePath = path.join(templatesDir, template);
      let content = await fs.readFile(templatePath, 'utf-8');
      content = content
        .replace(/\{\{appId\}\}/g, appId)
        .replace(/\{\{communityId\}\}/g, communityId)
        .replace(/\{\{apiUrl\}\}/g, apiUrl)
        .replace(/\{\{appName\}\}/g, appName);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, content, 'utf-8');
    } catch {
      // Template not found — skip (CLAUDE.md is the critical one)
    }
  }
}
