import React, { useEffect, useRef, useCallback } from 'react';
import { AppContextEvent, AppData } from '../util/AppData';
import { Api } from '../util/api';
import { useAppContext } from '../AppContext';
import { DiscordSDK, DiscordSDKMock, patchUrlMappings } from '@discord/embedded-app-sdk';
import ErrorBoundary from './ErrorBoundary';

// Module-level flag for SYNCHRONOUS OAuth detection (prevents race condition)
let oauthCallbackDetected = false;
let oauthCallbackCode = null;
let oauthCallbackProvider = null;

/**
 * SYNCHRONOUSLY detect if URL contains an OAuth callback
 * This runs immediately on module load to set flags before any React renders
 * Returns detection info, does NOT make API calls
 */
function detectOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    
    if (!code || !state) {
        return { detected: false };
    }
    
    // Check for Google OAuth callback
    const googleStoredState = sessionStorage.getItem('google_oauth_state');
    if (googleStoredState && googleStoredState === state) {
        console.log('[SdkInitializer] Detected Google OAuth callback (sync)');
        // Clean URL IMMEDIATELY to prevent other code from seeing the code
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        // Clear state
        sessionStorage.removeItem('google_oauth_state');
        return { detected: true, provider: 'google', code };
    }
    
    // Check for Discord OAuth callback (state is JSON with random field)
    const discordStoredState = sessionStorage.getItem('discord_oauth_state');
    if (discordStoredState) {
        try {
            const storedStateObj = JSON.parse(discordStoredState);
            const urlStateObj = JSON.parse(state);
            
            // Check if random field matches (we use 'random' not 'nonce')
            if (urlStateObj && storedStateObj.random === urlStateObj.random) {
                console.log('[SdkInitializer] Detected Discord OAuth callback (sync)');
                // Clean URL IMMEDIATELY
                const cleanUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
                // Clear state
                sessionStorage.removeItem('discord_oauth_state');
                return { detected: true, provider: 'discord', code };
            }
        } catch (parseError) {
            // State parsing failed, not a Discord OAuth callback
        }
    }
    
    return { detected: false };
}

// Run SYNCHRONOUSLY on module load (before any React component mounts)
const oauthDetection = detectOAuthCallback();
if (oauthDetection.detected) {
    oauthCallbackDetected = true;
    oauthCallbackCode = oauthDetection.code;
    oauthCallbackProvider = oauthDetection.provider;
}

/**
 * Process the detected OAuth callback (async API call)
 * Only called after synchronous detection
 */
async function processOAuthCallback(provider, code) {
    try {
        if (provider === 'google') {
            return await Api.checkGoogleAuthenticationStatus(code);
        } else if (provider === 'discord') {
            return await Api.checkDiscordAuthenticationStatus(code);
        }
    } catch (error) {
        console.error(`[SdkInitializer] ${provider} OAuth callback error:`, error);
        return { status: 'AUTH_FAILED', error: error.message };
    }
    return { status: 'AUTH_FAILED', error: 'Unknown provider' };
}


const gtmId = import.meta.env.VITE_GTM_ID;
const gtmAuth = import.meta.env.VITE_GTM_AUTH;
const gtmPreview = import.meta.env.VITE_GTM_PREVIEW;

// Remove 'isEmbedded' variable from SdkInitializer.js
// const queryParams = new URLSearchParams(window.location.search);
// const isEmbedded = queryParams.get('frame_id') != null;


/* DO NOT REMOVE! This is a hard to get list of scopes that are needed for the bot to work properly.

    // "applications.builds.upload",
    // "applications.builds.read",
    // "applications.store.update",
    // "applications.entitlements",
    // "bot",
    "identify",
    // "connections",
    // "email",
    // "gdm.join",
    "guilds",
    // "guilds.join",
    // "guilds.members.read",
    // "messages.read",
    // "relationships.read",
    // 'rpc.activities.write',
    // "rpc.notifications.read",
    // "rpc.voice.write",
    // "rpc.voice.read",
    // "webhook.incoming",
*/




const initializeGtm = (isEmbeddedEnvironment) => {
    if (!gtmId || !gtmAuth || !gtmPreview) {
        console.error('GTM Initializer: Missing GTM config — VITE_GTM_ID, VITE_GTM_AUTH, or VITE_GTM_PREVIEW not set at build time.');
        return;
    }
    window.dataLayer = window.dataLayer || [];

    const isGtmScriptPresent = () => {
        const scripts = document.getElementsByTagName('script');
        for (let i = 0; i < scripts.length; i++) {
            if (scripts[i].src.includes('/gtm.js') || scripts[i].src.includes('googletagmanager.com/gtm.js')) {
                return true;
            }
        }
        return false;
    };

    if (isGtmScriptPresent()) {
        console.log('GTM Initializer: GTM script already present.');
        return;
    }

    console.log('GTM Initializer: Initializing GTM...');

    window.dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
    });

    const script = document.createElement('script');
    script.async = true;

    const envParams = `&gtm_auth=${gtmAuth}&gtm_preview=${gtmPreview}&gtm_cookies_win=x`;
    if (isEmbeddedEnvironment) {
        script.src = `/gtm/gtm.js?id=${gtmId}${envParams}`;
        console.log(`GTM Initializer: Injecting GTM script with mapped URL: ${script.src}`);
    } else {
        script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}${envParams}`;
        console.log(`GTM Initializer: Injecting GTM script with standard URL: ${script.src}`);
    }

    document.head.appendChild(script);
};


const SdkInitializer = ({ children }) => {
    const { appEvent, setAppEvent, isEmbedded } = useAppContext(); // Get isEmbedded from context
    const isSdkInitialized = useRef(false);
    const isGtmInitialized = useRef(false); // Track GTM initialization specifically
    const isOAuthProcessed = useRef(false); // Track if OAuth API call was completed

    // Process OAuth callback if detected (module-level detection already ran)
    // This only makes the API call - URL was already cleaned synchronously
    useEffect(() => {
        if (isOAuthProcessed.current || isEmbedded || !oauthCallbackDetected) return;
        
        isOAuthProcessed.current = true;
        
        const processCallback = async () => {
            console.log(`SdkInitializer: Processing ${oauthCallbackProvider} OAuth callback`);
            
            const result = await processOAuthCallback(oauthCallbackProvider, oauthCallbackCode);
            
            if (result?.status && result.status !== 'AUTH_FAILED') {
                // OAuth was successful - dispatch success event
                console.log('SdkInitializer: OAuth authentication successful, dispatching LOGIN_SUCCESS');
                setAppEvent(AppContextEvent.LOGIN_SUCCESS, {
                    sessionInfo: result.sessionInfo,
                    next_destination: result.next_destination,
                    provider: oauthCallbackProvider
                });
            } else {
                // OAuth failed - dispatch SDK_FAILED to allow normal guest flow
                console.error('SdkInitializer: OAuth failed:', result?.error);
                setAppEvent(AppContextEvent.SDK_FAILED);
            }
        };
        
        processCallback();
    }, [isEmbedded, setAppEvent]);

    const initializeSdk = useCallback(async () => {
        if (isSdkInitialized.current) {
            console.log('SdkInitializer: SDK initialization already attempted.');
            return;
        }
        isSdkInitialized.current = true;
        console.log('SdkInitializer: Starting SDK initialization...');

        // --- Standalone App Detection (Build-time constants from vite.config.js) ---
        const buildTimeAppId = typeof __STANDALONE_APP_ID__ !== 'undefined' ? __STANDALONE_APP_ID__ : null;
        const buildTimeAppUrl = typeof __STANDALONE_APP_URL__ !== 'undefined' ? __STANDALONE_APP_URL__ : null;

        // --- Deep Link Detection ---
        const path = window.location.pathname;
        const claimMatch = path.match(/\/claim\/([A-Z0-9]+)/i);
        const testMatch = path.match(/\/test\/([a-z-]+)/i);
        const sampleMatch = path.match(/\/samples\/([a-z-]+)/i);

        let deepLinkData = null;
        if (claimMatch) {
            deepLinkData = { type: 'CLAIM', code: claimMatch[1].toUpperCase() };
        } else if (testMatch) {
            deepLinkData = { type: 'TEST', route: testMatch[1] };
        } else if (sampleMatch) {
            deepLinkData = { type: 'SAMPLE', route: sampleMatch[1] };
        }

        if (buildTimeAppId) {
            console.log(`[SdkInitializer] Booting in STANDALONE_APP mode for: ${buildTimeAppId}`);
            const appUrl =
              buildTimeAppUrl ||
              (buildTimeAppId === 'powch' && typeof __POWCH_APP_URL__ !== 'undefined'
                ? __POWCH_APP_URL__
                : null) ||
              (buildTimeAppId === 'powch' ? 'https://powch.descix.net/' : null);
            setAppEvent({
                type: AppContextEvent.SDK_READY,
                payload: {
                    mode: 'STANDALONE_APP',
                    appId: buildTimeAppId,
                    url: appUrl,
                    deepLink: deepLinkData
                }
            });
            return;
        }

        let sdkInstance = null;
        let authCode = null;
        let referralData = null;
        let debugKey = null;

        // Skip if OAuth callback was detected (handled by separate useEffect)
        if (oauthCallbackDetected) {
            console.log('SdkInitializer: OAuth callback detected, skipping SDK init');
            return;
        }

        try {
            if (isEmbedded) {
                console.log('SdkInitializer: Running in embedded mode.');
                console.log('SdkInitializer: Initializing Discord SDK...');
                const DISCORD_SDK = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

                // --- Apply URL Mapping BEFORE ready() might be safer, or immediately after ---
                // Discord's docs show calling it before initialization starts.
                // Let's place it here, assuming it modifies globals needed by ready/authorize.
                console.log('SdkInitializer: Applying GTM URL mapping...');
                patchUrlMappings([{ prefix: '/gtm', target: 'www.googletagmanager.com' }]);
                // Add mappings for any other required external domains here
                console.log('SdkInitializer: URL mappings applied.');


                await DISCORD_SDK.ready();
                console.log('SdkInitializer: Discord SDK ready.');

                 // --- Initialize GTM only AFTER SDK is ready and mapping is applied ---
                 if (!isGtmInitialized.current) {
                    initializeGtm(true); // Pass true for embedded environment
                    isGtmInitialized.current = true;
                 }


                // Check for referral data AFTER ready()
                const custom_id = DISCORD_SDK?.customId ? (DISCORD_SDK.customId === "undefined" ? null : DISCORD_SDK.customId) : null;
                const referrer_id = DISCORD_SDK?.referrerId ? (DISCORD_SDK.referrerId === "undefined" ? null : DISCORD_SDK.referrerId) : null;
                const guild_id = DISCORD_SDK.guildId;

                if (custom_id && referrer_id) {
                    referralData = { custom_id, referrer_id, guild_id };
                    console.log('SdkInitializer: Found referral data:', referralData);
                } else {
                    console.log('SdkInitializer: No referral data found in SDK context.');
                }

                console.log('SdkInitializer: Authorizing...');
                const requested_scopes = ['identify', 'guilds', 'email'];
                const authResult = await DISCORD_SDK.commands.authorize({
                    client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
                    response_type: 'code',
                    state: '',
                    prompt: 'none',
                    scope: requested_scopes,
                });

                authCode = authResult.code;
                sdkInstance = DISCORD_SDK;

            } else {
                // --- Non-Embedded Mode ---
                console.log('SdkInitializer: Running in non-embedded mode.');

                // --- Initialize GTM for non-embedded ---
                // We can do this earlier here as no SDK mapping is needed.
                if (!isGtmInitialized.current) {
                    initializeGtm(false); // Pass false for non-embedded environment
                    isGtmInitialized.current = true;
                }

                // Extract referral data from URL using separate regex searches
                const url = window.location.href;
                const referrerMatch = url.match(/(?:referrer_id|user_id)=([^&]+)(?:&|$)/);
                const customMatch = url.match(/custom_id=([^&]+)(?:&|$)/);
                const guildMatch = url.match(/guild_id=([^&]+)(?:&|$)/);
                // Skip code extraction for /device routes — handled by AppContext SDK_CHECKED
                const isDeviceRoute = window.location.pathname === '/device' || window.location.pathname.startsWith('/device');
                const codeMatch = isDeviceRoute ? null : url.match(/code=([^&]+)(?:&|$)/);
                let custom_id = customMatch ? customMatch[1] : null;
                let referrer_id = referrerMatch ? referrerMatch[1] : null;
                let guild_id = guildMatch ? guildMatch[1] : 'mock_standalone_guild';
                AppData.source_guild_id = guild_id;
                let codeFromUrl = codeMatch ? codeMatch[1] : null;
                if (custom_id && referrer_id) {
                    referralData = { custom_id, referrer_id, guildId: guild_id };
                    console.log('SdkInitializer: Found referral data in URL params:', referralData);
                } else {
                    console.log('SdkInitializer: No referral data found in URL.');
                }

                
                debugKey = import.meta.env.VITE_DEBUG_KEY;


                guild_id = guild_id || 'mock_standalone_guild';

                if (custom_id) {
                    referralData = { custom_id, referrer_id, guild_id };
                    console.log('SdkInitializer: Found referral data in URL params:', referralData);
                }

                if (codeFromUrl) {
                    console.log('SdkInitializer: Found auth code in URL.');
                    authCode = codeFromUrl;
                    sdkInstance = null; // No SDK instance in this specific non-embedded flow
                } else if (debugKey) {
                    console.log('SdkInitializer: Using DEBUG mode.');
                    authCode = debugKey;
                    const mockSdk = new DiscordSDKMock(
                        import.meta.env.VITE_DISCORD_CLIENT_ID,
                        guild_id, "mock_channel_debug_id", "mock_location_debug_id"
                    );
                    if (referralData) {
                        mockSdk.customId = referralData.customId;
                        mockSdk.referrerId = referralData.referrerId;
                    }
                    sdkInstance = mockSdk;
                    console.log('SdkInitializer: Mock SDK initialized for debug.');
                } else {
                    console.log('SdkInitializer: Non-embedded, no auth code/debug key. Cannot proceed with SDK logic.');
                    setAppEvent(AppContextEvent.SDK_FAILED); // Or handle appropriately
                    // We still initialized GTM above, but SDK part fails here.
                    return;
                }
            }

            // Store code and SDK instance
            AppData.sdkCode = authCode; // Consider if AppData is the right place vs. context state
            AppData.sdk = sdkInstance;

            const sdkReadyPayload = { referral: referralData, deepLink: deepLinkData };
            setAppEvent({ type: AppContextEvent.SDK_READY, payload: sdkReadyPayload });
            console.log('SdkInitializer: SDK_READY dispatched with payload:', JSON.stringify(sdkReadyPayload));

        } catch (error) {
            console.error('SdkInitializer: Error during SDK initialization or authorization:', error);
            // Attempt to initialize GTM even on SDK error for non-embedded? Or only on success?
            // Current logic initializes GTM *before* potential failure points where possible.
            setAppEvent(AppContextEvent.SDK_FAILED);
        }
    }, [isEmbedded, setAppEvent]); // Add dependencies

    useEffect(() => {
        if (appEvent.type === AppContextEvent.SDK_INITIALIZE && !isSdkInitialized.current) {
            console.log("SdkInitializer: Received SDK_INITIALIZE event, starting initializations.");
            initializeSdk();
        }
    }, [appEvent, initializeSdk]);

    // Render children once initialization logic is underway or complete
    return <ErrorBoundary>{children}</ErrorBoundary>;
};

export default SdkInitializer;