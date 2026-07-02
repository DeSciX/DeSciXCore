/**
 * WS-HEADLESS-MVP-A4 — dev harness: embeddable credits-aware AI-Chat + CodeSite
 * split view against LIVE DEV (:4000 via the vite proxy).
 *
 * This page is the frqtl.com hosting pattern in miniature:
 *   - AppShell (peer-app model) provides context + Powch integration
 *   - CodeSiteWidget in CHILDREN mode: the host app fills the panel pane with its own
 *     "IDE" component and registers window.DeSciX_Actions handlers the AI can target
 *     via ```json:call:<fn>``` action blocks (user clicks Run — no auto-execution)
 *   - the chat pane is the metered ChatWidget: real ask_question_to_app calls, real
 *     USD AI-credit debits, balance chip + debit feedback + buy-credits CTA at $0
 *   - chatEntitled unlocks the input UI (the host manages entitlement); the SERVER
 *     stays authoritative (verify_subscription + credits gate on every call)
 *
 * Auth (REAL Powch login — standalone-app pattern per DeSciX/CLAUDE.md):
 *   - the ChatWidget renders "Sign in with Powch" when unauthenticated;
 *   - the harness supplies onRequestLogin backed by a PowchClient (its own Powch
 *     iframe against the LOCAL dev Powch site :5175 — passkey ceremony, site pass,
 *     registerDeSciX) and hands the auth payload to window.DeSciX.loginWithSessionToken;
 *   - the Playwright spec drives the REAL WebAuthn ceremony with the CDP virtual
 *     authenticator + PRF mock. Nothing here bypasses a backend check.
 *
 * Run:  cd DeSciX_Core/descix-app-sdk/demo && npx vite   → https://localhost:5199/splitview.html (HTTPS — WebAuthn secure context)
 */
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { AppShell, CodeSiteWidget, AppData } from '@descix/app-sdk';
import { PowchClient } from '@descix/app-sdk/powch-client';

const HARNESS_APP = {
  app_id: 'descix-docs',
  community_id: 'daita',
  app_name: 'DeSciX Docs',
};

// Select the app BEFORE React mounts: AppContext reads AppData.selectedApp at provider
// render (the setter is non-reactive by design — the PWA re-renders via view routing,
// which a standalone embed does not).
AppData.selectedApp = HARNESS_APP;
AppData.selectedCommunity = { community_id: HARNESS_APP.community_id, community_name: 'DeSciX' };

// ── Powch login (STANDALONE-app pattern) ─────────────────────────────────────────
// A standalone host (the frqtl.com pattern) owns a PowchClient: it creates its own
// Powch sidebar iframe against the LOCAL dev Powch site (__POWCH_APP_URL__ from the
// workspace product map → https://localhost:5175/ in dev). The ChatWidget's
// "Sign in with Powch" button invokes this via onRequestLogin; on success the auth
// payload (HOST_SAFE_KEYS incl. sessionInfo) goes to the shell's canonical
// window.DeSciX.loginWithSessionToken → REACTIVE AppContext session → the widget
// re-renders authenticated and loads the credit balance.
const POWCH_URL = typeof __POWCH_APP_URL__ !== 'undefined' && __POWCH_APP_URL__
  ? __POWCH_APP_URL__ : 'https://localhost:5175/';
// Constructed EAGERLY at module scope (like the canonical sample
// DeSciX_Powch/samples/standalone-react/app.js): at this point window.DeSciX.powch does
// not exist yet, so PowchClient runs in TRUE STANDALONE mode and owns its own
// domain-isolated sidebar iframe (#powch-sdk-bridge). Constructing it lazily after the
// shell is READY would silently switch it to embedded/shell-bridge mode.
const _powch = new PowchClient({ bridgeUrl: POWCH_URL });
function getPowch() { return _powch; }

/**
 * Send POWCH_AUTH with boot-race protection: if the Powch app inside the sidebar
 * iframe is still booting, a postMessage request is dropped silently (the PWA never
 * hits this because its sidebar loads at app startup, long before a sign-in click).
 * Re-send until the auth FLOW responds. Duplicate sends are safe — the Powch app
 * just (re)opens the auth flow.
 */
async function authWithBootRetry(powch, options, { attempts = 5, attemptMs = 10000 } = {}) {
  for (let i = 0; i < attempts; i++) {
    const result = await Promise.race([
      powch.auth(options),
      new Promise((res) => setTimeout(() => res('__POWCH_BOOT_TIMEOUT__'), attemptMs)),
    ]);
    if (result !== '__POWCH_BOOT_TIMEOUT__') return result;
    console.warn(`[harness] Powch auth attempt ${i + 1} unanswered (app booting?) — retrying`);
  }
  throw new Error('Powch auth: no response from the Powch app after retries');
}

async function harnessPowchLogin() {
  const powch = getPowch();
  powch.open(); // show the Powch sidebar so the user sees the passkey/login UI
  const payload = await authWithBootRetry(powch, { registerDeSciX: true, require: ['email'] });
  if (!payload) throw new Error('Powch auth returned no payload');
  if (!window.DeSciX?.loginWithSessionToken) {
    throw new Error('Shell not READY — window.DeSciX.loginWithSessionToken unavailable');
  }
  window.DeSciX.loginWithSessionToken(payload);
  powch.close();
  return payload;
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

function HarnessApp() {
  return (
    <div data-testid="harness-root" style={{ height: '100vh' }}>
      <CodeSiteWidget chatPosition="left" chatWidth={0.45} height="100vh" chatEntitled onRequestLogin={harnessPowchLogin}>
        <FakeIdePanel />
      </CodeSiteWidget>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppShell appId="descix-docs" config={{}}>
      <HarnessApp />
    </AppShell>
  </React.StrictMode>
);
