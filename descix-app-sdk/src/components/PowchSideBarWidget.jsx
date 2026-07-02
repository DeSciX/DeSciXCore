import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { useAppContext } from '../AppContext';
import { usePowchBridge } from '../providers/PowchBridgeProvider';

/**
 * PowchSideBarWidget
 *
 * The "Host" side component for the Powch identity silo.
 * - Renders the iframe for the Powch App.
 * - Uses PWA-owned PowchBridgeProvider for visibility and iframe registration.
 * - Subscribes to ui_open/ui_close for reliable visibility updates.
 *
 * WS-HEADLESS-MVP-A4 `standalone` prop: a STANDALONE-ORIGIN AppShell app (own
 * top-level window — e.g. frqtl.com or the splitview harness; NOT embedded inside the
 * platform PWA) has no host shell to provide the Powch iframe, so the shell bridge's
 * login() dead-ends with "Powch PWA not ready". Passing standalone={true} mounts +
 * registers the sidebar despite isAppMode (which exists to prevent DUPLICATE sidebars
 * when the app runs inside the PWA, whose own sidebar already serves the bridge).
 * This honors the platform invariant "Powch integration is automatic for any app
 * using AppShell" for standalone-origin hosting.
 */
const PowchSideBarWidget = ({ standalone = false }) => {
  const { isAppMode } = useAppContext();
  const iframeRef = useRef(null);
  const bridge = usePowchBridge();
  const powchAppUrl = bridge?.config?.bridgeUrl || 'https://powch.descix.net/';
  const [isVisible, setIsVisible] = useState(bridge?.isIframeVisible ?? false);
  const suppressed = isAppMode && !standalone;

  useEffect(() => {
    if (suppressed || !iframeRef.current) return;
    console.log('[PowchSideBar] Registering iframe with global bridge');
    window.dispatchEvent(new CustomEvent('POWCH_REGISTER_IFRAME', {
      detail: { iframe: iframeRef.current },
    }));
  }, [suppressed]);

  useEffect(() => {
    if (!bridge) return;
    setIsVisible(bridge.isIframeVisible);
    const onOpen = () => setIsVisible(true);
    const onClose = () => setIsVisible(false);
    const onToggle = () => setIsVisible(bridge.isIframeVisible);
    bridge.on('ui_open', onOpen);
    bridge.on('ui_close', onClose);
    bridge.on('toggle_ui', onToggle);
    return () => {
      bridge.off('ui_open', onOpen);
      bridge.off('ui_close', onClose);
      bridge.off('toggle_ui', onToggle);
    };
  }, [bridge]);

  // Embedded inside the platform PWA: the PWA's own sidebar serves the bridge —
  // rendering another here would duplicate the identity silo. Standalone-origin
  // hosts opt in via the `standalone` prop.
  if (suppressed) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '375px',
        height: '100vh',
        zIndex: 9999,
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease-in-out',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#0D1117',
        borderLeft: '1px solid #30363d'
      }}
    >
      <iframe
        ref={iframeRef}
        id="powch-standalone-iframe"
        src={powchAppUrl}
        title="Powch Identity Silo"
        style={{ width: '100%', height: '100%', border: 'none' }}
        allow="publickey-credentials-get *; publickey-credentials-create *"
      />
    </Box>
  );
};

export default PowchSideBarWidget;
