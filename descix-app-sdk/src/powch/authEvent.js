/**
 * authEvent — the one owner of the shell's sign-in state as apps see it: `{ signedIn, address }`.
 *
 * `signedIn` is whether the shell holds a DeSciX session. It covers every way a session arrives
 * (a sign-in an app requested, the shell's own Sign In, a session restored at boot) and every way
 * it ends (SESSION_EXPIRED). Powch's own `isAuthenticated` flag is not this fact: Powch reports a
 * sign-in only to the host whose request started it, so after a reload, or a sign-in the user
 * starts inside a sidebar the host merely opened, Powch has told the host nothing while the shell
 * holds a session.
 *
 * `address` is the wallet address Powch released to this host (POWCH_STATE_UPDATE
 * `displayAddress`), and only while the shell is signed in; null when Powch released none. It is
 * dropped when the session ends, so it never carries over to the next account.
 *
 * Subscribers registered with `on('auth', cb)` are called once at once with the current state,
 * then on every change. A subscriber that throws is reported and the others still run.
 */

export const AUTH_EVENT = 'auth';

/** Whether `info` is a DeSciX session (the shape Powch hands the shell and the shell restores). */
export function isSession(info) {
  return !!(info?.id || info?.access_token);
}

function sameState(a, b) {
  return a.signedIn === b.signedIn && a.address === b.address;
}

function assertAuthEvent(event, method) {
  if (event !== AUTH_EVENT) {
    throw new Error(
      `DeSciX.powch.${method}(${JSON.stringify(event)}): the only event is '${AUTH_EVENT}' ` +
      `(payload { signedIn: boolean, address: string|null })`
    );
  }
}

function deliver(cb, state) {
  try {
    cb(state);
  } catch (err) {
    console.error(`[DeSciX.powch] an '${AUTH_EVENT}' subscriber threw (the other subscribers still ran):`, err);
  }
}

/**
 * @returns {{
 *   readonly current: {signedIn: boolean, address: string|null},
 *   setSession(sessionInfo: object|null): void,
 *   setReleasedAddress(address: string|null|undefined): void,
 *   on(event: 'auth', cb: Function): () => void,
 *   off(event: 'auth', cb: Function): void,
 * }}
 */
export function createAuthEvent() {
  let signedIn = false;
  let released = null;
  let current = Object.freeze({ signedIn: false, address: null });
  const subscribers = new Set();

  function publish() {
    const next = { signedIn, address: signedIn ? released : null };
    if (sameState(next, current)) return;
    current = Object.freeze(next);
    for (const cb of [...subscribers]) deliver(cb, current);
  }

  const auth = {
    get current() {
      return current;
    },

    /** Feed: the shell's session (AppContext sessionInfo). Called on every change of it. */
    setSession(sessionInfo) {
      const was = signedIn;
      signedIn = isSession(sessionInfo);
      if (was && !signedIn) released = null;
      publish();
    },

    /** Feed: the address Powch released to this host with a sign-in it requested. */
    setReleasedAddress(address) {
      released = address ?? null;
      publish();
    },

    /** Subscribe; `cb` is called now with the current state, then on every change. Returns the unsubscribe. */
    on(event, cb) {
      assertAuthEvent(event, 'on');
      if (typeof cb !== 'function') {
        throw new TypeError(`DeSciX.powch.on('${AUTH_EVENT}', cb): cb must be a function, got ${typeof cb}`);
      }
      subscribers.add(cb);
      deliver(cb, current);
      return () => auth.off(event, cb);
    },

    off(event, cb) {
      assertAuthEvent(event, 'off');
      subscribers.delete(cb);
    },
  };
  return auth;
}
