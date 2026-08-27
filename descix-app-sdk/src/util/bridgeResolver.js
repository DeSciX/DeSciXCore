/**
 * bridgeResolver — THE owner of window/iframe LEVEL DETECTION for the DeSciX bus.
 *
 * ── Why this module exists ───────────────────────────────────────────────────
 * The shell publishes its service bus on ITS OWN window (`window.DeSciX`, owned by
 * appBridge.js). An app embedded one level down therefore reaches it at `parent`;
 * an app nested deeper reaches it further up. Before this module every consumer
 * hard-coded its own guess at that hop, and the guesses disagreed: the scaffold
 * reached `window.top.DeSciX`, the appView/appChat docblocks taught
 * `window.parent.DeSciX`, and PowchClient tried `window` then `window.top`. Those
 * are three derivations of one fact — the general form of mirror drift — and they
 * are wrong in different situations:
 *
 * The scaffold's share of that drift, measured 2026-08-21 before this module existed:
 * `window.top` 17 occurrences, `window.parent` 0, and its guard was named
 * `hasParentAccess()` while reading `window.top` — the name and the behaviour had
 * already come apart. That file is now GENERATED from templates/DeSciXAppSDK.template.js
 * with this resolver inlined, so the count is history; it is recorded here because a
 * resolver that costs a hop-walk deserves to say how bad the hand-rolled version got.
 *
 *
 *   - `parent` is wrong when an app is nested more than one level below the shell.
 *   - `top` is wrong when the shell is itself embedded in some outer page, because
 *     `top` is then the OUTER page, which carries no bus.
 *
 * Both are wrong for the same reason: they encode a fixed DISTANCE when the real
 * question is an IDENTITY — "which window is carrying the bus?". So the hop is
 * computed, once, here, and no consumer writes `window.` anything.
 *
 * ── Resolution order (the contract) ──────────────────────────────────────────
 * Walk UP the frame chain from the starting window toward `top`, and stop at the
 * FIRST window that carries the bridge marker:
 *
 *   1. hop 0  — the starting window itself (`self`). A page that published its own
 *               bus IS the shell; it resolves to itself, distance zero.
 *   2. hop 1  — `parent` (the ordinary embedded-app case).
 *   3. hop 2… — successive ancestors, up to and including `top` (nested embedding).
 *   4. none   — no ancestor carries the marker. Which of TWO states that is depends
 *               on whether this window is framed at all, and they are NOT the same
 *               fact (GAP-5, measured 2026-08-27):
 *                 `standalone`          — `window.top === window`. This page is the
 *                                          top window. There is no shell because there
 *                                          is no frame above; that is normal and final.
 *                 `embedded-no-bridge`  — `window.top !== window`. This page IS framed,
 *                                          but nothing above it carried a readable bus.
 *
 *               Collapsing these into one `standalone` is what let GAP-4 survive
 *               undetected: an app pinned to the wrong host loads inside the shell,
 *               finds no readable bus because the ancestor is cross-origin, reports
 *               `standalone`, and silently degrades to scripting-window-CLOSED — which
 *               is indistinguishable from correctly running with no shell at all. The
 *               failure detonates toward silence.
 *
 *               `window.top !== window` is readable CROSS-ORIGIN, so this distinction
 *               costs nothing the resolver does not already hold.
 *
 *               NOTE the mode does NOT name a CAUSE. `embedded-no-bridge` covers both
 *               "the shell above is cross-origin and unreadable" and "this page is
 *               framed by something that is not a DeSciX shell at all". The walk exits
 *               identically in both cases, so the resolver cannot tell them apart, and
 *               naming a cause it never established would be the same over-claiming
 *               that hand-rolled host detection was guilty of.
 *
 * The marker is `DeSciX.bridge.version`, published by appBridge.js `ensureBus()`.
 * The marker — not the mere presence of a `DeSciX` property — is the discriminator,
 * because "something called DeSciX is on that window" is exactly the ambiguity that
 * let an app-side proxy be mistaken for a shell bus.
 *
 * ── Cross-origin ancestors ───────────────────────────────────────────────────
 * Reading a property of a cross-origin window throws
 *     SecurityError: Blocked a frame with origin "…" from accessing a cross-origin frame
 * so EVERY hop is probed inside try/catch and a throwing ancestor is treated as
 * "not the shell" — and the walk CONTINUES past it. Continuing is deliberate, not
 * defensive noise: `top` is a direct reference, so an A→B→A nesting can put a
 * reachable same-origin bus above an unreachable cross-origin frame. Powch depends
 * on this: its iframe is cross-origin BY DESIGN, and walking up out of it must
 * return "standalone", never throw.
 *
 * ── Why this file has no imports ─────────────────────────────────────────────
 * It is the single source that the app-side scaffold (`DeSciXAppSDK.js`) INLINES at
 * generation time — see scripts/generate-app-sdk-copies.js. A plain browser script
 * with no module loader cannot follow an import, and re-typing the resolver into the
 * scaffold would recreate the very drift this module deletes. So the region between
 * the INLINE markers below is self-contained on purpose. Keep it that way.
 */

/* ---8<--- INLINE START (generated into DeSciXAppSDK.js — keep self-contained) */

/**
 * Hard ceiling on the frame-chain walk. A malformed or hostile frame graph must not
 * be able to spin the resolver; 32 is far beyond any real embedding depth.
 */
export const BRIDGE_RESOLUTION_MAX_HOPS = 32;

/**
 * Does this window carry the shell's bus?
 *
 * @param {Window} w
 * @returns {object|null} the bus, or null when absent OR unreadable (cross-origin).
 */
function busOn(w) {
  try {
    const bus = w && w.DeSciX;
    // The version marker, not merely a `DeSciX` property: an app-side proxy also
    // lives at `window.DeSciX`, and only the OWNER publishes `bridge.version`.
    if (bus && bus.bridge && bus.bridge.version) return bus;
  } catch (e) {
    // Cross-origin ancestor. Not the shell as far as we can ever know — and not an
    // error: the walk continues past it (see the docblock).
  }
  return null;
}

/**
 * Find the window carrying the DeSciX bus, walking up from `startWindow`.
 *
 * This is the ONE place the `self` / `parent` / `top` question is answered. Consumers
 * ask for the bus, never for a window level.
 *
 * @param {Window} [startWindow] - defaults to the ambient `window`.
 * @returns {{window: Window|null, bus: object|null, hops: number, mode: 'shell'|'standalone'|'embedded-no-bridge'}}
 *   `mode: 'shell'`              — `hops` = frames traversed (0 = this page owns the bus).
 *   `mode: 'standalone'`         — `bus: null`, `hops: -1`; this window is `top`, no shell exists.
 *   `mode: 'embedded-no-bridge'` — `bus: null`, `hops: -1`; this window IS framed but no
 *                                   ancestor carried a readable bus. A shell may be above and
 *                                   unreadable (cross-origin), or there may be no shell above.
 *                                   The resolver cannot distinguish those and does not claim to.
 */
export function resolveBridge(startWindow) {
  const start =
    startWindow || (typeof window === 'undefined' ? null : window);

  // No DOM at all (SSR / node): there is no frame chain, so this is standalone in the
  // strict sense the mode now carries. Never throws.
  if (!start) return { window: null, bus: null, hops: -1, mode: 'standalone' };

  let w = start;
  for (let hops = 0; hops <= BRIDGE_RESOLUTION_MAX_HOPS; hops++) {
    const bus = busOn(w);
    if (bus) return { window: w, bus, hops, mode: 'shell' };

    let next;
    try {
      next = w.parent;
    } catch (e) {
      // Even `.parent` can be refused in exotic sandboxes. Nothing above is
      // reachable, so the answer is standalone rather than a throw.
      break;
    }
    // `window.parent === window` at the top of the chain: that is the terminator.
    if (!next || next === w) break;
    w = next;
  }

  // No ancestor carried the bus. WHICH no-bus state this is turns on one question the
  // resolver can always answer, even across origins: is this window framed at all?
  return { window: start, bus: null, hops: -1, mode: noBusMode(start) };
}

/**
 * `standalone` when this window is the TOP of its chain; `embedded-no-bridge` when it is framed
 * but nothing above carried a readable bus.
 *
 * "Am I the top?" has TWO equivalent answers in a real browser — `top === self` and
 * `parent === self` — and this asks both, preferring `top`, because they are not equally
 * available. `window.top` is a direct reference and comparing it to `self` is an identity check,
 * not a property read, so it does not throw across origins: that is what makes the distinction
 * free. But `top` is not guaranteed to EXIST on every window-like object the resolver is handed
 * (measured 2026-08-27: this module's own test fixtures model a window as `{ parent: self }`
 * with no `top` at all, and an implementation that read only `top` called those genuine top
 * windows "framed"). `parent === self` is the same fact and is how the walk above already
 * terminates, so it is the honest fallback rather than a second derivation.
 *
 * A window so sandboxed that BOTH reads throw is reported `embedded-no-bridge`: a window that
 * cannot see its own top or parent is certainly not demonstrably the top, and claiming
 * `standalone` there would assert something never established.
 */
function noBusMode(w) {
  try {
    if (w.top !== undefined && w.top !== null) return w.top === w ? 'standalone' : 'embedded-no-bridge';
  } catch (e) {
    return 'embedded-no-bridge';
  }
  try {
    const p = w.parent;
    return !p || p === w ? 'standalone' : 'embedded-no-bridge';
  } catch (e) {
    return 'embedded-no-bridge';
  }
}

/* ---8<--- INLINE END */
