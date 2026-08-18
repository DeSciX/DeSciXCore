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
import { DEFAULT_API_URL } from '@descix/app-sdk/dev';

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
    // The shipped default lives in ONE place (@descix/app-sdk/dev envOrigins) — this
    // used to re-declare the production URL as a local literal.
    const PRODUCTION_URL = DEFAULT_API_URL;

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
   * WS-HEADLESS-MVP-A1 (mcp-oauth-longlived-tokens design §2.4, Option 4A) — attach the
   * cached OAuth access token as the standard `Authorization: Bearer` header when the
   * credential cache holds a FRESH one.
   *
   * This REPLACES the retired gcloud-IAM transport seam (_isIamGatedOrigin/_mintIamBearer/
   * _applyIamAuthIfNeeded): `apiFront-http-dev` now deploys --allow-unauthenticated and the
   * OAuth bearer — verified by the app layer (verifyMcpAccessToken on /mcp; scope/exposure
   * gate + checkCommandPermission) — is the wall. No Google identity token, no gcloud, no
   * ~1h SSO reauth. The CLI's session credential still travels in the request BODY for the
   * /apifront auth middleware (the wallet-sig/API_KEY headless path, CEO-D-2026-06-02).
   *
   * ensureSession() keeps the token fresh (silent refresh); this method only ATTACHES it.
   * No-op when no OAuth credential is cached — never a fabricated fallback.
   *
   * @param {Object} axiosConfig
   * @returns {Object}
   */
  _applyOAuthBearerIfAvailable(axiosConfig) {
    const oauthBlock = this.credentials?.oauth;
    if (!oauthBlock?.access_token) return axiosConfig;
    axiosConfig.headers = { ...(axiosConfig.headers || {}), Authorization: `Bearer ${oauthBlock.access_token}` };
    return axiosConfig;
  }

  /**
   * WS-HEADLESS-MVP-A1 (design §2.2/§4.1) — OAuth silent refresh, the gcloud-ADC analogue.
   *
   * When the cached OAuth access token is expired (or within the 60s skew window), POST
   * grant_type=refresh_token to /oauth/token. The AS ROTATES the refresh token on use, so
   * BOTH returned tokens are persisted back to wallet.json immediately — losing the rotated
   * refresh token would trip the AS's reuse-detection and revoke the whole chain.
   *
   * Non-interactive for up to 30 days of inactivity (sliding window under rotation). If the
   * refresh is rejected (revoked/expired chain), we FAIL LOUD once per process and leave the
   * wallet-sig path — which is untouched by the OAuth branch — to carry the session; the
   * user re-runs `descix login` to re-establish OAuth.
   */
  async _ensureOAuthAccessToken() {
    const oauthBlock = this.credentials?.oauth;
    if (!oauthBlock?.refresh_token || this._oauthRefreshFailed) return;

    const { isOAuthAccessTokenFresh, refreshOAuthTokens, buildOAuthCredentialBlock } = await import('./oauth-client.js');
    if (isOAuthAccessTokenFresh(oauthBlock)) return;

    try {
      const tokens = await refreshOAuthTokens(this.baseUrl, {
        refreshToken: oauthBlock.refresh_token,
        clientId: oauthBlock.client_id,
      });
      const updated = buildOAuthCredentialBlock({
        clientId: oauthBlock.client_id,
        tokens,
        tokenEndpointBase: this.baseUrl,
      });
      this.credentials.oauth = updated;

      // Persist the ROTATED pair to wallet.json (same write path as the session refresh).
      try {
        const { WalletFileManager } = await import('./wallet-file.js');
        const walletPath = await WalletFileManager.findWalletFile(this.workspaceRoot || process.cwd());
        if (walletPath) {
          const walletData = await WalletFileManager.loadWalletFile(walletPath);
          if (walletData) {
            walletData.oauth = updated;
            await WalletFileManager.saveWalletFile(walletPath, walletData);
          }
        }
      } catch (saveErr) {
        console.error('[ApiClient] Failed to persist rotated OAuth tokens to wallet file:', saveErr.message);
      }
    } catch (error) {
      // Revoked/expired refresh chain (or AS unreachable): loud, once per process. The
      // wallet-sig session path proceeds independently — no silent credential fabrication.
      this._oauthRefreshFailed = true;
      console.error(`[ApiClient] OAuth silent refresh failed: ${error.message}. ` +
        `Run 'descix login' to re-establish OAuth credentials.`);
    }
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
    // WS-HEADLESS-MVP-A1 OAuth branch: keep the cached OAuth access token fresh (silent
    // refresh against /oauth/token). Runs ONLY when an `oauth` credential block exists in
    // wallet.json (written by `descix login`) — the wallet-sig session path below is
    // untouched and remains the headless/API_KEY credential (design §2.6).
    if (this.credentials?.oauth?.refresh_token) {
      await this._ensureOAuthAccessToken();
    }

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

    // WS-A1: OAuth bearer rides the standard Authorization header (no-op without a cache).
    this._applyOAuthBearerIfAvailable(axiosConfig);

    try {
      const response = await axios.post(url, requestBody, axiosConfig);
      console.log(`[ApiClient] Response status: ${response.status}`);
      const data = response.data;
      
      if (data.status !== 'OK') {
        const error = new Error(data.message || 'API request failed');
        error.status = data.status;
        error.response = data;
        // WS-HEADLESS-MVP-A3: surface structured error fields (e.g. CREDITS_REQUIRED
        // code + purchasable-action data) to CLI/MCP consumers.
        if (data.code) error.code = data.code;
        if (data.data) error.data = data.data;
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

      // WS-A1: OAuth bearer rides the standard Authorization header (no-op without a cache).
      this._applyOAuthBearerIfAvailable(axiosConfig);

      const response = await axios.post(url, requestBody, axiosConfig);

      const data = response.data;
      
      if (data.status !== 'OK') {
        const error = new Error(data.message || 'API request failed');
        error.status = data.status;
        error.response = data;
        // WS-HEADLESS-MVP-A3: surface structured error fields (e.g. CREDITS_REQUIRED
        // code + purchasable-action data) to CLI/MCP consumers.
        if (data.code) error.code = data.code;
        if (data.data) error.data = data.data;
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
        // WS-HEADLESS-MVP-A3: ferry structured error fields (code + purchasable-action
        // data, e.g. CREDITS_REQUIRED/402) through the axios error path.
        if (errorData.code) apiError.code = errorData.code;
        if (errorData.data) apiError.data = errorData.data;
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
        tokenSymbol: walletData.tokenSymbol || null,
        // WS-A1: OAuth credential block (gcloud-ADC analogue) — null when never logged in
        // via the device→OAuth bridge; the wallet-sig path is then the sole credential.
        oauth: walletData.oauth || null
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
