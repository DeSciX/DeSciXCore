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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const mcpProvider_1 = require("./mcpProvider");
const auth_1 = require("./auth");
const statusBar_1 = require("./statusBar");
const workspace_1 = require("./workspace");
function activate(context) {
    console.log('[DeSciX] Extension activating...');
    // 1. Register MCP server provider (always — VS Code manages server lifecycle)
    (0, mcpProvider_1.registerMcpProvider)(context);
    // 2. Register commands (login, init, status, logout)
    (0, auth_1.registerCommands)(context);
    // 3. Create status bar item
    (0, statusBar_1.createStatusBar)(context);
    // 4. Check auth state — show welcome or setup guidance if not fully configured
    Promise.all([(0, workspace_1.checkWalletExists)(), (0, workspace_1.checkWorkspaceConfigExists)(), (0, workspace_1.readAppJson)()]).then(([hasWallet, hasWorkspace, appJson]) => {
        if (!hasWallet) {
            const isTry = appJson?.invite_type === 'try';
            const message = appJson?.app_name
                ? isTry
                    ? `DeSciX: Found app preview for "${appJson.app_name}" — connect to explore`
                    : `DeSciX: Found invite to "${appJson.app_name}" — connect to get started`
                : 'DeSciX: Connect to enable AI-assisted app development';
            vscode.window
                .showInformationMessage(message, 'Connect')
                .then((action) => {
                if (action === 'Connect') {
                    vscode.commands.executeCommand('descix.login');
                }
            });
        }
        else if (!hasWorkspace) {
            const isTry = appJson?.invite_type === 'try';
            const message = appJson?.app_name
                ? isTry
                    ? `DeSciX: Found app preview for "${appJson.app_name}" — ask your AI agent to explore it`
                    : `DeSciX: Found invite to "${appJson.app_name}" — your AI agent can set this up`
                : 'DeSciX: Connected but workspace not configured. Ask your AI agent: "Help me get started with DeSciX"';
            vscode.window
                .showInformationMessage(message, 'Open Chat', 'Re-connect')
                .then((action) => {
                if (action === 'Open Chat') {
                    vscode.commands.executeCommand('workbench.action.chat.open');
                }
                else if (action === 'Re-connect') {
                    vscode.commands.executeCommand('descix.login');
                }
            });
        }
    });
    console.log('[DeSciX] Extension activated');
}
function deactivate() {
    console.log('[DeSciX] Extension deactivated');
}
//# sourceMappingURL=extension.js.map