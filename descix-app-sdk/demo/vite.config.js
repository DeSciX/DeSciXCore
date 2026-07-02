import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { buildWorkspaceProducts, getViteHttpsConfig } from '@descix/app-sdk/dev';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Workspace root (Unkamon/) — four levels up from descix-app-sdk/demo.
const workspaceRoot = path.resolve(__dirname, '../../../..');

// Canonical product map (same helper the platform PWA vite config uses) — gives us the
// REAL local Powch origin for the login iframe instead of a hardcoded deployed URL.
let workspaceProducts = null;
try {
  workspaceProducts = buildWorkspaceProducts(workspaceRoot);
} catch (e) {
  console.warn('[splitview-harness] buildWorkspaceProducts failed:', e.message);
}
const powchAppUrl = workspaceProducts?.powch || 'https://localhost:5175/';
const powchOriginForPolicy = new URL(powchAppUrl).origin;

// HTTPS is MANDATORY (WebAuthn secure context) — the standalone-host trap: a plain-HTTP
// host page can never complete a Powch passkey ceremony. Modeled on
// DeSciX_Powch/samples/standalone-react/vite.config.js, using the workspace's shared
// dev certs (same certs the gateway/PWA/Powch sites use).
const httpsConfig = getViteHttpsConfig();

export default defineConfig({
  plugins: [react()],
  server: {
    // WS-HEADLESS-MVP-A4 harness: HTTPS origin (WebAuthn) + Permissions-Policy
    // delegating publickey-credentials to the DOMAIN-ISOLATED Powch iframe origin
    // (zero-knowledge SSO: the host must NEVER share origin with Powch — cross-origin
    // is the security model). /apifront proxies to the LIVE DEV backend so the
    // split-view harness exercises real metered chat.
    ...httpsConfig,
    port: 5199,
    headers: {
      'Permissions-Policy':
        `publickey-credentials-create=(self "${powchOriginForPolicy}"), ` +
        `publickey-credentials-get=(self "${powchOriginForPolicy}")`,
    },
    proxy: {
      '/apifront': { target: 'https://localhost:4000', changeOrigin: true, secure: false },
    },
  },
  define: {
    __STANDALONE_APP_ID__: JSON.stringify('demo'),
    __POWCH_APP_URL__: JSON.stringify(powchAppUrl),
    __API_GATEWAY_URL__: JSON.stringify('https://localhost:4000'),
    __WORKSPACE_PRODUCTS__: JSON.stringify(workspaceProducts),
    global: 'globalThis',
  },
  resolve: {
    dedupe: ['react', 'react-dom', '@mui/material', '@mui/icons-material'],
    alias: {
      '@mui/icons-material': path.resolve(__dirname, 'node_modules/@mui/icons-material'),
      '@mui/material': path.resolve(__dirname, 'node_modules/@mui/material'),
    },
  },
});
