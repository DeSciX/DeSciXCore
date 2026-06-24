/**
 * Agent Files — Multi-format instruction file generator
 *
 * Reads workspace.json and generates agent instruction files for
 * Claude Code, GitHub Copilot, Cursor, and Cline from shared templates.
 *
 * Shared between CLI (descix quickstart) and VS Code extension.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '../templates');

/**
 * Template → output file mapping
 */
const AGENT_FILES = [
  { template: 'agent-claude.md', output: 'CLAUDE.md' },
  { template: 'agent-copilot.md', output: '.github/copilot-instructions.md' },
  { template: 'agent-cursor.md', output: '.cursorrules' },
  { template: 'agent-cline.md', output: '.clinerules' },
];

/**
 * Read workspace.json and extract template variables
 */
async function loadContext(workspaceRoot) {
  const wsPath = path.join(workspaceRoot, '.descix', 'workspace.json');
  try {
    const raw = await fs.readFile(wsPath, 'utf-8');
    const config = JSON.parse(raw);

    // Derive from v2.1 format or legacy
    const platform = config.env?.platform || {};
    const appId = platform.appId || config.defaultContext?.appId || 'my-app';
    const communityId = platform.communityId || config.defaultContext?.communityId || config.primaryCommunity;

    // Derive API URL
    let apiUrl = config.apiUrl || null;
    if (!apiUrl && platform.microservice?.port) {
      apiUrl = `https://localhost:${platform.microservice.port}`;
    }
    apiUrl = apiUrl || 'https://descix.net';

    // Friendly name: capitalize app_id or use as-is
    const appName = appId.charAt(0).toUpperCase() + appId.slice(1);

    return { appId, communityId, apiUrl, appName };
  } catch {
    // No workspace.json — use defaults
    return {
      appId: path.basename(workspaceRoot),
      communityId: 'daita',
      apiUrl: 'https://descix.net',
      appName: path.basename(workspaceRoot),
    };
  }
}

/**
 * Substitute {{placeholder}} tokens in a template string
 */
function render(template, vars) {
  return template
    .replace(/\{\{appId\}\}/g, vars.appId)
    .replace(/\{\{communityId\}\}/g, vars.communityId)
    .replace(/\{\{apiUrl\}\}/g, vars.apiUrl)
    .replace(/\{\{appName\}\}/g, vars.appName);
}

/**
 * Generate all agent instruction files in the workspace root.
 *
 * @param {string} workspaceRoot - Project root directory
 * @returns {Promise<string[]>} List of files written
 */
export async function generateAgentFiles(workspaceRoot) {
  const vars = await loadContext(workspaceRoot);
  const written = [];

  for (const { template, output } of AGENT_FILES) {
    const templatePath = path.join(TEMPLATES_DIR, template);
    const outputPath = path.join(workspaceRoot, output);

    try {
      // Check if file exists and has been customized
      try {
        const existing = await fs.readFile(outputPath, 'utf-8');
        if (!existing.includes('<!-- BOOTSTRAP')) {
          // File has been customized — don't overwrite
          continue;
        }
      } catch {
        // File doesn't exist — proceed with writing
      }

      const raw = await fs.readFile(templatePath, 'utf-8');
      const content = render(raw, vars);

      // Ensure parent directory exists (e.g., .github/)
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, content, 'utf-8');
      written.push(output);
    } catch (err) {
      // Template missing — skip silently
      console.error(`[agent-files] Skipped ${template}: ${err.message}`);
    }
  }

  return written;
}

/**
 * Generate .vscode/mcp.json for non-extension users.
 * Skips if the DeSciX VS Code extension is installed (it registers MCP natively).
 *
 * @param {string} workspaceRoot - Project root directory
 * @returns {Promise<boolean>} True if file was written, false if skipped
 */
export async function generateMcpConfig(workspaceRoot) {
  // Skip if the DeSciX extension is installed — it registers the MCP server
  // natively via registerMcpServerDefinitionProvider, so mcp.json would create
  // a duplicate namespace.
  try {
    const extensionsDir = path.join(
      process.env.HOME || process.env.USERPROFILE || '',
      '.vscode', 'extensions'
    );
    const entries = await fs.readdir(extensionsDir);
    if (entries.some(e => e.startsWith('descix.'))) {
      return false; // Extension installed — skip mcp.json
    }
  } catch {
    // Can't read extensions dir — proceed with mcp.json
  }

  const outputPath = path.join(workspaceRoot, '.vscode', 'mcp.json');

  // Preserve existing servers if file already exists
  let existing = { servers: {} };
  try {
    const raw = await fs.readFile(outputPath, 'utf-8');
    existing = JSON.parse(raw);
    if (!existing.servers) existing.servers = {};
  } catch {
    // No existing file — start fresh
  }

  // Add/update DeSciX MCP server
  existing.servers['descix'] = {
    command: 'descix',
    args: ['mcp-serve'],
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(existing, null, 2), 'utf-8');
  return true;
}
