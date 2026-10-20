/**
 * appView — the app-facing VIEW API, reached from an embedded app as `DeSciX.view`.
 *
 * (The shell publishes it on ITS OWN window. An app does NOT name that window: it
 * loads `DeSciXAppSDK.js`, which resolves the level internally — see
 * `util/bridgeResolver.js`. Hard-coding a `parent` or `top` hop at the call site is
 * the mistake this bridge exists to remove, because the right hop depends on how
 * deeply the app happens to be embedded, which app code cannot know.)
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
 * carries `.powch` and `.config`, and the app-side SDK resolves that window for the
 * app. The view API is one more member of that bus, so an app in the CodeSite iframe
 * does:
 *
 *     DeSciX.view.set('CodeSite');   // give me the whole frame
 *     DeSciX.view.set('SplitView');  // app + chat side by side
 *     DeSciX.view.set('Chat');       // chat only
 *     DeSciX.view.set('NoChrome');   // no shell chrome; the app fills the viewport
 *
 * NoChrome: the shell renders NO chrome (no TopNavBar, no Main padding, no chat)
 * and the app iframe fills the shell's viewport. The shell is the consumer of
 * this value (DeSciX_Cloud site/src/App.jsx and AppSurfaceWidget.jsx). NoChrome
 * is a shell view: the shell drops its chrome inside the browser tab. Browser full
 * screen is the separate Fullscreen API, which the CodeSite iframe delegates
 * (`allow="fullscreen"`) and which the app may call on top of any view.
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
import { resolveBridge } from './bridgeResolver.js';

/* ---8<--- INLINE START (generated into DeSciXAppSDK.js — keep self-contained; resolveBridge is in scope there) */

/** The four views an app may ask for. The one list of views. */
export const VIEW_MODES = Object.freeze({
  CODESITE: 'CodeSite',
  SPLITVIEW: 'SplitView',
  CHAT: 'Chat',
  NOCHROME: 'NoChrome',
});

const VALID = Object.freeze(Object.values(VIEW_MODES));

/** What each view gives the app, keyed by VIEW_MODES value; the not-a-view error prints it. */
const VIEW_DESCRIPTIONS = Object.freeze({
  [VIEW_MODES.CODESITE]: 'your app gets the whole frame, inside the shell chrome',
  [VIEW_MODES.SPLITVIEW]: 'your app beside the chat panel (the default)',
  [VIEW_MODES.CHAT]: 'chat only',
  [VIEW_MODES.NOCHROME]: 'no shell chrome (no top bar, no padding, no chat); your app fills the viewport',
});
{
  const described = Object.keys(VIEW_DESCRIPTIONS);
  const missing = VALID.filter((m) => !described.includes(m));
  const extra = described.filter((m) => !VALID.includes(m));
  if (missing.length || extra.length) {
    throw new Error(`[DeSciX.view] VIEW_DESCRIPTIONS does not match VIEW_MODES (missing: ${missing.join(', ') || 'none'}; extra: ${extra.join(', ') || 'none'}).`);
  }
}
const WIDTH = Math.max(...VALID.map((m) => m.length));

/** The one "not a view" refusal, shared by setView and requestView. */
function assertViewMode(mode) {
  if (!VALID.includes(mode)) {
    throw new Error(
      `[DeSciX.view] "${mode}" is not a view. Valid: ${VALID.join(', ')}.\n` +
      VALID.map((m) => `  ${m.padEnd(WIDTH)} = ${VIEW_DESCRIPTIONS[m]}`).join('\n')
    );
  }
}

/**
 * What a requestView() call did. The one list of outcomes.
 *   REQUESTED     — a listening shell set the asked mode.
 *   FALLBACK      — the shell's MODES lacks the asked mode; it set the caller's fallback.
 *   UNOFFERED     — nothing was set: no readable shell bus (standalone, or framed with no
 *                   readable bus), the shell publishes no view member, no host is listening,
 *                   or the shell's MODES offers neither the mode nor the fallback.
 *                   `bridge` and `reason` say which.
 *   VIEW_NO_MODES — a fallback was given but the shell publishes no view.MODES to choose by.
 *   SET_THREW     — the shell's view.set() threw; `reason` carries its message.
 */
export const VIEW_OUTCOMES = Object.freeze({
  REQUESTED: 'requested',
  FALLBACK: 'fallback',
  UNOFFERED: 'unoffered',
  VIEW_NO_MODES: 'view-no-modes',
  SET_THREW: 'set-threw',
});

function contractViolation(what) {
  const err = new Error(`[DeSciX.view] the shell broke the view contract: ${what}`);
  err.code = 'VIEW_CONTRACT_VIOLATED';
  return err;
}

/**
 * Ask whatever shell hosts this page for a view, and report what actually happened.
 *
 * Unlike setView (the shell's own store), this resolves the shell's bus (bridgeResolver.js), so
 * it works from an embedded app at any frame depth, and it never throws because of WHERE the
 * page runs: no shell, a cross-origin shell, or a shell that does not offer the mode are
 * outcomes, not errors.
 *
 * @param {string} mode - one of VIEW_MODES
 * @param {{ fallback?: string }} [opts] - a VIEW_MODES value other than mode, set when the
 *   shell's view.MODES lacks mode
 * @returns {{ outcome: string, mode: string|null, requested: string,
 *   bridge: 'shell'|'standalone'|'embedded-no-bridge', reason: string }}
 *   outcome is a VIEW_OUTCOMES value; mode is the view this call set, or null when it set none
 * @throws {Error} "not a view" for a mode or fallback outside VIEW_MODES, or a fallback equal to
 *   mode; code VIEW_CONTRACT_VIOLATED when the shell's view member lacks set()/available(),
 *   available() throws, or set() returns a mode other than the one it was asked for
 */
export function requestView(mode, { fallback } = {}) {
  assertViewMode(mode);
  if (fallback !== undefined) {
    assertViewMode(fallback);
    if (fallback === mode) throw new Error(`[DeSciX.view] the fallback "${fallback}" is the mode itself; a fallback is a different view.`);
  }
  const result = (outcome, set, bridge, reason) => ({ outcome, mode: set, requested: mode, bridge, reason });

  const { bus, mode: bridge } = resolveBridge();
  if (!bus) {
    return result(VIEW_OUTCOMES.UNOFFERED, null, bridge, bridge === 'standalone'
      ? 'no shell: this page is the top window'
      : 'no readable shell bus: this page is framed, but no ancestor carries a readable DeSciX bus');
  }
  const view = bus.view;
  if (!view) return result(VIEW_OUTCOMES.UNOFFERED, null, bridge, 'the shell publishes no view member');
  if (typeof view.available !== 'function') throw contractViolation(`view.available is ${typeof view.available}`);
  if (typeof view.set !== 'function') throw contractViolation(`view.set is ${typeof view.set}`);
  let listening;
  try {
    listening = view.available();
  } catch (e) {
    throw contractViolation(`view.available() threw: ${e && e.message}`);
  }
  if (!listening) return result(VIEW_OUTCOMES.UNOFFERED, null, bridge, 'the shell publishes view, but no host is listening (view.available() is false)');

  let target = mode;
  const modes = view.MODES && typeof view.MODES === 'object' ? Object.values(view.MODES) : null;
  if (fallback !== undefined && !modes) {
    return result(VIEW_OUTCOMES.VIEW_NO_MODES, null, bridge, `a fallback was given, but the shell publishes no view.MODES (got ${String(view.MODES)})`);
  }
  if (modes && !modes.includes(mode)) {
    if (fallback === undefined || !modes.includes(fallback)) {
      return result(VIEW_OUTCOMES.UNOFFERED, null, bridge,
        `view.MODES [${modes.join(', ')}] offers neither "${mode}"${fallback === undefined ? ' (no fallback given)' : ` nor the fallback "${fallback}"`}`);
    }
    target = fallback;
  }

  let returned;
  try {
    returned = view.set(target);
  } catch (e) {
    return result(VIEW_OUTCOMES.SET_THREW, null, bridge, `view.set("${target}") threw: ${e && e.message}`);
  }
  if (returned !== target) throw contractViolation(`view.set("${target}") returned ${JSON.stringify(returned)}`);
  return target === mode
    ? result(VIEW_OUTCOMES.REQUESTED, mode, bridge, `set "${mode}"`)
    : result(VIEW_OUTCOMES.FALLBACK, fallback, bridge, `"${mode}" is not in view.MODES [${modes.join(', ')}]; set the fallback "${fallback}"`);
}

/* ---8<--- INLINE END */


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
  assertViewMode(mode);
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
 * Publication is not capability. A host that never subscribed still gets a working
 * `set()`: it validates, updates `current`, notifies an empty subscriber set, and
 * returns the mode you asked for while the screen never changes. A no-op that returns
 * success is indistinguishable from success, which is the exact failure class this
 * platform's doctrine exists to prevent — so `set()`'s return value is never evidence
 * that the layout moved, and this is.
 *
 * Subscriber count is the truthful answer, and it is already tracked here — so an
 * app can ask before it trusts the layout to change.
 *
 * Subscription belongs to the host's view layer, not to the widget it renders.
 *
 * @returns {boolean} true when at least one host will re-render on a view change
 */
export function viewAvailable() {
  return subscribers.size > 0;
}

/**
 * Publish the API onto the shell's `window.DeSciX.view` (an embedded app reaches it
 * as `DeSciX.view`, with the frame level resolved for it). Idempotent — safe to call
 * from every render path that might be the first one.
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
