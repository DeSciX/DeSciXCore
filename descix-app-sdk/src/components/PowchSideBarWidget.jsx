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
 */
const PowchSideBarWidget = () => {
  const { isAppMode } = useAppContext();
  const iframeRef = useRef(null);
  const bridge = usePowchBridge();
  const powchAppUrl = bridge?.config?.bridgeUrl || 'https://powch.descix.net/';
  const [isVisible, setIsVisible] = useState(bridge?.isIframeVisible ?? false);

  useEffect(() => {
    if (isAppMode || !iframeRef.current) return;
    console.log('[PowchSideBar] Registering iframe with global bridge');
    window.dispatchEvent(new CustomEvent('POWCH_REGISTER_IFRAME', {
      detail: { iframe: iframeRef.current },
    }));
  }, [isAppMode]);

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

  // If we are already in an app mode (standalone), we don't need the sidebar
  if (isAppMode) return null;

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
