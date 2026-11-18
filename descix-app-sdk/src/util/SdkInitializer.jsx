import React, { useEffect, useRef, useCallback, useState } from 'react';
import { AppContextEvent, AppData } from '../util/AppData';
import { useAppContext } from '../AppContext';
import { DiscordSDK, patchUrlMappings } from '@discord/embedded-app-sdk';
import ErrorBoundary from './ErrorBoundary';
import { startAppBinding, appFrameUrl, describeAppBindingError, APP_BINDING_RESULT } from './appBinding';
import ShellErrorState from '../components/ShellErrorState.jsx';
import ShellFrame from '../components/ShellFrame.jsx';
import { POWCH_APP_ID, requirePowchUrl } from '../powch/powchOrigin.js';
import { storePendingRef } from './shareLink.js';

const gtmId = import.meta.env.VITE_GTM_ID;
const gtmAuth = import.meta.env.VITE_GTM_AUTH;
const gtmPreview = import.meta.env.VITE_GTM_PREVIEW;
const gtmEnvSuffix = import.meta.env.VITE_GTM_ENV_SUFFIX
    || (gtmAuth && gtmPreview ? `&gtm_auth=${gtmAuth}&gtm_preview=${gtmPreview}&gtm_cookies_win=x` : '');

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
    if (!gtmId) {
        console.error('GTM Initializer: Missing VITE_GTM_ID at build time.');
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

    const envParams = gtmEnvSuffix;
    if (isEmbeddedEnvironment) {
        script.src = `/gtm/gtm.js?id=${gtmId}${envParams}`;
        console.log(`GTM Initializer: Injecting GTM script with mapped URL: ${script.src}`);
    } else {
        script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}${envParams}`;
        console.log(`GTM Initializer: Injecting GTM script with standard URL: ${script.src}`);
    }

    document.head.appendChild(script);
};


const SdkInitializer = ({ children, standalone = false, appId = null }) => {
    const { appEvent, setAppEvent, isEmbedded } = useAppContext(); // Get isEmbedded from context
    const isSdkInitialized = useRef(false);
    const isGtmInitialized = useRef(false); // Track GTM initialization specifically
    // The app binding could not be read: the shell shows this instead of booting anything.
    const [bindingError, setBindingError] = useState(null);
    // The binding exchange in flight (startAppBinding's handle), so an unmount can cancel it and a
    // second Try again cannot start a second run.
    const bindingRun = useRef(null);
    const unmounted = useRef(false);

    const initializeSdk = useCallback(async () => {
        if (isSdkInitialized.current) {
            console.log('SdkInitializer: SDK initialization already attempted.');
            return;
        }
        isSdkInitialized.current = true;
        console.log('SdkInitializer: Starting SDK initialization...');

        // --- Standalone App Detection ---
        // Two sources, and neither is a build-time global any more.
        //
        // SERVED binding (AMB-1c) for the case the code CANNOT know: one shell
        // bundle that boots as the store on descix.net and as a developer's app
        // under `descix serve`. That shell arrives PRE-BUILT from the cloud, so a
        // define could never have reached it.
        //
        // DECLARED prop for the case the code already knows: an app that builds
        // ITSELF standalone says so at its own mount — <AppShell appId="powch"
        // standalone>. The __STANDALONE_APP_ID__ define this replaced was a global
        // carrying a fact the call site had in hand, and it forced one shared value
        // on every entry point in a build (the demo's two entries both booted as
        // 'demo'). Deleted, not fenced (CEO-D-2026-08-19, envelope amendment).
        // A SELF-DECLARING APP DOES NOT ASK ITS ORIGIN WHO IT IS. The probe below is
        // INTENTIONALLY NOT MADE when `standalone` is declared — identity is compile-time for an
        // app that builds itself, and the comment above already blesses exactly that case. Do NOT
        // re-add the fetch "for safety": it would resurrect a guaranteed 404 on every load of
        // every self-declaring app. Powch is the live instance — its origin is SHELL_EXEMPT at the
        // edge by design (ZK-SSO isolation), so the edge correctly synthesizes nothing there and
        // the probe could only ever 404. Same-origin relative path, so this was never a
        // cross-origin reach.
        //
        // THE ACCEPTED TRADE, stated so nobody rediscovers it as a bug: this does not FAIL LOUD on
        // a declared-vs-served conflict, it makes that conflict UNOBSERVABLE by construction. The
        // misconfiguration it hides is "an edge serves a binding for an origin whose app
        // self-declares" — which SHELL_EXEMPT prevents for the only live case.
        // (VISION ruling A, 2026-08-22, under window discretion; listed for CEO ratification.)
        const declaredAppId = standalone ? appId : null;
        const bindingExchange = declaredAppId ? null : startAppBinding();
        bindingRun.current = bindingExchange;
        const bindingResult = bindingExchange ? await bindingExchange.result : null;
        // Clear the handle only if it is still THIS run's: a remount (StrictMode) may have started a
        // newer run while this cancelled one was waiting, and the unmount must still find that one.
        if (bindingRun.current === bindingExchange) bindingRun.current = null;
        // Unmounted while waiting: both requests were aborted by the cleanup; drop the result.
        if (unmounted.current || bindingResult?.kind === 'cancelled') return;
        // Only a 404 ('none') means "this host has no app": the store. Any other failure is shown,
        // with a retry — booting the store there would show the user the wrong page and say nothing.
        if (bindingResult?.kind === APP_BINDING_RESULT.ERROR) {
            const reason = describeAppBindingError(bindingResult);
            console.error(`[SdkInitializer] The app binding could not be read: ${reason}. Not booting the store in its place.`);
            setBindingError(reason);
            return;
        }
        const servedBinding = bindingResult?.kind === APP_BINDING_RESULT.BINDING ? bindingResult.binding : null;

        const standaloneAppId = servedBinding?.appId || declaredAppId;
        // An app's direct link hands its query and hash to the app (appFrameUrl).
        const standaloneAppUrl = servedBinding?.appUrl ? appFrameUrl(servedBinding.appUrl, window.location) : null;
        const bindingSource = servedBinding ? `served (${servedBinding.source || 'binding'})` : 'declared by the app';

        // --- Deep Link Detection ---
        const path = window.location.pathname;
        const claimMatch = path.match(/\/claim\/([A-Z0-9]+)/i);
        const testMatch = path.match(/\/test\/([a-z-]+)/i);
        const sampleMatch = path.match(/\/samples\/([a-z-]+)/i);

        // A /claim/<code> URL is never a shell VIEW — claim redemption and the one-time email
        // transfer live in Powch's own PWA (claim transfer and all token-related
        // chain actions are in Powch). Every OTHER host
        // (the platform shell, a `descix serve` app binding) forwards there with a browser
        // redirect, never a view. Powch's own build IS the destination: it detects and routes
        // this path itself (PowchAppProvider, the same way it already does for /subscribe), so
        // it is deliberately NOT threaded through deepLinkData below — one fact, one owner.
        if (claimMatch && standaloneAppId !== POWCH_APP_ID) {
            const powchUrl = requirePowchUrl(null, 'SdkInitializer');
            window.location.replace(`${powchUrl}claim/${claimMatch[1].toUpperCase()}`);
            return;
        }

        let deepLinkData = null;
        if (testMatch) {
            deepLinkData = { type: 'TEST', route: testMatch[1] };
        } else if (sampleMatch) {
            deepLinkData = { type: 'SAMPLE', route: sampleMatch[1] };
        }

        if (standaloneAppId) {
            console.log(`[SdkInitializer] Booting in STANDALONE_APP mode for: ${standaloneAppId} [${bindingSource}]`);
            // Powch's own standalone build knows where it lives via __POWCH_APP_URL__.
            // The hardcoded production-Powch tail that stood here is
            // DELETED: a dev build silently resolving the wallet to PRODUCTION is a
            // cross-environment leak, and this value decides where passkeys are
            // typed. Absent is better than plausible-and-wrong.
            const appUrl =
              standaloneAppUrl ||
              (standaloneAppId === 'powch' && typeof __POWCH_APP_URL__ !== 'undefined'
                ? __POWCH_APP_URL__
                : null);
            // The two guards that branch on standalone mode read a WINDOW global
            // (AppData.isEmbedded, CodeSiteWidget.isPlatformApp). A Vite define
            // substitutes the bare identifier and never a member expression, so
            // window.__STANDALONE_APP_ID__ was never actually set by anyone and
            // both guards were permanently false. Set it here, where the value is
            // real at runtime, so they finally mean what they say.
            if (typeof window !== 'undefined') window.__STANDALONE_APP_ID__ = standaloneAppId;
            setAppEvent({
                type: AppContextEvent.SDK_READY,
                payload: {
                    mode: 'STANDALONE_APP',
                    appId: standaloneAppId,
                    url: appUrl,
                    // The view the shell paints first (share.json default_view, via the binding);
                    // AppContext seeds it before READY. A declared standalone app has no binding.
                    defaultView: servedBinding?.defaultView ?? null,
                    deepLink: deepLinkData
                }
            });
            return;
        }

        let sdkInstance = null;

        try {
            if (isEmbedded) {
                console.log('SdkInitializer: Running in embedded mode.');
                console.log('SdkInitializer: Initializing Discord SDK...');
                const DISCORD_SDK = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

                // --- Apply URL Mapping BEFORE ready() might be safer, or immediately after ---
                // Discord's docs show calling it before initialization starts.
                // Let's place it here, assuming it modifies globals needed by ready().
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


                // A Discord activity launched from a share link carries Discord's custom_id launch param
                // (DiscordSDK.customId). Held for the claim, which sends { custom_id } only (util/shareLink.js).
                const launchCustomId = DISCORD_SDK.customId && DISCORD_SDK.customId !== "undefined" ? DISCORD_SDK.customId : null;
                if (launchCustomId) {
                    storePendingRef(window.sessionStorage, launchCustomId);
                    console.log('SdkInitializer: Discord launch custom_id held for the share-link claim:', launchCustomId);
                }

                // No Discord sign-in: the activity's user signs in through Powch like every app.
                // The SDK instance serves the channel and share-link features.
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

                const guildMatch = window.location.href.match(/guild_id=([^&]+)(?:&|$)/);
                AppData.source_guild_id = guildMatch ? guildMatch[1] : 'mock_standalone_guild';

                // Outside Discord there is no SDK: the native shell signs in through Powch.
                setAppEvent(AppContextEvent.SDK_FAILED);
                return;
            }

            AppData.sdk = sdkInstance;

            const sdkReadyPayload = { deepLink: deepLinkData };
            setAppEvent({ type: AppContextEvent.SDK_READY, payload: sdkReadyPayload });
            console.log('SdkInitializer: SDK_READY dispatched with payload:', JSON.stringify(sdkReadyPayload));

        } catch (error) {
            console.error('SdkInitializer: Error during SDK initialization:', error);
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

    // Unmount: cancel the binding exchange (aborts both requests; the result is dropped), and let a
    // remount (React StrictMode) start initialization again.
    useEffect(() => {
        unmounted.current = false;
        return () => {
            unmounted.current = true;
            if (bindingRun.current) {
                bindingRun.current.cancel();
                bindingRun.current = null;
                isSdkInitialized.current = false;
            }
        };
    }, []);

    const retryBinding = useCallback(() => {
        // Only from the error screen, and never while a run is in flight: a double click starts one run.
        if (!bindingError || bindingRun.current) return;
        setBindingError(null);
        isSdkInitialized.current = false;
        initializeSdk();
    }, [initializeSdk, bindingError]);

    if (bindingError) {
        // Inside the same ShellFrame the ERROR state uses (AppShell.jsx), so both look the same.
        return (
            <ShellFrame>
                <ShellErrorState
                    title="This page could not load"
                    message="The page could not find out which app to open. Check your connection and try again."
                    detail={bindingError}
                    onRetry={retryBinding}
                />
            </ShellFrame>
        );
    }

    // Render children once initialization logic is underway or complete
    return <ErrorBoundary>{children}</ErrorBoundary>;
};

export default SdkInitializer;