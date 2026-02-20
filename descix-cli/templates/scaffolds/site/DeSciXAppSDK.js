/**
 * DeSciXAppSDK.js (V2 - App Shell Edition)
 * 
 * A thin wrapper for CodeSites and ChatWidgets running within the DeSciX PWA.
 * Leverages Same-Origin interframe scripting to provide direct access to
 * PWA helpers and the backend API.
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

    if (!hasParentAccess()) {
        console.warn('[DeSciX SDK] Running in standalone mode or cross-origin. Direct PWA helpers unavailable.');
        return {
            mode: 'standalone',
            call: async (command, params) => {
                throw new Error('SDK not initialized in PWA App Shell mode.');
            }
        };
    }

    console.log('[DeSciX SDK] Initialized in App Shell mode.');

    // Proxy to the PWA's global DeSciX object
    return {
        mode: 'shell',
        
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
         * Chat interaction helpers
         */
        Chat: {
            suggestPrompt: (text) => {
                // Future: trigger text injection into ChatWidget
                console.log('[DeSciX SDK] Suggesting prompt:', text);
            }
        }
    };
})();
