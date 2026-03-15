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
exports.resolveCliRoot = resolveCliRoot;
exports.ensureCli = ensureCli;
exports.getCliBinPath = getCliBinPath;
exports.getCliTemplatesDir = getCliTemplatesDir;
exports.clearCliCache = clearCliCache;
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const workspace_1 = require("./workspace");
let _cachedCliRoot = null;
let _installInProgress = null;
/**
 * Resolve the root directory of @descix/cli.
 * Search order: workspace node_modules, global npm prefix.
 * Returns null if not found.
 */
async function resolveCliRoot() {
    if (_cachedCliRoot)
        return _cachedCliRoot;
    const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
    // 1. Workspace node_modules
    const workspaceRoot = (0, workspace_1.getWorkspaceRoot)();
    if (workspaceRoot) {
        const wsPath = path.join(workspaceRoot, 'node_modules', '@descix', 'cli');
        try {
            await fs.access(path.join(wsPath, 'package.json'));
            _cachedCliRoot = wsPath;
            return wsPath;
        }
        catch { /* not here */ }
    }
    // 2. Global npm prefix (npm root -g)
    try {
        const { execSync } = await Promise.resolve().then(() => __importStar(require('child_process')));
        const globalRoot = execSync('npm root -g', { encoding: 'utf-8' }).trim();
        const globalPath = path.join(globalRoot, '@descix', 'cli');
        await fs.access(path.join(globalPath, 'package.json'));
        _cachedCliRoot = globalPath;
        return globalPath;
    }
    catch { /* not here */ }
    return null;
}
/**
 * Ensure @descix/cli is installed. If not found, auto-install globally
 * with a progress notification. Returns true if CLI is available after this call.
 */
async function ensureCli() {
    const existing = await resolveCliRoot();
    if (existing)
        return true;
    // Deduplicate concurrent install attempts
    if (_installInProgress)
        return _installInProgress;
    _installInProgress = doInstall();
    const result = await _installInProgress;
    _installInProgress = null;
    return result;
}
async function doInstall() {
    return vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'DeSciX',
        cancellable: false,
    }, async (progress) => {
        progress.report({ message: 'Installing CLI tools...' });
        try {
            const { execSync } = await Promise.resolve().then(() => __importStar(require('child_process')));
            execSync('npm install -g @descix/cli', {
                encoding: 'utf-8',
                timeout: 120_000,
                stdio: 'pipe',
            });
            clearCliCache();
            const root = await resolveCliRoot();
            if (root) {
                progress.report({ message: 'CLI installed' });
                return true;
            }
            else {
                vscode.window.showErrorMessage('DeSciX: CLI install completed but not found. Try: npm install -g @descix/cli');
                return false;
            }
        }
        catch (err) {
            const msg = err.stderr?.toString().substring(0, 300) || err.message?.substring(0, 300) || '';
            vscode.window.showErrorMessage('DeSciX: CLI install failed. Run manually: npm install -g @descix/cli\n' + msg);
            return false;
        }
    });
}
/**
 * Get the path to a CLI binary (e.g., 'descix.js' or 'mcp-server.js').
 * Auto-installs CLI if missing.
 */
async function getCliBinPath(binName) {
    const available = await ensureCli();
    if (!available)
        return null;
    const root = await resolveCliRoot();
    if (!root)
        return null;
    return path.join(root, 'bin', binName);
}
/**
 * Get the path to the CLI templates directory.
 * Auto-installs CLI if missing.
 */
async function getCliTemplatesDir() {
    const available = await ensureCli();
    if (!available)
        return null;
    const root = await resolveCliRoot();
    if (!root)
        return null;
    return path.join(root, 'templates');
}
/**
 * Clear the cached CLI root (e.g., after install or update).
 */
function clearCliCache() {
    _cachedCliRoot = null;
}
//# sourceMappingURL=cliResolver.js.map