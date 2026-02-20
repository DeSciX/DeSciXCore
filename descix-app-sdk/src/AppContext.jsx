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

  // --- REMOVED: Login Modal State (all auth flows use OnboardingWidget) ---
  // OnboardingWidget is a self-contained wizard that handles the entire auth flow
  // --- End Login Modal State ---

  // --- REMOVED: TOS Modal State (now handled by useOnboardingFlow hook) ---
  // TOS modal is owned by OnboardingWidget, not AppContext
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

  const viewRouter = async (targetView, viewEventData) => {

    // if (appState === AppContextState.INITIALIZING) {
    //   console.log('AppContext: viewRouter called with INITIALIZING state, returning LOADING');
    //   return AppContextView.LOADING;\
    // } else if (appState === AppContextState.ERROR) {
    //   console.log('AppContext: viewRouter called with ERROR state, returning WELCOME');
    //   return AppContextView.WELCOME;
    // }

    if (targetView === AppContextView.ERROR) {
      return targetView;
    }
    
    // ============================================================
    // WALLET REQUIRED - Force onboarding completion if missing wallet
    // User has identity but no wallet connected (regardless of cached status).
    // This catches both AUTHENTICATED users AND users who incorrectly got
    // CONNECTED status without actually having a wallet.
    // OnboardingBlocker will overlay, but we need app state correct.
    // ============================================================
    const currentAuthStatus = AppData.loginStatus;
    const hasSession = AppData.sessionInfo?.id;
    const hasWallet = AppData.sessionInfo?.wallet_address;
    const isLoggedInWithoutWallet = hasSession && !hasWallet && currentAuthStatus !== LoginStatus.GUEST;
    
    if (isLoggedInWithoutWallet) {
      console.log('AppContext: User logged in without wallet - enforcing onboarding. Status:', currentAuthStatus);
      // Correct the login status to AUTHENTICATED (not CONNECTED) since no wallet
      if (currentAuthStatus === LoginStatus.CONNECTED) {
        console.log('AppContext: Correcting login status from', currentAuthStatus, 'to AUTHENTICATED (no wallet)');
        AppData.loginStatus = LoginStatus.AUTHENTICATED;
        _setLoginStatus(LoginStatus.AUTHENTICATED);
      }
      // Ensure appState is READY so OnboardingBlocker can render properly
      if (appState !== AppContextState.READY) {
        setAppState(AppContextState.READY);
      }
      // Navigate to Trading Dashboard - OnboardingBlocker will overlay
      // Only redirect if not already going there (avoid infinite loop)
      if (targetView !== AppContextView.TRADING_DASHBOARD) {
        console.log('AppContext: Redirecting user without wallet to TRADING_DASHBOARD for onboarding');
        triggerViewChange(AppContextView.TRADING_DASHBOARD);
        return AppContextView.TRADING_DASHBOARD;
      }
    }
    // ============================================================

    // Check if the target view is the same as the current view && the current view is not LOADING or WELCOME, all other views may be doing async work
    if (currentView === targetView && !(currentView === AppContextView.LOADING || currentView === AppContextView.WELCOME)) {
      console.log('Ignoring view change to the same view:', targetView);
      return targetView;
    }

    // Check if the target view is LOADING or WELCOME, and if so, trigger the view change immediately
    if (targetView === AppContextView.LOADING || targetView === AppContextView.WELCOME) {
      triggerViewChange(targetView);
      return targetView;
    }

    // Set loading state before async operations
    triggerViewChange(AppContextView.LOADING);

    console.log('AppContent: viewRouter called with targetView:', targetView, 'viewEventData:', JSON.stringify(viewEventData));

    let localCommunity = selectedCommunity; // Store locally for async context
    let localApp = selectedApp; // Store locally for async context



    // WALLET view REMOVED - auth flows now handled by OnboardingWidget
    // If somehow WALLET view is requested, redirect to Dashboard
    if (targetView === AppContextView.WALLET) {
      console.log('AppContext: WALLET view requested but removed - redirecting to Dashboard');
      triggerViewChange(AppContextView.TRADING_DASHBOARD);
      return AppContextView.TRADING_DASHBOARD;
    }

    // DEVICE_LOGIN view - no authentication required, used for CLI/MCP login flow
    if (targetView === AppContextView.DEVICE_LOGIN) {
      // Check if this is actually a setup flow
      if (AppData.isSetupMode) {
        console.log('AppContext: Redirecting DEVICE_LOGIN to DEVICE_SETUP due to setup mode');
        triggerViewChange(AppContextView.DEVICE_SETUP);
        return AppContextView.DEVICE_SETUP;
      }
      
      // Store viewEventData (contains deviceCode) for DeviceLoginWidget
      setViewEventData(viewEventData);
      triggerViewChange(targetView);
      return targetView;
    }

    // DEVICE_SETUP view - Workspace Builder
    if (targetView === AppContextView.DEVICE_SETUP) {
      setViewEventData(viewEventData);
      triggerViewChange(targetView);
      return targetView;
    }

    // CLAIM_PAGE view
    if (targetView === AppContextView.CLAIM_PAGE) {
      setViewEventData(viewEventData);
      triggerViewChange(targetView);
      return targetView;
    }

    // if (!isEmbedded) {
    //   const params = new URLSearchParams(window.location.search);
    //   const hasPaymentComplete = params.get('payment_complete') === 'true';
    //   if (!hasPaymentComplete && !params.has('user_id') && !params.has('code') && !isDebugWallet) {
    //     console.log('AppContent: No user_id or code, showing Welcome');
    //     // Clear cached session to avoid forced logged-in state when no auth params
    //     try {
    //       AppData.reset();
    //       localStorage.clear();
         
    //     } catch (err) {
    //       console.error('Failed to clear cached session:', err);
    //     }
    //     if (currentView !== AppContextView.WELCOME) return AppContextView.WELCOME; // Show welcome screen for non-embedded, no context
    //   }
    // } else {
    //   // If embedded and the app is not ready
    // }



    if (targetView === AppContextView.APP_STORE || targetView === AppContextView.APP_USAGE || targetView === AppContextView.COMMUNITY_LOBBY) { // Added COMMUNITY_LOBBY here
      if (!AppData.myCommunities || AppData.myCommunities.length === 0 || !AppData.myApps || AppData.myApps.length === 0) {
        console.log('AppContext: No communities or apps found, fetching purchases');
        let myPurchases = await Api.fetchMyCommunitiesAndApps();
        if (!(myPurchases && myPurchases.communities && myPurchases.communities.length > 0)) {
          console.log('AppContext: No communities found, going to COMMUNITY STORE');
          targetView = AppContextView.COMMUNITY_STORE;
          return targetView;
        }

        if (targetView === AppContextView.APP_USAGE && myPurchases && (!myPurchases.apps || myPurchases.apps.length === 0)) {
          console.log('AppContext: No purchased apps found, going to MY_APPS');
          targetView = AppContextView.MY_APPS;
          return targetView;
        }
        AppData.myCommunities = myPurchases.communities;
        AppData.myApps = myPurchases.apps;
      }


      if (viewEventData?.communityId) { // Check optional chaining
        localCommunity = AppData.myCommunities.find(c => c.community_id === viewEventData.communityId);
        if (!localCommunity) {
          console.log('AppContext: No community found for app, going to COMMUNITY_STORE');
          targetView = AppContextView.COMMUNITY_STORE;
          return targetView;
        }
      } else if (targetView === AppContextView.COMMUNITY_LOBBY) {
        // For Lobby, default to the first community if no communityId in viewEventData
        if (AppData.myCommunities && AppData.myCommunities.length > 0) {
          localCommunity = AppData.myCommunities[0];
        } else if (loginStatus === LoginStatus.GUEST) {
          // GUEST: Fetch promoted communities and set EGPT as default
          console.log('AppContext: GUEST user - fetching promoted communities');
          try {
            const promotedCommunities = await Api.fetchFeaturedCommunities(true);
            // Find EGPT community or use first promoted community
            const egptCommunity = promotedCommunities.find(c => 
              c.token_symbol && c.token_symbol.toUpperCase() === 'EGPT'
            ) || promotedCommunities[0];
            
            if (egptCommunity) {
              localCommunity = egptCommunity;
              AppData.availableCommunities = promotedCommunities;
              // Set EGPT as selected community token
              if (egptCommunity.token_symbol) {
                AppData.selectedCommunityToken = egptCommunity.token_symbol.toUpperCase();
              }
              console.log(`AppContext: GUEST - Set promoted community: ${egptCommunity.community_name}`);
            } else {
              console.log('AppContext: No promoted communities found for GUEST');
              targetView = AppContextView.WELCOME;
              return targetView;
            }
          } catch (error) {
            console.error('AppContext: Error fetching promoted communities for GUEST:', error);
            targetView = AppContextView.WELCOME;
            return targetView;
          }
        } else {
          console.log('AppContext: No communities to show Lobby, going to COMMUNITY_STORE');
          targetView = AppContextView.COMMUNITY_STORE; // Or MY_APPS?
          return targetView;
        }
      }


      if (targetView === AppContextView.APP_USAGE) {
        localApp = AppData.myApps.find(a => a.app_id === viewEventData.appId && a.community_id === localCommunity.community_id);
        if (!localApp) {
          console.log('AppContext: No app found for community, going to MY_APPS');
          targetView = AppContextView.MY_APPS;
          return targetView;
        }
      }
    }


    if (targetView === AppContextView.APP_STORE) {
      let communityApps = localCommunity.apps || await Api.fetchFeaturedApps(localCommunity.community_id);
      localCommunity.apps = communityApps;
      if (!localCommunity.apps || localCommunity.apps.length === 0) {
        console.log('AppContext: No apps found for community, going to COMMUNITY_STORE');
        targetView = AppContextView.COMMUNITY_STORE;
        return targetView;
      }
    } else if (targetView === AppContextView.APP_USAGE) {
      if (viewEventData && viewEventData.AppContextInAppActivityType) {
        setInAppActivityView(viewEventData.AppContextInAppActivityType);
      }
    } else if (targetView === AppContextView.COMMUNITY_STORE && (!AppData.myCommunities && !AppData.availableCommunities || AppData.availableCommunities.length === 0)) {
      if (loginStatus === LoginStatus.CONNECTED || loginStatus === LoginStatus.GUEST) {
        //get the featured communities (GUEST can see promoted communities)
        let featuredCommunities = await Api.fetchFeaturedCommunities(true);
        AppData.availableCommunities = featuredCommunities || [];
      } else {
        targetView = AppContextView.WELCOME;
      }
    } else {
      if (targetView === AppContextView.MY_APPS && (!AppData.myCommunities || AppData.myCommunities.length === 0)) {
        targetView = AppContextView.COMMUNITY_STORE;
      }
    }

    // NEW: When switching to COMMUNITY_LOBBY, fetch lobby data and attach to the community object
    if (targetView === AppContextView.COMMUNITY_LOBBY && localCommunity) {
      // Log community lobby view event
      try {
        await Api.logContentEvent({
          event_type: 'PAGE_VIEW',
          entity_type: 'COMMUNITY',
          entity_id: localCommunity.community_id,
          community_id: localCommunity.community_id
        });
      } catch (error) {
        console.error('Error logging community lobby view:', error);
      }
      try {
        const details = await Api.getCommunityDetails(localCommunity.community_id);
        // For GUEST users, skip user stats (requires authentication)
        let stats = null;
        if (loginStatus !== LoginStatus.GUEST) {
          stats = await Api.getUserCommunityStats(localCommunity.community_id);
        } else {
          // GUEST: Provide empty stats
          stats = { stats: { community_dip: 0, community_ref: 0, community_rep: 0 }, token_balance: 0 };
        }
        // Use details if available, otherwise create a shallow copy to avoid circular reference
        localCommunity.lobbyData = {
          communityDetails: details || { ...localCommunity, lobbyData: undefined },
          userStats: stats
        };
      } catch (error) {
        console.error("Error fetching Community Lobby data:", error);
        // For GUEST, provide fallback data
        if (loginStatus === LoginStatus.GUEST) {
          // Create a shallow copy to avoid circular reference
          localCommunity.lobbyData = {
            communityDetails: { ...localCommunity, lobbyData: undefined },
            userStats: { stats: { community_dip: 0, community_ref: 0, community_rep: 0 }, token_balance: 0 }
          };
        }
      }
    }

    if (viewEventData) {
      setSelectedCommunity(localCommunity);
      setSelectedApp(localApp);
    }

    triggerViewChange(targetView);
    return targetView;
  };

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

  // --- Function to handle launching an app ---
  const handleLaunchApp = async (app, inAppActivityView = AppContextInAppActivity.CODESITE) => { // Default to CODESITE
    if (!app || !app.community_id || !app.app_id) {
      console.error("AppContext: Invalid app object provided to handleLaunchApp");
      return;
    }
    // Ensure the community context is set correctly first
    if (selectedCommunity?.community_id !== app.community_id) {
      const community = AppData.myCommunities.find(c => c.community_id === app.community_id);
      if (community) {
        setSelectedCommunity(community);
      } else {
        console.error(`AppContext: Community ${app.community_id} not found in user's communities.`);
        // Maybe fetch community details? Or redirect?
        setCurrentView(AppContextView.COMMUNITY_STORE);
        return;
      }
    }
    // Now set the app and trigger the view change
    setSelectedApp(app);
    let newEventViewData = new AppEventViewData(app.community_id, app.app_id, AppContextView.APP_USAGE, inAppActivityView);
    await viewRouter(AppContextView.APP_USAGE, newEventViewData); // Use viewRouter to handle transition
  };

  async function refreshMyCommunitiesAndApps() {
    try {
      // Always fetch the latest data from backend
      const hadNoCommunities = !AppData.myCommunities || AppData.myCommunities.length === 0;
      
      await Api.fetchMyCommunitiesAndApps();
      await Api.fetchMyTransactions();

      // Set default selected community if this is the first time loading
      if (hadNoCommunities && AppData.myCommunities && AppData.myCommunities.length > 0) {
        setSelectedCommunity(AppData.myCommunities[0]);
      }
      console.log("AppContext: Refresh complete.");
    } catch (error) {
      console.error("AppContext: Error during data refresh:", error);
      // Handle error appropriately
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
        } else if (status === LoginStatus.AUTHENTICATED) {
          // Handle TOS acceptance
          await viewRouter(AppContextView.TRADING_DASHBOARD, null);
        }
      }
      let status, data, params, hasPaymentComplete;

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

          // Fetch Token Contracts
          data = await Api.getTokenContractAddresses();
          setTokenContractAddresses(data);

          // 3. DETERMINE VIEW BASED ON AUTH STATUS
          if (status === LoginStatus.CONNECTED) {
            setAppState(AppContextState.READY);
            
            // Handle Deep Links
            if (payload?.deepLink) {
              const { type, code, route } = payload.deepLink;
              if (type === 'CLAIM') {
                setViewEventData({ claimCode: code });
                triggerViewChange(AppContextView.CLAIM_PAGE); // Assuming this exists or we use viewRouter
                return;
              }
              if (type === 'TEST' && route === 'powch-hello') {
                // Handle test routes
                triggerViewChange(AppContextView.LOADING); // Placeholder
                // ...
              }
            }

            setAppEvent(AppContextEvent.LOGIN_SUCCESS);
            
            // Handle Referral if passed from SDK_READY
            const referral = payload?.referral;
            if (referral) {
              console.log("AppContext: Handling INCOMING_REFERRAL event - payload:", referral);
              handleReferral(referral);
            }
          } else if (status === LoginStatus.AUTHENTICATED) {
            // User has identity but needs wallet - viewRouter will handle redirect + OnboardingBlocker
            setAppState(AppContextState.READY);
            await viewRouter(AppContextView.TRADING_DASHBOARD, null);
          } else if (status === LoginStatus.GUEST) {
            setAppState(AppContextState.READY);
            
            // Handle payment complete param (was in SDK_FAILED)
            const params = new URLSearchParams(window.location.search);
            hasPaymentComplete = params.get('payment_complete') === 'true';
            
            if (hasPaymentComplete) {
              // Guest returning from payment - go to Dashboard
              console.log('AppContext: Guest returning from payment - going to Dashboard');
              await viewRouter(AppContextView.TRADING_DASHBOARD, null);
            } else {
              // Standard Guest -> Trading Dashboard (new default home)
              await viewRouter(AppContextView.TRADING_DASHBOARD, null);
            }
          } else {
            // Not authenticated -> Welcome
            setAppState(AppContextState.READY);
            await viewRouter(AppContextView.WELCOME, null);
          }
          break;
        }

        //Handle manual login
        case AppContextEvent.LOGIN_START:
          //Go to the welcome page
          await viewRouter(AppContextView.WELCOME, null);
          break;

        case AppContextEvent.CHANGE_VIEW: {
          const { view, viewEventData } = payload;
          const newFinalView = await viewRouter(view, viewEventData);
          break;
        }

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
          
          // Device login flow now handled by OnboardingWidget - no special WALLET view routing needed
          // Device login completion happens in useOnboardingFlow.completeOnboarding()
          
          // Normal flow: Ensure core data is present or fetched
          await refreshMyCommunitiesAndApps();
          
          // Navigate based on mode
          if (AppData.isSetupMode) {
            console.log('AppContext: Setup mode detected - going to DEVICE_SETUP');
            await viewRouter(AppContextView.DEVICE_SETUP, null);
          } else {
            // Navigate to Trading Dashboard (new default home)
            await viewRouter(AppContextView.TRADING_DASHBOARD, null);
          }

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
          
          // Navigate to server-specified destination
          if (next_destination?.view) {
            console.log('AppContext: LOGIN_WITH_ROUTING - navigating to:', next_destination.view);
            await viewRouter(next_destination.view, next_destination.view_data || null);
            
            // Update browser URL if deep_link provided
            if (next_destination.deep_link && !isEmbedded) {
              window.history.pushState(null, '', next_destination.deep_link);
            }
          } else {
            // Fallback to default destination
            await refreshMyCommunitiesAndApps();
            await viewRouter(AppContextView.TRADING_DASHBOARD, null);
          }
          break;
        }

        case AppContextEvent.LOGIN_FAILURE:
          console.log("AppContext: Handling LOGIN_FAILURE event");
          setLoginStatus(LoginStatus.AUTH_FAILED);
          await viewRouter(AppContextView.WELCOME, null);
          break;

        // ============================================================
        // POWCH ONBOARDING - Now handled by useOnboardingFlow hook
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
          console.log("AppContext: Refresh complete, staying on current view or navigating.");
          // Decide where to navigate after refresh, e.g., stay or go to My Apps/Lobby
          await viewRouter(currentView, null); // Re-run view logic for current view
          break;

        case AppContextEvent.SESSION_EXPIRED: {
          console.log("AppContext: SESSION_EXPIRED - clearing state and reloading host");
          // Reset React state to match cleared AppData
          _setSessionInfo(null);
          _setLoginStatus(LoginStatus.GUEST);
          _setCustodialBalance(0);
          setUserRoles(null);
          // Clear store cache
          clearStoreCache();
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
          currentView,
          appState,
          loginStatus,
          sessionInfo,
          selectedCommunity,
          selectedApp,
          setCurrentView,
          setAppEvent,
          handleLaunchApp,
          refreshSession
        },
        // Direct API access helper
        call: Api.call
      };
      console.log('[App Shell] DeSciX helpers exposed on window object');
    }
  }, [appState, currentView, loginStatus, sessionInfo, selectedCommunity, selectedApp, setCurrentView, setAppEvent, handleLaunchApp, refreshSession]);

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

  // NEW: Parse URL path for community token (e.g., /EGPT) or deep links on mount
  useEffect(() => {
    if (!isEmbedded) {
      const path = window.location.pathname;
      const urlParams = new URLSearchParams(window.location.search);
      
      // Exclude reserved routes
      if (path === '/device' || path.startsWith('/device')) {
        return;
      }
      
      // Handle proposed document deep links: /p/{doc_id}
      const proposedMatch = path.match(/^\/p\/([^/]+)/);
      if (proposedMatch && proposedMatch[1]) {
        const proposedDocId = proposedMatch[1];
        const referrerId = urlParams.get('ref') || urlParams.get('referrer_id');
        console.log(`AppContext: Detected proposed doc deep link: ${proposedDocId}, referrer: ${referrerId}`);
        
        // Set view data and navigate to PROPOSED_DOC view
        setViewEventData({ proposedDocId, referrerId });
        triggerViewChange(AppContextView.PROPOSED_DOC);
        return;
      }
      
      // Handle saved thread deep links: /t/{file_id} (requires auth)
      const threadMatch = path.match(/^\/t\/([^/]+)/);
      if (threadMatch && threadMatch[1]) {
        const threadFileId = threadMatch[1];
        console.log(`AppContext: Detected thread deep link: ${threadFileId}`);
        
        // Store for later when authenticated
        AppData.pendingThreadFileId = threadFileId;
        // Will need to load and display after auth
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
  }, [isEmbedded, setSelectedCommunity, setViewEventData, triggerViewChange]);

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
        // User needs to complete onboarding - go to Dashboard (OnboardingBlocker will handle)
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
        // User needs to complete onboarding - go to Dashboard (OnboardingBlocker will handle)
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

  // --- Uninstall Functions (Local state removal only - consider backend integration later) ---
  const uninstallApp = (app, communityId) => {
    console.warn("Uninstalling app locally - backend integration needed for full removal.");
    const currentApps = AppData.myApps || {};
    const communityApps = currentApps[communityId] || [];
    const updatedApps = communityApps.filter((a) => a.app_id !== app.app_id);
    AppData.myApps = { ...currentApps, [communityId]: updatedApps };
    // Trigger UI update if necessary (e.g., refresh My Apps view)
    setCurrentView(AppContextView.MY_APPS);
  };

  const uninstallCommunity = (community) => {
    console.warn("Uninstalling community locally - backend integration needed.");
    const currentCommunities = AppData.myCommunities || [];
    const updatedCommunities = currentCommunities.filter((p) => p.community_id !== community.community_id);
    AppData.myCommunities = updatedCommunities;
    // Also remove apps associated with this community from local cache
    const currentApps = AppData.myApps || {};
    delete currentApps[community.community_id];
    AppData.myApps = currentApps;
    // Trigger UI update
    setCurrentView(AppContextView.COMMUNITY_STORE);
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

        // REMOVED: Login Modal State - all auth flows use OnboardingWidget
        // REMOVED: TOS Modal State - owned by OnboardingWidget

        // Selected Context
        selectedCommunity, setSelectedCommunity,
        selectedApp, setSelectedApp,

        // Core Functions
        verifyAuthenticationStatus,
        refreshSession,
        refreshMyCommunitiesAndApps,
        handleLaunchApp,
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
