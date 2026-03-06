/**
 * PowchBridgeProvider - PWA-owned bridge to Powch iframe
 *
 * Creates PowchBridgeClient and provides it via PowchBridgeContext.
 * Listens for POWCH_REGISTER_IFRAME from PowchSideBarWidget to receive the iframe ref.
 * No Powch internals - pure postMessage protocol.
 * Host apps using @powch/react UI components must add their own PowchAppContext bridge.
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { PowchBridgeClient } from '../util/PowchBridgeClient';
import { Api } from '../util/api';

export function usePowchBridge() {
  const ctx = React.useContext(PowchBridgeContext);
  return ctx?.bridge ?? null;
}

const PowchBridgeContext = React.createContext(null);

export function PowchBridgeProvider({ children, config = {} }) {
  const bridgeRef = useRef(null);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  const bridgeUrl =
    config.bridgeUrl ??
    (typeof __POWCH_APP_URL__ !== 'undefined' ? __POWCH_APP_URL__ : 'https://powch.descix.net/');

  const bridge = useMemo(() => {
    const client = new PowchBridgeClient({
      bridgeUrl,
      brand: config.brand ?? { name: 'DeSciX', logo: null },
      getApi: () => Api,
    });
    bridgeRef.current = client;
    return client;
  }, [bridgeUrl, config.brand]);

  useEffect(() => {
    // activate() sets up the window message listener. Must be in useEffect (not
    // the constructor) so React strict-mode's cleanup/re-setup cycle works —
    // otherwise destroy() in cleanup removes the listener and it's never re-added.
    bridge.activate();

    const handleRegister = (event) => {
      if (event.detail?.iframe) {
        bridge.registerIframe(event.detail.iframe);
        forceUpdate();
      }
    };
    const onStateUpdate = () => forceUpdate();
    const onReady = () => forceUpdate();
    window.addEventListener('POWCH_REGISTER_IFRAME', handleRegister);
    bridge.on('state_update', onStateUpdate);
    bridge.on('ready', onReady);
    bridge.on('ui_open', onStateUpdate);
    bridge.on('ui_close', onStateUpdate);
    bridge.on('toggle_ui', onStateUpdate);
    const existing = document.getElementById('powch-standalone-iframe');
    if (existing) {
      bridge.registerIframe(existing);
      forceUpdate();
    }
    return () => {
      window.removeEventListener('POWCH_REGISTER_IFRAME', handleRegister);
      bridge.off('state_update', onStateUpdate);
      bridge.off('ready', onReady);
      bridge.off('ui_open', onStateUpdate);
      bridge.off('ui_close', onStateUpdate);
      bridge.off('toggle_ui', onStateUpdate);
      bridge.destroy();
    };
  }, [bridge]);

  const contextValue = useMemo(() => ({ bridge }), [bridge]);

  return (
    <PowchBridgeContext.Provider value={contextValue}>{children}</PowchBridgeContext.Provider>
  );
}
