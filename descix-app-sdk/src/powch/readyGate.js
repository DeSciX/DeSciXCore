/**
 * PowchReadyGate — the one owner of "has this Powch iframe announced it is listening?"
 * for every host-side client (PowchClient standalone mode, PowchBridgeClient).
 *
 * Powch posts POWCH_READY to its parent once initialization is done
 * (DeSciX_Powch packages/react/src/PowchAppProvider.jsx, INITIALIZE handler). A request
 * posted before that is lost: the iframe is not listening yet, and the loss surfaces
 * only as the request's own (120 s) timeout. So readiness is set by that message and
 * nothing else — not by the iframe element existing, not by a timer.
 *
 * Requests made before READY are queued and run on READY in call order. If READY does
 * not arrive within `readyTimeoutMs`, each queued request is rejected with an error that
 * names the missing POWCH_READY, so the failure says what went deaf.
 *
 * The caller validates the message (its origin, at minimum) before calling markReady().
 */

export const POWCH_READY = 'POWCH_READY';

// Bound on how long a request may wait for POWCH_READY. Independent of the per-request
// timeout, which starts only once the request is actually posted.
export const DEFAULT_READY_TIMEOUT_MS = 30000;

export class PowchReadyGate {
  /**
   * @param {object} opts
   * @param {string} opts.label - names the iframe in errors (its URL)
   * @param {number} [opts.readyTimeoutMs]
   */
  constructor({ label, readyTimeoutMs = DEFAULT_READY_TIMEOUT_MS }) {
    if (!label) throw new Error('PowchReadyGate: label (the Powch iframe URL) is required');
    this.label = label;
    this.readyTimeoutMs = readyTimeoutMs;
    this._ready = false;
    this._queue = [];
  }

  get isReady() {
    return this._ready;
  }

  /** Number of requests waiting for POWCH_READY. */
  get queuedCount() {
    return this._queue.length;
  }

  /**
   * Run `send` now if READY has arrived; otherwise queue it until READY. On the ready
   * bound, `reject` receives an error naming the missing POWCH_READY and `send` never runs.
   */
  run(type, send, reject) {
    if (this._ready) {
      send();
      return;
    }
    const entry = { type, send, reject, timer: null };
    entry.timer = setTimeout(() => {
      const i = this._queue.indexOf(entry);
      if (i === -1) return;
      this._queue.splice(i, 1);
      reject(new Error(
        `Powch iframe (${this.label}) did not send ${POWCH_READY} within ${this.readyTimeoutMs}ms; ` +
        `${type} was never posted`
      ));
    }, this.readyTimeoutMs);
    this._queue.push(entry);
  }

  /** The iframe announced POWCH_READY: flush the queue in call order. */
  markReady() {
    this._ready = true;
    const queued = this._queue.splice(0);
    for (const entry of queued) {
      clearTimeout(entry.timer);
      entry.send();
    }
  }

  /**
   * A different iframe now serves this client (it has not announced READY yet). Queued
   * requests stay queued and go to whichever frame announces READY next.
   */
  reset() {
    this._ready = false;
  }

  /** Reject every queued request, naming `reason` and the request; nothing is posted. */
  cancel(reason) {
    const queued = this._queue.splice(0);
    for (const entry of queued) {
      clearTimeout(entry.timer);
      entry.reject(new Error(`${reason}; ${entry.type} was never posted`));
    }
  }
}
