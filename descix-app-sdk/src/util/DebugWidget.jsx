import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { AppData, AppContextEvent, AppContextView } from './AppData';
import { AppContext } from '../AppContext';

const DebugWidget = () => {
  // Use useContext directly with null check - AppContext may not be ready during initial render
  const appContext = useContext(AppContext);
  const [messages, setMessages] = useState([]);
  const [visible, setVisible] = useState(import.meta.env.VITE_DEBUG === 'false');
  const messagesRef = useRef([]);                         // NEW: use mutable ref

  const addMessage = useCallback((message, type = 'log') => {
    messagesRef.current = [...messagesRef.current, { text: message, type }];
    setTimeout(() => {                                    // defer state update
      setMessages([...messagesRef.current]);
    }, 0);
  }, []);

  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    // The global console is already wrapped in App.jsx with styling and prefixes.
    // We just need to intercept the arguments to update the DebugWidget UI.
    console.log = (...args) => {
      originalConsoleLog(...args);
      addMessage(args.join(' '), 'log');
    };
    console.error = (...args) => {
      originalConsoleError(...args);
      addMessage(args.join(' '), 'error');
    };
    console.warn = (...args) => {
      originalConsoleWarn(...args);
      addMessage(args.join(' '), 'warn');
    };

    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, [addMessage]);

  const toggleVisibility = () => {
    setVisible(!visible);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const clearLocalStorage = () => {
    localStorage.clear();
  };

  // Enhanced refresh: Clear purchase-related data only, refresh token holdings, and navigate to dashboard
  const refreshPurchases = () => {
    console.log('[DebugWidget] Refreshing purchases - clearing purchase-related data...');
    
    // Clear purchase-related localStorage keys only
    const purchaseKeys = [
      'myCommunities',
      'myApps',
      'myTransactions',
      'custodialBalance',
      'selectedCommunity',
      'selectedApp',
      'availableCommunities'
    ];
    
    purchaseKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`[DebugWidget] Cleared localStorage: ${key}`);
    });
    
    // Clear corresponding AppData in-memory state
    AppData._myCommunities = [];
    AppData._myApps = [];
    AppData._myTransactions = [];
    AppData._custodialBalance = 0;
    AppData._selectedCommunity = null;
    AppData._selectedApp = null;
    AppData._availableCommunities = [];
    
    console.log('[DebugWidget] Cleared AppData in-memory state');
    
    // Only dispatch events if context is available
    if (appContext) {
      // Dispatch refresh event to trigger backend re-fetch
      appContext.setAppEvent({ type: AppContextEvent.PURCHASES_REFRESH_REQUESTED });
      
      // Navigate to Trading Dashboard
      appContext.setCurrentView(AppContextView.TRADING_DASHBOARD);
      
      console.log('[DebugWidget] Refresh complete - navigating to Trading Dashboard');
    } else {
      console.warn('[DebugWidget] AppContext not available - reload page to apply changes');
      window.location.reload();
    }
  };

  return (
    <>
      {/* Floating toggle button - always visible */}
      <button 
        onClick={toggleVisibility} 
        style={{ 
          position: 'fixed', 
          right: visible ? 'calc(25% + 10px)' : '10px', 
          top: '10px', 
          zIndex: 9999, // Above everything for debugging
          padding: '8px 12px',
          backgroundColor: '#333',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          transition: 'right 0.3s',
        }}
      >
        {visible ? '×' : 'Debug'}
      </button>
      
      {/* Debug panel */}
      <div style={{ width: visible ? '25%' : '0', backgroundColor: 'grey', display: 'block', padding: visible ? '10px' : '0', overflowY: 'scroll', overflowX: 'hidden', height: '100vh', position: 'fixed', right: 0, top: 0, transition: 'width 0.3s, padding 0.3s', fontSize: '9pt', zIndex: 9998 }}>
        {visible && (
          <>
            <div style={{ marginBottom: '10px', marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <button onClick={clearMessages} style={{ marginRight: '10px' }}>
                  Clear Messages
                </button>
                <button onClick={clearLocalStorage}>
                  Clear All Storage
                </button>
              </div>
              <div>
                <button 
                  onClick={refreshPurchases}
                  style={{ 
                    backgroundColor: '#4CAF50', 
                    color: 'white', 
                    border: 'none', 
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Refresh Purchases & Go to Dashboard
                </button>
              </div>
            </div>
            {messages.map((msg, index) => (
              <div key={index} style={{ color: msg.type === 'error' ? 'red' : msg.type === 'warn' ? 'yellow' : 'inherit' }}>
                {msg.text}
                <br />
                <hr key={`hr-${index}`} style={{ margin: '5px 0' }} />
              </div> 
            ))}
          </>
        )}
      </div>
    </>
  );
};

export default DebugWidget;