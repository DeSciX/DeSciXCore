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
import { requirePowchUrl } from './powch/powchOrigin.js';

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

/**
 * @param {Object} props
 * @param {string} props.appId - which app this shell is
 * @param {Object} [props.config]
 * @param {boolean} [props.standalone] - this build IS the app: boot straight into
 *   it, no store chrome. An app that builds itself standalone declares it here,
 *   at the mount that already knows, instead of through a build-time global.
 */
export default function AppShell({ appId, config = {}, children, standalone = false }) {
  const isIdentityProvider = appId === 'powch';
  const theme = config.theme ?? darkTheme;

  // Built only for a shell that actually MOUNTS the bridge. Powch's own shell is
  // the silo — it has no bridge to configure, so it must not be held hostage to a
  // value it never uses.
  const powchProviderConfig = isIdentityProvider ? null : {
    ...(config.powch ?? {}),
    brand: config.powch?.brand ?? { name: 'DeSciX', logo: null },
    // Where Powch lives. Explicit config wins, else __POWCH_APP_URL__, which both
    // the gateway and the shell's own build inject from ONE owner (resolvePowchUrl).
    // Unknown throws — see powchOrigin.js for why there is no default.
    //
    // The __WORKSPACE_PRODUCTS__.powch fallback that stood here is DELETED, not
    // reordered: that map is the SHELL-ORIGIN map, and reading Powch out of it
    // puts the wallet same-origin with every hosted app, collapsing the one
    // boundary the platform deliberately keeps.
    bridgeUrl: requirePowchUrl(config.powch?.bridgeUrl, 'AppShell'),
  };

  const innerContent = (
    <AppProvider>
      <NetworkLoadingProvider>
        <SdkInitializer standalone={standalone} appId={appId}>
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
