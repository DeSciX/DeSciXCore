"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkspaceRoot = getWorkspaceRoot;
exports.checkWalletExists = checkWalletExists;
exports.checkWorkspaceConfigExists = checkWorkspaceConfigExists;
exports.readWorkspaceConfig = readWorkspaceConfig;
exports.initWorkspace = initWorkspace;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
/**
 * Get the workspace root directory.
 */
function getWorkspaceRoot() {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}
/**
 * Check if .descix/wallet.json exists in the workspace root.
 */
async function checkWalletExists() {
    const root = getWorkspaceRoot();
    if (!root)
        return false;
    try {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        await fs.access(path.join(root, '.descix', 'wallet.json'));
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Check if .descix/workspace.json exists.
 */
async function checkWorkspaceConfigExists() {
    const root = getWorkspaceRoot();
    if (!root)
        return false;
    try {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        await fs.access(path.join(root, '.descix', 'workspace.json'));
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Read workspace.json and return parsed config.
 */
async function readWorkspaceConfig() {
    const root = getWorkspaceRoot();
    if (!root)
        return null;
    try {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const raw = await fs.readFile(path.join(root, '.descix', 'workspace.json'), 'utf-8');
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
/**
 * Initialize workspace: write bootstrap agent instruction files directly.
 * Does NOT run `descix init` — the AI agent handles project setup
 * conversationally using MCP tools (find_communities, descix_doctor, etc.).
 * Does NOT generate mcp.json — the extension handles MCP registration natively.
 */
async function initWorkspace(context) {
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
async function writeBootstrapAgentFiles(workspaceRoot, context) {
    const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
    // Try to read templates from bundled CLI
    const templatesDir = path.join(context.extensionPath, 'node_modules', '@descix', 'cli', 'templates');
    // Template -> output mapping
    const files = [
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
    }
    catch {
        // No workspace.json — use folder name as app ID
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
        }
        catch {
            // Template not found — skip (CLAUDE.md is the critical one)
        }
    }
}
//# sourceMappingURL=workspace.js.map