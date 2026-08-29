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
import { readIdentity, isIdentityNamed } from './workspace-identity.js';

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

  // A workspace.json that cannot be read or parsed is a HARD failure, not a cue to invent an
  // identity. This used to return `{appId: <dirname>, communityId: 'daita', apiUrl: <prod>}` —
  // three fabricated facts written into four files the developer's coding agent then treats as
  // authoritative. 'daita' is the DeSciX root community; handing it to an unrelated developer
  // was the worst of the three.
  let config;
  try {
    config = JSON.parse(await fs.readFile(wsPath, 'utf-8'));
  } catch (err) {
    throw new Error(
      `Cannot generate agent instruction files: ${wsPath} could not be read (${err.code || err.message}). ` +
      `Run \`descix init -c <community> -a <app>\` first — the app, community and origin these ` +
      `files state must come from your workspace, and there is no default that would be true.`
    );
  }

  // ONE reader, over the keys registerApp() actually writes. See lib/workspace-identity.js.
  const { appId, communityId, apiUrl, originSource } = readIdentity(config);

  if (!isIdentityNamed({ appId, communityId })) {
    const missing = [!appId && 'app id', !communityId && 'community id'].filter(Boolean).join(' and ');
    throw new Error(
      `Cannot generate agent instruction files: ${wsPath} names no ${missing}. ` +
      `Run \`descix init -c <community> -a <app>\` to register it. ` +
      `(Refusing to write files that would state an app or community you did not choose.)`
    );
  }

  // The origin is the one fact that may legitimately be absent: a workspace can exist before an
  // environment has been chosen. It is stated as UNCONFIGURED with the remedy — never guessed.
  // An unconfigured origin is not an error here because the app and community are still true.
  const originLine = apiUrl
    ? apiUrl
    : '(not configured — run `descix config set-env dev|demo|prod`)';

  // Friendly name: capitalize app_id or use as-is
  const appName = appId.charAt(0).toUpperCase() + appId.slice(1);

  return { appId, communityId, apiUrl: originLine, appName, originSource };
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
