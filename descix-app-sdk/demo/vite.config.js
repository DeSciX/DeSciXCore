import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default defineConfig({
  plugins: [react()],
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
