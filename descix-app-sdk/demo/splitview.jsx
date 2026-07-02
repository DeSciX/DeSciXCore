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
 * Auth: the harness expects a REAL platform session seeded into localStorage
 * ('sessionInfo') before load — the Playwright spec mints one via reconnect_by_wallet
 * (the same wallet-sig rail the CLI uses). Nothing here bypasses a backend check.
 *
 * Run:  cd DeSciX_Core/descix-app-sdk/demo && npx vite   → http://localhost:5599/splitview.html
 */
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { AppShell, CodeSiteWidget, AppData } from '@descix/app-sdk';

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
      <CodeSiteWidget chatPosition="left" chatWidth={0.45} height="100vh" chatEntitled>
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
