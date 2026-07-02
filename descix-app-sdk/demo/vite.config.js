import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default defineConfig({
  plugins: [react()],
  server: {
    // WS-HEADLESS-MVP-A4 harness: route the SDK's relative /apifront calls to the LIVE
    // DEV backend (self-signed https) so the split-view harness exercises real metered
    // chat. 5599 avoids the platform gateway (5173) and PWA (5174) ports.
    port: 5599,
    proxy: {
      '/apifront': { target: 'https://localhost:4000', changeOrigin: true, secure: false },
    },
  },
  define: {
    __STANDALONE_APP_ID__: JSON.stringify('demo'),
    __POWCH_APP_URL__: JSON.stringify('https://powch.descix.net/'),
    __API_GATEWAY_URL__: JSON.stringify('https://localhost:4000'),
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
