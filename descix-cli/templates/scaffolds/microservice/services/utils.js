/**
 * Service Configuration Bootstrap
 * 
 * STANDARD BOOTSTRAP PATTERN:
 * - .env: Only bootstrap keys (CONFIG_SECRET_NAME, CONFIG_SECRET_VERSION, DEPLOY_ENV)
 * - defaults-config.json: Instance defaults (checked in)
 * - Secret Manager: Global config
 * - dev-overrides.json: Local dev overrides (gitignored)
 */

import { fileURLToPath } from 'url';
import { GoogleAuth } from 'google-auth-library';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

class ServiceConfig {
    constructor() {
        if (ServiceConfig.instance) return ServiceConfig.instance;

        this.__appDir = path.resolve(__dirname, '../');

        // 1. Load Bootstrap .env
        if (process.env.DEPLOY_ENV !== 'production') {
            dotenv.config({ path: path.resolve(this.__appDir, '.env') });
        }
        
        this.CONFIG_SECRET_NAME = process.env.CONFIG_SECRET_NAME || null;
        this.CONFIG_SECRET_VERSION = process.env.CONFIG_SECRET_VERSION || null;
        this.DEPLOY_ENV = process.env.DEPLOY_ENV || null;

        // 2. Initialize Config Keys (All NULL - no hardcoded defaults)
        this.DEBUG_LOCAL = null;
        this.LOCAL_PORT = null;
        this.CORE_API_URL = null; // URL for DeSciX Core (for loopback)
        this.SERVICE_SECRET = null; // Secret for authenticating loopback calls (Legacy)
        this.SERVICE_KEY = null; // Service Delegate Key (New)
        
        // Owner Credentials (for loopback API calls)
        this.OWNER_WALLET_ADDRESS = null;
        this.OWNER_SIGNATURE = null;
        this.OWNER_USER_ID = null;

        this.GOOGLE_PROJECT_ID = null;
        this.secretClient = null;
        this.PORT = process.env.PORT || null;

        // Load instance defaults immediately
        this._loadDefaults();

        ServiceConfig.instance = this;
    }

    _mergeConfig(config) {
        for (const [key, value] of Object.entries(config)) {
            if (key.startsWith('_')) continue;
            // Allow dynamic expansion (undefined) or overwrite (null/value)
            this[key] = value;
        }
    }

    _loadDefaults() {
        const defaultsPath = path.resolve(this.__appDir, 'defaults-config.json');
        if (fs.existsSync(defaultsPath)) {
            try {
                this._mergeConfig(require(defaultsPath));
                console.log('[Config] Loaded defaults-config.json');
            } catch (e) {
                console.error('[Config] Error loading defaults-config.json:', e.message);
            }
        }
    }

    _loadDevOverrides() {
        if (this.DEPLOY_ENV !== 'dev') return;
        const overridesPath = path.resolve(this.__appDir, 'dev-overrides.json');
        if (fs.existsSync(overridesPath)) {
            try {
                this._mergeConfig(require(overridesPath));
                console.log('[Config] Loaded dev-overrides.json');
            } catch (e) {
                console.error('[Config] Error loading dev-overrides.json:', e.message);
            }
        }
    }

    async accessSecretVersion(secretName, version) {
        if (!version) throw new Error('[Config] CRITICAL: CONFIG_SECRET_VERSION not set');
        if (!this.secretClient) this.secretClient = new SecretManagerServiceClient();
        
        const name = `projects/${this.GOOGLE_PROJECT_ID}/secrets/${secretName}/versions/${version}`;
        const [response] = await this.secretClient.accessSecretVersion({ name });
        return response.payload.data.toString('utf8');
    }

    async _registerWithWorkspace() {
        if (this.DEPLOY_ENV !== 'dev' && !this.DEBUG_LOCAL) return;

        if (this.DEBUG_LOCAL) {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        }

        let communityId = null;
        let appId = null;
        let workspacePath = null;

        // Walk up from the service directory to find .descix/workspace.json
        let searchDir = this.__appDir;
        for (let i = 0; i < 10; i++) {
            const candidate = path.resolve(searchDir, '.descix/workspace.json');
            if (fs.existsSync(candidate)) {
                workspacePath = candidate;
                break;
            }
            const parent = path.dirname(searchDir);
            if (parent === searchDir) break;
            searchDir = parent;
        }

        // Detect context from manifest.json
        try {
            const manifestPath = path.resolve(this.__appDir, 'manifest.json');
            if (fs.existsSync(manifestPath)) {
                const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
                communityId = manifest.service?.community_id || manifest.community_id;
                appId = manifest.service?.app_id || manifest.app_id;
            }
        } catch (e) {
            console.warn('[Config] Failed to detect app context from manifest:', e.message);
        }

        if (!communityId || !appId) {
            console.log('[Config] No communityId/appId — skipping workspace registration');
            return;
        }

        if (!workspacePath) {
            console.log('[Config] No .descix/workspace.json found — skipping workspace registration');
            return;
        }

        // Write service port into workspace.json for descix-serve to pick up
        try {
            const workspace = JSON.parse(fs.readFileSync(workspacePath, 'utf-8'));
            if (!workspace.communities) workspace.communities = {};
            if (!workspace.communities[communityId]) workspace.communities[communityId] = { apps: {} };
            if (!workspace.communities[communityId].apps) workspace.communities[communityId].apps = {};
            if (!workspace.communities[communityId].apps[appId]) workspace.communities[communityId].apps[appId] = {};

            const appEntry = workspace.communities[communityId].apps[appId];
            if (!appEntry.service) appEntry.service = {};
            appEntry.service.port = parseInt(this.PORT, 10);

            fs.writeFileSync(workspacePath, JSON.stringify(workspace, null, 2), 'utf-8');
            console.log(`[Config] Registered ${communityId}/${appId} service port ${this.PORT} in workspace.json`);

            this._workspacePath = workspacePath;
            this._registeredCommunityId = communityId;
            this._registeredAppId = appId;
        } catch (e) {
            console.warn('[Config] Failed to write workspace.json:', e.message);
        }
    }

    cleanupWorkspaceRegistration() {
        if (!this._workspacePath || !this._registeredCommunityId || !this._registeredAppId) return;
        try {
            const workspace = JSON.parse(fs.readFileSync(this._workspacePath, 'utf-8'));
            const appEntry = workspace.communities?.[this._registeredCommunityId]?.apps?.[this._registeredAppId];
            if (appEntry?.service) {
                delete appEntry.service.port;
            }
            fs.writeFileSync(this._workspacePath, JSON.stringify(workspace, null, 2), 'utf-8');
            console.log(`[Config] Cleaned up workspace registration for ${this._registeredCommunityId}/${this._registeredAppId}`);
        } catch {
            // Best-effort cleanup on shutdown
        }
    }

    async initialize() {
        // 1. Get Project ID
        const auth = new GoogleAuth();
        this.GOOGLE_PROJECT_ID = await auth.getProjectId();

        // 2. Load from Secret Manager
        if (this.CONFIG_SECRET_NAME) {
            try {
                const payload = await this.accessSecretVersion(
                    this.CONFIG_SECRET_NAME, 
                    this.CONFIG_SECRET_VERSION
                );
                this._mergeConfig(JSON.parse(payload));
                console.log(`[Config] Loaded from Secret Manager: ${this.CONFIG_SECRET_NAME}`);
            } catch (error) {
                console.warn(`[Config] Secret Manager unavailable:`, error.message);
            }
        }

        // 3. Apply Dev Overrides
        this._loadDevOverrides();

        // 4. Validate Port (Allow 'auto' or 0)
        if (!this.PORT && this.PORT !== 0) {
            if (this.DEBUG_LOCAL && this.LOCAL_PORT) {
                this.PORT = this.LOCAL_PORT;
            } else {
                // If dev, default to auto-assign
                if (this.DEPLOY_ENV === 'dev' || this.DEBUG_LOCAL) {
                    this.PORT = 'auto';
                } else {
                    throw new Error('[Config] CRITICAL: PORT not configured');
                }
            }
        }
        
        // 5. Default Core API URL if not set
        if (!this.CORE_API_URL) {
            this.CORE_API_URL = this.DEBUG_LOCAL 
                ? 'https://localhost:4000/apifront' 
                : 'https://descix-cloud.descix.net/apifront';
        }

        // 6. Register service port in workspace.json for descix-serve gateway
        await this._registerWithWorkspace();

        // Clean up registration on shutdown
        process.on('SIGINT', () => this.cleanupWorkspaceRegistration());
        process.on('SIGTERM', () => this.cleanupWorkspaceRegistration());

        console.log(`[Config] Final: port=${this.PORT}, core=${this.CORE_API_URL}`);
    }
}

const serviceConfig = new ServiceConfig();

async function initializeServiceConfig() {
    await serviceConfig.initialize();
    return serviceConfig;
}

export { initializeServiceConfig, serviceConfig as utils };
