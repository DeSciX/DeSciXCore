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

/**
 * Powch's origin, or a loud failure. Never a guess: this value decides where a
 * user's passkeys and wallet are entered, so a wrong-but-plausible answer is
 * worse than no answer.
 */
function resolveBridgeUrl() {
  if (typeof __POWCH_APP_URL__ !== 'undefined' && __POWCH_APP_URL__) return __POWCH_APP_URL__;
  throw new Error(
    '[AppShell] Powch origin is unknown, so the Powch bridge cannot be mounted.\n' +
    '  Set it one of these ways:\n' +
    '    - pass config.powch.bridgeUrl to AppShell, or\n' +
    '    - define __POWCH_APP_URL__ at build time (descix serve and the shell build\n' +
    '      both inject it from env.powchUrl / the powch product; see resolvePowchUrl).\n' +
    '  There is deliberately no default: Powch holds passkeys and the wallet, and a\n' +
    '  fallback origin would send them somewhere the developer did not choose.'
  );
}

export default function AppShell({ appId, config = {}, children }) {
  const isIdentityProvider = appId === 'powch';
  const theme = config.theme ?? darkTheme;

  const powchProviderConfig = {
    ...(config.powch ?? {}),
    brand: config.powch?.brand ?? { name: 'DeSciX', logo: null },
    // Where Powch lives. Explicit config wins, else __POWCH_APP_URL__, which both
    // the gateway and the shell's own build inject from ONE owner (resolvePowchUrl).
    //
    // The two fallbacks that stood here are DELETED, not reordered:
    //   __WORKSPACE_PRODUCTS__.powch — that map is the SHELL-ORIGIN map. Reading
    //     Powch out of it puts the wallet same-origin with every hosted app,
    //     collapsing the one boundary the platform deliberately keeps.
    //   'https://powch.descix.net/' — a hardcoded PROD origin reached from a dev
    //     build is a silent cross-environment leak, and this value decides where
    //     passkeys and a wallet are typed. A misconfiguration must fail, not
    //     quietly point somewhere real.
    bridgeUrl: config.powch?.bridgeUrl ?? resolveBridgeUrl(),
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
