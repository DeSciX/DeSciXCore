import { useEffect, useRef } from 'react';
import { usePowchBridge } from '../providers/PowchBridgeProvider';
import { AppContextState } from '../util/AppData';
import { publishViewApi } from '../util/appView.js';

/**
 * useDeSciXBridge Hook
 *
 * Exposes the PWA-owned Powch bridge to window.DeSciX.powch for embedded apps (CodeSite, etc.).
 * Uses only postMessage protocol - no Powch internals.
 *
 * Session update (loginWithSessionToken) lives on window.DeSciX and is set by AppContext,
 * not by this hook. The bridge exposes login, sign, etc.; session update is an App Shell
 * responsibility.
 *
 * Runs only in host mode (PowchBridgeProvider mounted). In Case 3 (Powch standalone),
 * PowchBridgeProvider is not mounted; bridge is null and we do not set window.DeSciX.powch.
 */
export const useDeSciXBridge = (appState) => {
  const bridge = usePowchBridge();
  const initialized = useRef(false);

  useEffect(() => {
    if (!bridge) return;
    if (appState !== AppContextState.READY) return;
    if (initialized.current) return;

    console.log('[useDeSciXBridge] Initializing window.DeSciX service bus');

    window.DeSciX = window.DeSciX || {};

    window.DeSciX.powch = {
      login: (opts) => bridge.login(opts),
      logout: () => bridge.logout(),
      sign: (data) => bridge.sign(data),
      signTransaction: (tx, address) => bridge.signTransaction(tx, address),
      signMessage: (msg, address) => bridge.signMessage(msg, address),
      signTypedData: (domain, types, value, address) =>
        bridge.signTypedData(domain, types, value, address),
      receive: (params) => bridge.receive(params),
      send: (params) => bridge.send(params),
      open: (opts) => bridge.open(opts),
      isAuthenticated: () => bridge.isAuthenticated,
      getAddress: () => bridge.displayAddress,
    };

    window.DeSciX.config = {
      ...window.DeSciX.config,
      env: import.meta.env.MODE,
      shellOrigin: window.location.origin,
      powchOrigin: bridge.config?.bridgeUrl,
    };

    // The view API is part of the same bus, but it must NOT wait on Powch: an
    // app with no wallet still gets to choose its layout. useDeSciXView publishes
    // it independently; this call only makes the bus complete for anyone reading
    // window.DeSciX after DESCX_BRIDGE_READY.
    publishViewApi();

    window.dispatchEvent(new CustomEvent('DESCX_BRIDGE_READY'));
    initialized.current = true;
  }, [bridge, appState]);
};
