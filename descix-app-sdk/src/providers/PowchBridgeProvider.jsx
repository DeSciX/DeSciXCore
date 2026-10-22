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
import { requirePowchUrl } from '../powch/powchOrigin.js';
import { Api } from '../util/api';

export function usePowchBridge() {
  const ctx = React.useContext(PowchBridgeContext);
  return ctx?.bridge ?? null;
}

const PowchBridgeContext = React.createContext(null);

export function PowchBridgeProvider({ children, config = {} }) {
  const bridgeRef = useRef(null);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  // Explicit config wins, else the origin the build injected. The hardcoded PROD
  // tail that stood here is DELETED, not reordered: a dev build quietly mounting
  // the production wallet is a cross-environment leak on the one origin where
  // passkeys are typed. See ../powch/powchOrigin.js.
  const bridgeUrl = requirePowchUrl(config.bridgeUrl, 'PowchBridgeProvider');

  // One bridge per Powch iframe: a re-created bridge never sees the POWCH_READY the
  // iframe already sent, so identity is keyed on VALUES, not on the brand object (AppShell
  // builds a fresh one every render).
  const brandName = config.brand ? config.brand.name : 'DeSciX';
  const brandLogo = config.brand ? config.brand.logo : null;
  const bridge = useMemo(() => {
    const client = new PowchBridgeClient({
      bridgeUrl,
      brand: { name: brandName, logo: brandLogo },
      getApi: () => Api,
    });
    bridgeRef.current = client;
    return client;
  }, [bridgeUrl, brandName, brandLogo]);

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
