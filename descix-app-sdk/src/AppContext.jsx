// ---------- [./DeSciX_PWA/src/AppContext.jsx] ----------
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import {
  AppContextEvent, AppContextState, AppContextView, AppContextInAppActivity, ProductTypes, RewardTypes, AppData, LoginStatus, AppEventViewData,
  PLATFORM_SCOPE_ID,
  MEMBER_ROLE_ID,
  PERMISSIONS,
  apiProxyUrlPrefix,
  isEmbedded,
  registerAppEventDispatcher,
  registerSessionExpiryCallback,
} from './util/AppData';
import { Api } from './util/api';
import { useDeSciXBridge } from './hooks/useDeSciXBridge';



export const AppContext = createContext();

export const AppProvider = ({ children }) => {


  const [currentChannel, setCurrentChannel] = useState(null);
  const [currentView, triggerViewChange] = useState(AppContextView.LOADING);
  const [appState, setAppState] = useState(AppContextState.INITIALIZING);
  const [appEvent, _setAppEvent] = useState({ type: null, id: 0, payload: null });
  const [currentInAppActivity, _setInAppActivityView] = useState(AppContextInAppActivity.CODESITE);
  const [spinnerMessage, setSpinnerMessage] = useState('');
  const [tokenContractAddresses, setTokenContractAddresses] = useState(null);
  const [viewEventData, setViewEventData] = useState(null); // Data passed to current view (e.g., deviceCode for DEVICE_LOGIN)
  const [isAppMode, setIsAppMode] = useState(false); // V2: App Shell mode

  // --- Initialize DeSciX Bridge Hook ---
  useDeSciXBridge(appState);

  // --- NEW: State for User Roles ---
  const [userRoles, setUserRoles] = useState(AppData.userRoles); // Initialize from AppData cache
  // --- End NEW State ---

  // --- NEW: State for Session Info (React state to trigger re-renders) ---
  const [sessionInfo, _setSessionInfo] = useState(AppData.sessionInfo || null);
  const [loginStatus, _setLoginStatus] = useState(AppData.loginStatus || LoginStatus.GUEST);
  const [custodialBalance, _setCustodialBalance] = useState(AppData.custodialBalance || 0);
  // --- End NEW State ---

  // --- REMOVED: Login Modal State (all auth flows use SignInButton + usePowchBridge) ---
  // --- End Login Modal State ---

  // --- REMOVED: TOS Modal State (bridge-based auth; makeCommandRequestJSON hydrates session) ---
  // --- End TOS Modal State ---

  const isDebugWallet = (import.meta.env.VITE_DEBUG_KEY && !isEmbedded);

  // --- Derived State ---
  const walletAddress = sessionInfo?.wallet_address || null; // Non-custodial address from sessionInfo
  const isNonCustodialWalletConnected = !!walletAddress; // Check if non-custodial wallet is linked
  // --- End Derived State ---

  // --- Helper to set app events ---
  // Supports: setAppEvent('EVENT_NAME') or setAppEvent('EVENT_NAME', payload) or setAppEvent({ type: 'EVENT_NAME', payload })
  const setAppEvent = useCallback((newEvent, payloadArg) => {
    if (typeof newEvent === 'string') {
      // Support two-argument syntax: setAppEvent('EVENT_NAME', payload)
      newEvent = { type: newEvent, payload: payloadArg };
    } else if (typeof newEvent !== 'object' || !newEvent?.type) {
      console.error('AppContext: ERROR setAppEvent called with invalid event:', JSON.stringify(newEvent));
      return;
    }
    _setAppEvent(prev => ({
      type: newEvent.type,
      id: (prev?.id ?? 0) + 1,
      payload: newEvent.payload // Pass payload
    }));
  }, []); // Removed appEvent from dependencies

  // --- In-App Activity View Setter ---
  const setInAppActivityView = useCallback((newView) => {
    _setInAppActivityView(newView);
  }, []); // Removed walletConnected dependency

  // --- Clear Store Cache ---
  const clearStoreCache = useCallback(() => {
    AppData.availableCommunities = [];
    AppData.myCommunities = [];
    AppData.myApps = []; 
    AppData.myTransactions = [];
  }, []);

  // --- Selected Community/App Getters/Setters ---
  const selectedCommunity = AppData.selectedCommunity;
  const setSelectedCommunity = (community) => {
    AppData.selectedCommunity = community;
  }
  const selectedApp = AppData.selectedApp;
  const setSelectedApp = (app) => {
    AppData.selectedApp = app;
  }


  // Unified setters that update both AppData and React state
  const setLoginStatus = useCallback((status) => {
    AppData.loginStatus = status;
    _setLoginStatus(status);
  }, []);

  const setSessionInfo = useCallback((info) => {
    AppData.sessionInfo = info;
    _setSessionInfo(info);
    // Also sync derived values
    if (info?.custodial_balance !== undefined) {
      AppData.custodialBalance = info.custodial_balance;
      _setCustodialBalance(info.custodial_balance);
    }
  }, []);

  const verifyAuthenticationStatus = async (walletAddress, signature) => {
    //wraps the Api.checkAuthenticationStatus function and sets the loginStatus
    if (!walletAddress || !signature) {
      console.error("AppContext: ERROR verifyAuthenticationStatus called with undefined walletAddress or signature");
      return;
    }
    const status = await Api.checkAuthenticationStatus(walletAddress, signature);
    console.log("AppContext: Handling verifyAuthenticationStatus event", (AppData.sdk) ? "SDK PRESENT" : "SDK MISSING", status);
    setLoginStatus(status);
    return status;
  };

  const refreshSession = useCallback(async () => {
    // Re-fetch session info from backend and update React state
    try {
      const status = await Api.checkAuthenticationStatus();
      console.log("AppContext: refreshSession - updated status:", status);
      
      // Update React state with fresh sessionInfo from AppData
      _setSessionInfo(AppData.sessionInfo || null);
      _setLoginStatus(AppData.loginStatus || LoginStatus.GUEST);
      _setCustodialBalance(AppData.custodialBalance || 0);
      setUserRoles(AppData.userRoles);
      
      return status;
    } catch (error) {
      console.error("AppContext: Error refreshing session:", error);
      return LoginStatus.GUEST;
    }
  }, []);

  // viewRouter logic has been moved to PlatformViewProvider (DeSciX_Cloud/site/src/PlatformViewContext.jsx).
  // SDK now fires lifecycle events; app-level view providers handle view routing.

  // --- Refresh User Roles Function ---
  const refreshUserRoles = useCallback(async () => {
    try {
      console.log("Refreshing user roles...");
      const rolesMap = await Api.getMyRoles(); // Fetches and updates AppData.userRoles via makeCommandRequestJSON
      setUserRoles(rolesMap); // Update local state from AppData
      console.log("User roles refreshed:", rolesMap);
    } catch (error) {
      console.error("Failed to refresh user roles:", error);
      // Handle error appropriately, maybe show a notification
    }
  }, []);
  const setCurrentView = (newView, newViewEventData) => {
    setAppEvent({ type: AppContextEvent.CHANGE_VIEW, payload: { view: newView, viewEventData: newViewEventData } });
  };

  // handleLaunchApp has been moved to PlatformViewProvider (DeSciX_Cloud/site/src/PlatformViewContext.jsx).

  async function refreshMyCommunitiesAndApps() {
    try {
      const hadNoCommunities = !AppData.myCommunities || AppData.myCommunities.length === 0;
      await Api.fetchStoreAndPurchases(); // Single call replaces fetchMyCommunitiesAndApps + fetchMyTransactions

      // Set default selected community if this is the first time loading
      if (hadNoCommunities && AppData.myCommunities && AppData.myCommunities.length > 0) {
        setSelectedCommunity(AppData.myCommunities[0]);
      }
      console.log("AppContext: Refresh complete.");
    } catch (error) {
      console.error("AppContext: Error during data refresh:", error);
    }
  };

  // --- Deep Link Generation Functions ---
  const makeCustomDeepLink = async (targetView, appId, communityId, documentId, inAppActivityView, rewardType, rewardAmount) => {
    const guild_id = isEmbedded && AppData.sdk?.guildId ? AppData.sdk.guildId : null;
    const activityId = import.meta.env.VITE_DISCORD_CLIENT_ID;
    const channelId = isEmbedded && AppData.sdk?.channelId ? AppData.sdk.channelId : null;

    // Ensure user is logged in
    if (!AppData.sessionInfo?.id) {
      throw new Error("User not logged in. Cannot generate referral link.");
    }

    const result = await Api.generateReferralCode({
      target_view: targetView,
      target_community_id: communityId || AppData.selectedCommunity?.community_id, // Use selected if not provided
      target_app_id: appId || AppData.selectedApp?.app_id,           // Use selected if not provided
      target_document_id: documentId,
      target_in_app_activity: inAppActivityView,
      source_guild_id: guild_id,
      source_channel_id: channelId,
      source_user_id: AppData.sessionInfo.id, // Included automatically by makeCommandRequestJSON, but explicit here for clarity
      rewardType: rewardType,
      rewardAmount: rewardAmount,
    });

    if (result && result.custom_id) {
      const customId = result.custom_id;
      const referrerId = AppData.sessionInfo.id;
      let baseUrl = isEmbedded ? `https://discord.com/activities/${activityId}` : (import.meta.env.VITE_SITE_URL || window.location.origin);

      // Construct the link using URLSearchParams for safety
      const linkParams = new URLSearchParams();
      linkParams.set('referrer_id', referrerId);
      linkParams.set('custom_id', customId);
      // Optionally add guild_id if needed for external link context (though backend gets it from Promotion doc)
      // if (guild_id) linkParams.set('guild_id', guild_id);

      let referralLink = `${baseUrl}?${linkParams.toString()}`;
      console.log('AppContext: Generated referral link:', referralLink);
      return referralLink; // Return the generated link

    } else {
      throw new Error("API did not return a valid custom_id.");
    }
  };


  const makeDeepLinkToCurrent = async (rewardType = RewardTypes.REF, rewardAmount = 1) => { // Default reward type/amount
    const appId = AppData.selectedApp?.app_id;
    const communityId = AppData.selectedCommunity?.community_id;
    const documentId = null; // Add logic if specific docs can be linked
    const inAppActivityView = currentInAppActivity; // Use current in-app view
    return await makeCustomDeepLink(currentView, appId, communityId, documentId, inAppActivityView, rewardType, rewardAmount);
  };

  // --- State Machine Logic ---
  const stateMachine = useCallback(async (event, payload) => {
    if (!event) {
      console.error('AppContext: ERROR state machine called with undefined event');
      return;
    }
    try {
      // Skip re-auth check for auth-related events that already handled authentication
      const authEvents = [
        AppContextEvent.LOGIN_SUCCESS,
        AppContextEvent.LOGIN_FAILURE,
        AppContextEvent.SDK_CHECKED,
        AppContextEvent.SDK_READY,
        AppContextEvent.SDK_FAILED
      ];
      const isAuthEvent = authEvents.includes(event);
      
      // Use AppData.loginStatus (source of truth) instead of stale React state
      const currentAuthStatus = AppData.loginStatus || LoginStatus.GUEST;
      const isAuthenticated = currentAuthStatus === LoginStatus.AUTHENTICATED || 
                              currentAuthStatus === LoginStatus.CONNECTED;
      
      // Only do re-auth check if:
      // 1. App is READY
      // 2. Not an auth event (which already handled auth)
      // 3. Not currently authenticated according to AppData
      // 4. SDK is available (skip Discord auth in native mode)
      if (appState === AppContextState.READY && !isAuthEvent && !isAuthenticated && AppData.sdk) {
        console.log('AppContext: stateMachine called with READY state but loginStatus is not authenticated, checking auth');
        const status = await Api.checkAuthenticationStatus();
        console.log("AppContext: Re-auth check result", (AppData.sdk) ? "SDK PRESENT" : "SDK MISSING", status);
        setLoginStatus(status);
        if (status === LoginStatus.CONNECTED) {
          setAppEvent(AppContextEvent.LOGIN_SUCCESS);
        }
        // AUTHENTICATED/other: status already updated — Platform handles view routing
      }
      let status, data;

      switch (event) {
        case AppContextEvent.SDK_INITIALIZE:
          break; // SdkInitializer handles this directly

        case AppContextEvent.SDK_READY:
          // SDK is present, but we route to SDK_CHECKED for unified auth/route logic
          console.log("AppContext: SDK_READY, proceeding to SDK_CHECKED.", payload);

          // Handle isolated Standalone App Modes (like Powch or white-label apps)
          if (payload?.mode === 'STANDALONE_APP') {
            console.log(`AppContext: Detected STANDALONE_APP mode for ${payload.appId}, skipping standard checks`);
            setIsAppMode(true);
            // Store app mode config in AppData for StandAloneAppWidget
            AppData.appModeConfig = {
              appId: payload.appId,
              url: payload.url
            };

            // Handle deep links in standalone mode
            if (payload.deepLink) {
              console.log('AppContext: Handling standalone deep link:', payload.deepLink);
              if (payload.deepLink.type === 'CLAIM') {
                setViewEventData({ claimCode: payload.deepLink.code });
                // We don't change view here, StandAloneAppWidget will handle it or we stay in STANDALONE_APP
              }
            }

            setAppState(AppContextState.READY);
            triggerViewChange(AppContextView.STANDALONE_APP);
            return;
          }

          // Pass referral info if any
          setAppEvent({ 
            type: AppContextEvent.SDK_CHECKED, 
            payload: { 
              ...payload,
              sdkReady: true 
            } 
          });
          break;

        case AppContextEvent.SDK_FAILED:
          console.log("AppContext: SDK_FAILED (Native/Guest mode), proceeding to SDK_CHECKED.");
          // Proceed to checked state for native/guest flow
          setAppEvent({ 
            type: AppContextEvent.SDK_CHECKED, 
            payload: { 
              ...payload,
              sdkReady: false 
            } 
          });
          break;

        case AppContextEvent.SDK_CHECKED: {
          console.log("AppContext: SDK_CHECKED event processing - consolidating checks.");
          
          // 1. EXTRACT AND HANDLE DEVICE CODE / REFERRAL CODE
          const urlParams = new URLSearchParams(window.location.search);
          const deviceCode = urlParams.get('code');
          const path = window.location.pathname;
          const isDeviceRoute = path === '/device' || path.startsWith('/device');
          
          // Handle device code
          if (deviceCode || isDeviceRoute) {
            console.log('AppContext: Device code detected in URL:', deviceCode || 'NONE');
            try {
              const validationResult = await Api.validateDeviceLoginRequest(deviceCode);
              if (validationResult.status === 'OK') {
                AppData.refCode = validationResult.message.device_code;
                AppData.refType = 'DEVICE';
                AppData.deviceUserCode = validationResult.message.user_code;
                
                // Check for setup mode
                const isSetupMode = urlParams.get('setup') === 'true' || validationResult.message.setup_mode;
                if (isSetupMode) {
                  console.log('AppContext: Device setup mode detected');
                  AppData.isSetupMode = true;
                }
                
                // Store existing_workspace for pre-population in Workspace Builder
                if (validationResult.message.existing_workspace) {
                  console.log('AppContext: Existing workspace found for pre-population');
                  AppData.existingWorkspace = validationResult.message.existing_workspace;
                }
                
                console.log('AppContext: Device code validated, stored in AppData');
              } else {
                console.error('AppContext: Device code validation failed:', validationResult.message);
                // Continue with normal flow even if validation fails (user can still login normally)
              }
            } catch (error) {
              console.error('AppContext: Error validating device code:', error);
              // Continue with normal flow
            }
          }
          
          // Handle referral code
          const custom_id = urlParams.get('custom_id');
          const referrer_id = urlParams.get('referrer_id');
          const guild_id = urlParams.get('guild_id');
          
          if (custom_id && referrer_id) {
            console.log('AppContext: Referral code detected in URL');
            AppData.refCode = custom_id;
            AppData.refType = 'REFERRAL';
            AppData.referralData = { custom_id, referrer_id, guild_id };
          }
          
          // Strip URL params and redirect to clean URL
          if (deviceCode || custom_id || referrer_id || isDeviceRoute) {
            const cleanUrl = window.location.origin + '/';
            window.history.replaceState({}, '', cleanUrl);
            console.log('AppContext: URL params stripped, redirected to:', cleanUrl);
          }

          // 2. NORMAL AUTH FLOW (Native or Discord)
          status = await Api.checkAuthenticationStatus();
          console.log("AppContext: Handling SDK_CHECKED auth check", (AppData.sdk) ? "SDK PRESENT" : "SDK MISSING", status);
          
          // Handle Auth Status
          if (!status || status === LoginStatus.AUTH_FAILED) {
            if (!AppData.sessionInfo?.id) {
              status = LoginStatus.GUEST;
              setLoginStatus(LoginStatus.GUEST);
            } else {
              setLoginStatus(status);
            }
          } else {
            setLoginStatus(status);
          }

          // Token contract info is now included in the store bundle (fetched during login/view routing)

          // 3. SET READY — Platform handles view routing based on loginStatus
          setAppState(AppContextState.READY);

          if (status === LoginStatus.CONNECTED) {
            // Store deep links for Platform to pick up after LOGIN_SUCCESS
            if (payload?.deepLink) {
              AppData.pendingDeepLink = payload.deepLink;
            }

            setAppEvent(AppContextEvent.LOGIN_SUCCESS);

            // Handle Referral if passed from SDK_READY
            const referral = payload?.referral;
            if (referral) {
              console.log("AppContext: Handling INCOMING_REFERRAL event - payload:", referral);
              handleReferral(referral);
            }
          }
          // AUTHENTICATED, GUEST, other: Platform's initial route handler
          // (useEffect on sdk.appState === READY) handles view routing.
          break;
        }

        case AppContextEvent.LOGIN_START:
          // Platform handles view routing via lifecycle event handler
          break;

        case AppContextEvent.CHANGE_VIEW:
          // Platform handles view routing via lifecycle event handler
          break;

        case AppContextEvent.LOGIN_SUCCESS: {
          console.log("AppContext: LOGIN_SUCCESS event processing.");
          
          // Ensure app state is READY (critical for OAuth callback flow which skips SDK_CHECKED)
          if (appState !== AppContextState.READY) {
            console.log('AppContext: LOGIN_SUCCESS setting appState to READY');
            setAppState(AppContextState.READY);
          }
          
          // Sync React state from AppData (API calls update AppData directly)
          console.log('[DEBUG] LOGIN_SUCCESS: Syncing state from AppData:', AppData.sessionInfo);
          _setSessionInfo(AppData.sessionInfo || null);
          _setLoginStatus(AppData.loginStatus || LoginStatus.GUEST);
          _setCustodialBalance(AppData.custodialBalance || 0);
          setUserRoles(AppData.userRoles);
          
          // Device login flow - no special WALLET view routing needed
          
          // Normal flow: Ensure core data is present or fetched
          await refreshMyCommunitiesAndApps();
          
          // Platform handles view routing via LOGIN_SUCCESS lifecycle event
          break;
        }

        case AppContextEvent.LOGIN_WITH_ROUTING: {
          // NEW: Server-guided login with next_destination routing
          console.log("AppContext: LOGIN_WITH_ROUTING event processing.");
          
          // Ensure app state is READY (critical for OAuth callback flow)
          if (appState !== AppContextState.READY) {
            console.log('AppContext: LOGIN_WITH_ROUTING setting appState to READY');
            setAppState(AppContextState.READY);
          }
          
          const { sessionInfo: newSessionInfo, auth_status, next_destination } = payload || {};
          
          // Sync React state from payload
          if (newSessionInfo) {
            AppData.sessionInfo = newSessionInfo;
            _setSessionInfo(newSessionInfo);
            AppData.custodialBalance = newSessionInfo.custodial_balance || 0;
            _setCustodialBalance(newSessionInfo.custodial_balance || 0);
            if (newSessionInfo.roles) {
              AppData.userRoles = new Map(Object.entries(newSessionInfo.roles));
              setUserRoles(AppData.userRoles);
            }
          }
          
          if (auth_status) {
            AppData.loginStatus = auth_status;
            _setLoginStatus(auth_status);
          }
          
          // Platform handles view routing via LOGIN_WITH_ROUTING lifecycle event
          if (!next_destination?.view) {
            // Fallback: refresh data (Platform will route to default)
            await refreshMyCommunitiesAndApps();
          }
          break;
        }

        case AppContextEvent.LOGIN_FAILURE:
          console.log("AppContext: Handling LOGIN_FAILURE event");
          setLoginStatus(LoginStatus.AUTH_FAILED);
          // Platform handles view routing via lifecycle event handler
          break;

        // ============================================================
        // POWCH ONBOARDING - Bridge-based auth; makeCommandRequestJSON hydrates session
        // ============================================================
        // The following events are DEPRECATED and no longer processed here:
        // - POWCH_LOGIN_COMPLETE: Hook handles identity via direct setters
        // - TOS_ACCEPTED: Hook handles TOS via direct setters
        // - WALLET_CONNECT_REQUEST: Hook handles wallet internally
        // - WALLET_CONNECTED: Hook handles wallet registration
        // 
        // The hook uses direct AppData setters for intermediate state changes
        // and only fires LOGIN_SUCCESS at completion for view navigation.
        // ============================================================

        case AppContextEvent.PURCHASES_REFRESH_REQUESTED:
          console.log("AppContext: PURCHASES_REFRESH_REQUESTED event processing.");
          await refreshMyCommunitiesAndApps();
          // Also refresh available communities (store view)
          await Api.fetchCommunities(true);
          // Optionally refresh other data like roles
          await refreshUserRoles();
          console.log("AppContext: Refresh complete.");
          // Platform handles re-routing via PURCHASES_REFRESH_REQUESTED lifecycle event
          break;

        case AppContextEvent.SESSION_EXPIRED: {
          console.log("AppContext: SESSION_EXPIRED - clearing state and reloading host");
          // Reset React state to match cleared AppData
          _setSessionInfo(null);
          _setLoginStatus(LoginStatus.GUEST);
          _setCustodialBalance(0);
          setUserRoles(null);
          // Full cache clear including chat threads
          AppData.reset();
          // Browser navigate to host root - full reload ensures clean state, correct app (standalone vs platform)
          window.location.href = window.location.origin + '/';
          break;
        }

        default:
          console.warn(`AppContext: Unhandled event: ${event}`);
      }
    } catch (error) {
      console.error(`AppContext: Error in stateMachine handling event ${event}:`, error);
      setAppState(AppContextState.ERROR);
      AppData.reset(); // Reset AppData on error (localStorage will persist)
      setCurrentView(AppContextView.ERROR); // Fallback on error
    }
  }, []); // No dependencies, as this is a state machine

  useEffect(() => {
    const awaitStateMachine = async () => {
      if (appEvent.type) {
        await stateMachine(appEvent.type, appEvent.payload);
      }
    };
    awaitStateMachine();
  }, [appEvent, stateMachine]);

  useEffect(() => {
    // --- V2: App Shell Initialization ---
    // Expose helpers on window for same-origin interframe scripting
    if (appState === AppContextState.READY) {
      window.DeSciX = {
        ...window.DeSciX, // Merge with existing (e.g. from useDeSciXBridge)
        AppData,
        Api,
        registerSessionExpiryCallback,
        AppContext: {
          appState,
          loginStatus,
          sessionInfo,
          selectedCommunity,
          selectedApp,
          setCurrentView,
          setAppEvent,
          refreshSession
        },
        // Direct API access helper
        call: Api.call,
        /** Standard app-sdk API: update session from Powch bridge result. Call after bridge.login() resolves. */
        loginWithSessionToken: (sessionData) => {
          const info = sessionData?.sessionInfo ?? sessionData;
          if (!info?.id && !info?.access_token) return;
          const status = sessionData?.auth_status ?? LoginStatus.CONNECTED;
          AppData.sessionInfo = info;
          AppData.loginStatus = status;
          if (info?.custodial_balance !== undefined) AppData.custodialBalance = info.custodial_balance;
          if (info?.roles !== undefined) AppData.userRoles = new Map(Object.entries(info.roles));
          setSessionInfo(info);
          setLoginStatus(status);
        }
      };
      console.log('[App Shell] DeSciX helpers exposed on window object');
    }
  }, [appState, loginStatus, sessionInfo, selectedCommunity, selectedApp, setCurrentView, setAppEvent, refreshSession, setSessionInfo, setLoginStatus]);

  useEffect(() => {
    // Register the event dispatcher for session expiry handling
    registerAppEventDispatcher(setAppEvent);
    
    if (appState === AppContextState.INITIALIZING) {
      setAppEvent(AppContextEvent.SDK_INITIALIZE);
    }
    
    // Cleanup on unmount
    return () => {
      registerAppEventDispatcher(null);
    };
  }, [setAppEvent]);

  // Parse URL path for community token (e.g., /EGPT) on mount.
  // Deep link parsing (/p/{doc_id}, /t/{file_id}) moved to PlatformViewProvider.
  useEffect(() => {
    if (!isEmbedded) {
      const path = window.location.pathname;

      // Exclude reserved routes
      if (path === '/device' || path.startsWith('/device')) {
        return;
      }

      // Extract token from path like /EGPT or /egpt
      const pathMatch = path.match(/^\/([A-Za-z]+)/);
      if (pathMatch && pathMatch[1]) {
        const tokenSymbol = pathMatch[1].toUpperCase();
        console.log(`AppContext: Detected community token from URL: ${tokenSymbol}`);
        AppData.selectedCommunityToken = tokenSymbol;

        // If user is authenticated, try to fetch and set the community
        if (AppData.sessionInfo?.id) {
          Api.fetchCommunityByTokenSymbol(tokenSymbol).then(community => {
            if (community) {
              setSelectedCommunity(community);
              console.log(`AppContext: Set selected community from URL token: ${community.community_name}`);
            }
          }).catch(err => {
            console.warn(`AppContext: Could not fetch community for token ${tokenSymbol}:`, err);
          });
        }
      }
    }
  }, [isEmbedded, setSelectedCommunity]);

  // --- Referral Validation Handler ---
  const handleReferral = async (payload) => {
    console.log("AppContext: handleReferral validating:", payload);
    if (payload?.custom_id && AppData.sessionInfo?.id) {
      try {
        const validationPayload = {
          custom_id: payload.custom_id,
          referrer_id: payload.referrer_id, // Ensure referrer_id is in payload
          guild_id: payload.guild_id,      // Ensure guild_id is in payload
          // new_user_id is added by makeCommandRequestJSON based on AppData.sessionInfo.id
        };
        const response = await Api.validateReferral(validationPayload);
        console.log("AppContext: Referral validation API response:", response);
        // Optionally show success/error message based on response.message
        if (response.status === 'OK' && response.message && !response.message.includes("already claimed")) {
          // Show success feedback (e.g., toast notification) - Implement UI feedback later
          console.log("Referral success:", response.message);
        } else if (response.status === 'ERROR') {
          // Show error feedback - Implement UI feedback later
          console.error("Referral error:", response.message);
        }
      } catch (error) {
        console.error("AppContext: Referral validation API call failed:", error);
        // Show error feedback - Implement UI feedback later
      }
    } else {
      console.warn("AppContext: handleReferral - missing referral data or user info.");
    }
  };


  // --- Product Purchase/Join/Install Functions (Refactored slightly) ---
  const installApp = async (app, communityId) => {
    // Logic might need refinement based on how AppData.myApps is structured
    const user_id = AppData.sessionInfo?.id;
    if (!user_id || !app || !communityId) {
      console.error("Missing user ID, app, or communityId for installApp");
      return false;
    }
    
    // Check if already installed
    const currentCommunityApps = AppData.myApps || [];
    if (currentCommunityApps.some(a => a.app_id === app.app_id && a.community_id === communityId)) {
      console.log(`App ${app.app_id} already installed.`);
      return true;
    }

    try {
      const response = await Api.purchaseProduct(app, ProductTypes.APP);
      
      if (response.needsOnboarding) {
        // User needs to complete onboarding - go to Dashboard
        setAppEvent({ type: AppContextEvent.CHANGE_VIEW, payload: { view: AppContextView.TRADING_DASHBOARD } });
        return false;
      }

      if (response.status === 'OK') {
        console.log(`Successfully purchased/installed app ${app.app_id}`);
        await refreshMyCommunitiesAndApps();
        return true;
      } else {
        console.error(`Failed to install app ${app.app_id}:`, response.message);
        return false;
      }
    } catch (error) {
      console.error(`Error installing app ${app.app_id}:`, error);
      return false;
    }
  };


  const joinCommunity = async (community) => {
    const user_id = AppData.sessionInfo?.id;
    if (!user_id || !community?.community_id) {
      console.error("Missing user ID or community info for joinCommunity");
      return false;
    }
    // Check if already joined
    if (AppData.myCommunities?.some(c => c.community_id === community.community_id)) {
      console.log(`Already joined community ${community.community_id}`);
      return true;
    }

    try {
      const response = await Api.purchaseProduct(community, ProductTypes.COMMUNITY);

      if (response.needsOnboarding) {
        // User needs to complete onboarding - go to Dashboard
        setAppEvent({ type: AppContextEvent.CHANGE_VIEW, payload: { view: AppContextView.TRADING_DASHBOARD } });
        return false;
      }

      if (response.status === 'OK') {
        console.log(`Successfully joined community ${community.community_id}`);
        await refreshMyCommunitiesAndApps();
        return true;
      } else {
        console.error(`Failed to join community ${community.community_id}:`, response.message);
        return false;
      }
    } catch (error) {
      console.error(`Error joining community ${community.community_id}:`, error);
      return false;
    }
  };

  // --- Uninstall Functions (Local-only: removes from cache, entitlement persists on server) ---
  const uninstallApp = (app) => {
    AppData.myApps = (AppData.myApps || []).filter(a => a.app_id !== app.app_id);
    setCurrentView(AppContextView.MY_APPS);
  };

  const uninstallCommunity = (community) => {
    AppData.myCommunities = (AppData.myCommunities || []).filter(c => c.community_id !== community.community_id);
    AppData.myApps = (AppData.myApps || []).filter(a => a.community_id !== community.community_id);
    setCurrentView(AppContextView.MY_APPS);
  };


  // --- Fetch Current Channel (Keep existing logic) ---
  const fetchCurrentChannel = async () => {
    console.log('Fetching current channel...');
    if (AppData.sdk) {
      if (!isEmbedded) {
        const mockchannel = { id: 'mock-channel-id', name: 'DESCIX', guild_id: 'mock-guild-id' }; // Mock structure
        setCurrentChannel(mockchannel);
        // Fetch mock/default community?
        // await fetchCommunity("DESCIX");
        return;
      }
      try {
        const channel = await AppData.sdk.commands.getChannel({ channel_id: AppData.sdk.channelId });
        console.log('Current Channel:', channel);
        setCurrentChannel(channel);
        // Fetch community based on channel/category? This logic needs review.
        // const communityName = channel.name.split('-')[0];
        // await fetchCommunity(communityName);
      } catch (error) {
        console.error('Error fetching current channel:', error);
      }
    }
  }; // No dependencies? Maybe add sdk readiness?

  // --- Provide context values ---
  return (
    <AppContext.Provider
      value={{
        // State & Setters
        currentView, setCurrentView: (view, data) => setAppEvent({ type: AppContextEvent.CHANGE_VIEW, payload: { view, viewEventData: data } }), // Use setAppEvent
        appState,
        appEvent, setAppEvent,
        currentInAppActivity, setInAppActivityView,
        spinnerMessage, setSpinnerMessage,
        tokenContractAddresses,
        userRoles, // Provide user roles state
        refreshUserRoles, // Provide function to refresh roles
        viewEventData, // View-specific data (e.g., deviceCode for DEVICE_LOGIN)

        // Derived State
        loginStatus,
        setLoginStatus, // Export setLoginStatus for components
        custodialBalance,
        isNonCustodialWalletConnected, // Maybe rename for clarity
        walletAddress, // Non-custodial address
        sessionInfo, // Export sessionInfo React state for components
        setSessionInfo, // Export setter for components

        // REMOVED: Login Modal State - all auth flows use SignInButton + bridge
        // REMOVED: TOS Modal State - bridge-based auth

        // Selected Context
        selectedCommunity, setSelectedCommunity,
        selectedApp, setSelectedApp,

        // Core Functions
        verifyAuthenticationStatus,
        refreshSession,
        refreshMyCommunitiesAndApps,
        makeCustomDeepLink,
        makeDeepLinkToCurrent,

        // V2 App Shell
        isAppMode,
        setIsAppMode,
        appModeConfig: AppData.appModeConfig, // NEW: Provide appModeConfig via context

        // Utilities & Constants
        isEmbedded,
        isDebugWallet,
        apiUrlPrefix: apiProxyUrlPrefix,
        clearStoreCache,
        MEMBER_ROLE_ID, // Export constant
        PERMISSIONS, // Export permissions

        // Product/Community/App Management (Frontend Actions)
        joinCommunity, handleInstallCommunity: joinCommunity,
        installApp,
        uninstallApp,
        uninstallCommunity,

        // Other (Consider if still needed)
        currentChannel, fetchCurrentChannel, // Still relevant?

      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};
