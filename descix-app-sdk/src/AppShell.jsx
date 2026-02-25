/**
 * AppShell - Minimal shell that boots to READY and renders the app component.
 *
 * Every app using app-sdk is a standalone app with an appId.
 * Shell: init → READY. App: full-screen UI when READY.
 */

import React from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme, Typography } from '@mui/material';
import { useAppContext, AppProvider } from './AppContext.jsx';
import { AppContextState } from './util/AppData.jsx';
import { NetworkLoadingProvider } from './util/NetworkAPI.jsx';
import ErrorBoundary from './util/ErrorBoundary.jsx';
import SdkInitializer from './util/SdkInitializer.jsx';
import LoadingWidget from './components/LoadingWidget.jsx';
import WagmiProvider from './providers/WagmiProvider.jsx';
import { PowchBridgeProvider } from './providers/PowchBridgeProvider.jsx';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function ShellContent({ children }) {
  const { appState } = useAppContext();

  if (appState === AppContextState.INITIALIZING || appState === AppContextState.LOADING) {
    return <LoadingWidget />;
  }
  if (appState === AppContextState.ERROR) {
    return (
      <Box sx={{ padding: 3 }}>
        <Typography variant="h4" align="center" color="error" gutterBottom>
          An Error Occurred
        </Typography>
        <Typography variant="body1" align="center" gutterBottom>
          Something went wrong with the application. Please try again later.
        </Typography>
      </Box>
    );
  }
  if (appState === AppContextState.READY) {
    return children;
  }
  return <LoadingWidget />;
}

export default function AppShell({ appId, config = {}, children }) {
  const isIdentityProvider = appId === 'powch';
  const theme = config.theme ?? darkTheme;

  const powchProviderConfig = {
    ...(config.powch ?? {}),
    brand: config.powch?.brand ?? { name: 'DeSciX', logo: null },
    // Use __POWCH_APP_URL__ if available (injected by descix-serve), otherwise fallback to workspace map or default
    bridgeUrl: config.powch?.bridgeUrl ?? (
      typeof __POWCH_APP_URL__ !== 'undefined' ? __POWCH_APP_URL__ : 
      (typeof __WORKSPACE_PRODUCTS__ !== 'undefined' && __WORKSPACE_PRODUCTS__?.powch ? __WORKSPACE_PRODUCTS__.powch : 'https://powch.descix.net/')
    ),
  };

  const innerContent = (
    <AppProvider>
      <NetworkLoadingProvider>
        <SdkInitializer>
          <ErrorBoundary>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#0D1117' }}>
              <ShellContent>{children}</ShellContent>
            </Box>
          </ErrorBoundary>
        </SdkInitializer>
      </NetworkLoadingProvider>
    </AppProvider>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WagmiProvider>
        {isIdentityProvider ? innerContent : (
          <PowchBridgeProvider config={powchProviderConfig}>{innerContent}</PowchBridgeProvider>
        )}
      </WagmiProvider>
    </ThemeProvider>
  );
}
