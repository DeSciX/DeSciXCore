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
exports.createStatusBar = createStatusBar;
exports.updateStatusBar = updateStatusBar;
const vscode = __importStar(require("vscode"));
const workspace_1 = require("./workspace");
let statusBarItem;
/**
 * Create the status bar item and start watching for changes.
 */
function createStatusBar(context) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
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
async function updateStatusBar() {
    if (!statusBarItem)
        return;
    const hasWallet = await (0, workspace_1.checkWalletExists)();
    if (!hasWallet) {
        statusBarItem.text = '$(plug) DeSciX: Not Connected';
        statusBarItem.tooltip = 'Click to connect to DeSciX';
        statusBarItem.command = 'descix.login';
    }
    else {
        const config = await (0, workspace_1.readWorkspaceConfig)();
        const appId = config?.env?.platform?.appId || config?.defaultContext?.appId || '';
        const communityId = config?.env?.platform?.communityId || config?.defaultContext?.communityId || '';
        const label = communityId && appId ? `${communityId}/${appId}` : 'Connected';
        statusBarItem.text = `$(plug) DeSciX: ${label}`;
        statusBarItem.tooltip = 'DeSciX connected — click for status';
        statusBarItem.command = 'descix.status';
    }
    statusBarItem.show();
}
//# sourceMappingURL=statusBar.js.map