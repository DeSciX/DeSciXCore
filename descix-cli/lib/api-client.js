/**
 * DeSciX HTTP-Only API Client
 *
 * Self-contained HTTP client for CLI/MCP.
 * No service imports - all communication via HTTP.
 * Uses WorkspaceConfig for workspace/config resolution.
 */

import path from 'path';
import axios from 'axios';
import { WorkspaceConfig } from './workspace-config.js';

export class DeSciXApiClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || null; // Will be loaded async
    this.credentials = null;
    this.workspaceRoot = options.workspaceRoot || null; // Set by initialize()
    this._workspaceConfig = null; // Cached WorkspaceConfig
    this._initialized = false;
    // serviceMode: a headless service-context client (an app microservice reusing this
    // api-client to call /apifront AS the developer). It NEVER falls back to interactive
    // device login on a 401 — a Cloud Run service has no TTY — it hard-fails instead.
    this.serviceMode = options.serviceMode === true;
  }

  /**
   * Initialize the client by finding workspace root and loading config
   * This is the primary initialization method - call before any API operations
   *
   * Uses WorkspaceConfig for unified path resolution.
   *
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this._initialized) {
      return;
    }

    // Step 1: Try to load WorkspaceConfig (finds .descix/workspace.json upward)
    this._workspaceConfig = await WorkspaceConfig.tryLoad();

    if (this._workspaceConfig) {
      this.workspaceRoot = this._workspaceConfig.getWorkspaceRoot();
    } else {
      this.workspaceRoot = null;
    }

    // Step 2: Set API URL from WorkspaceConfig or environment (only if not already set)
    if (!this.baseUrl) {
      this.baseUrl = await this.detectApiUrl();
    }

    // Step 3: Load credentials from known wallet location
    await this.loadCredentials();

    this._initialized = true;
  }

  /**
   * Detect API URL from workspace config or environment
   * @returns {Promise<string>} API base URL
   */
  async detectApiUrl() {
    const PRODUCTION_URL = 'https://descix.net';

    // Check environment variable first (highest priority)
    if (process.env.DESCIX_API_URL) {
      return process.env.DESCIX_API_URL;
    }

    // Use WorkspaceConfig if loaded (only if it has an explicit URL, not the production default)
    if (this._workspaceConfig) {
      const apiUrl = this._workspaceConfig.getApiUrl();
      if (apiUrl && apiUrl !== PRODUCTION_URL) {
        return apiUrl;
      }
    }

    // Check global config (set by `descix login --dev` or `descix config set-url`)
    try {
      const { GlobalConfig } = await import('./global-config.js');
      const gc = await GlobalConfig.load();
      if (gc.api_url && gc.api_url !== PRODUCTION_URL) return gc.api_url;
    } catch {}

    // Default to production
    return PRODUCTION_URL;
  }

  /**
   * Ensure client is initialized (workspace root found, config loaded)
   * @returns {Promise<void>}
   */
  async ensureInitialized() {
    if (!this._initialized) {
      await this.initialize();
    }
  }

  /**
   * Ensure baseUrl is loaded (calls initialize if needed)
   * @returns {Promise<string>} Base URL
   */
  async ensureBaseUrl() {
    await this.ensureInitialized();
    return this.baseUrl;
  }

  /**
   * WS-MCP-SURFACE-SPLIT §9 — IAM gating for the internal-only DEV apiFront function.
   *
   * The persistent admin-capable DEV endpoint (`apiFront-http-dev`) is deployed
   * `--no-allow-unauthenticated`, so Google Cloud Run IAM rejects any caller without a
   * valid Google-signed identity token (HTTP 403 before the request ever reaches the app).
   * The public LB origins (`*.descix.net`) and local dev (`localhost`/`127.0.0.1`) are NOT
   * IAM-gated — they front allow-unauthenticated functions or a self-signed local server.
   *
   * This predicate returns true ONLY for the raw Cloud Run / Cloud Functions origins
   * (`*.run.app`, `*.cloudfunctions.net`). When true, callers must add a Google identity
   * bearer token to clear the IAM layer. The CLI's own session credential still travels in
   * the request BODY for the app-level auth middleware — IAM and app-auth are two layers.
   *
   * @returns {boolean}
   */
  _isIamGatedOrigin() {
    if (!this.baseUrl) return false;
    let host;
    try {
      host = new URL(this.baseUrl).hostname;
    } catch {
      return false;
    }
    return host.endsWith('.run.app') || host.endsWith('.cloudfunctions.net');
  }

  /**
   * Mint a Google identity token (`aud` = the function origin) to clear Cloud Run IAM.
   *
   * Resolution order (durable across both deployment and developer contexts):
   *   1. google-auth-library `getIdTokenClient(audience)` — works when ADC is a SERVICE
   *      ACCOUNT (CI / Cloud Run / a configured SA key). This is the canonical, audience-
   *      scoped path. A user ADC cannot mint an audience-scoped ID token, so its headers
   *      come back WITHOUT an Authorization bearer — we detect that and fall through.
   *   2. `gcloud auth print-identity-token` — works for a developer's USER ADC (the local
   *      always-on case). The token is accepted by Cloud Run IAM when the principal holds
   *      `roles/run.invoker` (project owner/editor inherit it).
   *
   * Returns the `Authorization: Bearer <id_token>` value, or null if no identity is mintable
   * (caller then proceeds without it and surfaces the resulting 403 — no silent fallback).
   *
   * @param {string} audience - the function origin (scheme+host), the IAM token audience
   * @returns {Promise<string|null>}
   */
  async _mintIamBearer(audience) {
    // Path 1: service-account ADC via google-auth-library (audience-scoped).
    try {
      const { GoogleAuth } = await import('google-auth-library');
      const auth = new GoogleAuth();
      const client = await auth.getIdTokenClient(audience);
      const headers = await client.getRequestHeaders();
      const bearer = headers.Authorization || headers.authorization;
      if (bearer) return bearer;
      // No bearer => user ADC; fall through to gcloud.
    } catch (e) {
      console.error(`[ApiClient] google-auth-library ID token unavailable (${e.message}); trying gcloud.`);
    }

    // Path 2: developer user ADC via gcloud CLI.
    try {
      const { execFile } = await import('node:child_process');
      const { promisify } = await import('node:util');
      const run = promisify(execFile);
      const { stdout } = await run('gcloud', ['auth', 'print-identity-token'], { timeout: 30000 });
      const token = (stdout || '').trim();
      if (token) return `Bearer ${token}`;
    } catch (e) {
      console.error(`[ApiClient] gcloud identity token unavailable: ${e.message}`);
    }

    return null;
  }

  /**
   * Apply IAM auth to an axios config when the baseUrl is an internal IAM-gated origin.
   * No-op for localhost and public LB origins. Mutates and returns the config.
   * @param {Object} axiosConfig
   * @returns {Promise<Object>}
   */
  async _applyIamAuthIfNeeded(axiosConfig) {
    if (!this._isIamGatedOrigin()) return axiosConfig;
    const audience = new URL(this.baseUrl).origin;
    const bearer = await this._mintIamBearer(audience);
    if (bearer) {
      axiosConfig.headers = { ...(axiosConfig.headers || {}), Authorization: bearer };
    } else {
      console.error('[ApiClient] WARNING: IAM-gated origin but no identity token could be minted; expect HTTP 403.');
    }
    return axiosConfig;
  }

  /**
   * Build request body for API call
   * @param {string} command - Command name
   * @param {Object} params - Command parameters
   * @param {Object} credentials - Optional credentials override
   * @returns {Object} Request body
   */
  buildRequestBody(command, params = {}, credentials = null) {
    const creds = credentials || this.credentials || {};
    
    const requestBody = {
      command,
      params,
      user_id: creds.userId || null,
      access_token: creds.accessToken || null,
      wallet_address: creds.walletAddress || null,
      signature: creds.signature || null,
      guild_id: params.guild_id || null
    };

    if (params.streaming) {
      requestBody.streaming = true;
    }

    return requestBody;
  }

  /**
   * Ensure we have a valid session by calling reconnect_by_wallet if needed
   * This is called automatically before authenticated API calls
   * @returns {Promise<void>}
   */
  async ensureSession() {
    // If we already have an access token, assume it's valid (will retry if expired)
    if (this.credentials?.accessToken) {
      return;
    }
    
    // If we have wallet credentials but no session, get one via reconnect_by_wallet
    if (this.credentials?.walletAddress && this.credentials?.signature) {
      try {
        // Use invokeRaw to avoid session check recursion
        // We pass skipSessionCheck: true to invokeRaw to be extra safe
        const result = await this.invokeRaw('reconnect_by_wallet', {
          wallet_address: this.credentials.walletAddress,
          signature: this.credentials.signature
        }, null, { skipSessionCheck: true });
        
        if (result.status === 'OK' && result.message?.sessionInfo?.access_token) {
          this.credentials.accessToken = result.message.sessionInfo.access_token;
          // Also update userId if returned (in case it was missing)
          if (result.message.sessionInfo.id) {
            this.credentials.userId = result.message.sessionInfo.id;
          }
          
          // Save updated credentials to wallet file
          try {
            const { WalletFileManager } = await import('./wallet-file.js');
            const walletPath = await WalletFileManager.findWalletFile(this.workspaceRoot || process.cwd());
            if (walletPath) {
              const walletData = await WalletFileManager.loadWalletFile(walletPath);
              if (walletData) {
                walletData.sessionToken = this.credentials.accessToken;
                walletData.userId = this.credentials.userId;
                walletData.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                await WalletFileManager.saveWalletFile(walletPath, walletData);
              }
            }
          } catch (saveErr) {
            console.error('[ApiClient] Failed to save refreshed session to wallet file:', saveErr.message);
          }
        }
      } catch (error) {
        // If reconnect fails, continue anyway - the actual request will fail with proper error
        console.error('[ApiClient] Failed to create session via wallet:', error.message);
      }
    }
  }

  /**
   * Invoke a command via HTTP (raw, no session management)
   * Used internally for auth commands to avoid recursion
   * @param {string} command - Command name
   * @param {Object} params - Command parameters
   * @param {Object} credentials - Optional credentials override
   * @returns {Promise<Object>} Response data
   */
  async invokeRaw(command, params = {}, credentials = null, options = {}) {
    console.log(`[ApiClient] invoking ${command}...`);
    await this.ensureBaseUrl();
    console.log(`[ApiClient] Base URL: ${this.baseUrl}`);
    
    const requestBody = this.buildRequestBody(command, params, credentials);
    if (options.skipSessionCheck) {
      requestBody.access_token = null; // Force guest-like call for refresh
    }
    const url = `${this.baseUrl}/apifront/`;
    console.log(`[ApiClient] POST ${url}`);

    const axiosConfig = {
      headers: { 'Content-Type': 'application/json' },
      timeout: 300000
    };
    
    if (this.baseUrl.includes('localhost') || this.baseUrl.includes('127.0.0.1')) {
      const https = await import('https');
      axiosConfig.httpsAgent = new https.Agent({
        rejectUnauthorized: false
      });
    }

    // Clear Cloud Run IAM for the internal-only DEV apiFront function (no-op otherwise).
    await this._applyIamAuthIfNeeded(axiosConfig);

    try {
      const response = await axios.post(url, requestBody, axiosConfig);
      console.log(`[ApiClient] Response status: ${response.status}`);
      const data = response.data;
      
      if (data.status !== 'OK') {
        const error = new Error(data.message || 'API request failed');
        error.status = data.status;
        error.response = data;
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`[ApiClient] Error invoking ${command}:`, error.message);
      throw error;
    }
  }

  /**
   * WS-MCP-SURFACE-SPLIT §10.2 — fetch the PERMISSION-FILTERED MCP tool catalog for THIS caller.
   *
   * Calls the backend `list_mcp_tools` command over the standard /apifront session/wallet path
   * (the proven CLI auth: device-flow session token, with automatic reconnect-by-wallet refresh).
   * The backend returns the catalog already filtered by the SAME server-side checkCommandPermission
   * gate the HTTP /mcp tools/list uses — ONE describe-as-permission-gate, no parallel taxonomy in
   * the CLI. `--admin` is just the operator's wallet carrying admin entitlements (cred-gated, §9.1).
   *
   * NOTE we deliberately do NOT hit /mcp here: that endpoint's bearer path is OAuth-only and its
   * signature path needs a REGISTERED api-signature — neither is the CLI's session token. The
   * command path reuses invoke()'s working session auth.
   *
   * @returns {Promise<Array<{name, description, inputSchema}>>}
   */
  async mcpListTools(options = {}) {
    // The stdio MCP transport owns stdout for JSON-RPC; invoke()'s [ApiClient] console.log noise
    // would corrupt it. Route stdout chatter to stderr for the duration of this call only.
    const origLog = console.log;
    console.log = (...a) => console.error(...a);
    try {
      const resp = await this.invoke('list_mcp_tools', {}, options);
      const msg = resp?.message || resp;
      return msg?.tools || [];
    } finally {
      console.log = origLog;
    }
  }

  /**
   * Invoke a command via HTTP with automatic session management
   * @param {string} command - Command name
   * @param {Object} params - Command parameters
   * @param {Object} options - Optional { credentials, allowGuest, skipSessionCheck }
   * @returns {Promise<Object>} Response data
   */
  async invoke(command, params = {}, options = {}) {
    // Ensure baseUrl is loaded
    await this.ensureBaseUrl();
    
    // Load credentials if not provided
    let credentials = options.credentials || this.credentials;
    if (!credentials && !options.allowGuest) {
      credentials = await this.loadCredentials();
    }

    // Ensure we have a session (unless this is a guest command or session check is skipped)
    if (!options.allowGuest && !options.skipSessionCheck) {
      await this.ensureSession();
    }

    // Build request with potentially updated credentials (after ensureSession)
    const requestBody = this.buildRequestBody(command, params, this.credentials || credentials);
    
    // If we are triggering device login, we MUST NOT pass an expired session token
    // or the backend will reject it before we can even request a new code.
    if (command === 'device_request_login' || command === 'device_check_status') {
      requestBody.access_token = null;
    }
    
    const url = `${this.baseUrl}/apifront/`;

    try {
      // For local development with self-signed certs, disable SSL verification
      const axiosConfig = {
        headers: { 'Content-Type': 'application/json' },
        timeout: 300000 // 5 minute timeout for file uploads with vectorization
      };
      
      // Disable SSL verification for localhost (development only)
      if (this.baseUrl.includes('localhost') || this.baseUrl.includes('127.0.0.1')) {
        const https = await import('https');
        axiosConfig.httpsAgent = new https.Agent({
          rejectUnauthorized: false
        });
      }

      // Clear Cloud Run IAM for the internal-only DEV apiFront function (no-op otherwise).
      await this._applyIamAuthIfNeeded(axiosConfig);

      const response = await axios.post(url, requestBody, axiosConfig);

      const data = response.data;
      
      if (data.status !== 'OK') {
        const error = new Error(data.message || 'API request failed');
        error.status = data.status;
        error.response = data;
        throw error;
      }

      return data;
    } catch (error) {
      // Check if this is an auth failure that we can retry
      const isAuthError = error.response?.status === 401 || 
                          error.response?.auth_status === 'AUTH_FAILED' ||
                          error.message?.includes('session') ||
                          error.message?.includes('expired');
      
      // If auth failed and we have wallet credentials, try to refresh session once
      if (isAuthError && 
          this.credentials?.walletAddress && 
          this.credentials?.signature &&
          !options._retried) {
        
        // Clear existing access token
        if (this.credentials) {
          this.credentials.accessToken = null;
        }
        
        // Try to get new session
        await this.ensureSession();
        
        // If we got a new token, retry the original request
        if (this.credentials?.accessToken) {
          return this.invoke(command, params, { ...options, _retried: true });
        } else if (this.serviceMode) {
          // Headless service context: no interactive device login is possible. The developer's
          // wallet_address + signature failed to mint/refresh a session — fail loud (no fallback).
          throw new Error(
            `[ServiceApiClient] reconnect_by_wallet failed for command '${command}': the developer ` +
            `credential (wallet_address + signature) did not yield a session. Check the credential in ` +
            `dev-overrides.json (dev) / the secret (prod). No interactive login fallback in a microservice.`
          );
        } else if (command !== 'device_request_login' && command !== 'device_check_status') {
          // If refresh failed (e.g. signature invalid or user not found), 
          // we should trigger device login if this is a CLI environment
          console.log('[ApiClient] Session refresh failed, triggering device login...');
          const { loginDevice } = await import('./commands/auth.js');
          await loginDevice({ url: this.baseUrl, workspaceRoot: this.workspaceRoot });
          
          // After login, credentials should be updated in the wallet file.
          // Reload them and retry the request one last time.
          this.credentials = null;
          await this.loadCredentials();
          if (this.credentials?.accessToken) {
            return this.invoke(command, params, { ...options, _retried: true });
          }
        }
      }
      
      if (error.response) {
        // Axios error with response
        const errorData = error.response.data || { message: 'HTTP request failed' };
        const apiError = new Error(errorData.message || `HTTP ${error.response.status}`);
        apiError.status = error.response.status;
        apiError.response = errorData;
        throw apiError;
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to ${this.baseUrl}. Is the backend server running?`);
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error(`Request to ${this.baseUrl} timed out. Please try again.`);
      } else {
        // Network or other error
        throw error;
      }
    }
  }

  /**
   * Load credentials from wallet file at workspace root
   * Wallet is ALWAYS at {workspaceRoot}/.descix/wallet.json
   * @returns {Promise<Object|null>} Credentials object or null
   */
  async loadCredentials() {
    if (this.credentials) {
      return this.credentials;
    }

    // Use WorkspaceConfig's workspace root if available
    if (!this.workspaceRoot && this._workspaceConfig) {
      this.workspaceRoot = this._workspaceConfig.getWorkspaceRoot();
    }

    // If still no workspace root, try: WorkspaceConfig → wallet.json walk
    if (!this.workspaceRoot) {
      const wsConfig = await WorkspaceConfig.tryLoad();
      if (wsConfig) {
        this.workspaceRoot = wsConfig.getWorkspaceRoot();
        this._workspaceConfig = wsConfig;
      } else {
        this.workspaceRoot = await WorkspaceConfig.findWorkspaceRoot();
      }
      // Final fallback: walk up from cwd looking for .descix/wallet.json
      if (!this.workspaceRoot) {
        const fs = await import('fs/promises');
        let dir = path.resolve(process.cwd());
        const root = path.parse(dir).root;
        while (dir !== root) {
          try {
            await fs.access(path.join(dir, '.descix', 'wallet.json'));
            this.workspaceRoot = dir;
            break;
          } catch { /* not here, keep walking */ }
          const parent = path.dirname(dir);
          if (parent === dir) break;
          dir = parent;
        }
        if (!this.workspaceRoot) return null;
      }
    }

    try {
      const { WalletFileManager } = await import('./wallet-file.js');
      
      // Load wallet from known location: {workspaceRoot}/.descix/wallet.json
      const walletData = await WalletFileManager.loadFromWorkspace(this.workspaceRoot);
      if (!walletData) {
        return null;
      }

      this.credentials = {
        userId: walletData.userId || null,
        accessToken: walletData.sessionToken || null,
        walletAddress: walletData.walletAddress || null,
        signature: walletData.signature || null,
        communityId: walletData.communityId || null,
        tokenSymbol: walletData.tokenSymbol || null
      };

      return this.credentials;
    } catch (error) {
      console.error('[ApiClient] Error loading credentials:', error.message);
      return null;
    }
  }

  /**
   * Set credentials manually
   * @param {Object} credentials - { userId, accessToken, walletAddress, signature, ... }
   */
  setCredentials(credentials) {
    this.credentials = credentials;
  }

  /**
   * Check if credentials are loaded and valid
   * @returns {boolean}
   */
  hasCredentials() {
    return !!(this.credentials?.userId || this.credentials?.walletAddress);
  }

  /**
   * Get the WorkspaceConfig instance (if loaded)
   * Useful for commands that need path resolution
   * @returns {WorkspaceConfig|null}
   */
  getWorkspaceConfig() {
    return this._workspaceConfig;
  }
}

/**
 * Create a default API client instance
 * @param {Object} options - Client options
 * @returns {DeSciXApiClient}
 */
export function createApiClient(options = {}) {
  return new DeSciXApiClient(options);
}

export default DeSciXApiClient;
