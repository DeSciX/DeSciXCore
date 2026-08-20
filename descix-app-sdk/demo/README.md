# App-SDK Demo Pages

> **THE canonical MVP dogfood demo is `daita-splitviewdemo`** — a self-contained static
> sub-PWA (`Unkamon/apps/daita-splitviewdemo/site/`, egpt/scaffold pattern: no build
> step) delivered into an App Shell CodeSite iframe. The sub-PWA scripts to the shell
> via the same-origin `window.parent.DeSciX` bridge, chooses its layout with
> `DeSciX.view.set(...)`, and registers `window.DeSciX_Actions.ide_set_status` for
> AI-chat action blocks. The shell supplies the Powch identity sidebar and the
> credits-aware chat pane.
>
> **Where to look at it.** `descix serve` boots the shell **standalone into one app**
> with no store chrome, so there is no store view to browse from the gateway — run it
> from the demo app's directory (or `--app daita-splitviewdemo`) and you land straight
> in it. To exercise the store chrome (TopNavBar login/logout, app store, my-apps),
> use a deployed shell such as `https://dev.descix.net`.
> Lifecycle proof: `DeSciX/tests/playwright/smoke/a4-splitview-powch-login.spec.ts`.

This directory keeps two SECONDARY component harnesses:

- `index.html` — minimal AppShell boot check.
- `splitview.html` — widget-level harness mounting CodeSiteWidget/ChatWidget directly
  in a bare AppShell page (useful for iterating on the SDK components without the full
  shell). `cd demo && npx vite` → `https://localhost:5199/splitview.html` (HTTPS —
  WebAuthn secure context; Permissions-Policy delegates `publickey-credentials-*` to
  the Powch origin). Specs: `a4-splitview-credits.spec.ts`.

## Integration notes (full write-up: `DeSciX/V2_docs/architecture/frqtl-server-seam-contract.md` §7.5)

1. **Powch is domain-isolated BY DESIGN** (zero-knowledge SSO) — the identity iframe is
   the one deliberately cross-origin piece; postMessage is its security model.
2. **HTTPS is mandatory** for any page hosting a passkey ceremony.
3. The shell's chat pane and CodeSite layout are the SDK's ChatWidget/CodeSiteWidget —
   the platform PWA consumes them via re-export shims (one canonical implementation;
   credits UI everywhere).
4. Server stays authoritative: entitlements (community membership / verify_subscription)
   and the AI-credits gate run on every ask regardless of UI state.
