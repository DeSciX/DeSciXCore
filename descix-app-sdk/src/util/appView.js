/**
 * appView — the app-facing VIEW API, reached from an embedded app as
 * `window.parent.DeSciX.view`.
 *
 * (The shell publishes it on ITS OWN window, so `window.DeSciX.view` is the correct
 * form only for shell-side code. Inside the iframe — the stated audience — the
 * `parent` hop is not optional, and omitting it yields `TypeError: Cannot read
 * properties of undefined`.)
 *
 * ── What it is for ───────────────────────────────────────────────────────────
 * The shell decided the layout alone: AppWidget rendered CodeSite with
 * `enableChat={true}` hardcoded whenever an app had a URL, so a plain tool that
 * wants its whole surface and a document app that wants chat beside it got the
 * same frame. Nothing an app could say changed it (CEO-D-2026-08-19-SERVE-UX-
 * AMB-RULINGS, AMB-3: the app controls whether it shows SplitView).
 *
 * ── The mechanism, and why it needs no new surface ───────────────────────────
 * The shell already publishes a service bus on its own window — `window.DeSciX`
 * carries `.powch` and `.config`, and an embedded app reads them off its PARENT.
 * The view API is one more member of that bus, so an app in the CodeSite iframe
 * does:
 *
 *     window.parent.DeSciX.view.set('CodeSite');   // give me the whole frame
 *     window.parent.DeSciX.view.set('SplitView');  // app + chat side by side
 *     window.parent.DeSciX.view.set('Chat');       // chat only
 *
 * That reach works because shell and app are SAME ORIGIN — the property this
 * workstream's G-1 fix restored. It is the identical mechanism SplitView uses in
 * the other direction when it calls into the app's `DeSciX_Actions`.
 *
 * ── State lives here, not in the shell ───────────────────────────────────────
 * A module-level store with subscribers, so the shell re-renders when an app
 * changes its mind at runtime (the app is loaded AFTER the layout is drawn, so
 * a one-shot read at mount would always miss it).
 */

import { publishBridgeMember } from './appBridge.js';

/** The three views an app may ask for. */
export const VIEW_MODES = Object.freeze({
  CODESITE: 'CodeSite',
  SPLITVIEW: 'SplitView',
  CHAT: 'Chat',
});

const VALID = Object.freeze(Object.values(VIEW_MODES));

/**
 * The shell's own default when an app expresses no preference: app plus chat.
 * Stated once, here, rather than inlined at the render site where it read as a
 * decision nobody could see.
 */
export const DEFAULT_VIEW = VIEW_MODES.SPLITVIEW;

let current = DEFAULT_VIEW;
const subscribers = new Set();

/** @returns {string} the view the shell should currently render */
export function getView() {
  return current;
}

/**
 * Ask the shell for a view.
 * @param {string} mode - one of VIEW_MODES
 * @returns {string} the mode now in effect
 * @throws {Error} on an unknown mode, naming the valid ones — an app silently
 *   getting the wrong layout is harder to debug than a thrown error at the call.
 */
export function setView(mode) {
  if (!VALID.includes(mode)) {
    throw new Error(
      `[DeSciX.view] "${mode}" is not a view. Valid: ${VALID.join(', ')}.\n` +
      '  CodeSite  = your app gets the whole frame\n' +
      '  SplitView = your app beside the chat panel (the default)\n' +
      '  Chat      = chat only'
    );
  }
  if (current !== mode) {
    current = mode;
    for (const fn of subscribers) {
      try {
        fn(current);
      } catch (e) {
        // One bad subscriber must not stop the others from re-rendering.
        console.error('[DeSciX.view] subscriber threw:', e);
      }
    }
  }
  return current;
}

/**
 * Observe view changes.
 * @param {(mode: string) => void} fn
 * @returns {() => void} unsubscribe
 */
export function subscribeView(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

/** Back to the shell's default. Used when the shell switches to another app. */
export function resetView() {
  setView(DEFAULT_VIEW);
}

/**
 * Is a host actually LISTENING to view changes?
 *
 * Publication is not capability. `AppWidget` subscribes (via useDeSciXView) and
 * honours the request; `StandAloneAppWidget` renders a bare iframe and subscribes to
 * nothing — so on that host `set()` validates, updates `current`, notifies an empty
 * subscriber set, and returns the mode you asked for while the screen never changes.
 * A no-op that returns success is indistinguishable from success, which is the exact
 * failure class this platform's doctrine exists to prevent.
 *
 * Subscriber count is the truthful answer, and it is already tracked here — so an
 * app can ask before it trusts the layout to change.
 *
 * @returns {boolean} true when at least one host will re-render on a view change
 */
export function viewAvailable() {
  return subscribers.size > 0;
}

/**
 * Publish the API onto the shell's `window.DeSciX.view` (an embedded app reaches it
 * as `window.parent.DeSciX.view`). Idempotent — safe to call from every render path
 * that might be the first one.
 *
 * Goes through the bridge owner rather than touching `window.DeSciX` directly, so
 * publication is announced (the readiness contract) and the bus is created in
 * exactly one place.
 */
export function publishViewApi() {
  if (typeof window === 'undefined') return;
  publishBridgeMember('view', {
    set: setView,
    get: getView,
    subscribe: subscribeView,
    available: viewAvailable,
    MODES: VIEW_MODES,
    DEFAULT: DEFAULT_VIEW,
  });
}
