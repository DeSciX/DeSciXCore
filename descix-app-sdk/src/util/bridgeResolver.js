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
 *   4. none   — no ancestor carries the marker: STANDALONE. Resolves to the
 *               starting window with `bus: null`, so a no-shell app takes the
 *               standalone path instead of hanging on a bridge that is never coming.
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
 * @returns {{window: Window|null, bus: object|null, hops: number, mode: 'shell'|'standalone'}}
 *   `mode: 'shell'` with `hops` = frames traversed (0 = this page owns the bus);
 *   `mode: 'standalone'` with `bus: null` and `hops: -1` when nothing carries it.
 */
export function resolveBridge(startWindow) {
  const start =
    startWindow || (typeof window === 'undefined' ? null : window);

  // No DOM at all (SSR / node): honestly standalone, and never throws.
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

  return { window: start, bus: null, hops: -1, mode: 'standalone' };
}

/* ---8<--- INLINE END */
