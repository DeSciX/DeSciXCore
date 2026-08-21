/**
 * PowchClient - Drop-in JavaScript library for Powch integration.
 * Handles iframe management, postMessage communication, and provides a clean Promise-based API.
 *
 * UPDATED (2026-02-04): Supports "Service-Oriented Shell" architecture.
 * If running inside the DeSciX App Shell, it delegates to the Shell's bridge instead of creating an iframe.
 */

import { requirePowchUrl } from './powchOrigin.js';
import { resolveBridge } from '../util/bridgeResolver.js';

export class PowchClient {
  constructor(config = {}) {
    this.handlers = {};
    this.pendingRequests = new Map();
    this.requestIdCounter = 0;
    this._user = null;
    this.isReady = false;
    this._iframeVisible = false;

    // 1. Check for Shell Bridge (Embedded Mode)
    this.shellBridge = this._findShellBridge();

    if (this.shellBridge) {
      console.log('[PowchClient] Running in Embedded Mode (Shell Bridge detected)');
      this.isReady = true;
      // In embedded mode, we don't manage the iframe.
      // We assume the shell is ready.
      setTimeout(() => this.emit('ready'), 0);
    } else {
      // 2. Standalone Mode (Legacy/Dev)
      console.log('[PowchClient] Running in Standalone Mode (No Shell Bridge), Bridge URL: ', config.bridgeUrl);
      // Standalone hosts (frqtl.com, the splitview harness, third-party sites)
      // reach us here. They pass bridgeUrl explicitly; if they forget, they hear
      // about it rather than silently loading the production wallet.
      this.bridgeUrl = requirePowchUrl(config.bridgeUrl, 'PowchClient');
      this.container = config.container || document.body;
      this.origin = new URL(this.bridgeUrl).origin;
      this.iframe = null;

      this._initIframe();
      this._setupListeners();
    }
  }

  /**
   * Detect if we are running inside a DeSciX Shell that exposes the Powch Bridge.
   *
   * The frame level is not our question to answer: this used to check `window` and
   * then `window.top`, which is a guess that is wrong whenever the shell is neither
   * (a nested app, or a shell that is itself embedded). `resolveBridge()` owns that
   * walk — including the cross-origin hops, which it reports as "no shell" rather
   * than throwing, so a cross-origin host falls through to standalone as before.
   */
  _findShellBridge() {
    const { bus } = resolveBridge();
    if (bus?.powch) return bus.powch;
    if (bus) {
      // A shell IS hosting us, it just has no wallet bridge mounted. Distinct from
      // "no shell", and worth saying: the standalone fallback below will load a
      // SECOND wallet inside a page that already has a shell.
      console.warn('[PowchClient] A DeSciX shell is hosting this page but publishes no Powch bridge. Falling back to standalone mode.');
    }
    return null;
  }

  /**
   * Initialize the Powch iframe and inject it into the DOM.
   * Uses sidebar positioning (like MetaMask extension popup).
   */
  _initIframe() {
    this.iframe = document.createElement('iframe');
    this.iframe.sandbox="allow-scripts allow-same-origin"
    this.iframe.src = this.bridgeUrl;
    this.iframe.id = 'powch-sdk-bridge';
    this.iframe.allow = "publickey-credentials-get *; publickey-credentials-create *";

    // Sidebar style - fixed position on right side
    Object.assign(this.iframe.style, {
      display: 'none',
      border: 'none',
      position: 'fixed',
      top: '0',
      right: '0',
      width: '375px', // Standard mobile width
      height: '100%',
      zIndex: '2147483647',
      opacity: '0',
      pointerEvents: 'none',
      boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)',
      borderLeft: '1px solid #30363d',
      background: '#0D1117', // Dark background while loading
    });

    this.container.appendChild(this.iframe);
  }

  /**
   * Set up window message listener for communication from the iframe.
   */
  _setupListeners() {
    window.addEventListener('message', (event) => {
      if (event.origin !== this.origin) return;
      if (event.source !== this.iframe.contentWindow) return;

      const data = event.data || {};
      const { type, requestId, success, payload, error } = data;

      // Handle internal protocol events
      if (type === 'POWCH_READY') {
        this.isReady = true;
        this.emit('ready');
        return;
      }

      if (type === 'POWCH_UI_CLOSE') {
        this.close();
        return;
      }

      // Handle request/response matching (no auto-hide on response)
      if (requestId && this.pendingRequests.has(requestId)) {
        const { resolve, reject } = this.pendingRequests.get(requestId);
        this.pendingRequests.delete(requestId);

        if (success) {
          resolve(payload);
        } else {
          reject(new Error(error || 'Request failed'));
        }
      }
    });
  }

  _showIframe() {
    this._iframeVisible = true;
    Object.assign(this.iframe.style, {
      display: 'block',
      opacity: '1',
      pointerEvents: 'auto',
      zIndex: '2147483647',
      // Animate in from right
      transform: 'translateX(0)',
      transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
    });
  }

  _hideIframe() {
    this._iframeVisible = false;
    Object.assign(this.iframe.style, {
      display: 'none',
      opacity: '0',
      pointerEvents: 'none',
      zIndex: '-1',
      transform: 'translateX(100%)',
    });
  }

  /**
   * Show the Powch sidebar (idempotent). Host owns visibility; call before or when user requests PII/UI.
   * @param {Object} [options] - Optional configuration
   * @param {string} [options.tab] - Deep-link to a specific tab ('home', 'wallet', 'holdings', 'activity')
   */
  open(options = {}) {
    if (this.shellBridge) {
      // Delegate to Shell
      // Note: shellBridge.open might handle tab options differently, but we pass it through
      return this.shellBridge.open(options.tab, options.data);
    }

    if (!this._iframeVisible) {
      this._showIframe();
      this.emit('ui_open');
    }
    // Deep-link to specific tab if provided
    if (options.tab) {
      this._sendRequest('POWCH_SET_TAB', { tab: options.tab });
    }
  }

  /**
   * Hide the Powch sidebar (idempotent). Call when user closes via host UI, or iframe sends POWCH_UI_CLOSE.
   */
  close() {
    if (this.shellBridge) {
      // Delegate to Shell (if it supports explicit close)
      // The bridge interface might not have 'close', but usually 'open' toggles or we can assume host handles it.
      // Checking DeSciXBridge... it maps 'open' but not 'close'.
      // However, usually clicking outside or a toggle handles it.
      // If we need explicit close, we should add it to DeSciXBridge.
      // For now, we'll do nothing or log.
      console.warn('[PowchClient] close() called in embedded mode - relying on Shell UI');
      return;
    }

    if (this._iframeVisible) {
      this._hideIframe();
      this.emit('ui_close');
    }
  }

  /**
   * Send a request to the Powch iframe.
   */
  _sendRequest(type, payload = {}, timeout = 120000) {
    const requestId = `req_${++this.requestIdCounter}_${Date.now()}`;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      this.iframe.contentWindow.postMessage({
        type,
        requestId,
        payload
      }, this.origin);

      if (timeout) {
        setTimeout(() => {
          if (this.pendingRequests.has(requestId)) {
            this.pendingRequests.delete(requestId);
            reject(new Error(`Timeout waiting for ${type} response`));
          }
        }, timeout);
      }
    });
  }

  /**
   * Simple event emitter implementation.
   */
  on(event, callback) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(callback);

    // If ready event is registered and we are already ready, trigger it immediately
    if (event === 'ready' && this.isReady) {
      callback();
    }
  }

  emit(event, data) {
    if (this.handlers[event]) {
      this.handlers[event].forEach(cb => cb(data));
    }
  }

  /**
   * Authenticate the user via Powch. PII-implying: ensures sidebar is shown before request (idempotent).
   * Caches user on success and emits 'auth' so createButton / host can update.
   * @returns {Promise<{email: string, powchToken: string, address: string}>}
   */
  async auth(options = {}) {
    let payload;

    if (this.shellBridge) {
      // Delegate to Shell
      // Bridge 'login' maps to 'POWCH_LOGIN' or 'POWCH_AUTH'
      payload = await this.shellBridge.login(options);
    } else {
      this.open();
      payload = await this._sendRequest('POWCH_AUTH', {
        origin: window.location.origin,
        require: options.require || ['email'],
        ...options
      });
    }

    const user = payload && (payload.email || payload.powchToken)
      ? { email: payload.email ?? null, address: payload.address ?? null, powchToken: payload.powchToken ?? null }
      : null;
    this._user = user;
    if (user) this.emit('auth', user);
    return payload;
  }

  /**
   * Connect to a wallet via Powch's internal WalletConnect bridge. PII-implying: ensures sidebar is shown (idempotent).
   * @param {object} params - Optional { signatureMessage, startWalletMode, instruction }
   * @returns {Promise<{connected: boolean, session: object}>}
   */
  async connectWallet(params = {}) {
    if (this.shellBridge) {
      // Shell bridge might not expose 'connectWallet' directly if it's not in the mapping.
      console.warn('[PowchClient] connectWallet not directly supported in embedded mode. Using login/open.');
      return this.shellBridge.login(params);
    }

    this.open();
    return this._sendRequest('POWCH_CONNECT_WALLET', params);
  }

  /**
   * Sign a transaction using Powch. PII-implying: ensures sidebar is shown (idempotent).
   * @param {object} params - Transaction parameters { tx: { to, value, data }, address? }
   * @returns {Promise<{signedTransaction: string, hash: string}>}
   */
  async signTransaction(params) {
    if (this.shellBridge) {
      // Bridge expects (tx, address)
      return this.shellBridge.signTransaction(params.tx, params.address);
    }

    this.open();
    return this._sendRequest('POWCH_SIGN_TX', params);
  }

  /**
   * Sign a message using Powch. PII-implying: ensures sidebar is shown (idempotent).
   * @param {object} params - { message, address? }
   * @returns {Promise<{signature: string}>}
   */
  async signMessage(params) {
    if (this.shellBridge) {
      return this.shellBridge.signMessage(params.message, params.address);
    }

    this.open();
    return this._sendRequest('POWCH_SIGN_MESSAGE', params);
  }

  /**
   * Logout the current Powch session. Clears cached user and emits 'logout'.
   */
  async logout() {
    if (this.shellBridge) {
      await this.shellBridge.logout();
    } else {
      await this._sendRequest('POWCH_LOGOUT');
    }
    this._user = null;
    this.emit('logout');
  }

  /**
   * Return the current cached user (from last successful auth). Read-only; no persistence across reloads.
   * @returns {null|{email: string|null, address: string|null, powchToken: string|null}}
   */
  getUser() {
    return this._user;
  }

  /**
   * Create a stylized button that does Sign in with Powch, reflects login state, and can open/close the sidebar.
   * Subscribe to 'auth' and 'logout' to drive button updates. Host can style via class names.
   * @param {HTMLElement} container - Parent to append the button to (e.g. nav right slot).
   * @param {Object} [options] - Optional config
   * @param {string} [options.signInLabel='Sign in with Powch'] - Label when not signed in.
   * @param {function} [options.signedInLabel] - (user) => string; default user?.email || 'My Powch'.
   * @param {boolean} [options.toggle=false] - When signed in, click toggles sidebar open/close.
   * @param {Object} [options.classNames] - { button: 'powch-sdk-button', signedIn: 'powch-sdk-button--signed-in' }
   * @returns {HTMLButtonElement} The button element.
   */
  createButton(container, options = {}) {
    const signInLabel = options.signInLabel ?? 'Sign in with Powch';
    const signedInLabelFn = options.signedInLabel ?? ((user) => (user?.email || 'My Powch'));
    const toggle = options.toggle ?? false;
    const classNames = options.classNames ?? {};
    const buttonClass = classNames.button ?? 'powch-sdk-button';
    const signedInClass = classNames.signedIn ?? 'powch-sdk-button--signed-in';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = buttonClass;

    const updateLabel = () => {
      const user = this._user;
      button.textContent = user ? signedInLabelFn(user) : signInLabel;
      if (user) button.classList.add(signedInClass);
      else button.classList.remove(signedInClass);
    };

    updateLabel();

    button.addEventListener('click', async () => {
      if (!this._user) {
        try {
          await this.auth();
        } catch (err) {
          this.emit('error', err);
        }
        return;
      }
      if (toggle) {
        if (this.shellBridge) {
            this.open();
        } else {
            if (this._iframeVisible) this.close();
            else this.open();
        }
      } else {
        this.open();
      }
    });

    this.on('auth', updateLabel);
    this.on('logout', updateLabel);

    if (container) container.appendChild(button);
    return button;
  }

  /**
   * Open the wallet management flow. PII-implying: ensures sidebar is shown (idempotent).
   * @returns {Promise<void>}
   */
  async manage() {
    if (this.shellBridge) {
        return this.shellBridge.open('wallet');
    }

    this.open();
    return this._sendRequest('POWCH_MANAGE');
  }
}
