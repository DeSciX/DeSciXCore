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
exports.registerCommands = registerCommands;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const mcpProvider_1 = require("./mcpProvider");
const workspace_1 = require("./workspace");
const statusBar_1 = require("./statusBar");
/**
 * Resolve the descix CLI entry point from the bundled package.
 */
function getCliPath(context) {
    return path.join(context.extensionPath, 'node_modules', '@descix', 'cli', 'bin', 'descix.js');
}
/**
 * Run `descix login --dev` in a VS Code terminal and watch for wallet.json
 * creation to detect completion.
 */
async function login(context) {
    const workspaceRoot = (0, workspace_1.getWorkspaceRoot)();
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
    return new Promise((resolve) => {
        let resolved = false;
        const onWalletReady = async () => {
            if (resolved)
                return;
            resolved = true;
            watcher.dispose();
            vscode.window.showInformationMessage('DeSciX: Connected!');
            (0, statusBar_1.updateStatusBar)();
            mcpProvider_1.mcpDidChange.fire(); // Trigger MCP server (re)start
            // Auto-init workspace if needed
            await (0, workspace_1.initWorkspace)(context);
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
async function showStatus(context) {
    const hasWallet = await (0, workspace_1.checkWalletExists)();
    const workspaceRoot = (0, workspace_1.getWorkspaceRoot)();
    if (!hasWallet) {
        vscode.window.showInformationMessage('DeSciX: Not connected. Run "DeSciX: Connect" to authenticate.');
        return;
    }
    // Read wallet for user info
    try {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const walletPath = path.join(workspaceRoot, '.descix', 'wallet.json');
        const raw = await fs.readFile(walletPath, 'utf-8');
        const wallet = JSON.parse(raw);
        vscode.window.showInformationMessage(`DeSciX: Connected as ${wallet.userId || wallet.walletAddress?.substring(0, 10)} ` +
            `(${wallet.communityId || 'descix'})`);
    }
    catch {
        vscode.window.showInformationMessage('DeSciX: Connected');
    }
}
/**
 * Disconnect — remove wallet.json.
 */
async function logout() {
    const workspaceRoot = (0, workspace_1.getWorkspaceRoot)();
    if (!workspaceRoot)
        return;
    const confirm = await vscode.window.showWarningMessage('DeSciX: Disconnect? This removes your saved credentials.', { modal: true }, 'Disconnect');
    if (confirm !== 'Disconnect')
        return;
    try {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        await fs.unlink(path.join(workspaceRoot, '.descix', 'wallet.json'));
        vscode.window.showInformationMessage('DeSciX: Disconnected');
        (0, statusBar_1.updateStatusBar)();
        mcpProvider_1.mcpDidChange.fire(); // MCP server will stop
    }
    catch {
        // Already gone
    }
}
/**
 * Register all extension commands.
 */
function registerCommands(context) {
    context.subscriptions.push(vscode.commands.registerCommand('descix.login', () => login(context)), vscode.commands.registerCommand('descix.init', () => (0, workspace_1.initWorkspace)(context)), vscode.commands.registerCommand('descix.status', () => showStatus(context)), vscode.commands.registerCommand('descix.logout', () => logout()));
}
//# sourceMappingURL=auth.js.map