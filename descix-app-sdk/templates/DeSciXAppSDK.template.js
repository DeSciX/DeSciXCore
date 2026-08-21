/**
 * DeSciXAppSDK.js — the APP side of the DeSciX bridge.
 *
 * !!! GENERATED FILE — DO NOT EDIT !!!
 * Source:    @descix/app-sdk templates/DeSciXAppSDK.template.js
 *            + src/util/bridgeResolver.js (inlined below)
 * Regenerate: node descix-app-sdk/scripts/generate-app-sdk-copies.js
 * Verify:     node descix-app-sdk/scripts/generate-app-sdk-copies.js --check
 * A hand-edit here is drift by construction and the --check gate will fail loud.
 *
 * ── What this file gives you ─────────────────────────────────────────────────
 * One object, `DeSciX`, that works the same whether your page is embedded in the
 * DeSciX App Shell, nested deeper inside it, or opened standalone:
 *
 *     await DeSciX.ready();                      // is the shell's bus there?
 *     DeSciX.view.set('CodeSite');               // ask for the whole frame
 *     if (DeSciX.chat.available()) { … }         // can chat take an attachment now?
 *     await DeSciX.chat.sendMedia({ … });        // hand the model something to look at
 *     await DeSciX.call('some_command', { … });  // call the platform through the shell
 *
 * You never write `window.parent.` or `window.top.` — that hop is DETECTED, not
 * declared. The shell publishes its bus on its own window, so the correct level
 * depends on how deeply your app happens to be embedded, which your code cannot
 * know and should not have to. `resolveBridge()` below answers it on every access.
 *
 * Standalone is a first-class case, not a failure: with no shell above you,
 * `DeSciX.ready()` resolves `{ mode: 'standalone' }` (it does not hang), and
 * `DeSciX.view` / `DeSciX.chat` report their absence by name instead of throwing.
 */

window.DeSciX = (() => {
    'use strict';

/* ── inlined from @descix/app-sdk src/util/bridgeResolver.js ─────────────── */
__BRIDGE_RESOLVER__
/* ── end inlined resolver ───────────────────────────────────────────────── */

    // ── Never clobber an owner ───────────────────────────────────────────────
    // If the bus resolves at hop 0, THIS page published it: the page is the shell
    // (or a host that already ran @descix/app-sdk), and `window.DeSciX` is already
    // the real thing. Overwriting it with an app-side proxy would delete the owner's
    // bus — every member, and the marker every embedded app resolves against. So we
    // hand back the very same object: the assignment below becomes an identity no-op.
    const owned = resolveBridge();
    if (owned.hops === 0) return owned.bus;

    // Otherwise resolution is LIVE — recomputed at each access, never captured at
    // load time. The shell renders this iframe, but script order is not a contract:
    // a snapshot taken while the shell was still mounting would pin this app to
    // "standalone" forever, which is precisely the stale-capture failure this file
    // exists to end. (A self-reference is harmless: the proxy carries no `bridge`
    // marker, so the resolver walks straight past it to the real owner.)

    /**
     * Readiness, without polling.
     *
     * Resolve immediately when the bus is already published; otherwise wait for the
     * shell's `descix:bridge-ready` announcement on the window that owns it. An app
     * with no shell above it resolves as standalone rather than waiting for a bridge
     * that is never coming — an app that hangs forever is indistinguishable from an
     * app that is broken, and it can no longer take the standalone path it may well
     * support.
     *
     * @returns {Promise<{mode: string, members: string[], version: number|null}>}
     */
    const ready = () => new Promise((resolve) => {
        const found = resolveBridge();

        if (found.mode === 'standalone') {
            resolve({ mode: 'standalone', members: [], version: null });
            return;
        }

        const snapshot = () => {
            const now = resolveBridge();
            if (now.mode === 'standalone') return { mode: 'standalone', members: [], version: null };
            return {
                mode: 'shell',
                version: now.bus.bridge ? now.bus.bridge.version : null,
                members: now.bus.bridge ? now.bus.bridge.members() : Object.keys(now.bus),
            };
        };

        if (found.bus.bridge && found.bus.bridge.ready) {
            resolve(snapshot());
            return;
        }

        const evtName = (found.bus.bridge && found.bus.bridge.EVENT) || 'descix:bridge-ready';
        const onReady = () => {
            found.window.removeEventListener(evtName, onReady);
            resolve(snapshot());
        };
        found.window.addEventListener(evtName, onReady);
    });

    /**
     * Read a member off the shell's bus, or explain its absence in plain language.
     *
     * Three distinct situations, three distinct messages — collapsing them into one
     * "undefined" is what sent app authors hunting through frame levels:
     *   - no shell at all (standalone / cross-origin): a capability you do not have here;
     *   - shell present, member absent: this host does not implement it;
     *   - shell present, member present: you get it.
     */
    const member = (name, why) => {
        const found = resolveBridge();

        if (found.mode === 'standalone') {
            console.error(
                `[DeSciX SDK] DeSciX.${name} is unavailable: no DeSciX App Shell was found ` +
                `above this page (running standalone, or the shell is cross-origin). ${why}`
            );
            return null;
        }

        const api = found.bus[name];
        if (!api) {
            console.error(
                `[DeSciX SDK] DeSciX.${name} is not published by this host. ${why} ` +
                `Await DeSciX.ready() before first use; if it is still absent afterwards, this host does not implement it.`
            );
            return null;
        }
        return api;
    };

    /** Read a plain (non-member) property off the bus, or null when there is no shell. */
    const busProp = (name) => {
        const found = resolveBridge();
        return found.mode === 'standalone' ? null : found.bus[name];
    };

    return {
        /** 'shell' when a DeSciX App Shell is hosting this page, else 'standalone'. Live. */
        get mode() { return resolveBridge().mode; },

        /**
         * How many frames up the bus was found: 0 = this page owns it, 1 = the parent
         * (the ordinary embedded case), 2+ = nested, -1 = standalone. Diagnostics only —
         * app code should never branch on it, which is the whole point of this file.
         */
        get bridgeLevel() { return resolveBridge().hops; },

        /** Resolves once the shell's bus is published. See ready() above. */
        ready,

        /** Global application data (Communities, Apps, User Profile). */
        get AppData() { return busProp('AppData'); },

        /** The PWA state machine and navigation. */
        get AppContext() { return busProp('AppContext'); },

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
            return member('view', 'View switching is a shell capability (this host renders the app frame without a view-aware container).');
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
            return member('chat', 'There is no chat pane here, so there is no conversation to contribute to.');
        },

        /**
         * Call a platform command through the shell's authenticated session.
         * Throws when there is no shell — a call that cannot possibly be delivered
         * must not resolve as though it were.
         */
        call: (command, params) => {
            const found = resolveBridge();
            if (found.mode === 'standalone') {
                throw new Error(
                    `[DeSciX SDK] DeSciX.call('${command}') requires the DeSciX App Shell: ` +
                    'no shell was found above this page (running standalone, or cross-origin).'
                );
            }
            return found.bus.call(command, params);
        },
    };
})();
