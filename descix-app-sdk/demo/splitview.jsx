/**
 * WS-HEADLESS-MVP-A4 — the MVP dogfood demo: a CANONICAL @descix/app-sdk app
 * (AppShell citizen) hosting the credits-aware AI-Chat + CodeSite split view
 * against LIVE DEV (:4000 via the vite proxy — topology-faithful: mirrors the LB's
 * statics + /apifront on one host; see frqtl-server-seam-contract.md §7.5).
 *
 * CANONICAL COMPONENTS ONLY (engineering-culture mandate — extend, never re-invent):
 *   - AppShell            → providers + SdkInitializer (deeplinks /claim/:code,
 *                           referral params custom_id/referrer_id/guild_id, community-
 *                           token path parsing — ALL inherited automatically)
 *   - DemoChrome          → the PWA TopNavBar pattern, minimal: wallet button
 *                           (bridge.openUi()), user menu with the canonical logout
 *                           (setSessionInfo(null) + setLoginStatus(GUEST))
 *   - CodeSiteWidget      → THE canonical split layout, DEFAULT orientation
 *                           (CodeSite pane LEFT, chat pane RIGHT). children mode fills
 *                           the CodeSite pane with the host "IDE" (frqtl.com pattern)
 *   - ChatWidget          → credits-aware (balance chip, debit feedback, buy-credits
 *                           CTA, built-in "Sign in with Powch" via the shell bridge)
 *   - PowchSideBarWidget  → the domain-isolated Powch identity silo (standalone prop:
 *                           own-origin host; NOT auto-rendered by AppShell)
 *
 * Run:  cd DeSciX_Core/descix-app-sdk/demo && npx vite
 *       → https://localhost:5199/splitview.html   (HTTPS — WebAuthn secure context)
 */
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  AppShell, CodeSiteWidget, PowchSideBarWidget, AppData, LoginStatus,
  useAppContext, usePowchBridge,
} from '@descix/app-sdk';
import {
  AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Chip, Tooltip,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const DEMO_APP = {
  app_id: 'descix-docs',
  community_id: 'daita',
  app_name: 'DeSciX Docs',
};

// Select the app BEFORE React mounts: AppContext reads AppData.selectedApp at provider
// render (the setter is non-reactive by design — the PWA re-renders via view routing,
// which a single-page app does not).
AppData.selectedApp = DEMO_APP;
AppData.selectedCommunity = { community_id: DEMO_APP.community_id, community_name: 'DeSciX' };

const CHROME_HEIGHT = 56;

/**
 * Minimal canonical chrome — the platform PWA's TopNavBar pattern reduced to its
 * essentials: brand, Powch wallet button (bridge.openUi()), and — when authenticated —
 * a user menu whose Logout is the CANONICAL logout (clear the reactive session +
 * return the login state machine to GUEST; the Powch vault is deliberately untouched —
 * it is managed inside the domain-isolated iframe).
 */
function DemoChrome() {
  const { sessionInfo, setSessionInfo, setLoginStatus } = useAppContext();
  const bridge = usePowchBridge();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const isAuthenticated = !!(sessionInfo?.id || sessionInfo?.user_id);

  const handleLogout = () => {
    // TopNavBar.jsx handleLogout pattern (the PWA reference implementation).
    setSessionInfo(null);
    setLoginStatus(LoginStatus.GUEST);
    setMenuAnchor(null);
  };

  return (
    <AppBar position="static" sx={{ height: CHROME_HEIGHT, justifyContent: 'center' }}>
      <Toolbar variant="dense">
        <Typography variant="h6" sx={{ flexGrow: 1 }} data-testid="chrome-title">
          SplitView Demo <Typography component="span" variant="caption" sx={{ opacity: 0.7 }}>— app-sdk MVP dogfood ({DEMO_APP.app_id})</Typography>
        </Typography>
        {isAuthenticated && (
          <Chip
            size="small"
            color="success"
            variant="outlined"
            data-testid="chrome-user-chip"
            // WS-HEADLESS-MVP-R7 (defect #1): same fallback fix as ChatWidget's
            // chat-user-chip — never surface the raw passkey id/user_id.
            label={sessionInfo?.email || 'Signed in'}
            sx={{ mr: 1, maxWidth: 260 }}
          />
        )}
        <Tooltip title="Open Powch wallet">
          <IconButton color="inherit" onClick={() => bridge?.openUi()} aria-label="Open Powch wallet" data-testid="chrome-wallet-button">
            <AccountBalanceWalletIcon />
          </IconButton>
        </Tooltip>
        {isAuthenticated && (
          <>
            <IconButton color="inherit" onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label="User menu" data-testid="chrome-user-menu">
              <AccountCircleIcon />
            </IconButton>
            <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
              <MenuItem onClick={handleLogout} data-testid="chrome-logout">Logout</MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

/** The host app's "IDE" pane — stands in for frqtl.com's IDE/Studio/GYM component. */
function FakeIdePanel() {
  const [status, setStatus] = useState('idle');
  const [log, setLog] = useState([]);

  useEffect(() => {
    // children-mode action convention: host window registers DeSciX_Actions —
    // the chat pane's Run buttons dispatch here (CodeSiteWidget.handleExecuteAction).
    window.DeSciX_Actions = {
      ide_set_status: (args) => {
        setStatus(String(args?.status ?? 'unknown'));
        setLog((l) => [...l, `ide_set_status(${JSON.stringify(args)})`]);
        return { ok: true };
      },
    };
    return () => { delete window.DeSciX_Actions; };
  }, []);

  return (
    <div data-testid="harness-ide-panel" style={{ padding: 24, height: '100%', background: '#0D1117', color: '#E6EDF3', fontFamily: 'monospace', boxSizing: 'border-box' }}>
      <h2 style={{ marginTop: 0 }}>Host IDE panel (children mode)</h2>
      <p>This pane is rendered by the HOST app (frqtl.com pattern) — not an iframe.</p>
      <p>
        IDE status: <strong data-testid="ide-status">{status}</strong>
      </p>
      <pre data-testid="ide-action-log" style={{ background: '#161B22', padding: 12, minHeight: 80 }}>
        {log.join('\n') || '(no actions dispatched yet)'}
      </pre>
      <p style={{ opacity: 0.7 }}>
        Registered actions: <code>ide_set_status</code> — ask the AI to emit a
        <code>{' ```json:call:ide_set_status '}</code> block and click Run.
      </p>
    </div>
  );
}

function DemoApp() {
  return (
    <div data-testid="harness-root" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <DemoChrome />
      {/* CANONICAL split layout: CodeSite pane LEFT, chat pane RIGHT (CodeSiteWidget
          defaults). chatEntitled unlocks the input UI only — the SERVER enforces the
          real entitlement (verify_subscription) + the credits gate on every ask. */}
      <CodeSiteWidget chatWidth={0.4} height={`calc(100vh - ${CHROME_HEIGHT}px)`} chatEntitled>
        <FakeIdePanel />
      </CodeSiteWidget>
      {/* The domain-isolated Powch identity silo (NOT auto-rendered by AppShell;
          `standalone` because this app runs on its own origin, not inside the PWA). */}
      <PowchSideBarWidget standalone />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppShell appId="descix-docs" standalone config={{}}>
      <DemoApp />
    </AppShell>
  </React.StrictMode>
);
