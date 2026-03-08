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
 * Initialize workspace: run quickstart via terminal if workspace.json is missing.
 * Generates agent instruction files using the CLI's agent-files module.
 */
async function initWorkspace(context) {
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
    const cliPath = path.join(context.extensionPath, 'node_modules', '@descix', 'cli', 'bin', 'descix.js');
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
async function generateAgentFilesViaTerminal(context, workspaceRoot) {
    const agentFilesPath = path.join(context.extensionPath, 'node_modules', '@descix', 'cli', 'lib', 'agent-files.js');
    // Use a simple inline node command to generate files
    const terminal = vscode.window.createTerminal({
        name: 'DeSciX Agent Files',
        cwd: workspaceRoot,
    });
    terminal.sendText(`node -e "import('${agentFilesPath.replace(/\\/g, '/')}').then(m => m.generateAgentFiles('${workspaceRoot.replace(/\\/g, '/')}').then(f => { console.log('Generated:', f.join(', ')); process.exit(0); }))"`);
    // Terminal auto-closes; no need to wait
    vscode.window.showInformationMessage('DeSciX: Agent instruction files generated');
}
//# sourceMappingURL=workspace.js.map