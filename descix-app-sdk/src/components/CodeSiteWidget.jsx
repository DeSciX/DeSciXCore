// CodeSiteWidget.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Paper, IconButton } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import { gcsMediaPath } from '../util/AppData';
import { Api } from '../util/api';
import { useAppContext } from '../AppContext';
import ChatWidget from './ChatWidget';

/**
 * CodeSiteWidget
 * 
 * Displays an app's CodeSite in an iframe with an optional Chat split-view.
 * Leverages direct interframe scripting since all frames are same-site.
 */
const CodeSiteWidget = ({ url, enableChat = true, chatPosition = 'right', chatWidth = 0.25 }) => {
  const iframeRef = useRef(null);
  const { selectedCommunity, selectedApp } = useAppContext();
  const [chatOpen, setChatOpen] = useState(enableChat);

  const iframeSrc = useMemo(() => gcsMediaPath(url), [url]);
  
  // Prevent recursion: If we are the Shell (daita) viewing daita, show placeholder
  const isSelfView = selectedApp?.app_id === 'daita' && !window.__STANDALONE_APP_ID__;

  useEffect(() => {
    const iframeEl = iframeRef.current;
    if (!iframeEl || !iframeSrc || isSelfView) return;
    
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
   * Direct execution handler: Calls functions in the CodeSite iframe's window object.
   * This leverages allow-same-origin to directly invoke functions exposed by the CodeSite.
   */
  const handleExecuteAction = (functionName, args) => {
    if (isSelfView) return;
    const childWindow = iframeRef.current?.contentWindow;
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

    if (targetFunction) {
      console.log(`[CodeSiteWidget] Executing ${functionName} with args:`, args);
      try {
        const result = targetFunction(args);
        if (result instanceof Promise) {
          result
            .then((res) => console.log(`[CodeSiteWidget] ${functionName} completed:`, res))
            .catch((err) => console.error(`[CodeSiteWidget] ${functionName} failed:`, err));
        }
      } catch (err) {
        console.error(`[CodeSiteWidget] Error executing ${functionName}:`, err);
      }
    } else {
      console.warn(`[CodeSiteWidget] Function ${functionName} not found.`);
    }
  };

  if (!iframeSrc) return null;

  if (isSelfView) {
    return (
      <Box sx={{ display: 'flex', height: '90vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 600 }}>
          <Typography variant="h5" gutterBottom>
            {selectedApp?.app_name || 'Platform Root'}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            You are currently using this application (The DeSciX Store).
          </Typography>
          <Typography variant="body2" color="text.secondary">
            To view the source code or contribute, please visit our repository.
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Sandbox permissions: allow-same-origin is CRITICAL for direct interframe scripting
  const sandboxPermissions = 'allow-scripts allow-forms allow-popups allow-same-origin';

  // Calculate layout widths
  const codesiteWidth = chatOpen ? (chatPosition === 'right' ? 1 - chatWidth : chatWidth) : 1;
  const chatPanelWidth = chatOpen ? (chatPosition === 'right' ? chatWidth : 1 - chatWidth) : 0;

  return (
    <Box sx={{ display: 'flex', height: '90vh', position: 'relative' }}>
      {/* CodeSite Area */}
      <Box 
        sx={{ 
          width: `${codesiteWidth * 100}%`, 
          height: '100%',
          transition: 'width 0.3s ease',
          position: 'relative'
        }}
      >
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title="Code Site"
          style={{ width: '100%', height: '100%', border: 'none' }}
          sandbox={sandboxPermissions}
        />
        
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
            mode="embedded"
          />
        </Paper>
      )}
    </Box>
  );
};

export default CodeSiteWidget;
