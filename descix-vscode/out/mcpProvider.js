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
exports.mcpDidChange = void 0;
exports.registerMcpProvider = registerMcpProvider;
const vscode = __importStar(require("vscode"));
const workspace_1 = require("./workspace");
const cliResolver_1 = require("./cliResolver");
/** Event emitter to signal MCP server definition changes (e.g., after login) */
exports.mcpDidChange = new vscode.EventEmitter();
/**
 * Register the DeSciX MCP server definition provider with VS Code.
 *
 * VS Code calls provideMcpServerDefinitions to learn about available servers,
 * and resolveMcpServerDefinition before actually starting a server (auth gate).
 */
function registerMcpProvider(context) {
    const provider = vscode.lm.registerMcpServerDefinitionProvider('descix-mcp', {
        onDidChangeMcpServerDefinitions: exports.mcpDidChange.event,
        provideMcpServerDefinitions: async () => {
            const mcpServerPath = await (0, cliResolver_1.getCliBinPath)('mcp-server.js');
            if (!mcpServerPath) {
                vscode.window.showWarningMessage('DeSciX: @descix/cli not found. Install with: npm install -g @descix/cli');
                return [];
            }
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                return [];
            }
            const server = new vscode.McpStdioServerDefinition('DeSciX Platform', 'node', [mcpServerPath], {}, '1.0.0');
            server.cwd = workspaceFolder.uri;
            return [server];
        },
        resolveMcpServerDefinition: async (server) => {
            const hasWallet = await (0, workspace_1.checkWalletExists)();
            if (!hasWallet) {
                const action = await vscode.window.showWarningMessage('DeSciX: Authentication required to start MCP server', 'Connect');
                if (action === 'Connect') {
                    await vscode.commands.executeCommand('descix.login');
                }
                const walletNow = await (0, workspace_1.checkWalletExists)();
                if (!walletNow) {
                    return undefined;
                }
            }
            return server;
        },
    });
    context.subscriptions.push(provider);
}
//# sourceMappingURL=mcpProvider.js.map