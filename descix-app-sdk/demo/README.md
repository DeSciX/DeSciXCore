# App-SDK Demo — Split-View Harness (WS-HEADLESS-MVP-A4)

Two pages:

- `index.html` — minimal AppShell boot check.
- `splitview.html` — **the frqtl.com hosting pattern in miniature**: credits-aware
  AI-Chat pane (left) + host-rendered "IDE" panel (CodeSiteWidget children mode) against
  LIVE DEV, with REAL Powch passkey login.

## Run

```bash
# prereqs: backend :4000, powch microservice :3003, powch site :5175
cd DeSciX_Core/descix-app-sdk/demo
npm install     # once
npx vite        # → https://localhost:5199/splitview.html  (HTTPS — see below)
```

Playwright evidence specs (from `DeSciX/`):

```bash
npx playwright test tests/playwright/smoke/a4-splitview-credits.spec.ts      # seeded-session metered chat + zero-balance CTA
npx playwright test tests/playwright/smoke/a4-splitview-powch-login.spec.ts  # FULL journey: real passkey ceremony → balance → CTA → metered debit
```

## Integration traps this harness exists to demonstrate

(Full write-up: `DeSciX/V2_docs/architecture/frqtl-server-seam-contract.md` §7.5.)

1. **Powch is domain-isolated BY DESIGN** (zero-knowledge SSO). The host never shares an
   origin with Powch; the login iframe is cross-origin + postMessage. Do not proxy or
   co-host Powch.
2. **HTTPS is mandatory** — WebAuthn needs a secure context. This harness uses the
   workspace's shared dev certs (`getViteHttpsConfig`) + a `Permissions-Policy` header
   delegating `publickey-credentials-*` to the Powch origin. A plain-HTTP host page can
   NEVER complete a passkey ceremony.
3. **Standalone hosts use `PowchClient`** (`@descix/app-sdk/powch-client`, reference
   sample `DeSciX_Powch/samples/standalone-react`) constructed AT MODULE SCOPE, and hand
   the auth payload to `window.DeSciX.loginWithSessionToken`. In-shell apps use
   `usePowchBridge()` instead — the ChatWidget's built-in sign-in button does that
   automatically when no `onRequestLogin` prop is given.
4. **Retry the first auth request** — a postMessage sent while the Powch app is still
   booting inside the iframe is dropped silently (`authWithBootRetry` here).
5. **Server stays authoritative**: `chatEntitled` only unlocks the input UI; every ask
   passes verify_subscription (community membership / admin-granted role) and the
   AI-credits gate server-side. Fresh users see their $0 balance but cannot chat until
   they join the community.
