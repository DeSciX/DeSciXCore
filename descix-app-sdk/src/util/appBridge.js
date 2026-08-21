/**
 * appBridge — THE owner of the `window.DeSciX` service bus and its readiness signal.
 *
 * ── Why this module exists ───────────────────────────────────────────────────
 * The shell publishes several app-facing members onto one global object: `.powch`,
 * `.config`, `.view`, and (ws-c3-bridge-media-handle) `.chat`. Before this module,
 * each publisher wrote `window.DeSciX = window.DeSciX || {}` for itself. That is two
 * derivations of one fact — the general form of mirror drift (engineering-culture
 * mandate): the copies disagree the moment one of them learns something the other
 * does not, such as "announce yourself when you land". So the bus has ONE owner and
 * every member goes on through `publishBridgeMember`.
 *
 * ── The readiness contract (RT-5) ────────────────────────────────────────────
 * An embedded app runs in an iframe the shell renders, so it usually starts AFTER
 * the shell has published. Usually is not a contract. Before this, an app that
 * looked early saw `window.parent.DeSciX.view === undefined`, which is
 * indistinguishable from "shell too old", "wrong property name", or "cross-origin",
 * and every app would have invented its own polling loop to paper over it.
 *
 * So publication ANNOUNCES itself: a `descix:bridge-ready` CustomEvent on the shell
 * window, plus a synchronously-readable `window.DeSciX.bridge` marker. An app that
 * is late reads the marker; an app that is early hears the event. Neither polls.
 *
 * ── Ready is NOT the same as capable, deliberately ───────────────────────────
 * This is the distinction RT-1 was written about. On the standalone host, the view
 * API is PUBLISHED and no host is subscribed, so `view.set()` succeeds and changes
 * nothing — "a no-op that returns the mode you asked for is indistinguishable from
 * success". A readiness signal that claimed capability would be repeating that lie
 * one layer up.
 *
 * Therefore readiness answers only "has the shell published its bus yet?", and each
 * member answers "can I actually do anything?" for itself, LIVE, via its own
 * `available()`. Capability is not a fact frozen at boot: a chat pane can be closed
 * long after the bridge went ready. An app asks at the moment of use:
 *
 *     await DeSciX.ready();                       // the bus exists
 *     if (DeSciX.chat.available()) { ... }        // ...and chat can take it NOW
 *
 * ── Publication is here; RESOLUTION is bridgeResolver.js ─────────────────────
 * This module answers "how does the shell publish?". The mirror question — "which
 * window is an app's bus actually on?" — is answered exactly once, in the sibling
 * `bridgeResolver.js`, and re-exported below so there is one import surface. No
 * consumer computes a `self`/`parent`/`top` hop for itself.
 */

export { resolveBridge, BRIDGE_RESOLUTION_MAX_HOPS } from './bridgeResolver.js';

/**
 * Fired on the window that OWNS the bus, every time a member is published. An app
 * listens on the window `resolveBridge()` returns — it never names a frame level.
 */
export const BRIDGE_READY_EVENT = 'descix:bridge-ready';

/**
 * Bumped when the SHAPE of the bus changes in a way an app could care about, so an
 * app meeting an older shell can say so instead of failing on a missing property.
 * RT-5 asked for a version marker; this is it.
 */
export const BRIDGE_VERSION = 1;

/** @returns {object|null} the shell's bus, or null when there is no DOM (SSR/node). */
export function getBridge() {
  if (typeof window === 'undefined') return null;
  return window.DeSciX || null;
}

/** The bus as it exists RIGHT NOW on this window. See the note in `ensureBus`. */
function currentBus() {
  if (typeof window === 'undefined') return {};
  return window.DeSciX || {};
}

/**
 * Ensure `window.DeSciX` and its `bridge` marker exist. Idempotent, and NEVER
 * clobbers members another publisher already put there.
 */
function ensureBus() {
  if (typeof window === 'undefined') return null;
  window.DeSciX = window.DeSciX || {};
  const bus = window.DeSciX;
  if (!bus.bridge) {
    bus.bridge = {
      version: BRIDGE_VERSION,
      ready: true,
      // A function, not a frozen array: members arrive across several mounts, and a
      // snapshot handed out early would silently be wrong later.
      //
      // These read `window.DeSciX` LIVE rather than closing over the `bus` captured
      // above, because a publisher can REPLACE the bus object rather than mutate it
      // (AppContext.jsx does exactly that: `window.DeSciX = { ...window.DeSciX, … }`).
      // The spread carries this `bridge` marker onto the new object, so a closure over
      // the old one would keep answering about a bus nothing reads any more — a
      // members() list that is confidently wrong, which is worse than an empty one.
      members: () => Object.keys(currentBus()).filter((k) => k !== 'bridge'),
      has: (name) => Object.prototype.hasOwnProperty.call(currentBus(), name),
      EVENT: BRIDGE_READY_EVENT,
    };
  }
  return bus;
}

/**
 * Put a member on the bus and announce it.
 *
 * @param {string} name - bus property name ('view', 'chat', …)
 * @param {object} api  - the member's API object
 * @returns {object|null} the bus, or null without a DOM
 */
export function publishBridgeMember(name, api) {
  const bus = ensureBus();
  if (!bus) return null;
  bus[name] = api;
  announce(name);
  return bus;
}

/**
 * Remove a member (the shell unmounted the thing backing it).
 *
 * Deleting is deliberate: leaving a stale handle whose backing component is gone is
 * how "the call succeeded and nothing happened" bugs are born. An absent member is
 * an honest signal, and the app-side proxies report it by name.
 */
export function retractBridgeMember(name) {
  if (typeof window === 'undefined' || !window.DeSciX) return;
  delete window.DeSciX[name];
  announce(name);
}

/** Dispatch the readiness/change event, tolerating environments without CustomEvent. */
function announce(member) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  const marker = currentBus().bridge;
  const detail = {
    member,
    version: BRIDGE_VERSION,
    // A publisher that replaced the bus without carrying the marker over leaves no
    // one to ask; report the keys we can see rather than throwing mid-announce.
    members: marker ? marker.members() : Object.keys(currentBus()).filter((k) => k !== 'bridge'),
  };
  let evt;
  if (typeof CustomEvent === 'function') {
    evt = new CustomEvent(BRIDGE_READY_EVENT, { detail });
  } else {
    // Node/test environments without CustomEvent: a plain bag is enough for the
    // listeners we ship, and failing to announce would be worse than a plain object.
    evt = { type: BRIDGE_READY_EVENT, detail };
  }
  try {
    window.dispatchEvent(evt);
  } catch (e) {
    console.error('[DeSciX.bridge] failed to announce bridge readiness:', e);
  }
}
