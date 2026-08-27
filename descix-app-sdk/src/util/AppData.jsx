// ---------- [./DeSciX_PWA/src/util/AppData.jsx] ----------


import { resolveAgainstCurrentOrigin } from './productUrl.js';

const queryParams = new URLSearchParams(window.location.search);
// isEmbedded is strictly for Discord embedded apps (where .proxy/ prefix is needed)
// We check for frame_id AND ensure we are NOT in standalone app mode (internal iframe)
export const isEmbedded = Boolean(queryParams.get('frame_id')) && !window.__STANDALONE_APP_ID__;
const apiDebugPostfix = '_debug';

export class ProductTypes {
  static COMMUNITY = 'COMMUNITY';
  static APP = 'APP';
  static KNOWLEDGEBASE = 'KNOWLEDGEBASE';
  static ROLE = 'ROLE'; // <-- Added ROLE type
}

export class AppData {
  static _sessionInfo = null;
  static _custodialBalance = 0; // NEW: Store custodial balance
  static _userRoles = null; // NEW: Store user roles map
  static _availableCommunities = [];
  static _myCommunities = [];
  static _myApps = [];
  static _myTransactions = []; // Added myTransactions to store transaction history
  static _selectedCommunity = null;
  static _selectedApp = null;
  static _loginStatus = null;
  static _selectedCommunityToken = null; // NEW: Store community token symbol from URL (e.g., "EGPT")
  static sdk = null;
  static sdkCode = null;
  static source_guild_id = null;
  static _refCode = null; // Unified referral/device code
  static _refType = null; // 'DEVICE' | 'REFERRAL' | null
  static _deviceUserCode = null; // For device login only
  static _referralData = null; // For referral: { custom_id, referrer_id, guild_id }
  static _appModeConfig = null; // NEW: Config for standalone app mode (appId, url)
  static _workspaceProducts = typeof __WORKSPACE_PRODUCTS__ !== 'undefined' ? __WORKSPACE_PRODUCTS__ : null;

  static get workspaceProducts() {
    return AppData._workspaceProducts;
  }

  /**
   * Live-update the workspace product map at runtime (dev only).
   * Called by the @descix/app-sdk/dev workspaceProductsPlugin HMR client runtime
   * when .descix/workspace.json changes, so the app store reflects added/changed
   * product sites WITHOUT a dev-server restart. getProductUrl() reads this same
   * mutable field, so the store re-resolves URLs from the new map on next render.
   * @param {Object|null} products - { [appId]: 'proto://localhost:port' } or null
   */
  static setWorkspaceProducts(products) {
    AppData._workspaceProducts = products && typeof products === 'object' ? products : null;
    return AppData._workspaceProducts;
  }

  /**
   * The code-site location for a product, resolved against the CURRENT origin.
   * The rule itself is owned by ./productUrl.js — see that file for GAP-4 and why only the
   * stored value's PATH is meaningful. The dev workspaceProducts indirection still wins:
   * that is the point of it, and `descix serve` routes through it.
   */
  static getProductUrl(product) {
    if (AppData._workspaceProducts && AppData._workspaceProducts[product.app_id]) {
      return AppData._workspaceProducts[product.app_id];
    }
    return resolveAgainstCurrentOrigin(product.ip_site_gcs_path_url);
  }

  static reset() {
    AppData._sessionInfo = null;
    AppData._custodialBalance = 0;
    AppData._userRoles = null;
    AppData._availableCommunities = [];
    AppData._myCommunities = [];
    AppData._myApps = [];
    AppData._myTransactions = [];
    AppData._selectedCommunity = null;
    AppData._selectedApp = null;
    AppData._loginStatus = null;
    AppData._selectedCommunityToken = null;
    AppData.sdk = null;
    AppData.sdkCode = null;
    AppData.source_guild_id = null;
    AppData._refCode = null;
    AppData._refType = null;
    AppData._deviceUserCode = null;
    AppData._referralData = null;
    AppData._appModeConfig = null;

    // Clear localStorage
    localStorage.removeItem('sessionInfo');
    localStorage.removeItem('custodialBalance');
    localStorage.removeItem('userRoles');
    localStorage.removeItem('loginStatus');
    localStorage.removeItem('selectedCommunity');
    localStorage.removeItem('selectedCommunityToken');
    localStorage.removeItem('selectedApp');
    localStorage.removeItem('availableCommunities');
    localStorage.removeItem('myCommunities');
    localStorage.removeItem('myTransactions');
    localStorage.removeItem('myApps');

    // Clear chat thread data (dynamic keys: descix_threads_{communityId}_{appId})
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('descix_threads_')) keysToRemove.push(key);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }

  static get appModeConfig() {
    return AppData._appModeConfig;
  }

  static set appModeConfig(config) {
    AppData._appModeConfig = config;
  }

  // --- Session Info Getter/Setter ---
  static get sessionInfo() {
    if (AppData._sessionInfo) {
      return AppData._sessionInfo;
    }
    const stored = localStorage.getItem('sessionInfo');
    try {
      AppData._sessionInfo = stored ? JSON.parse(stored) : null;
      return AppData._sessionInfo;
    } catch (error) {
      console.error('Error parsing sessionInfo from localStorage:', error);
      return null;
    }
  }
  static set sessionInfo(value) {
    AppData._sessionInfo = value;
    localStorage.setItem('sessionInfo', JSON.stringify(value));
  }


  // --- Custodial Balance Getter/Setter ---
  static get custodialBalance() {
    if (AppData._custodialBalance !== null && AppData._custodialBalance !== undefined) {
      return AppData._custodialBalance;
    }
    const stored = localStorage.getItem('custodialBalance');
    try {
      AppData._custodialBalance = stored ? parseFloat(stored) : 0;
      return AppData._custodialBalance;
    } catch (error) {
      console.error('Error parsing custodialBalance from localStorage:', error);
      AppData._custodialBalance = 0;
      return 0;
    }
  }
  static set custodialBalance(balance) {
    AppData._custodialBalance = balance;
    localStorage.setItem('custodialBalance', String(balance));
  }

  // --- User Roles Getter/Setter ---
  static get userRoles() {
    if (AppData._userRoles) {
      return AppData._userRoles;
    }
    const stored = localStorage.getItem('userRoles');
    try {
      AppData._userRoles = stored ? new Map(Object.entries(JSON.parse(stored))) : null;
      return AppData._userRoles;
    } catch (error) {
      console.error('Error parsing userRoles from localStorage:', error);
      AppData._userRoles = null;
      return null;
    }
  }
  static set userRoles(value) {
    // value should be a Map
    AppData._userRoles = value instanceof Map ? value : null;
    // Store as object in localStorage
    const rolesObject = AppData._userRoles ? Object.fromEntries(AppData._userRoles) : {};
    localStorage.setItem('userRoles', JSON.stringify(rolesObject));
  }


  // --- Selected Community Getter/Setter ---
  static get selectedCommunity() {
    if (AppData._selectedCommunity) {
      return AppData._selectedCommunity;
    }
    const stored = localStorage.getItem('selectedCommunity');
    try {
      AppData._selectedCommunity = stored ? JSON.parse(stored) : null;
      return AppData._selectedCommunity;
    } catch (error) {
      console.error('Error parsing selectedCommunity from localStorage:', error);
      return null;
    }
  }
  static set selectedCommunity(value) {
    AppData._selectedCommunity = value;
    localStorage.setItem('selectedCommunity', JSON.stringify(value));
    // Also sync selectedCommunityToken
    if (value && value.token_symbol) {
      AppData._selectedCommunityToken = value.token_symbol;
      localStorage.setItem('selectedCommunityToken', value.token_symbol);
    }
  }

  // --- Selected Community Token Getter/Setter ---
  static get selectedCommunityToken() {
    if (AppData._selectedCommunityToken) {
      return AppData._selectedCommunityToken;
    }
    const stored = localStorage.getItem('selectedCommunityToken');
    if (stored) {
      AppData._selectedCommunityToken = stored;
      return stored;
    }
    return null;
  }
  static set selectedCommunityToken(value) {
    AppData._selectedCommunityToken = value;
    localStorage.setItem('selectedCommunityToken', value);
  }


  // --- Login Status Getter/Setter ---
  static get loginStatus() {
    if (AppData._loginStatus) {
      return AppData._loginStatus;
    }
    const stored = localStorage.getItem('loginStatus');
    try {
      AppData._loginStatus = stored ? JSON.parse(stored) : LoginStatus.GUEST;
      return AppData._loginStatus;
    } catch (error) {
      console.error('Error parsing loginStatus from localStorage:', error);
      return LoginStatus.GUEST;
    }
  }
  static set loginStatus(value) {
    AppData._loginStatus = value;
    localStorage.setItem('loginStatus', JSON.stringify(value));
  }

  // --- Selected App Getter/Setter ---
  static get selectedApp() {
    if (AppData._selectedApp) {
      return AppData._selectedApp;
    }
    const stored = localStorage.getItem('selectedApp');
    try {
      AppData._selectedApp = stored ? JSON.parse(stored) : null;
      return AppData._selectedApp;
    } catch (error) {
      console.error('Error parsing selectedApp from localStorage:', error);
      return null;
    }
  }
  static set selectedApp(value) {
    AppData._selectedApp = value;
    localStorage.setItem('selectedApp', JSON.stringify(value));
  }

  // --- Available Communities Getter/Setter ---
  static get availableCommunities() {
    if (AppData._availableCommunities && AppData._availableCommunities.length > 0) {
      return AppData._availableCommunities;
    }
    const stored = localStorage.getItem('availableCommunities');
    try {
      AppData._availableCommunities = stored ? JSON.parse(stored) : [];
      return AppData._availableCommunities;
    } catch (error) {
      console.error('Error parsing availableCommunities from localStorage:', error);
      AppData._availableCommunities = [];
      return [];
    }
  }
  static set availableCommunities(value) {
    AppData._availableCommunities = Array.isArray(value) ? value : [];
    localStorage.setItem('availableCommunities', JSON.stringify(AppData._availableCommunities));
  }

  // --- My Communities Getter/Setter ---
  static get myCommunities() {
    if (AppData._myCommunities && AppData._myCommunities.length > 0) {
      return AppData._myCommunities;
    }
    const stored = localStorage.getItem('myCommunities');
    try {
      AppData._myCommunities = stored ? JSON.parse(stored) : [];
      return AppData._myCommunities;
    } catch (error) {
      console.error('Error parsing myCommunities from localStorage:', error);
      AppData._myCommunities = [];
      return [];
    }
  }
  static set myCommunities(value) {
    AppData._myCommunities = Array.isArray(value) ? value : [];
    localStorage.setItem('myCommunities', JSON.stringify(AppData._myCommunities));
  }

  // --- My Transactions Getter/Setter ---
  static get myTransactions() {
    if (AppData._myTransactions && AppData._myTransactions.length > 0) {
      return AppData._myTransactions;
    }
    const stored = localStorage.getItem('myTransactions');
    try {
      AppData._myTransactions = stored ? JSON.parse(stored) : [];
      return AppData._myTransactions;
    } catch (error) {
      console.error('Error parsing myTransactions from localStorage:', error);
      AppData._myTransactions = [];
      return [];
    }
  }
  static set myTransactions(value) {
    AppData._myTransactions = Array.isArray(value) ? value : [];
    localStorage.setItem('myTransactions', JSON.stringify(AppData._myTransactions));
  }

  // --- My Apps Getter/Setter ---
  static get myApps() {
    if (AppData._myApps && AppData._myApps.length > 0) {
      return AppData._myApps;
    }
    const stored = localStorage.getItem('myApps');
    try {
      const parsed = stored ? JSON.parse(stored) : [];
      AppData._myApps = Array.isArray(parsed) ? parsed : [];
      return AppData._myApps;
    } catch (error) {
      console.error('Error parsing myApps from localStorage:', error);
      AppData._myApps = [];
      return [];
    }
  }
  static set myApps(value) {
    AppData._myApps = Array.isArray(value) ? value : [];
    localStorage.setItem('myApps', JSON.stringify(AppData._myApps));
  }

  // --- Ref Code Getter/Setter ---
  static get refCode() {
    return AppData._refCode;
  }
  static set refCode(value) {
    AppData._refCode = value;
  }

  // --- Ref Type Getter/Setter ---
  static get refType() {
    return AppData._refType;
  }
  static set refType(value) {
    AppData._refType = value;
  }

  // --- Device User Code Getter/Setter ---
  static get deviceUserCode() {
    return AppData._deviceUserCode;
  }
  static set deviceUserCode(value) {
    AppData._deviceUserCode = value;
  }

  // --- Referral Data Getter/Setter ---
  static get referralData() {
    return AppData._referralData;
  }
  static set referralData(value) {
    AppData._referralData = value;
  }
}

// State Machine States ... managed by dispatch
export const AppContextState = {
  INITIALIZING: 'INITIALIZING', // App startup, SDK, wallet checks
  READY: 'READY',          // Core setup complete, app functional
  LOADING: 'LOADING',        // General data loading in progress
  ERROR: 'ERROR',          // Application error state
};


export const NetworkLoadingType = {
  FETCH_COMMUNITIES: 'FETCH_COMMUNITIES',
  FETCH_MY_PURCHASES: 'FETCH_MY_PURCHASES',
  GET_AI_RESPONSE: 'GET_AI_RESPONSE',
  PURCHASE_ROLE: 'PURCHASE_ROLE',
  PURCHASE_PRODUCT: 'PURCHASE_PRODUCT',
  FETCH_COMMUNITY_APPS: 'FETCH_COMMUNITY_APPS',
  GENERAL: 'GENERAL', // General loading state
}

export const AppContextView = {
  LOADING: 'LOADING',
  WELCOME: 'WELCOME',
  TRADING_DASHBOARD: 'TRADING_DASHBOARD', // NEW: Crypto exchange-style trading dashboard
  COMMUNITY_LOBBY: 'COMMUNITY_LOBBY',
  COMMUNITY_STORE: 'COMMUNITY_STORE',
  MY_APPS: 'MY_APPS',
  APP_STORE: 'APP_STORE',
  APP_USAGE: 'APP_USAGE',
  WALLET: 'WALLET',
  DEVELOPER_TOOLS: 'DEVELOPER_TOOLS',
  DEVICE_LOGIN: 'DEVICE_LOGIN', // CLI/MCP device login flow
  CONNECT_CEREMONY: 'CONNECT_CEREMONY', // WS-FREEMIUM-ONRAMP: browser OAuth connect ceremony (claude.ai) — sibling of DEVICE_LOGIN
  STANDALONE_APP: 'STANDALONE_APP', // Isolated Standalone App mode
  CLAIM_PAGE: 'CLAIM_PAGE',     // NEW: Claim page view
  ERROR: 'ERROR',
  // Content Management Views
  MY_CONTENT: 'MY_CONTENT',           // User's content folder browser
  PROPOSED_KB: 'PROPOSED_KB',         // Browse proposed community content
  PROPOSED_DOC: 'PROPOSED_DOC',       // Deep-linked proposed document view (guest accessible)
  // Consider adding a dedicated ROLES view later if needed
  // ROLES: 'ROLES',
};

export const RewardTypes = {
  DIP: 'DIP',
  REF: 'REF',
  REP: 'REP',
}

// NEW: In-App Activity View
export const AppContextInAppActivity = {
  DEFAULT: 'DEFAULT',
  CHAT: 'CHAT',
  CODESITE: 'CODESITE',
  KNOWLEDGEBASE: 'KNOWLEDGEBASE',
  IPDOC: 'IPDOC', // NEW: IPDoc viewer with document-anchored chat
  CREATE_APP: 'CREATE_APP',
  CREATE_COMMUNITY: 'CREATE_COMMUNITY',
};

// State Machine Events ... communicated by dispatch (listened by others via useEffect)
export const AppContextEvent = {
  SDK_INITIALIZE: 'SDK_INITIALIZE',    // Start SDK initialization
  SDK_READY: 'SDK_READY',            // SDK initialization complete
  SDK_FAILED: 'SDK_FAILED',           // SDK initialization failed
  SDK_CHECKED: 'SDK_CHECKED',         // Post-SDK checks (auth, routing) complete
  WALLET_DETECTED: 'WALLET_DETECTED',      // Wallet data found during initialization
  WALLET_INSTALL_MISSING: 'WALLET_INSTALL_MISSING', // Wallet data not found during initialization
  WALLET_NEEDED: 'WALLET_NEEDED',        // Send user to web site to buy tokens
  LOGIN_START: 'LOGIN_START',           // Login process initiated
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',         // Login successful
  LOGIN_WITH_ROUTING: 'LOGIN_WITH_ROUTING', // Login successful with server-guided routing
  LOGIN_FAILURE: 'LOGIN_FAILURE',         // Login failed
  SESSION_EXPIRED: 'SESSION_EXPIRED',     // Session expired, needs re-authentication
  PURCHASES_REFRESH_REQUESTED: 'PURCHASES_REFRESH_REQUESTED', // User explicitly requests a store refresh
  CHANGE_VIEW: 'CHANGE_VIEW',            // Change the current view
  APP_ERROR: 'APP_ERROR',             // Error in app
  // --- DEPRECATED: Powch Onboarding Events (now handled by useOnboardingFlow hook) ---
  // These events are no longer processed by AppContext state machine.
  // Kept for backward compatibility but will be removed in a future release.
  POWCH_LOGIN_COMPLETE: 'POWCH_LOGIN_COMPLETE', // @deprecated
  TOS_ACCEPTED: 'TOS_ACCEPTED',           // @deprecated
  WALLET_CONNECT_REQUEST: 'WALLET_CONNECT_REQUEST', // @deprecated
  WALLET_CONNECTED: 'WALLET_CONNECTED',       // @deprecated
  // --- End DEPRECATED Powch Onboarding Events ---
  // --- Added Role Events (Optional, handled via refresh for now) ---
  // ROLE_PURCHASE_SUCCESS: 'ROLE_PURCHASE_SUCCESS',
  // ROLE_PURCHASE_FAILURE: 'ROLE_PURCHASE_FAILURE',
  // --- End Added Role Events ---
}

export const LoginStatus = {
  GUEST: 'GUEST',                      // No authentication, can browse promoted communities (read-only)
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED', // Account + wallet exist (passkey created) but no email/TOS
  PENDING_TOS: 'PENDING_TOS',          // Identity verified (Powch login) but TOS not yet accepted
  AUTHENTICATED: 'AUTHENTICATED',      // Identity verified + TOS accepted (email or Discord). NO wallet required
  CONNECTED: 'CONNECTED',              // Authenticated + wallet address linked (but no stake yet)
  AUTH_FAILED: 'AUTH_FAILED',          // Authentication attempt failed
};

// --- Added Frontend Constants ---
export const PLATFORM_SCOPE_ID = 'descix'; // Standard scope ID for platform-level items
export const MEMBER_ROLE_ID = `platform_${PLATFORM_SCOPE_ID}_member`; // Assumed Role ID format
export const PERMISSIONS = {
  AIRDROP_ELIGIBLE: 'AIRDROP_ELIGIBLE',
  PLATFORM_MANAGE_COMMUNITIES: 'PLATFORM_MANAGE_COMMUNITIES',
  COMMUNITY_MANAGE_APPS: 'COMMUNITY_MANAGE_APPS',
  PLATFORM_MANAGE_APPS: 'PLATFORM_MANAGE_APPS',
  PLATFORM_MANAGE_ROLES: 'PLATFORM_MANAGE_ROLES',
  ACCESS_PREMIUM_CONTENT: (appId) => `ACCESS_PREMIUM_CONTENT_${appId}`, // Example permission structure
};
// --- End Added Frontend Constants ---


export class AppEventViewData {
  constructor(communityId, appId, appContentViewType, AppContextInAppActivityType) {
    this.communityId = communityId; // the id of the new community to switch to
    this.appId = appId; // the id of the new app to switch to
    this.appContentViewType = appContentViewType; // the type of content view to switch to
    this.AppContextInAppActivityType = AppContextInAppActivityType; // the type of in-app activity to switch to
  }

}



export const apiProxyUrlPrefix = (import.meta.env.VITE_DEBUG_PROXY && isEmbedded)
  ? `/.proxy/api${apiDebugPostfix}`
  : isEmbedded
    ? `/.proxy/api`
    : '';
const mediaProxyPrefix = isEmbedded ? `/.proxy/gcs_media` : null;



/**
 * Transform GCS media URLs for proper loading context.
 * - Same-origin codesite URLs (app.descix.net/Community/...) pass through unchanged
 * - When embedded (Discord), GCS URLs are proxied through /.proxy/gcs_media
 * - All other URLs are served from the same origin
 * 
 * @param {string} path - The URL or path to transform
 * @returns {string} The transformed path
 */
export const gcsMediaPath = (path) => {
  if (!path) {
    return path;
  }
  
  // If path is already relative (starts with /Community), return as-is
  // The Vite proxy will handle /Community/ prefix
  if (path.startsWith('/Community')) {
    return path;
  }

  if (!isEmbedded) {
    return path;
  }

  // If we are in debug proxy mode, we will have the vite middleware proxy the all gcs media requests through the local proxy server
  // Use /.proxy/gcs_media when in debug proxy mode even if not embedded
  const proxyPrefix = mediaProxyPrefix || (import.meta.env.VITE_DEBUG_PROXY ? '/.proxy/gcs_media' : null);
  
  // If no proxy prefix needed and not in debug mode, return as-is
  if (!proxyPrefix && !import.meta.env.VITE_DEBUG_PROXY) {
    return path;
  }
  
  // Only rewrite if path contains storage.googleapis.com
  if (!path.includes('storage.googleapis.com')) {
    return path;
  }
  
  return path.replace('https://storage.googleapis.com', proxyPrefix);
};


export const ResponseStatus = {
  OK: 'OK',
  ERROR: 'ERROR',
};



/**
 * Commands that GUEST users (unauthenticated) are allowed to call.
 * This list must match the backend GUEST_ALLOWED_COMMANDS in utils.js for consistency.
 * 
 * Guest-allowed commands enable:
 * - Browsing public/promoted communities (find_communities, get_community_details, get_community, list_apps_for_community)
 * - Fetching featured communities (fetch_my_purchases - backend returns featured for GUEST)
 * - Viewing token contract info (get_token_contract_addresses)
 * - Anonymous payment flows (create_stripe_checkout_session, get_crypto_deposit_info)
 * 
 * Note: Backend entitlement checks remain authoritative. This list is for frontend UI gating only.
 * 
 * @see DeSciX_Cloud/services/utils.js for backend definition and full command inventory
 */
export const GUEST_ALLOWED_COMMANDS = [
    'find_communities',              // Browse promoted communities
    'get_community_details',         // View community details (read-only)
    'get_community',                  // Get single community info
    'list_apps_for_community',       // Browse apps in community (read-only)
    'get_token_contract_addresses', // Get token contract addresses (read-only)
    'fetch_my_purchases',            // Returns featured communities for GUEST (backend handles fallback)
    'create_stripe_checkout_session', // Initiate Stripe payment (anonymous)
    'get_crypto_deposit_info',       // Get crypto deposit info (anonymous)
    // Trading dashboard (returns demo data for guests)
    'get_platform_holdings',         // Platform holdings (demo for guests)
    'get_market_overview',           // Market overview with token prices
    'get_user_nfts',                 // User NFTs (demo for guests)
    // Wallet config (signature message for passkey registration - pre-auth)
    'get_wallet_config',            // Signature message for passkey registration
    // Powch Zero-Knowledge Authentication (NO PII sent to server)
    'powch_register_begin',          // Start WebAuthn registration (zero-knowledge)
    'powch_register_finish',         // Complete WebAuthn registration (zero-knowledge)
    'powch_login_begin',             // Start WebAuthn authentication (zero-knowledge)
    'powch_login_finish',            // Complete WebAuthn authentication (zero-knowledge)
    'powch_write_wallet_begin',      // Start wallet write ceremony (for largeBlob)
    
    // Powch Email Verification (zero-knowledge - hash only)
    'powch_send_verification_code',  // Generate verification code (hash only)
    'powch_verify_code',             // Verify code and get proof
    'powch_check_verification_proof', // Validate a verification proof
    
    // Note: descix_create_from_powch, descix_login_with_powch, descix_link_passkey,
    // and all passkey_* legacy commands have been removed.
    // Session is now created atomically by powch_register_finish / powch_login_finish.
    
    // Service SDK (read-only service discovery)
    'list_services',                 // List registered external services (public)
    'get_service',                   // Get service manifest (public)
    'service_health_check',          // Check service health (public)
    
    // Store Search (semantic search for browsing)
    'search_store',                  // Search communities and apps by description

    // T-FLOW-PASSKEY-FIRST Chunk 6 — airdrop_check_pending + airdrop_enqueue_migration
    // were previously GUEST-allowed for the pre-passkey TokenGateView preview. The
    // consolidated flow (Chunk 4) removes that pre-passkey screen; the any-token gate
    // now runs inside descix_accept_tos (NOT_AUTHENTICATED post-passkey). These two
    // commands are no longer reachable from a guest session in the PWA; REMOVE from
    // the client allowlist (REMOVE legacy per DeSciX CLAUDE.md policy).
];

// --- Event dispatcher registration for session expiry handling ---
// Event dispatcher - set by AppContext to dispatch events to state machine
let appEventDispatcher = null;

export function registerAppEventDispatcher(dispatcher) {
  appEventDispatcher = dispatcher;
}

// --- Session expiry callbacks (e.g. Powch vault lock) ---
const _sessionExpiryCallbacks = [];

export function registerSessionExpiryCallback(fn) {
  if (typeof fn === 'function') {
    _sessionExpiryCallbacks.push(fn);
  }
}

export async function clearSessionAndDispatchExpiry() {
  // Check if we have stored PWA wallet signature for auto-reconnect
  const storedSignature = localStorage.getItem('pwa_wallet_signature');
  
  if (storedSignature) {
    try {
      console.log('[AppData] Session expired, attempting automatic wallet reconnect via signature...');
      const { authenticateBySignature } = await import('./api/ApiAuth.js');
      const result = await authenticateBySignature(storedSignature);
      
      if (result.status === 'OK' && result.message?.sessionInfo) {
        // Reconnect successful - update session and return without clearing
        AppData.sessionInfo = result.message.sessionInfo;
        AppData.loginStatus = result.auth_status || LoginStatus.CONNECTED;
        AppData.custodialBalance = result.message.sessionInfo.custodial_balance || 0;
        AppData.userRoles = result.message.sessionInfo.roles 
          ? new Map(Object.entries(result.message.sessionInfo.roles)) 
          : null;
        
        // Dispatch LOGIN_SUCCESS to update UI
        if (appEventDispatcher) {
          appEventDispatcher({ type: AppContextEvent.LOGIN_SUCCESS });
        }
        
        console.log('[AppData] Automatic wallet reconnect successful');
        return; // Don't clear session - reconnect succeeded
      }
    } catch (error) {
      console.error('[AppData] Automatic wallet reconnect failed:', error);
      // Fall through to clear session
    }
  }
  
  // Only clear if reconnect failed or no wallet credentials
  localStorage.removeItem('sessionInfo');
  localStorage.removeItem('custodialBalance');
  localStorage.removeItem('userRoles');
  localStorage.removeItem('loginStatus');
  // Note: We keep pwa_wallet_signature and pwa_signed_message for next attempt
  // They will be cleared if user explicitly logs out
  
  // Reset AppData in-memory state
  AppData.reset();

  // Invoke session expiry callbacks (e.g. Powch vault lock) before dispatching
  _sessionExpiryCallbacks.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error('[AppData] Session expiry callback error:', err);
    }
  });
  
  // Dispatch to state machine via registered dispatcher
  if (appEventDispatcher) {
    appEventDispatcher({ type: AppContextEvent.SESSION_EXPIRED });
  }
}

// --- Updated makeCommandRequestJSON to use AppData properties ---
// Internal implementation that can be called with explicit credential control
// sendCredentials: true = use AppData.sessionInfo, false = no creds
async function makeCommandRequestInternal(command, params, isGuestAllowed, sendCredentials) {
  const sessionInfo = sendCredentials ? AppData.sessionInfo : null;
  const userId = sessionInfo?.id ?? sessionInfo?.user_id ?? null;
  const accessToken = sessionInfo?.access_token || '';

  const requestBody = {
    command,
    params,
    user_id: userId,
    access_token: accessToken,
    wallet_address: sessionInfo?.wallet_address || null,
    signature: sessionInfo?.signature || null,
    guild_id: AppData.source_guild_id || null,
  };

  if (params.streaming) {
    requestBody.streaming = true;
  }

  const res = await fetch(`${apiProxyUrlPrefix}/apifront/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  // --- Streaming Response Handling ---
  if (params.streaming) {
    // WS-HEADLESS-MVP-A3: a non-2xx on a streaming request is NOT a stream — it is a
    // JSON error envelope (e.g. 402 CREDITS_REQUIRED thrown by the pre-generation
    // credits gate). Pre-A3 this body was fed to the stream parser and yielded a chunk
    // with no `reply`, silently swallowing the failure. Fail loud with the structured
    // fields (code + data.purchase) so widgets can render the purchasable action.
    if (!res.ok) {
      const errText = await res.text();
      let errData;
      try { errData = JSON.parse(errText); } catch (_) {
        errData = { status: 'ERROR', message: errText || `Server error (${res.status})` };
      }
      const err = new Error(typeof errData.message === 'string' ? errData.message : `Server error (${res.status})`);
      err.status = res.status;
      if (errData.code) err.code = errData.code;
      if (errData.data) err.data = errData.data;
      throw err;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    async function* streamGenerator() {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n---END---\n');
        buffer = parts.pop();
        for (const part of parts) {
          if (part.trim()) yield JSON.parse(part);
        }
      }
      if (buffer.trim()) yield JSON.parse(buffer);
    }
    return { streaming: true, generator: streamGenerator() };
  }

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (_) {
    data = { status: 'ERROR', message: text || `Server error (${res.status})` };
  }
  return { streaming: false, data, status: res.status };
}

export const makeCommandRequestJSON = async (command, params = {}, allowGuest = false) => {
  const isGuestAllowed = allowGuest || GUEST_ALLOWED_COMMANDS.includes(command);
  const sessionInfo = AppData.sessionInfo;
  const hasCredentials = !!(sessionInfo?.id || sessionInfo?.user_id);

  if (!hasCredentials && !isGuestAllowed) {
    console.error('User profile or ID not found in AppData');
    throw new Error("User not authenticated.");
  }

  let result = await makeCommandRequestInternal(command, params, isGuestAllowed, hasCredentials);

  // Handle streaming response
  if (result.streaming) {
    return result.generator;
  }

  const { data, status } = result;

  // Check for session expiry - ensure errorMessage is a string
  const rawMessage = data.message;
  const errorMessage = typeof rawMessage === 'string' ? rawMessage : '';
  const isSessionExpired = 
    status === 401 ||
    errorMessage.toLowerCase().includes('session invalid or expired') ||
    errorMessage.toLowerCase().includes('user session invalid');

  // SIMPLIFIED: Trust the server.
  // If the server says "401 / Session Expired", it means the session is gone or invalid.
  // We should clear our local state to match the server's truth.
  // The server handles guest-allowed commands internally, so if we get a 401 here,
  // it means even guest access failed (unlikely) or we tried an auth-only command with a bad token.
  
  if (data.status !== ResponseStatus.OK && isSessionExpired) {
    console.log(`[AppData] Server reported session expired for command '${command}'. Clearing local session.`);
    
    // Clear session data
    localStorage.removeItem('sessionInfo');
    localStorage.removeItem('custodialBalance');
    localStorage.removeItem('userRoles');
    localStorage.removeItem('loginStatus');
    AppData.reset();
    
    // Dispatch expiry event to update UI
    if (appEventDispatcher) {
      appEventDispatcher({ type: AppContextEvent.SESSION_EXPIRED });
    }
    

  }

  // Process final result
  const finalData = result.streaming ? null : result.data;
  
  if (finalData && finalData.status === ResponseStatus.OK) {
    // Hydrate session from response - single source of truth for shell
    // Backend may return sessionInfo in message (apiFront) or at top level (some handlers)
    const sessionInfoFromResponse = finalData.message?.sessionInfo ?? finalData.sessionInfo;
    if (sessionInfoFromResponse) {
      AppData.sessionInfo = sessionInfoFromResponse;
      if (finalData.auth_status) {
        AppData.loginStatus = finalData.auth_status;
      }
      if (sessionInfoFromResponse.custodial_balance !== undefined) {
        AppData.custodialBalance = sessionInfoFromResponse.custodial_balance;
      }
      if (sessionInfoFromResponse.roles !== undefined) {
        AppData.userRoles = new Map(Object.entries(sessionInfoFromResponse.roles));
      }
    } else if (finalData.auth_status) {
      const statusOrder = [LoginStatus.GUEST, LoginStatus.AUTH_FAILED, LoginStatus.AUTHENTICATED, LoginStatus.CONNECTED];
      const currentStatus = AppData.loginStatus || LoginStatus.GUEST;
      const currentIdx = statusOrder.indexOf(currentStatus);
      const newIdx = statusOrder.indexOf(finalData.auth_status);
      if (newIdx > currentIdx) {
        AppData.loginStatus = finalData.auth_status;
      }
    }
    return finalData;
  } else {
    // Ensure finalErrorMessage is a string for error checking and throwing
    const rawFinalMessage = finalData?.message;
    const finalErrorMessage = typeof rawFinalMessage === 'string' ? rawFinalMessage : 'Unknown API error';
    console.error(`Error in API call '${command}':`, finalErrorMessage);

    // SIMPLIFIED: Trust the server.
    // We already handled session expiry above. If we are here, it's a different error
    // (e.g. "User not authenticated" for an entitlement gate, or a 500 error).
    // We should NOT clear the session here. The server knows best.
    // If the server wanted to expire the session, it would have returned 401.

    // WS-HEADLESS-MVP-A3: ferry structured error fields (code + data, e.g. the
    // CREDITS_REQUIRED purchasable action) so components can render actions, not prose.
    const err = new Error(finalErrorMessage);
    err.status = status;
    if (finalData?.code) err.code = finalData.code;
    if (finalData?.data) err.data = finalData.data;
    throw err;
  }
};

/**
 * Process onboarding route from server response
 * Validates and normalizes the next_destination object
 * @param {Object} nextDestination - Server-provided routing destination
 * @returns {Object|null} Validated destination or null if invalid
 */
export function processOnboardingRoute(nextDestination) {
  if (!nextDestination || typeof nextDestination !== 'object') {
    return null;
  }
  
  const { view, view_data, deep_link, display_name } = nextDestination;
  
  // Validate view is a known AppContextView
  const validViews = Object.values(AppContextView);
  if (!view || !validViews.includes(view)) {
    console.warn(`[processOnboardingRoute] Invalid view: ${view}`);
    return null;
  }
  
  return {
    view,
    view_data: view_data || {},
    deep_link: deep_link || null,
    display_name: display_name || null,
  };
}

// --- API wrapper functions moved to util/api/ - use Api from util/api ---

