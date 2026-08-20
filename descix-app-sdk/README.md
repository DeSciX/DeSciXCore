# @descix/app-sdk

Core package for all DeSciX web apps. Provides init-to-READY app shell logic, auth, API surface, Powch bridge integration, and dev proxy/config.

**Hosting an app inside the shell?** The contract is [The App Shell API](./APP_SHELL_API.md) — `window.DeSciX.view` to choose your layout, `window.DeSciX.powch` for identity and wallet, and `window.DeSciX_Actions` for what the shell calls back into. Plain JavaScript on `window`; no SDK import required.

The shell resolves which app it is serving at RUNTIME, from a binding served at `/__descix/app-binding.json` on its own origin, so one bundle boots as the store and as your app standalone with no rebuild. Apps that build themselves standalone (the Powch PWA, the demo) still set `__STANDALONE_APP_ID__` in their own Vite config.

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
| `.` | AppShell, AppContext, AppProvider, useAppContext, Api, ErrorBoundary, LoadingWidget, DebugWidget, CodeSiteWidget, ChatWidget, PowchSideBarWidget, PowchBridgeProvider, usePowchBridge, PowchClient, useDeSciXView, VIEW_MODES |
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

const powch = new PowchClient({ bridgeUrl: 'https://powch.descix.net/' });
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
resolve to cloud DEV.

```bash
descix config set-env dev                   # ← today: the platform runs on dev.descix.net
descix app init -a <app-id> -p ./my-app     # register the app in .descix/workspace.json
descix app set-site -a <app-id> --static .  # serve ./my-app at /p/<app-id>/
descix serve -p 5173
```

```
  API:       https://dev.descix.net   [workspace env.apiUrl]
  Shell:     https://dev.descix.net   [same origin as API (workspace env.apiUrl)]
    /                                  → https://dev.descix.net   (App Shell — sign in here)
    /apifront                          → https://dev.descix.net
    /p/<app-id>                        → ./my-app
```

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

### Trust the dev certificate (one time, required for passkey login)

The SDK ships a self-signed cert for `https://localhost` with a `subjectAltName` block.
Chrome will still warn until you trust it, and **WebAuthn refuses to run on an untrusted
origin** — so passkey sign-in needs this step:

`descix serve` prints the exact command with the resolved path on every start. On macOS:

```bash
security add-trusted-cert -k ~/Library/Keychains/login.keychain-db \
  "$(node --input-type=module -e "import {DEFAULT_CERT_DIR} from '@descix/app-sdk/dev'; console.log(DEFAULT_CERT_DIR + '/cert.pem')")"
```

Prefer your own cert (e.g. from `mkcert -install && mkcert localhost 127.0.0.1 ::1`)? Point
the workspace at it — no SDK edit:

```jsonc
// .descix/workspace.json
{ "env": { "devCerts": { "dir": "./certs" } } }   // or { "cert": "./certs/x.pem", "key": "./certs/x-key.pem" }
```

Any cert without a localhost `subjectAltName` is rejected at startup with the exact
`openssl` command that mints a correct one.

### Vite config for an app dev server

```js
import { createViteServerConfig } from '@descix/app-sdk/dev';

export default defineConfig({
  server: createViteServerConfig(process.cwd(), { port: 5174 }),  // API target resolved as above
  define: {
    __STANDALONE_APP_ID__: JSON.stringify('powch'),
    __POWCH_APP_URL__: JSON.stringify('https://powch.descix.net/'),
  },
});
```

## References

- [The App Shell API](./APP_SHELL_API.md) — what the shell publishes to your app, and what it calls back
- [App Shell Core Design](../../design/architecture/app-shell-core-design.md)
- [DeSciX Powch Integration Guide](../../DeSciX_Powch/docs/integration-guide.md)
