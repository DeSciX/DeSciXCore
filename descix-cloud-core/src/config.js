/**
 * CloudConfig - Universal Service Configuration
 * Shared bootstrap for DeSciX platform microservices (Core, Powch, Discord, etc.)
 *
 * Uses rootPath to resolve .env, defaults-config-{env}.json, defaults-config.json,
 * dev-overrides.json. Loads from Secret Manager via config-schema.json key definitions.
 *
 * Bootstrap precedence (highest → lowest), WS-CONFIG-ARCH Phase 1:
 *   1. process.env                    — bootstrap keys (_loadBootstrapKeys)
 *   2. defaults-config-{env}.json     — per-env NON-SECRET config (_loadEnvDefaults)
 *   3. defaults-config.json           — env-invariant NON-SECRET base (_loadDefaults)
 *   4. Secret Manager                 — SECRETS ONLY (_mergeConfig in initialize())
 *   + dev only: dev-overrides.json + .env FORCE-WIN over all the above for keys in
 *     config-schema.json dev_override_keys (_loadDevOverrides).
 * Merge is first-write-wins (_mergeConfig), so more-specific layers load FIRST.
 * "Secret Manager is for secrets only" — non-secret per-env config belongs in the
 * defaults-config-{env}.json layer, not in descix_config_{env} (CEO-D-2026-05-30-
 * CONFIG-ARCHITECTURE-DEFAULTS-PER-ENV). No hardcoded fallbacks: a missing required
 * key raises CloudConfigFatalError at boot (_assertRequiredKeys).
 *
 * WS-CONFIG-BOOTSTRAP-FIX item #2: required_keys enforcement at end of initialize().
 * WS-CONFIG-BOOTSTRAP-FIX item #11: dev file-watcher + boot-time SHA drift check.
 */

import { fileURLToPath } from 'url';
import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';
import path from 'path';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import fs from 'fs';
import crypto from 'crypto';
import { EventEmitter } from 'events';
import { createRequire } from 'module';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const configSchemaPath = path.resolve(__dirname, '../config-schema.json');
const configSchema = require(configSchemaPath);

/**
 * Non-retryable fatal error for CloudConfig bootstrap. Distinct from the
 * generic Errors thrown for transient causes (Secret Manager network blips,
 * GoogleAuth project resolution) — those are caught by initializeCloudConfig()
 * and retried with backoff. A CloudConfigFatalError signals a misconfiguration
 * that NO amount of retry will fix (missing required key on disk, schema gap).
 * The retry wrapper rethrows this class without backoff so the process exits
 * immediately and operators see the loud failure that `feedback_no_hardcoded_fallbacks`
 * mandates.
 */
export class CloudConfigFatalError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CloudConfigFatalError';
    }
}

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
    // WS-ADMIN-B1 §3.1 — Signature-gated any-token gate. Internally verifies EIP-191
    // signature against supplied wallet_address before consulting holdings. Adding to
    // guest allowlist so Powch's server-to-server loopback (from descix_accept_tos
    // airdrop-PK path) can reach it without propagating the user's session token back
    // across the Powch→Cloud boundary. Safe because the signature IS the authN; the
    // optional user_id param only extends the check to pending_migrations and does not
    // grant impersonation. See docs/design/ws-admin-b1-ceo-walkthrough.md bug fix.
    'confirm_wallet_any_registered_token'
    // T-FLOW-PASSKEY-FIRST Chunk 6 — airdrop_check_pending + airdrop_enqueue_migration
    // REMOVED from guest allowlist. See AppData.jsx comment + Powch manifest flip.
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
    // additionalRequiredKeys: per-service required keys NOT in the shared schema's
    // required_keys (which applies to every cloud-core consumer). e.g. Powch requires
    // CORE_API_URL for its Cloud loopback, but the Cloud service does not — so it
    // cannot live in the global schema. Enforced at boot by _assertRequiredKeys.
    _instance = new CloudConfig(rootPath, options.additionalRequiredKeys || []);
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

/**
 * TEST-ONLY: reset the singleton so anti-regression tests can construct a fresh
 * instance against a temp-dir rootPath. Production code MUST NOT call this.
 */
export function _resetCloudConfigForTests() {
    // CEO-D-2026-06-01-RAG-PATHJOIN-GUARD isolation guardrail: the org RAG read path
    // went down because a config negative-test nulled STORAGE_BUCKET in the LIVE
    // in-memory singleton and only restored the file. Resetting/mutating the config
    // singleton inside a running service is the footgun. Refuse unless we are clearly
    // in a test process (node:test sets NODE_TEST_CONTEXT) or the caller explicitly
    // opts in. A live service NEVER sets these — so this hard-fails the dangerous path
    // instead of silently corrupting a running backend.
    const inTestProcess = !!process.env.NODE_TEST_CONTEXT
        || !!process.env.DESCIX_ALLOW_CONFIG_RESET
        || (Array.isArray(process.execArgv) && process.execArgv.some(a => a === "--test" || a.startsWith("--test")))
        || process.argv.includes("--test");
    if (!inTestProcess) {
        throw new Error(
            "[CloudConfig] _resetCloudConfigForTests() called outside a test process. " +
            "Resetting the config singleton in a live service nulls config (e.g. STORAGE_BUCKET) " +
            "in-memory and takes down the RAG read path (CEO-D-2026-06-01-RAG-PATHJOIN-GUARD). " +
            "Run config negative-tests in an ISOLATED `node --test` process, or set " +
            "DESCIX_ALLOW_CONFIG_RESET=1 only in a context where corrupting the singleton is intended."
        );
    }
    if (_instance && _instance.__watcher) {
        try {
            // chokidar's close() returns a Promise. We deliberately do NOT await it
            // here — the test harness only needs the watcher to stop firing further
            // callbacks; pending close I/O can settle in the background. Awaiting
            // would force every test caller to become async-aware purely for cleanup.
            _instance.__watcher.close();
        } catch (_) { /* ignore */ }
        _instance.__watcher = null;
    }
    _instance = null;
    _rootPath = null;
}

class CloudConfig {
    constructor(rootPath, additionalRequiredKeys = []) {
        this.__rootPath = path.resolve(rootPath);
        this.__appDir = this.__rootPath;
        this.__servicesDir = path.resolve(this.__appDir, 'services');

        // Per-service required keys layered on top of the shared schema's
        // required_keys. Enforced in _assertRequiredKeys.
        this.__additionalRequiredKeys = Array.isArray(additionalRequiredKeys) ? additionalRequiredKeys : [];

        // Internal EventEmitter for config:reloaded events. We do NOT extend
        // EventEmitter directly because CloudConfig dynamically assigns config keys
        // as instance properties (this[key] = value in _mergeConfig) — extending
        // would risk name collisions with EE's prototype methods (on, emit, _events,
        // etc.). The composition pattern keeps the public surface intact.
        this.__emitter = new EventEmitter();

        // Drift-detection state (item #11 / option 2.B.3).
        this.__defaults_config_sha = null;
        this.__defaults_config_path = null;
        this.__drift_check_counter = 0;
        // Sampling N: every Nth request triggers checkDefaultsDrift(). N=100 chosen so
        // a 1-rps service detects drift within ~100s, a 100-rps service within ~1s.
        // No external dep, no auto-reload — drift just warns; operators must restart
        // (or, in dev, rely on the file-watcher in option 2.B.1).
        this.__drift_sample_n = 100;

        // Watcher state (item #11 / option 2.B.1).
        this.__watcher = null;
        // 250ms stability window. chokidar's awaitWriteFinish coalesces the
        // rename+change burst from editor atomic-saves into a single callback,
        // replacing the manual setTimeout debounce used by the old fs.watch impl.
        this.__watch_debounce_ms = 250;

        if (process.env.DEPLOY_ENV !== 'prod') {
            dotenv.config({ path: path.resolve(this.__appDir, '.env'), override: false });
        } else {
            console.log("Running in prod. Skipping .env file load.");
        }

        this._loadBootstrapKeys();

        this.secretClient = null;
        this.__googleApplicationCredentials = null;
        this.DAITA_ABI = null;

        // WS-CONFIG-ARCH Phase 1 — per-env config layer.
        // Loads defaults-config-{DEPLOY_ENV}.json BEFORE the env-invariant
        // defaults-config.json. Because _mergeConfig is first-write-wins, the
        // env-specific layer WINS over the base file. Both still load in the
        // constructor (before Secret Manager runs in initialize()), preserving
        // the existing disk-before-Secret-Manager semantics. DEPLOY_ENV is
        // already resolved here: from process.env (cloud) or workspace.json
        // (dev, via _tryLoadWorkspaceConfig inside _loadBootstrapKeys). If
        // DEPLOY_ENV is unset, this is a no-op (no hardcoded env fallback).
        this._loadEnvDefaults();

        this._loadDefaults();

        this.__port = process.env.PORT || this.LOCAL_PORT || this.DEFAULT_PORT;
        this.PORT = this.__port;
        console.log("[Config] PORT:", this.__port);
    }

    /**
     * Subscribe to config events. Currently emits:
     *   - 'config:reloaded' with { changedKeys: string[] } when the dev file-watcher
     *     detects + applies a defaults-config.json change.
     */
    on(event, listener) {
        this.__emitter.on(event, listener);
        return this;
    }

    /**
     * Unsubscribe a listener.
     */
    off(event, listener) {
        this.__emitter.off(event, listener);
        return this;
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
        const env = (this.DEPLOY_ENV || '').toLowerCase();
        // Shared elevated_credentials_descix uses the LIVE alias for prod; no PROD alias exists.
        if (env === 'prod') return 'LIVE';
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

    /**
     * WS-CONFIG-ARCH Phase 1 — load the per-environment defaults layer.
     *
     * Reads `defaults-config-{DEPLOY_ENV}.json` from the service root and merges
     * it via the same first-write-wins _mergeConfig path used by _loadDefaults().
     * This method MUST be called BEFORE _loadDefaults() so the env-specific layer
     * wins over the env-invariant base file.
     *
     * Full bootstrap precedence (highest → lowest):
     *   1. process.env                       (_loadBootstrapKeys, constructor)
     *   2. defaults-config-{env}.json        (this method, constructor)
     *   3. defaults-config.json              (_loadDefaults, constructor)
     *   4. Secret Manager (secrets ONLY)     (_mergeConfig in initialize())
     *   + In dev only, dev-overrides.json and .env FORCE-WIN over all of the
     *     above for keys listed in config-schema.json dev_override_keys
     *     (_loadDevOverrides, after Secret Manager).
     *
     * No hardcoded fallbacks: if DEPLOY_ENV is unset or the file is absent, this
     * is a no-op. A required key that ends up null is caught by _assertRequiredKeys
     * and raises CloudConfigFatalError at boot (anti-pattern #7 — fail loud).
     */
    _loadEnvDefaults() {
        if (!this.DEPLOY_ENV) {
            // DEPLOY_ENV not yet known (e.g. cloud deploy that sets it via env vars
            // but somehow not present, or a non-workspace local run). No env layer
            // to load — do NOT guess an environment. _assertRequiredKeys will catch
            // any resulting null required key loudly.
            return;
        }
        const envDefaultsPath = path.resolve(this.__appDir, `defaults-config-${this.DEPLOY_ENV}.json`);
        if (!fs.existsSync(envDefaultsPath)) {
            console.log(`[Config] No per-env defaults file at ${envDefaultsPath} — skipping env layer.`);
            return;
        }
        try {
            const raw = fs.readFileSync(envDefaultsPath, 'utf8');
            const parsed = JSON.parse(raw);
            this._mergeConfig(parsed);
            const sha = crypto.createHash('sha256').update(raw).digest('hex');
            console.log(`[Config] Loaded defaults-config-${this.DEPLOY_ENV}.json (sha256=${sha.slice(0, 12)}…) — env layer wins over base defaults.`);
        } catch (e) {
            console.error(`[Config] Error loading defaults-config-${this.DEPLOY_ENV}.json:`, e.message);
        }
    }

    _loadDefaults() {
        const defaultsPath = path.resolve(this.__appDir, 'defaults-config.json');
        this.__defaults_config_path = defaultsPath;
        if (fs.existsSync(defaultsPath)) {
            try {
                // Read raw bytes so we can compute a stable SHA — JSON.parse + re-stringify
                // would normalize whitespace/key order and detect spurious "drift".
                const raw = fs.readFileSync(defaultsPath, 'utf8');
                const parsed = JSON.parse(raw);
                this._mergeConfig(parsed);
                this.__defaults_config_sha = crypto.createHash('sha256').update(raw).digest('hex');
                // Boot snapshot of the parsed disk defaults — used by _reloadDefaults
                // to diff disk-vs-disk (NOT disk-vs-merged-singleton). This is the only
                // way to avoid overwriting Secret-Manager-supplied values with their
                // disk-null placeholders on a benign on-disk edit.
                this.__defaults_config_snapshot = parsed;
                console.log(`[Config] Loaded defaults-config.json (sha256=${this.__defaults_config_sha.slice(0, 12)}…)`);
            } catch (e) {
                console.error('[Config] Error loading defaults-config.json:', e.message);
            }
        }
    }

    /**
     * Boot-time SHA + sampled drift check (item #11 / option 2.B.3).
     * Re-reads defaults-config.json, computes SHA, compares to the SHA captured at
     * boot. If different, log a warning. Does NOT auto-reload — that is the dev
     * file-watcher's job (option 2.B.1). On cloud/Cloud-Functions deploys, the
     * watcher does not run; this warn is the only freshness signal, and operators
     * must redeploy/restart to pick up the change.
     */
    checkDefaultsDrift() {
        if (!this.__defaults_config_path || !this.__defaults_config_sha) return;
        try {
            const raw = fs.readFileSync(this.__defaults_config_path, 'utf8');
            const currentSha = crypto.createHash('sha256').update(raw).digest('hex');
            if (currentSha !== this.__defaults_config_sha) {
                console.warn(
                    `[CloudConfig] WARN: defaults-config.json on-disk SHA changed since boot ` +
                    `(boot=${this.__defaults_config_sha.slice(0, 12)}…, current=${currentSha.slice(0, 12)}…). ` +
                    `Service is serving stale config; restart to pick up changes.`
                );
            }
        } catch (e) {
            console.warn(`[CloudConfig] checkDefaultsDrift: re-read failed: ${e.message}`);
        }
    }

    /**
     * Sampling hook for HTTP middlewares. Call on every request; this method
     * triggers checkDefaultsDrift() every Nth invocation (N = __drift_sample_n).
     */
    sampleDriftCheck() {
        this.__drift_check_counter = (this.__drift_check_counter + 1) % this.__drift_sample_n;
        if (this.__drift_check_counter === 0) {
            this.checkDefaultsDrift();
        }
    }

    /**
     * Dev-only file watcher (item #11 / option 2.B.1). Watches defaults-config.json
     * and hot-reloads changed top-level keys into the singleton. Emits 'config:reloaded'.
     *
     * Uses chokidar (not fs.watch) because macOS's fs.watch detaches when the
     * watched file is replaced via inode swap — which is exactly how vim, VS Code
     * (default), and `jq + mv` atomically save. After such a save, subsequent
     * edits silently stop firing HOT-RELOAD. chokidar handles atomic-replace by
     * watching the parent directory and re-attaching on rename automatically.
     *
     * Cloud Functions don't have persistent watchers; this is a no-op outside dev.
     */
    _startConfigWatcher() {
        if (this.DEPLOY_ENV !== 'dev') return;
        if (!this.__defaults_config_path || !fs.existsSync(this.__defaults_config_path)) return;
        if (this.__watcher) return; // already armed

        const watchPath = this.__defaults_config_path;
        try {
            // atomic: true               — detect editor "tmp + rename" atomic saves
            // awaitWriteFinish (250ms)   — coalesce multi-event saves into ONE callback;
            //                              replaces the manual setTimeout debounce that
            //                              fs.watch needed. Keeps the same effective
            //                              debounce semantics (__watch_debounce_ms) so
            //                              tests can still tune via the field.
            // ignoreInitial: true        — don't fire on the synthetic 'add' that
            //                              chokidar emits when first attaching.
            this.__watcher = chokidar.watch(watchPath, {
                atomic: true,
                awaitWriteFinish: {
                    stabilityThreshold: this.__watch_debounce_ms,
                    pollInterval: 50,
                },
                ignoreInitial: true,
            });
            const onChange = (eventType) => {
                // chokidar already coalesces via awaitWriteFinish; we just call through.
                this._reloadDefaults(eventType);
            };
            this.__watcher.on('change', () => onChange('change'));
            // 'add' fires when the file reappears after atomic-rename (inode swap).
            // Treat it identically to 'change' so HOT-RELOAD survives editor saves.
            this.__watcher.on('add', () => onChange('add'));
            this.__watcher.on('error', (err) => {
                console.warn(`[CloudConfig] file-watcher error: ${err.message}`);
            });
        } catch (e) {
            console.warn(`[CloudConfig] failed to arm file-watcher: ${e.message}`);
            return;
        }

        console.log(`[CloudConfig] dev file-watcher armed on defaults-config.json (chokidar, awaitWriteFinish=${this.__watch_debounce_ms}ms)`);
    }

    /**
     * Re-read defaults-config.json and apply diffs into the singleton.
     * Handles mid-write race by retrying once after 100ms on parse failure.
     */
    _reloadDefaults(triggerEvent, _retry = false) {
        try {
            const raw = fs.readFileSync(this.__defaults_config_path, 'utf8');
            const fresh = JSON.parse(raw);
            const newSha = crypto.createHash('sha256').update(raw).digest('hex');
            if (newSha === this.__defaults_config_sha) {
                // Identical content (e.g., editor wrote+restored the same bytes). Skip.
                return;
            }

            // Diff against the BOOT-DISK SNAPSHOT, not the merged singleton. The
            // singleton contains values from Secret Manager + dev-overrides that have
            // no representation on disk; comparing against `this[key]` would falsely
            // flag every Secret-Manager-supplied key whose disk-side is null as a
            // "change" and clobber the Secret Manager value with null on reload.
            // The correct semantic: if disk value changed (snapshot vs fresh), apply.
            // If disk value is unchanged (still null, still old non-null), leave alone.
            const snapshot = this.__defaults_config_snapshot || {};
            const changedKeys = [];
            const formatVal = (v) => {
                if (v === null) return 'null';
                if (v === undefined) return 'undefined';
                if (typeof v === 'object') {
                    const j = JSON.stringify(v);
                    return j.length > 80 ? j.slice(0, 77) + '...' : j;
                }
                return JSON.stringify(v);
            };
            for (const [key, newVal] of Object.entries(fresh)) {
                if (key.startsWith('_')) continue;
                const snapVal = snapshot[key];
                // Deep-compare via JSON.stringify covers INTELLIGENCE_LEVELS object diffs.
                if (JSON.stringify(snapVal) === JSON.stringify(newVal)) continue;
                // Disk value genuinely changed. Apply to singleton.
                const prev = this[key];
                console.log(`[CloudConfig] HOT-RELOAD: ${key} changed from ${formatVal(prev)} to ${formatVal(newVal)}`);
                this[key] = newVal;
                changedKeys.push(key);
            }
            // Also handle keys REMOVED from disk (present in snapshot, absent in fresh).
            for (const key of Object.keys(snapshot)) {
                if (key.startsWith('_')) continue;
                if (key in fresh) continue;
                // Key was on disk at boot, no longer on disk. We do NOT clear the
                // singleton — Secret Manager / dev-overrides may legitimately own it
                // now. Warn so the operator notices.
                console.warn(`[CloudConfig] HOT-RELOAD: key ${key} was removed from defaults-config.json. Singleton value (${formatVal(this[key])}) NOT cleared — restart to re-derive precedence.`);
            }

            this.__defaults_config_sha = newSha;
            this.__defaults_config_snapshot = fresh;
            if (changedKeys.length > 0) {
                this.__emitter.emit('config:reloaded', { changedKeys });
            }
        } catch (e) {
            if (!_retry) {
                // File may be mid-write (editor atomic-save mid-rename). Retry once.
                setTimeout(() => this._reloadDefaults(triggerEvent, true), 100);
                return;
            }
            console.warn(`[CloudConfig] hot-reload re-read failed (after retry): ${e.message}`);
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

    /**
     * Enforce required_keys at end of bootstrap. Throws CloudConfigFatalError if any
     * key in config-schema.json's required_keys.keys resolves to undefined or null.
     * This is the loud boot failure mandated by `feedback_no_hardcoded_fallbacks`:
     * surface misconfiguration immediately rather than silently degrade at request time.
     */
    _assertRequiredKeys() {
        const { required_keys } = configSchema;
        const schemaKeys = (required_keys && Array.isArray(required_keys.keys)) ? required_keys.keys : [];
        // Union of shared-schema required keys and any per-service required keys
        // supplied via createCloudConfig({ additionalRequiredKeys }).
        const allRequired = [...new Set([...schemaKeys, ...this.__additionalRequiredKeys])];
        if (allRequired.length === 0) return;
        const missing = allRequired.filter(k => this[k] === undefined || this[k] === null);
        if (missing.length > 0) {
            throw new CloudConfigFatalError(
                `[CloudConfig] FATAL: required keys are unset after bootstrap: ${missing.join(', ')}. ` +
                `Set NON-SECRET per-env values in microservice/defaults-config-{env}.json (recommended), ` +
                `env-invariant values in defaults-config.json, or true secrets in Secret Manager. ` +
                `Schema: descix-cloud-core/config-schema.json required_keys ` +
                `(+ per-service additionalRequiredKeys passed to createCloudConfig).`
            );
        }
    }

    async initialize() {
        if (!this.DEPLOY_ENV) {
            throw new CloudConfigFatalError('[CloudConfig] FATAL: DEPLOY_ENV not set. Cannot determine environment before Secret Manager call. Provide DEPLOY_ENV via .env (local dev), deployment env vars (cloud deploy), or ensure .descix/workspace.json is reachable from the service root.');
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
                        // DEPRECATED: greenfield-bootstrap-only path for root DeSciX community. Use chainStorageUtils.getContractAbi() / getContractAddressBySymbol() / admin-supplied PK for active code. — CEO-D 2026-04-28
                        // Active B1 broadcast path no longer reads utils.DAITA_ABI; this loader is retained
                        // only for greenfield-bootstrap of the root DeSciX community where descix-chain
                        // Contracts/{address} is not yet populated.
                        const abiSecret = await this.accessSecretVersion(process.env.CONTRACT_SECRET_NAME, elevatedVersion);
                        this.DAITA_ABI = JSON.parse(abiSecret);
                        console.log('[Config] Loaded Contract ABI (DEPRECATED greenfield-bootstrap-only)');
                    }
                } catch (e) {
                    console.error('[Config] Failed to load elevated credentials:', e.message);
                }
            }

            // PUB_SUB_DISCORD_BOT_REPLY is set as a complete topic name per-env
            // via deploy script --set-env-vars (bootstrap key). No suffix appending needed.
        }

        // WS-CONFIG-BOOTSTRAP-FIX item #2: enforce required_keys at end of bootstrap.
        // Must be the last action — runs AFTER Secret Manager + dev-overrides so any
        // source can satisfy a required key.
        this._assertRequiredKeys();

        // WS-CONFIG-BOOTSTRAP-FIX item #11 (2.B.1): arm dev file-watcher AFTER required_keys
        // passes. If the service fails to boot, no watcher is left running.
        this._startConfigWatcher();
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
            // CloudConfigFatalError signals a misconfiguration that NO retry will fix
            // (missing required key, DEPLOY_ENV unset). Rethrow immediately so the
            // process exits and operators see the loud failure. Generic Error (Secret
            // Manager network blips, GoogleAuth) continues to retry with backoff.
            if (error instanceof CloudConfigFatalError) {
                console.error('[CloudConfig] FATAL non-retryable error:', error.message);
                throw error;
            }
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
