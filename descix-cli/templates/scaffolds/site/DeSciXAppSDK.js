/**
 * DeSciXAppSDK.js (V2 - App Shell Edition)
 *
 * A thin wrapper for CodeSites and ChatWidgets running within the DeSciX PWA.
 * Leverages Same-Origin interframe scripting to provide direct access to
 * PWA helpers and the backend API.
 *
 * ── What this file is ────────────────────────────────────────────────────────
 * The APP side of the bridge. The shell publishes its service bus on its own
 * window (`window.DeSciX`, owned by @descix/app-sdk util/appBridge.js); this file
 * is the proxy an embedded app talks to, so app code never repeats the
 * `window.top` hop or the same-origin guard at every call site.
 *
 * Same-origin is a HARD PRECONDITION. When it does not hold, reaching for
 * `window.top.DeSciX` throws
 *     SecurityError: Blocked a frame with origin "…" from accessing a cross-origin frame
 * which names nothing about DeSciX. That is why the reach is probed once, in
 * hasParentAccess(), and reported in plain language instead of at every property.
 */

window.DeSciX = (() => {
    const isEmbedded = window.top !== window;

    // Check for same-origin access
    const hasParentAccess = () => {
        try {
            return isEmbedded && !!window.top.DeSciX;
        } catch (e) {
            return false;
        }
    };

    /**
     * Readiness, without polling.
     *
     * The shell renders this iframe, so it has almost always published before app
     * code runs — but "almost always" is not a contract, and the failure it leaves
     * (`window.top.DeSciX.view === undefined`) is indistinguishable from a shell
     * too old to have the API at all. So: resolve immediately if the bus is already
     * there, otherwise wait for the shell's `descix:bridge-ready` announcement.
     * Every app would otherwise have invented its own retry loop for this.
     *
     * @returns {Promise<{mode: string, members: string[], version: number|null}>}
     */
    const ready = () => new Promise((resolve) => {
        const snapshot = () => ({
            mode: 'shell',
            version: window.top.DeSciX.bridge ? window.top.DeSciX.bridge.version : null,
            members: window.top.DeSciX.bridge
                ? window.top.DeSciX.bridge.members()
                : Object.keys(window.top.DeSciX),
        });

        // Standalone / cross-origin: RESOLVE, do not hang. An app that waits forever
        // for a bridge that is never coming looks identical to an app that is broken,
        // and it can no longer take the standalone path it might well support.
        if (!hasParentAccess()) {
            resolve({ mode: 'standalone', members: [], version: null });
            return;
        }
        if (window.top.DeSciX.bridge && window.top.DeSciX.bridge.ready) {
            resolve(snapshot());
            return;
        }
        const evtName = (window.top.DeSciX.bridge && window.top.DeSciX.bridge.EVENT) || 'descix:bridge-ready';
        const onReady = () => {
            window.top.removeEventListener(evtName, onReady);
            resolve(snapshot());
        };
        window.top.addEventListener(evtName, onReady);
    });

    if (!hasParentAccess()) {
        console.warn('[DeSciX SDK] Running in standalone mode or cross-origin. Direct PWA helpers unavailable.');
        return {
            mode: 'standalone',
            ready,
            // Loud, and NOT fatal. A throw here would kill a running app for a
            // condition it cannot fix; naming the gap lets it degrade deliberately.
            get view() {
                console.error('[DeSciX SDK] DeSciX.view is unavailable: this app is not embedded in the DeSciX App Shell (standalone or cross-origin). View switching is a shell capability.');
                return null;
            },
            get chat() {
                console.error('[DeSciX SDK] DeSciX.chat is unavailable: this app is not embedded in the DeSciX App Shell (standalone or cross-origin), so there is no chat conversation to contribute to.');
                return null;
            },
            call: async (command, params) => {
                throw new Error('SDK not initialized in PWA App Shell mode.');
            }
        };
    }

    console.log('[DeSciX SDK] Initialized in App Shell mode.');

    /**
     * Read a member off the shell's bus, or explain its absence.
     *
     * Absence is real and distinct from "not ready yet": a host may publish a chat
     * pane and no view switching, or vice versa. Await ready() to settle the timing
     * question; a member still missing after that is a capability this host does
     * not offer.
     */
    const member = (name, why) => {
        const api = window.top.DeSciX[name];
        if (!api) {
            console.error(
                `[DeSciX SDK] DeSciX.${name} is not published by this host. ${why} ` +
                `Await DeSciX.ready() before first use; if it is still absent afterwards, this host does not implement it.`
            );
            return null;
        }
        return api;
    };

    // Proxy to the PWA's global DeSciX object
    return {
        mode: 'shell',

        /** Resolves once the shell's bus is published. See ready() above. */
        ready,

        /**
         * Access to global application data (Communities, Apps, User Profile)
         */
        get AppData() { return window.top.DeSciX.AppData; },

        /**
         * Access to the PWA state machine and navigation
         */
        get AppContext() { return window.top.DeSciX.AppContext; },

        /**
         * Direct API call helper (proxied through PWA session)
         */
        call: (command, params) => window.top.DeSciX.call(command, params),

        /**
         * Layout control — ask the shell for a view:
         *
         *     DeSciX.view.set('CodeSite');   // this app gets the whole frame
         *     DeSciX.view.set('SplitView');  // this app beside the chat panel (default)
         *     DeSciX.view.set('Chat');       // chat only
         *
         * `DeSciX.view.available()` reports whether a host is actually LISTENING.
         * Check it: on a host that renders a bare iframe, set() validates and returns
         * the mode you asked for while nothing on screen changes, and that success is
         * otherwise indistinguishable from a real one.
         */
        get view() {
            return member('view', 'This host does not implement view switching (it renders the app frame without a view-aware container).');
        },

        /**
         * Chat contributions — hand the model something to LOOK AT:
         *
         *     await DeSciX.chat.sendMedia(
         *       { mime_type: 'image/png', data: base64Png, label: 'flyby' },
         *       { note: 'what do you see here?' }
         *     );
         *
         * Supply exactly one of `data` (raw base64, NOT a data: URL) or `asset_ref`
         * (a path in this app's own asset space). Resolves
         * `{ delivered, reason?, contribution? }` — `delivered:false` means the chat
         * pane is not mounted, not that the media was bad. Bad media throws, and
         * anything the server refuses is refused by name.
         *
         * `DeSciX.chat.available()` reports whether the ingress can take it right now.
         */
        get chat() {
            return member('chat', 'This host renders no chat pane, so there is no conversation to contribute to.');
        }
    };
})();
