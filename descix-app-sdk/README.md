# @descix/app-sdk

Core package for all DeSciX web apps. Provides init-to-READY app shell logic, auth, API surface, Powch bridge integration, and dev proxy/config.

**Hosting an app inside the shell?** The contract is [The App Shell API](./APP_SHELL_API.md) — `DeSciX.view` to choose your layout, `DeSciX.chat` to show the model something, `DeSciX.powch` for identity and wallet, and `window.DeSciX_Actions` for what the shell calls back into. Include `DeSciXAppSDK.js` and use `DeSciX.…`: it detects which window carries the bus, so you never write `window.parent.` or `window.top.`

The shell resolves which app it is serving at RUNTIME, from a binding served at `/__descix/app-binding.json` on its own origin, so one bundle boots as the store and as your app standalone with no rebuild. An app that builds *itself* standalone declares it at its own mount: `<AppShell appId="my-app" standalone>`.

## Installation

**Future (npm publish):**
```bash
npm install @descix/app-sdk
```

**Current (monorepo):**
```json
{
  "dependencies": {
    "@descix/app-sdk": "file:../DeSciX_Core/descix-app-sdk"
  }
}
```

## Exports

| Export | Description |
|--------|-------------|
| `.` | AppShell, AppContext, AppProvider, useAppContext, Api, ErrorBoundary, LoadingWidget, DebugWidget, CodeSiteWidget, ChatWidget, PowchSideBarWidget, PowchBridgeProvider, usePowchBridge, PowchClient, useDeSciXView, VIEW_MODES, viewAvailable, publishChatApi, retractChatApi, publishBridgeMember, retractBridgeMember, getBridge, BRIDGE_READY_EVENT |
| `./dev` | createViteProxyConfig, createViteServerConfig, getViteHttpsConfig, resolveGatewayPort, resolveServeBinding, resolvePowchUrl, resolveDevCertOptions, buildWorkspaceProducts |
| `./powch-client` | PowchClient (for third-party sites) |

## Usage

### AppShell + Children

```jsx
import { AppShell } from '@descix/app-sdk';
import { PowchAppProvider, PowchStandaloneApp } from '@powch/react';

function PowchApp() {
  return (
    <AppShell appId="powch" config={{ powch: { brand: { name: 'Powch', logo: null } } }}>
      <PowchAppProvider config={{ brand: { name: 'Powch', logo: null } }}>
        <PowchStandaloneApp />
      </PowchAppProvider>
    </AppShell>
  );
}
```

The shell handles init, auth, and providers. When `appState === READY`, it renders `children`.

### PowchClient (Third-Party Sites)

```js
import { PowchClient } from '@descix/app-sdk/powch-client';

// bridgeUrl is REQUIRED and has no default. It decides where your users type a
// passkey and unlock a wallet, so the SDK will not guess it — an unset origin
// throws with the ways to set it. Point it at the environment you mean.
const powch = new PowchClient({ bridgeUrl: import.meta.env.VITE_POWCH_APP_URL });
powch.createButton(document.getElementById('powch-button'), { toggle: true });
```

## Dependencies

The app-sdk is **self-contained**. It bundles:
- MUI (@mui/material, @mui/icons-material, @emotion/react, @emotion/styled)
- React, Wagmi, Viem
- PowchClient and PowchBridgeClient (postMessage protocol only)

**No @powch dependencies.** Apps that need Powch UI (e.g. Powch PWA) add @powch/react themselves. The app-sdk has no knowledge of Powch internals.

## Dev Mode

### Local app dev against the cloud (`descix serve`)

`descix serve` puts the App Shell, your app and the API on **one HTTPS origin**, which is
what makes a shell sign-in visible to your app and what makes passkeys work at all. No
platform checkout is required: with nothing configured, the shell and `/apifront` both
resolve to cloud DEV. What you see is **your app, standalone — no store chrome**.

```bash
descix config set-env dev                   # ← today: the platform runs on dev.descix.net
descix app init -a <app-id> -p ./my-app     # register the app in .descix/workspace.json
descix app set-site -a <app-id> --static .  # serve ./my-app at /p/<app-id>/
cd my-app && descix serve                   # the app is detected from the directory
```

```
  API:       https://dev.descix.net   [workspace env.apiUrl]
  Shell:     https://dev.descix.net   [same origin as API (workspace env.apiUrl)]
  Port:      5173                     [built-in default (5173)]
  App:       <app-id>                 [cwd]   mode: standalone
  Open:      https://localhost:5173/   → App Shell; reads /__descix/app-binding.json and boots <app-id> standalone
  App route: https://localhost:5173/p/<app-id>   → this app's route on the gateway (the URL the shell loads it from)

    /                                  → https://dev.descix.net   (App Shell — sign in here)
    /apifront                          → https://dev.descix.net
    /p/<app-id>                        → ./my-app
```

`descix serve` starts **nothing else** — no backend, no app dev server. If your app has its
own dev server you run it yourself and the gateway proxies to it; a `--static` app needs
nothing running.

#### Which app, and which port

One serve session serves **one app, standalone**. It is detected from the directory you are
standing in (the product whose `localPath` contains your cwd; longest match wins), or named
with `--app <id>` from anywhere else. Nothing is written to `workspace.json` — a persistent
"current app" pointer goes stale and lies. When it cannot name an app it says so and lists
the workspace's apps rather than quietly showing you the store.

The port resolves `--port` → `env.gateway.port` → `5173`, with `strictPort` on, and the
resolved value is printed with **where it came from**. Give a checkout its own port once:

```bash
descix config set-gateway-port 5599
```

#### Standalone is a runtime binding, not a build

The gateway answers `GET /__descix/app-binding.json` on the shell's own origin with
`{mode:'standalone', appId, appUrl, source}`. The shell asks its own origin before it mounts,
so the same pre-built cloud shell boots as the store on `descix.net` and as your app on
localhost, with **no rebuild**. No binding served (or a timeout, or a malformed one) means the
store — the safe degradation.

There is no `__STANDALONE_APP_ID__` define; it is deleted. An app that builds *itself*
standalone declares it at its own mount: `<AppShell appId="my-app" standalone>`.

> **Which environment?** The SDK ships pointing at **PROD** (`https://descix.net`). While the
> platform is still coming up on prod, run `descix config set-env dev` once per workspace —
> that writes `env.apiUrl` and both the API and the shell follow it. `demo` and `prod` work the
> same way. There is no "local" environment: a local backend is a URL you name, e.g.
> `descix config set-env dev --url https://localhost:4000`.

Targets, in precedence order:

| Target | `1.` flag | `2.` workspace.json | `3.` derived | `4.` default |
|---|---|---|---|---|
| **API** (`/apifront`, `/api`, `/mcp`, `/oauth`) | `descix --api-url <url> serve`, `--env dev` | `env.apiUrl` (what `set-env` writes) | `env.platform.microservice.port` (local platform checkout) | **PROD** |
| **Shell** (`/`) | `descix serve --site-url <url>` | `env.siteUrl` | the API origin when remote, else `env.platform.site.port` | — fails loud |

The default SDK user wins the defaults: whenever the API is a real platform origin, the shell
comes from that same origin, so one origin carries shell + app + `/apifront` with nothing
configured. **Platform developers opt IN** to a local shell by naming it
(`descix serve --site-url https://localhost:5174`, or `env.siteUrl`) — owning a platform
checkout is not by itself a request to serve it. A localhost target is always something you
named. If the API is local and no shell is configured, the gateway refuses to start rather
than proxying `/` at the API port. If the configured platform is unreachable, the proxy
surfaces the failure as-is (502/timeout) — nothing is masked or retried against a fallback.

#### Where the shell gets your app's URL (the product map)

The URL the shell puts in the CodeSite iframe does **not** come from your app record on the
platform — `get_app`'s `ip_site_gcs_path_url` is empty for a perfectly working local app. In dev it
comes from a Vite `define` named `__WORKSPACE_PRODUCTS__`, built by `buildWorkspaceProducts()` from
`.descix/workspace.json` at **config-load time**.

Every URL in that map is on the **gateway origin, absolute, with the port in it** —
`https://localhost:{gatewayPort}/p/{appId}` (the platform app gets the gateway root). That is the
contract, not an implementation detail: the shell reaches into `iframe.contentWindow` and SplitView
dispatches actions by direct interframe scripting, so an app served from its own dev-server origin
would throw a cross-origin `SecurityError` and die silently. Your app's own dev-server port is the
origin the gateway proxies *to*; it is never a URL anything opens or iframes.

Two consequences worth knowing before they cost you an afternoon:

- **A Vite `define` is compile-time text substitution.** A *prebuilt* shell bundle has its gateway
  port baked in. Reuse that bundle behind a second gateway on a different port and the iframe
  silently loads the **original** port's app, while `curl`ing `/p/{appId}` on the new port correctly
  returns your bytes. Rebuild the shell when the gateway origin changes.
- **A running app dev server does not have that problem.** `workspaceProductsPlugin` watches
  `.descix/workspace.json` and pushes a fresh map over Vite's WebSocket
  (`descix:workspace-products`), so `descix app set-site` shows up without a restart. It is
  dev-only (`apply: 'serve'`) and auto-injects its own client runtime — no source change in your app.

`resolveAppGatewayUrl()` is the one resolver that answers "where is this app", shared with
`descix app open`, and returns the same URL the map contains.

### Trust the dev certificate (one time, required for passkey login)

The SDK ships a self-signed cert for `https://localhost` with a `subjectAltName` block.
Chrome will still warn until you trust it, and **WebAuthn refuses to run on an untrusted
origin** — so passkey sign-in needs this step:

> The failure has no SDK-level hint. The browser refuses the ceremony itself, verbatim:
> `WebAuthn is not supported on sites with TLS certificate errors`. If Powch login dies with
> that message, it is the certificate, not your code or your Powch config. **A cert you trusted
> months ago and that has since EXPIRED fails exactly the same way** — trust is not the only
> thing the browser checks, so re-mint and re-trust rather than assuming a one-time step holds
> forever.

`descix serve` prints the exact command with the resolved path on every start. On macOS:

```bash
security add-trusted-cert -k ~/Library/Keychains/login.keychain-db \
  "$(node --input-type=module -e "import {DEFAULT_CERT_DIR} from '@descix/app-sdk/dev'; console.log(DEFAULT_CERT_DIR + '/cert.pem')")"
```

Prefer your own cert (e.g. from `mkcert -install && mkcert localhost 127.0.0.1 ::1`)? Point
the workspace at it — no SDK edit, no hand-edited JSON:

```bash
descix config set-dev-certs --dir ./certs          # expects cert.pem + key.pem
descix config set-dev-certs --cert ./certs/x.pem --key ./certs/x-key.pem
descix config set-dev-certs --clear                # back to the SDK-tracked SAN pair
```

That pair has **one owner** and is used by the gateway *and* every app dev server behind it —
passkey login is origin-bound, so a cert that reached only the gateway used to work there and
fail on the app. Any cert without a localhost `subjectAltName` is rejected at startup with the
exact `openssl` command that mints a correct one.

### Configuring the workspace (no hand-editing)

| Key | Verb |
|---|---|
| `env.apiUrl` | `descix config set-env <dev\|demo\|prod> [--url <url>]` (env is positional) |
| `env.gateway.port` | `descix config set-gateway-port <n\|none>` |
| `env.devCerts` | `descix config set-dev-certs --dir\|--cert\|--key\|--clear` |
| `env.powchUrl` | `descix config set-powch-url <url\|none>` |
| `env.siteUrl` | `descix config set-site-url <url\|none>` |
| product entries | `descix app init` / `app set-site` / `app set-port` / `app set-localpath` / `app unmap` |

Ports are explicit-only — there is no auto-allocation.

### The proxy engine is exact-pinned

Vite is a real runtime dependency of this package and is pinned exactly, not caret-ranged.
`descix serve` asserts the pin before it imports vite and refuses to boot on drift, naming
both the pinned and the resolved version and the `package.json` that would be loaded. The
declaration in this package's `package.json` is the single owner; the assert reads it.

### Vite config for an app dev server

```js
import fs from 'fs';
import { createViteServerConfig, resolvePowchUrl } from '@descix/app-sdk/dev';

// Where Powch lives has ONE owner. Never hardcode an origin here: a production
// URL baked into a dev build silently points the wallet at production.
const ws = JSON.parse(fs.readFileSync('.descix/workspace.json', 'utf8'));
const powchAppUrl = resolvePowchUrl(ws, { override: process.env.VITE_POWCH_APP_URL });
if (!powchAppUrl) {
  throw new Error('Set env.powchUrl in .descix/workspace.json, or VITE_POWCH_APP_URL');
}

export default defineConfig({
  server: createViteServerConfig(process.cwd(), { port: 5174 }),  // API target resolved as above
  define: {
    __POWCH_APP_URL__: JSON.stringify(powchAppUrl),
  },
});
```

An app declares itself standalone at its `<AppShell standalone />` mount, not through
a build-time global.

## References

- [The App Shell API](./APP_SHELL_API.md) — what the shell publishes to your app, and what it calls back
- [App Shell Core Design](../../design/architecture/app-shell-core-design.md)
- [DeSciX Powch Integration Guide](../../DeSciX_Powch/docs/integration-guide.md)
