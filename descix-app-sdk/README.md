# @descix/app-sdk

Core package for all DeSciX web apps. Provides init-to-READY app shell logic, auth, API surface, Powch bridge integration, and dev proxy/config. Every app (Powch PWA, DeSciX PWA, standalone samples) imports `@descix/app-sdk` and builds with `__STANDALONE_APP_ID__ === [app id]`.

## Installation

**Future (npm publish):**
```bash
npm install @descix/app-sdk
```

**Current (monorepo):**
```json
{
  "dependencies": {
    "@descix/app-sdk": "file:../packages/descix-app-sdk"
  }
}
```

## Exports

| Export | Description |
|--------|-------------|
| `.` | AppShell, AppContext, AppProvider, useAppContext, Api, ErrorBoundary, LoadingWidget, DebugWidget, CodeSiteWidget, ChatWidget, PowchSideBarWidget, PowchBridgeProvider, usePowchBridge, PowchClient |
| `./dev` | createViteProxyConfig, createViteServerConfig, getViteHttpsConfig |
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

Shared HTTPS certs and Vite config:

```js
import { createViteServerConfig } from '@descix/app-sdk/dev';

export default defineConfig({
  server: createViteServerConfig(process.cwd(), { port: 5174, apiGatewayUrl: 'https://localhost:4000' }),
  define: {
    __STANDALONE_APP_ID__: JSON.stringify('powch'),
    __POWCH_APP_URL__: JSON.stringify('https://powch.descix.net/'),
    __API_GATEWAY_URL__: JSON.stringify('https://localhost:4000'),
  },
});
```

## References

- [App Shell Core Design](../../design/architecture/app-shell-core-design.md)
- [DeSciX Powch Integration Guide](../../DeSciX_Powch/docs/integration-guide.md)
