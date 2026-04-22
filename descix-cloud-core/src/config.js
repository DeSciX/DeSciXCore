/**
 * CloudConfig - Universal Service Configuration
 * Shared bootstrap for DeSciX platform microservices (Core, Powch, Discord, etc.)
 *
 * Uses rootPath to resolve .env, defaults-config.json, dev-overrides.json.
 * Loads from Secret Manager via config-schema.json key definitions.
 */

import { fileURLToPath } from 'url';
import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';
import path from 'path';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import fs from 'fs';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const configSchemaPath = path.resolve(__dirname, '../config-schema.json');
const configSchema = require(configSchemaPath);

// Constants exported for consumers
class ProductTypes {
    static COMMUNITY = "COMMUNITY";
    static APP = "APP";
    static KNOWLEDGEBASE = "KNOWLEDGEBASE";
    static ROLE = "ROLE";
    static IPDOC = "IPDOC";
}

const LoginStatus = {
    GUEST: 'GUEST',
    NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
    AUTHENTICATED: 'AUTHENTICATED',
    CONNECTED: 'CONNECTED',
    NOT_STAKED: 'CONNECTED',
    STAKED: 'STAKED',
    AUTH_FAILED: 'AUTH_FAILED',
};

const NetworkStatus = { OK: 'OK', ERROR: 'ERROR' };

const PERMISSIONS = {
    AIRDROP_ELIGIBLE: 'AIRDROP_ELIGIBLE',
    PLATFORM_MANAGE_COMMUNITIES: 'PLATFORM_MANAGE_COMMUNITIES',
    PLATFORM_MANAGE_APPS: 'PLATFORM_MANAGE_APPS',
    PLATFORM_MANAGE_ROLES: 'PLATFORM_MANAGE_ROLES',
    PLATFORM_MANAGE_USERS: 'PLATFORM_MANAGE_USERS',
    COMMUNITY_MANAGE_APPS: 'COMMUNITY_MANAGE_APPS',
    COMMUNITY_MANAGE_ROLES: 'COMMUNITY_MANAGE_ROLES',
    COMMUNITY_MANAGE_TOKENS: 'COMMUNITY_MANAGE_TOKENS',
    APP_MANAGE_ROLES: 'APP_MANAGE_ROLES',
    APP_MANAGE_USERS: 'APP_MANAGE_USERS',
    ACCESS_PRIVATE_KB: 'ACCESS_PRIVATE_KB',
};

const GUEST_ALLOWED_COMMANDS = [
    'find_communities', 'get_community_details', 'get_community', 'list_apps_for_community',
    'get_store_bundle', 'get_token_contract_addresses', 'fetch_my_purchases', 'log_content_event',
    'create_stripe_checkout_session', 'get_crypto_deposit_info', 'get_stripe_status',
    'powch_register_begin', 'powch_register_finish', 'powch_login_begin', 'powch_login_finish',
    'powch_write_wallet_begin', 'powch_send_verification_code', 'powch_verify_code',
    'powch_check_verification_proof', 'check_onboarding_status', 'register_powch_wallet_address',
    'get_token_purchase_info', 'get_token_price',
    'estimate_token_purchase', 'authenticate_by_signature', 'get_purchase_status',
    'get_crypto_price', 'get_all_crypto_prices', 'get_supported_chains', 'crypto_to_usd',
    'usd_to_crypto', 'create_crypto_quote', 'get_quote_status', 'get_claim_details',
    'auth_discord', 'auth_google', 'get_google_config', 'get_discord_config', 'get_stripe_config',
    'get_wallet_config', 'send_email_verification', 'verify_email_code', 'register_email_tos',
    'register_native_user', 'reconnect_by_wallet', 'login_wallet_session', 'device_request_login',
    'device_check_status', 'device_validate', 'device_complete', 'get_platform_holdings',
    'get_market_overview', 'get_user_nfts', 'get_pool_state', 'get_pool_liquidity',
    'submit_transaction', 'submit_meta_transaction',
    'get_pool_market_overview', 'get_price_history', 'get_pool_token_info', 'get_migration_status',
    'list_services', 'get_service', 'service_health_check', 'platform_health',
    'admin_bootstrap_login',
    // Internal platform command dispatched by Pub/Sub subscriber (discord-events-{env}).
    // The command is invoked only by trusted Pub/Sub messages published by
    // authCommands.unlink_auth_provider. Authorization is enforced at the transport
    // layer (Pub/Sub IAM) and, on the bot callback, by DESCIX_DISCORD_BOT_TOKEN.
    'revoke_discord_role',
    // Airdrop onboarding (pre-auth) — WS-ADMIN-B1 §1.1/§1.2, CEO-D-TOKEN-GATE-SEMANTICS.
    // Screen B runs BEFORE the user has a Powch vault/session. Server-side handler uses
    // the EVM address / EIP-191 signature for self-auth; _descix.user is null by design.
    // These mirror the Powch manifest `guestAllowed: true` entries and keep the SDK +
    // cloud-core mirrors consistent with apiFront's isExternalGuestCommand() lookup.
    'airdrop_check_pending',
    'airdrop_enqueue_migration'
];

function networkResponse(netStatus, authStatus, message) {
    const validAuthStatuses = Object.values(LoginStatus);
    const finalAuthStatus = validAuthStatuses.includes(authStatus) ? authStatus : LoginStatus.CONNECTED;
    if (typeof message === 'object' && message !== null && message.status) {
        if (message.status === NetworkStatus.ERROR) {
            return { status: NetworkStatus.ERROR, auth_status: finalAuthStatus, message: message.message, code: message.code };
        }
        if (message.status === NetworkStatus.OK) {
            return { status: NetworkStatus.OK, auth_status: finalAuthStatus, message: message.message || message };
        }
    }
    return { status: netStatus, auth_status: finalAuthStatus, message: message };
}

function stripInvalidAndLower(username) {
    const disallowed_chars = " #%&*+/=?^`{|}~";
    const trans = new RegExp(`[${disallowed_chars}]`, 'g');
    return username.replace(/ /g, "_").toLowerCase().replace(trans, "");
}

let _instance = null;
let _rootPath = null;

/**
 * Create or get CloudConfig singleton.
 * Call with rootPath before any other config access. rootPath is the directory
 * containing .env, defaults-config.json, dev-overrides.json.
 * @param {{ rootPath: string }} options
 * @returns {CloudConfig}
 */
export function createCloudConfig(options = {}) {
    const rootPath = options.rootPath ? path.resolve(options.rootPath) : null;
    if (_instance) {
        return _instance;
    }
    if (!rootPath) {
        throw new Error('[CloudConfig] rootPath is required on first call: createCloudConfig({ rootPath: "path/to/app" })');
    }
    _rootPath = rootPath;
    _instance = new CloudConfig(rootPath);
    return _instance;
}

/**
 * Get the current CloudConfig instance (must have been created via createCloudConfig).
 */
export function getCloudConfig() {
    if (!_instance) {
        throw new Error('[CloudConfig] Must call createCloudConfig({ rootPath }) before getCloudConfig()');
    }
    return _instance;
}

class CloudConfig {
    constructor(rootPath) {
        this.__rootPath = path.resolve(rootPath);
        this.__appDir = this.__rootPath;
        this.__servicesDir = path.resolve(this.__appDir, 'services');

        if (process.env.DEPLOY_ENV !== 'production') {
            dotenv.config({ path: path.resolve(this.__appDir, '.env'), override: false });
        } else {
            console.log("Running in production mode. Skipping .env file load.");
        }

        this._loadBootstrapKeys();

        this.secretClient = null;
        this.__googleApplicationCredentials = null;
        this.DAITA_ABI = null;

        this._loadDefaults();

        this.__port = process.env.PORT || this.LOCAL_PORT || this.DEFAULT_PORT;
        this.PORT = this.__port;
        console.log("[Config] PORT:", this.__port);
    }

    get expressPort() { return this.__port; }

    get expressOptions() {
        if (this.DEBUG_LOCAL) {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
            try {
                return {
                    key: fs.readFileSync(path.resolve(this.__appDir, 'key.pem')),
                    cert: fs.readFileSync(path.resolve(this.__appDir, 'cert.pem')),
                };
            } catch (e) {
                console.warn("[Config] SSL certs not found, continuing without HTTPS options locally");
                return {};
            }
        }
        return {};
    }

    get appDir() { return this.__appDir; }
    get servicesDir() { return this.__servicesDir; }
    servicesFilePath(filename) { return path.resolve(this.__servicesDir, filename); }
    get HTTP_WORKER() { return this.servicesFilePath('httpWorker.js'); }
    get isDebug() { return this.DEBUG_PROXY || this.DEPLOY_ENV === 'dev'; }

    get GOOGLE_APPLICATION_CREDENTIALS() {
        return this.__googleApplicationCredentials;
    }

    formatString(template, replacements) {
        return template.replace(/{(\w+)}/g, (match, key) => replacements[key] || match);
    }

    generateGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    _loadBootstrapKeys() {
        const { bootstrap_keys, boolean_keys } = configSchema;
        
        // 1. Load from process.env first (Production priority)
        bootstrap_keys.keys.forEach(key => {
            const value = process.env[key];
            if (value !== undefined) {
                this[key] = boolean_keys.keys.includes(key) ? value === 'true' : value;
                console.log(`[Config] Bootstrap (Env) ${key}=${this[key]}`);
            }
        });

        // 2. Fallback to workspace.json (Local Dev priority)
        // Only if DEPLOY_ENV is not set by environment
        if (!this.DEPLOY_ENV) {
            this._tryLoadWorkspaceConfig();
        }

        // 3. Set derived values
        if (process.env.DEPLOY_ENV) this.DEPLOY_ENV = process.env.DEPLOY_ENV;
        if (process.env.DEBUG_LOCAL !== undefined) this.DEBUG_LOCAL = process.env.DEBUG_LOCAL === 'true';
        if (process.env.LOCAL_PORT) this.LOCAL_PORT = process.env.LOCAL_PORT;
        if (process.env.SERVICE_PROXY_HOST) this.SERVICE_PROXY_HOST = process.env.SERVICE_PROXY_HOST;
    }

    _tryLoadWorkspaceConfig() {
        try {
            // Walk up to find .descix/workspace.json
            let currentDir = this.__appDir;
            let workspacePath = null;
            for (let i = 0; i < 5; i++) {
                const checkPath = path.resolve(currentDir, '.descix/workspace.json');
                if (fs.existsSync(checkPath)) {
                    workspacePath = checkPath;
                    break;
                }
                const parent = path.dirname(currentDir);
                if (parent === currentDir) break;
                currentDir = parent;
            }

            if (workspacePath) {
                const workspace = JSON.parse(fs.readFileSync(workspacePath, 'utf8'));
                if (workspace.env?.environment === 'DEV') {
                    console.log('[Config] Auto-detected DEV workspace from', workspacePath);
                    this.DEPLOY_ENV = 'dev';
                    this.DEBUG_LOCAL = true;
                    this.CONFIG_SECRET_NAME = 'descix_config_dev';
                    this.CONFIG_SECRET_VERSION = 'latest';

                    // Auto-detect port from workspace apps (v2.1 format)
                    this._autoDetectPort(workspace);
                }
            }
        } catch (e) {
            // Ignore errors in production/CI where workspace.json might be missing
        }
    }

    /**
     * Derive the Secret Manager version alias for shared secrets (elevated_credentials_descix,
     * daita_contract_abi) that still use per-env aliases on a single secret.
     * Per-env config secrets (descix_config_dev, descix_config_demo) use 'latest' as their
     * version, but shared secrets continue to use env-specific aliases.
     */
    _getElevatedSecretVersion() {
        if (this.CONFIG_SECRET_VERSION !== 'latest') return this.CONFIG_SECRET_VERSION;
        return this.DEPLOY_ENV.toUpperCase();
    }

    _autoDetectPort(workspace) {
        // Match current directory to an app in workspace (v2.1 format: env.platform + env.products[])
        try {
            const wsRoot = workspace.workspaceRoot || path.dirname(path.dirname(this.__rootPath));
            const entries = [];

            // Platform entry
            if (workspace.env?.platform) {
                entries.push(workspace.env.platform);
            }
            // Product entries
            if (Array.isArray(workspace.env?.products)) {
                entries.push(...workspace.env.products);
            }

            for (const entry of entries) {
                if (!entry.localPath || !entry.microservice?.port) continue;
                const entryAbs = path.resolve(wsRoot, entry.localPath);
                // Match if __appDir is the entry root or its microservice subdirectory
                if (this.__appDir === entryAbs ||
                    this.__appDir === path.resolve(entryAbs, 'microservice') ||
                    this.__appDir.endsWith(entry.localPath) ||
                    this.__appDir.endsWith(entry.localPath + '/microservice')) {
                    this.LOCAL_PORT = entry.microservice.port;
                    console.log(`[Config] Auto-detected port ${this.LOCAL_PORT} for ${entry.appId || 'platform'} from workspace`);
                    return;
                }
            }
        } catch (e) {
            // Ignore path resolution errors
        }
    }

    _mergeConfig(config) {
        const { boolean_keys } = configSchema;
        for (const [key, value] of Object.entries(config)) {
            if (key.startsWith('_')) continue;
            if (this[key] === undefined || this[key] === null) {
                this[key] = boolean_keys.keys.includes(key) && typeof value === 'string'
                    ? value === 'true'
                    : value;
            }
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
                const overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
                console.log('[Config] Applying dev-overrides.json');
                // Force-assign: dev-overrides must win over Secret Manager
                const { boolean_keys } = configSchema;
                for (const [key, value] of Object.entries(overrides)) {
                    if (key.startsWith('_')) continue;
                    if (value === null) continue; // null in dev-overrides means "don't override"
                    console.log(`[Config] Dev override from JSON: ${key}`);
                    this[key] = boolean_keys.keys.includes(key) && typeof value === 'string'
                        ? value === 'true'
                        : value;
                }
            } catch (e) {
                console.error('[Config] Error loading dev-overrides.json:', e.message);
            }
        }
        const { boolean_keys, dev_override_keys } = configSchema;
        dev_override_keys.keys.forEach(key => {
            const envValue = process.env[key];
            if (envValue !== undefined) {
                console.log(`[Config] Dev override from .env: ${key}`);
                this[key] = boolean_keys.keys.includes(key) ? envValue === 'true' : envValue;
            }
        });
    }

    async accessSecretVersion(secretname, tag) {
        if (!tag) tag = 'DEV';
        if (!this.secretClient) this.secretClient = new SecretManagerServiceClient();
        const name = `projects/${this.GOOGLE_PROJECT_ID}/secrets/${secretname}/versions/${tag}`;
        const [version] = await this.secretClient.accessSecretVersion({ name });
        return version.payload.data.toString('utf8');
    }

    async initialize() {
        if (!this.DEPLOY_ENV) {
            throw new Error('[CloudConfig] FATAL: DEPLOY_ENV not set. Cannot determine environment before Secret Manager call. Provide DEPLOY_ENV via .env (local dev), deployment env vars (cloud deploy), or ensure .descix/workspace.json is reachable from the service root.');
        }

        const auth = new GoogleAuth();
        this.GOOGLE_PROJECT_ID = await auth.getProjectId();
        console.error("***** INITIALIZING Project ID: ", this.GOOGLE_PROJECT_ID);

        if (!this.GEMINI_API_KEY && this.CONFIG_SECRET_NAME) {
            try {
                const secretPayload = await this.accessSecretVersion(
                    this.CONFIG_SECRET_NAME,
                    this.CONFIG_SECRET_VERSION
                );
                this._mergeConfig(JSON.parse(secretPayload));
                console.log(`[Config] Loaded from Secret Manager: ${this.CONFIG_SECRET_NAME}`);
            } catch (error) {
                throw new Error(`[CloudConfig] Secret Manager failed for ${this.CONFIG_SECRET_NAME}/${this.CONFIG_SECRET_VERSION}: ${error.message}`);
            }

            this._loadDevOverrides();

            if (this.DEBUG_LOCAL && this.DEBUG_STREAMING && !this.DEBUG_PROXY) {
                this.DISCORD_BOT_URL = `https://localhost:${this.__port}`;
            }

            const shouldLoadElevated = this.REQUIRE_ELEVATED_CREDS === true ||
                (this.REQUIRE_ELEVATED_CREDS === null && this.CONTRACT_SECRET_NAME);

            if (shouldLoadElevated) {
                try {
                    // Shared secrets (elevated_credentials, contract ABI) still use env-specific
                    // aliases on a single secret, unlike the per-env descix_config_{env} pattern.
                    const elevatedVersion = this._getElevatedSecretVersion();
                    if (!this.__googleApplicationCredentials) {
                        const serviceAccountFileStr = await this.accessSecretVersion('elevated_credentials_descix', elevatedVersion);
                        this.__googleApplicationCredentials = JSON.parse(serviceAccountFileStr);
                        console.log('[Config] Loaded Elevated Credentials');
                    }
                    if (process.env.CONTRACT_SECRET_NAME) {
                        const abiSecret = await this.accessSecretVersion(process.env.CONTRACT_SECRET_NAME, elevatedVersion);
                        this.DAITA_ABI = JSON.parse(abiSecret);
                        console.log('[Config] Loaded Contract ABI');
                    }
                } catch (e) {
                    console.error('[Config] Failed to load elevated credentials:', e.message);
                }
            }

            // PUB_SUB_DISCORD_BOT_REPLY is set as a complete topic name per-env
            // via deploy script --set-env-vars (bootstrap key). No suffix appending needed.
        }
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function initializeCloudConfig() {
    const config = getCloudConfig();
    let backoff = 1000;
    const maxBackoff = 180000;
    while (true) {
        try {
            await config.initialize();
            return config;
        } catch (error) {
            console.error('Error initializing CloudConfig:', error, `Retrying in ${backoff / 1000} seconds...`);
            await delay(backoff);
            backoff = Math.min(backoff * 2, maxBackoff);
        }
    }
}

export {
    ProductTypes,
    LoginStatus,
    NetworkStatus,
    PERMISSIONS,
    GUEST_ALLOWED_COMMANDS,
    networkResponse,
    stripInvalidAndLower,
};
