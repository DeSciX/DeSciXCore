/**
 * PowchBridgeClient - PWA-owned postMessage client to Powch iframe
 *
 * Pure postMessage protocol. No Powch internals. Modeled on standalone-vanilla PowchClient.
 * The PWA owns the iframe (PowchSideBarWidget); this client receives it via registerIframe().
 *
 * Security: Validates event.origin on all received messages.
 */

import { requirePowchUrl } from '../powch/powchOrigin.js';
import { PowchReadyGate, POWCH_READY } from '../powch/readyGate.js';
import { createAuthEvent, isSession } from '../powch/authEvent.js';

const DEFAULT_REQUEST_TIMEOUT_MS = 120000;

const TAB_IDS = {
  CARDS: 'cards',
  PASSES: 'passes',
  PORTFOLIO: 'portfolio',
  ACTIVITY: 'activity',
};

export class PowchBridgeClient {
  constructor(config = {}) {
    // Where the wallet lives — one owner, no default. `this.origin` is the value
    // every inbound postMessage is checked against, so a guessed bridgeUrl would
    // also mean trusting a guessed origin.
    this.bridgeUrl = requirePowchUrl(config.bridgeUrl, 'PowchBridgeClient');
    this.origin = new URL(this.bridgeUrl).origin;
    this.brand = config.brand
      ? { name: config.brand.name ?? 'This site', logo: config.brand.logo ?? null }
      : { name: 'This site', logo: null };
    this.getApi = config.getApi || null;
    this.requestTimeoutMs = config.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;

    this.iframe = null;
    this.pendingRequests = new Map();
    this.requestIdCounter = 0;

    // Readiness is Powch's POWCH_READY and nothing else (see ../powch/readyGate.js).
    this._readyGate = new PowchReadyGate({ label: this.bridgeUrl, readyTimeoutMs: config.readyTimeoutMs });
    // POWCH_READY arrived before registerIframe(); applied when the iframe registers.
    this._readyBeforeRegister = false;
    this._isIframeVisible = false;
    // The shell's sign-in state as apps see it ({ signedIn, address }), published as
    // DeSciX.powch.on('auth'). Its signed-in half is fed by the shell's session (useDeSciXBridge);
    // this client feeds the address Powch releases to this host.
    this.auth = createAuthEvent();
    this._currentTab = TAB_IDS.CARDS;
    this._listeners = new Map();
    this._boundHandleMessage = null;
  }

  /**
   * Sync session from Powch to host when payload contains sessionInfo.
   * Ensures DeSciX session state updates whether login came via bridge.login() or internal unlock.
   */
  _syncSessionToHost(payload) {
    const info = payload?.sessionInfo ?? payload;
    if (!isSession(info)) return;
    try {
      const shell = typeof window !== 'undefined' ? window.DeSciX : null;
      if (shell?.loginWithSessionToken) {
        shell.loginWithSessionToken(payload);
      }
      if (shell?.AppContext?.setAppEvent) {
        shell.AppContext.setAppEvent('LOGIN_SUCCESS');
      }
    } catch (e) {
      console.warn('[PowchBridgeClient] _syncSessionToHost failed:', e);
    }
  }

  /**
   * Register the iframe element. Called when PowchSideBarWidget mounts.
   *
   * The element existing does NOT make the bridge ready: Powch is not listening until it
   * posts POWCH_READY, and a request posted earlier is lost. A different element than the
   * one registered before is a fresh Powch load and must announce READY itself.
   */
  registerIframe(iframe) {
    if (!iframe || !iframe.contentWindow) return;
    if (iframe === this.iframe) return;
    if (this.iframe) this._readyGate.reset();
    this.iframe = iframe;
    if (this._readyBeforeRegister) {
      this._readyBeforeRegister = false;
      this._markReady();
    }
  }

  _markReady() {
    this._readyGate.markReady();
    this._emit('ready');
  }

  /**
   * Activate the bridge's window message listener. Idempotent — safe to call
   * repeatedly (e.g. after React strict-mode unmount/remount cycles).
   * Must be paired with destroy() for cleanup.
   */
  activate() {
    if (this._boundHandleMessage) {
      window.removeEventListener('message', this._boundHandleMessage);
    }
    this._boundHandleMessage = (event) => this._handleMessage(event);
    window.addEventListener('message', this._boundHandleMessage);
  }

  _handleMessage(event) {
    const data = event.data || {};
    const { type } = data;

    // Debug: log all POWCH_ messages regardless of origin
    if (type && typeof type === 'string' && type.startsWith('POWCH_')) {
      const originMatch = event.origin === this.origin;
      console.log(`[PowchBridge] Received ${type} from ${event.origin} (expected: ${this.origin}, match: ${originMatch})`,
        type === 'POWCH_RESPONSE' ? { requestId: data.requestId, success: data.success, hasPending: this.pendingRequests.has(data.requestId) } : '');
    }

    try {
      if (event.origin !== this.origin) return;
    } catch (e) {
      return;
    }

    const { requestId, success, payload, error: errorMsg } = data;

    if (type === 'POWCH_RESPONSE') {
      // Always sync session for successful responses — even if the pending request
      // was removed (e.g. timeout fired during a long auth flow). The auth succeeded
      // on the Powch side; the Shell must learn about it.
      if (success) {
        this._syncSessionToHost(payload);
      }
      if (requestId && this.pendingRequests.has(requestId)) {
        const { resolve, reject, timer } = this.pendingRequests.get(requestId);
        clearTimeout(timer);
        this.pendingRequests.delete(requestId);
        if (success) resolve(payload);
        else reject(new Error(errorMsg || 'Request failed'));
      }
      return;
    }

    // POWCH_READY must be checked BEFORE the iframe null-guard: the iframe app may send
    // READY before React calls registerIframe(). Trusted on the origin check above, like
    // the other pre-source-guard messages.
    if (type === POWCH_READY) {
      if (this.iframe) this._markReady();
      else this._readyBeforeRegister = true;
      return;
    }

    // UI events: origin-verified (line 90) is sufficient. Vite HMR may cause
    // event.source !== iframe.contentWindow after a full-page reload inside the iframe.
    if (type === 'POWCH_UI_CLOSE') {
      this._isIframeVisible = false;
      this._emit('ui_close');
      return;
    }

    if (type === 'POWCH_TOGGLE_UI') {
      this._isIframeVisible = !this._isIframeVisible;
      this._emit('toggle_ui');
      return;
    }

    if (!this.iframe) return;
    if (event.source !== this.iframe.contentWindow) return;

    if (!type) return;

    if (type === 'POWCH_STATE_UPDATE' && payload) {
      if (payload.displayAddress !== undefined) this.auth.setReleasedAddress(payload.displayAddress);
      this._syncSessionToHost(payload);
      this._emit('state_update', payload);
      return;
    }

    if (requestId && this.pendingRequests.has(requestId)) {
      const { resolve, reject, timer } = this.pendingRequests.get(requestId);
      clearTimeout(timer);
      this.pendingRequests.delete(requestId);
      if (success) resolve(payload);
      else reject(new Error(errorMsg || 'Request failed'));
    }
  }

  /**
   * Before POWCH_READY the request is queued, not posted (the readiness gate owns that);
   * `timeout` runs from the actual post.
   */
  _sendRequest(type, payload = {}, timeout = this.requestTimeoutMs) {
    return new Promise((resolve, reject) => {
      if (!this.iframe?.contentWindow) {
        reject(new Error(
          `Powch PWA not ready: no Powch iframe is registered with this bridge (PowchSideBarWidget is not mounted); ${type} was not sent`
        ));
        return;
      }

      const doSend = () => {
        const requestId = `req_${++this.requestIdCounter}_${Date.now()}`;
        console.log(`[PowchBridge] Sending ${type} (requestId: ${requestId}) to ${this.origin}`);

        // Register BEFORE postMessage — the response can arrive synchronously
        // (same-origin iframe or fast round-trip) before the next line executes.
        const timer = setTimeout(() => {
          if (this.pendingRequests.has(requestId)) {
            this.pendingRequests.delete(requestId);
            reject(new Error(`Timeout waiting for ${type} response`));
          }
        }, timeout);
        this.pendingRequests.set(requestId, { resolve, reject, timer });

        const enrichedPayload = { ...payload, brand: this.brand };
        this.iframe.contentWindow.postMessage(
          { type, requestId, payload: enrichedPayload },
          this.origin
        );
      };

      this.openUi();
      this._readyGate.run(
        type,
        () => requestAnimationFrame(() => requestAnimationFrame(doSend)),
        reject
      );
    });
  }

  _emit(event, data) {
    const cbs = this._listeners.get(event);
    if (cbs) cbs.forEach((cb) => cb(data));
  }

  on(event, callback) {
    if (!this._listeners.has(event)) this._listeners.set(event, []);
    this._listeners.get(event).push(callback);
  }

  off(event, callback) {
    const cbs = this._listeners.get(event);
    if (cbs) {
      const idx = cbs.indexOf(callback);
      if (idx >= 0) cbs.splice(idx, 1);
    }
  }

  destroy() {
    window.removeEventListener('message', this._boundHandleMessage);
    for (const { timer } of this.pendingRequests.values()) {
      clearTimeout(timer);
    }
    this.pendingRequests.clear();
    this._readyGate.cancel(`PowchBridgeClient destroyed before Powch sent ${POWCH_READY}`);
  }

  // --- UI State ---
  get isBridgeReady() {
    return this._readyGate.isReady;
  }
  get isIframeVisible() {
    return this._isIframeVisible;
  }
  get currentTab() {
    return this._currentTab;
  }

  toggleUi() {
    this._isIframeVisible = !this._isIframeVisible;
    this._emit('toggle_ui');
  }

  openUi() {
    if (!this._isIframeVisible) {
      this._isIframeVisible = true;
      this._emit('ui_open');
    }
  }

  closeUi() {
    if (this._isIframeVisible) {
      this._isIframeVisible = false;
      this._emit('ui_close');
    }
  }

  setTab(tab) {
    if (Object.values(TAB_IDS).includes(tab)) {
      this._currentTab = tab;
      this._sendRequest('POWCH_SET_TAB', { tab }).catch(console.error);
    }
  }

  // --- API Methods ---
  login(options = {}) {
    return this._sendRequest('POWCH_LOGIN', options);
  }

  logout() {
    // WS-HEADLESS-MVP-R7 (defect #4): was a hard no-op — shell logout never reached
    // Powch. Fits the existing generic request/response plumbing untouched: Powch
    // whitelists POWCH_LOGOUT and routes it to its internal full-logout handler,
    // responding via the standard POWCH_RESPONSE requestId echo (contract agreed with
    // the Powch-side agent under this workstream — no wire-format change on either side).
    return this._sendRequest('POWCH_LOGOUT', {});
  }

  request(options = {}) {
    const hasRegisterDeSciX = !!options.registerDeSciX;
    const requiresIdentity =
      Array.isArray(options.require) &&
      options.require.some((r) => typeof r === 'string' && (r.includes('email') || r.includes('verified_email')));
    const isWalletOnly =
      options.signatureMessage ||
      (Array.isArray(options.require) &&
        options.require.some((r) => typeof r === 'string' && r.includes('wallet')));
    if (hasRegisterDeSciX || requiresIdentity) {
      return this._sendRequest('POWCH_LOGIN', options);
    }
    return isWalletOnly ? this._sendRequest('POWCH_CONNECT_WALLET', options) : this._sendRequest('POWCH_LOGIN', options);
  }

  connectWallet(options = {}) {
    return this._sendRequest('POWCH_CONNECT_WALLET', options);
  }

  manage(options = {}) {
    return this._sendRequest('POWCH_MANAGE', options);
  }

  sign(data) {
    return this._sendRequest('POWCH_SIGN', data);
  }

  receive(params) {
    return this._sendRequest('POWCH_RECEIVE', params);
  }

  send(params) {
    return this._sendRequest('POWCH_SEND', params);
  }

  open(options = {}) {
    if (typeof options === 'string') {
      return this._sendRequest('POWCH_OPEN', { tab: options });
    }
    return this._sendRequest('POWCH_OPEN', options);
  }

  signTransaction(tx, address) {
    return this._sendRequest('POWCH_SIGN_TX', { tx, address });
  }

  signMessage(message, address) {
    return this._sendRequest('POWCH_SIGN_MESSAGE', { message, address });
  }

  signTypedData(domain, types, value, address) {
    return this._sendRequest('POWCH_SIGN_TYPED_DATA', { domain, types, value, address });
  }

  get config() {
    return { bridgeUrl: this.bridgeUrl, brand: this.brand };
  }

  get networkAPI() {
    if (!this.getApi) return null;
    const Api = this.getApi();
    return {
      submitMetaTransaction: (params) => Api.call('submit_meta_transaction', params),
      submitTransaction: (params) => Api.call('submit_transaction', params),
    };
  }
}

// Sign-in state has one owner, `bridge.auth`. A read of a member it replaced fails loud, naming it.
for (const [member, use] of Object.entries({
  isAuthenticated: 'bridge.auth.current.signedIn',
  displayAddress: 'bridge.auth.current.address',
  wallet: 'bridge.auth.current.address',
})) {
  Object.defineProperty(PowchBridgeClient.prototype, member, {
    get() {
      throw new Error(`PowchBridgeClient.${member} is removed: read ${use} (or subscribe with bridge.auth.on('auth', cb))`);
    },
  });
}
