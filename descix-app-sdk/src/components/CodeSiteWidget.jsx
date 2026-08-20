// CodeSiteWidget.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Paper, IconButton, Typography } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import { gcsMediaPath, AppData } from '../util/AppData';
import { Api } from '../util/api';
import { useAppContext } from '../AppContext';
import ChatWidget from './ChatWidget';
import { actionResultContribution, actionErrorContribution } from '../util/chatIngress';

/**
 * Platform app IDs that should NOT render in the CodeSite iframe.
 * - daita: The Platform PWA itself — rendering it would be recursive (PWA inside PWA).
 * - powch: The identity/wallet provider — already embedded as PowchSideBarWidget.
 *          Rendering it in CodeSite would create a duplicate/conflicting instance.
 *
 * Design note: A metadata-driven approach (e.g., `is_platform_app` flag in Products)
 * would be more extensible, but hardcoding is appropriate for only 2 platform apps.
 */
const PLATFORM_APP_IDS = ['daita', 'powch'];

const PLATFORM_APP_MESSAGES = {
  daita: {
    title: 'DeSciX Platform',
    description: 'You are currently using this application (The DeSciX Store).',
    detail: 'To view the source code or contribute, please visit our repository.'
  },
  powch: {
    title: 'Powch Identity Wallet',
    description: 'Powch is your identity wallet — use the sidebar to access it.',
    detail: 'Powch provides zero-knowledge authentication, WebAuthn passkeys, and self-custody wallet services across all DeSciX apps.'
  }
};

/**
 * CodeSiteWidget — the Chat + CodeSite SPLIT-VIEW container (WS-HEADLESS-MVP-A4).
 *
 * Two panel modes:
 *  - iframe mode (default): pass `url` — the app's CodeSite renders in a sandboxed
 *    same-origin iframe; AI-emitted action blocks dispatch into the iframe window
 *    (direct interframe scripting — all frames are same-site; NO postMessage bridge).
 *  - children mode (A4): pass React `children` — a host app (e.g. frqtl.com's IDE
 *    component) fills the panel pane directly. Actions then dispatch against the HOST
 *    window's conventions (window.DeSciX_Actions[fn] etc.), which the host app
 *    registers. Same action vocabulary, same user-clicks-Run gate.
 *
 * The chat pane is the credits-aware embedded ChatWidget (balance, debit feedback,
 * buy-credits CTA — chat is metered per CEO-D-2026-07-01 D2).
 *
 * Platform apps (daita, powch) are guarded from iframe rendering to prevent
 * recursion (daita) and duplicate instances (powch). See PLATFORM_APP_IDS.
 */
const CodeSiteWidget = ({
  url,
  children,
  enableChat = true,
  chatPosition = 'right',
  chatWidth = 0.25,
  height = '90vh',
  chatEntitled,
  onRequestLogin,
  // WS-B8: what happens to an executed action's result.
  //  'send'  (default) — the result is posted as its own turn and the model reacts
  //          to it. This is the live loop: Maxi runs a counterfactual, the AI reads
  //          the outcome and continues. Costs one metered turn per Run click, which
  //          the user explicitly initiated.
  //  'stage' — the result renders on the composer and rides into the next turn the
  //          user types. No extra metering.
  actionResultDisposition = 'send',
}) => {
  const iframeRef = useRef(null);
  // Handle on THE chat ingress, published by the embedded ChatWidget.
  const chatIngressRef = useRef(null);
  // Inter-view state read DIRECTLY from AppData (viewRouter assigns before the view
  // transition; the context mirror is provider-render-stale — see ChatWidget note).
  const selectedCommunity = AppData.selectedCommunity;
  const selectedApp = AppData.selectedApp;
  const [chatOpen, setChatOpen] = useState(enableChat);

  const iframeSrc = useMemo(() => gcsMediaPath(url), [url]);
  const usesChildrenPanel = !!children;

  // Prevent rendering platform apps in iframe (recursion for daita, duplication for powch)
  const isPlatformApp = PLATFORM_APP_IDS.includes(selectedApp?.app_id) && !window.__STANDALONE_APP_ID__;

  useEffect(() => {
    const iframeEl = iframeRef.current;
    if (!iframeEl || !iframeSrc || isPlatformApp) return;
    
    const onLoad = () => {
      // Log CodeSite view event
      if (selectedCommunity && selectedApp) {
        Api.logContentEvent({
          event_type: 'CODESITE_VIEW',
          entity_type: 'CODESITE',
          entity_id: `${selectedCommunity.community_id}/${selectedApp.app_id}`,
          community_id: selectedCommunity.community_id,
          app_id: selectedApp.app_id
        }).catch(error => console.error('Error logging CodeSite view:', error));
      }
    };

    iframeEl.addEventListener('load', onLoad);
    return () => {
      iframeEl.removeEventListener('load', onLoad);
    };
  }, [iframeSrc, selectedCommunity, selectedApp]);

  /**
   * Hand a contribution to THE chat ingress. FAIL LOUD if the chat pane is not
   * mounted: silently dropping a result is exactly the bug WS-B8 exists to kill.
   */
  const deliverToChat = (contribution) => {
    const ingress = chatIngressRef.current;
    if (!ingress?.contribute) {
      console.error(
        '[CodeSiteWidget] Action produced a result but the chat ingress is unavailable ' +
        '(chat pane closed or not mounted). Result dropped:', contribution
      );
      return null;
    }
    return ingress.contribute(contribution);
  };

  /**
   * Direct execution handler: Calls functions in the CodeSite iframe's window object.
   * This leverages allow-same-origin to directly invoke functions exposed by the CodeSite.
   */
  const handleExecuteAction = (functionName, args) => {
    if (isPlatformApp) return;
    // children mode (A4): the host app rendered its own panel — dispatch against the
    // HOST window's registered conventions instead of an iframe contentWindow.
    const childWindow = usesChildrenPanel ? window : iframeRef.current?.contentWindow;
    if (!childWindow) {
      console.warn('[CodeSiteWidget] Cannot execute action: iframe not loaded');
      return;
    }

    // Try multiple conventions for function location
    let targetFunction = null;
    
    // Convention 1: window.DeSciX_Actions[functionName]
    if (childWindow.DeSciX_Actions && typeof childWindow.DeSciX_Actions[functionName] === 'function') {
      targetFunction = childWindow.DeSciX_Actions[functionName];
    }
    // Convention 2: Direct on window[functionName]
    else if (typeof childWindow[functionName] === 'function') {
      targetFunction = childWindow[functionName];
    }
    // Convention 3: window._codesiteFrame[functionName]
    else if (childWindow._codesiteFrame && typeof childWindow._codesiteFrame[functionName] === 'function') {
      targetFunction = childWindow._codesiteFrame[functionName];
    }

    if (!targetFunction) {
      // WS-B8: a missing function used to vanish into console.warn. The user
      // clicked Run and deserves to know nothing happened — and so does the model,
      // which otherwise waits forever for a result it will never see.
      return deliverToChat(
        actionErrorContribution(
          functionName,
          new Error(
            `No such action "${functionName}" on the CodeSite. Expose it as window.DeSciX_Actions.${functionName}, window.${functionName}, or window._codesiteFrame.${functionName}.`
          ),
          { disposition: actionResultDisposition }
        )
      );
    }

    console.log(`[CodeSiteWidget] Executing ${functionName} with args:`, args);
    // Await sync AND async returns uniformly, then route the outcome into THE chat
    // ingress. This is the WS-B8 return path: results no longer die in console.log.
    return (async () => {
      try {
        const result = await targetFunction(args);
        return deliverToChat(
          actionResultContribution(functionName, result, { disposition: actionResultDisposition })
        );
      } catch (err) {
        console.error(`[CodeSiteWidget] ${functionName} failed:`, err);
        return deliverToChat(
          actionErrorContribution(functionName, err, { disposition: actionResultDisposition })
        );
      }
    })();
  };

  if (!iframeSrc && !usesChildrenPanel) return null;

  if (isPlatformApp) {
    const msg = PLATFORM_APP_MESSAGES[selectedApp?.app_id] || PLATFORM_APP_MESSAGES.daita;
    return (
      <Box sx={{ display: 'flex', height: '90vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 600 }}>
          <Typography variant="h5" gutterBottom>
            {selectedApp?.app_name || msg.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {msg.description}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {msg.detail}
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Sandbox permissions: allow-same-origin is CRITICAL for direct interframe scripting
  const sandboxPermissions = 'allow-scripts allow-forms allow-popups allow-same-origin';

  // Layout: chatWidth is ALWAYS the chat pane's fraction; chatPosition picks the side
  // (row-reverse puts the chat pane first visually for 'left' — WS-HEADLESS-MVP-A4 fix:
  // previously 'left' swapped the WIDTHS but the chat still rendered on the right).
  const codesiteWidth = chatOpen ? 1 - chatWidth : 1;
  const chatPanelWidth = chatOpen ? chatWidth : 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: chatPosition === 'left' ? 'row-reverse' : 'row', height, position: 'relative' }}>
      {/* CodeSite / panel area */}
      <Box
        sx={{
          width: `${codesiteWidth * 100}%`,
          height: '100%',
          transition: 'width 0.3s ease',
          position: 'relative',
          overflow: usesChildrenPanel ? 'auto' : 'hidden'
        }}
      >
        {usesChildrenPanel ? (
          children
        ) : (
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            title="Code Site"
            style={{ width: '100%', height: '100%', border: 'none' }}
            sandbox={sandboxPermissions}
          />
        )}
        
        {/* Chat Toggle Button (floating) */}
        {enableChat && (
          <IconButton
            onClick={() => setChatOpen(!chatOpen)}
            sx={{
              position: 'absolute',
              top: 8,
              [chatPosition === 'right' ? 'right' : 'left']: 8,
              zIndex: 1000,
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': { bgcolor: 'action.hover' }
            }}
            size="small"
            title={chatOpen ? 'Hide Chat' : 'Show Chat'}
          >
            {chatOpen ? <CloseIcon /> : <ChatIcon />}
          </IconButton>
        )}
      </Box>

      {/* Chat Sidebar */}
      {enableChat && chatOpen && (
        <Paper 
          elevation={3}
          sx={{ 
            width: `${chatPanelWidth * 100}%`, 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: chatPosition === 'right' ? 1 : 0,
            borderRight: chatPosition === 'left' ? 1 : 0,
            borderColor: 'divider',
            overflow: 'hidden'
          }}
        >
          <ChatWidget
            onExecuteAction={handleExecuteAction}
            ingressRef={chatIngressRef}
            mode="embedded"
            entitled={chatEntitled}
            onRequestLogin={onRequestLogin}
          />
        </Paper>
      )}
    </Box>
  );
};

export default CodeSiteWidget;
