// ---------- [./DeSciX_PWA/src/providers/WagmiProvider.jsx] ----------
/**
 * WagmiProvider - Web3 wallet connection provider
 * 
 * Configures wagmi + @reown/appkit for multi-wallet support including:
 * - MetaMask (injected)
 * - Coinbase Wallet
 * - Trust Wallet
 * - WalletConnect (QR code for mobile wallets)
 * 
 * ARCHITECTURE NOTE:
 * - This provider wraps the app to enable wallet connections
 * - Actual authentication still goes through /apifront/ endpoint
 * - Wallet signatures are sent to backend for session creation
 */

import React from 'react';
import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider as WagmiProviderBase, createConfig, http } from 'wagmi';
import { polygon, polygonAmoy, mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

// WalletConnect Project ID - Get from https://cloud.walletconnect.com
// For production, this should be in environment variables
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

// Query client for react-query (required by wagmi v2)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 2,
    },
  },
});

// Supported chains - Polygon is primary for DeSciX
const chains = [polygon, polygonAmoy, mainnet];

// Metadata for WalletConnect modal
const metadata = {
  name: 'DeSciX',
  description: 'Decentralized Science Exchange - Community Token Platform',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://descix.app',
  icons: ['/logo192.png'],
};

// Create wagmi adapter for @reown/appkit
const wagmiAdapter = new WagmiAdapter({
  networks: chains,
  projectId: WALLETCONNECT_PROJECT_ID,
  ssr: false,
});

// Create AppKit instance (provides the wallet connection modal)
// Only initialize if we have a valid project ID
let appKitInstance = null;
if (WALLETCONNECT_PROJECT_ID && WALLETCONNECT_PROJECT_ID !== 'demo-project-id') {
  try {
    appKitInstance = createAppKit({
      adapters: [wagmiAdapter],
      networks: chains,
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata,
      features: {
        analytics: false, // Disable analytics for privacy
        email: false, // We handle email auth separately
        socials: false, // We handle social auth separately
      },
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent': '#6366f1', // Indigo accent color
        '--w3m-border-radius-master': '8px',
      },
    });
  } catch (error) {
    console.warn('AppKit initialization failed:', error.message);
  }
}

// Export wagmi config for use in hooks
export const wagmiConfig = wagmiAdapter.wagmiConfig;

// Export AppKit instance for programmatic control
export { appKitInstance };

/**
 * Check if WalletConnect is properly configured
 * @returns {boolean} True if WalletConnect is available
 */
export function isWalletConnectConfigured() {
  return WALLETCONNECT_PROJECT_ID && 
         WALLETCONNECT_PROJECT_ID !== 'demo-project-id' && 
         appKitInstance !== null;
}

/**
 * Get the signature message for wallet authentication
 * This should match the backend's DEFAULT_SIGNATURE_MESSAGE
 * @param {string} [nonce] - Optional nonce for unique signatures
 * @returns {string} Message to sign
 */
export function getSignatureMessage(nonce) {
  if (nonce) {
    return `DeSciX Login ${nonce}`;
  }
  // Default message (matches backend utils.DEFAULT_SIGNATURE_MESSAGE)
  return 'Sign this message to prove ownership of your wallet for DeSciX.';
}

/**
 * Generate a unique nonce for wallet session login
 * @returns {string} Unique nonce string
 */
export function generateLoginNonce() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}_${random}`;
}

/**
 * WagmiProvider Component
 * Wraps children with wagmi + react-query providers
 */
export default function WagmiProvider({ children }) {
  return (
    <WagmiProviderBase config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProviderBase>
  );
}

// Re-export wagmi hooks for convenience
export { 
  useAccount, 
  useConnect, 
  useDisconnect, 
  useSignMessage,
  useChainId,
  useSwitchChain,
} from 'wagmi';

// Re-export AppKit hooks
export { useAppKit, useAppKitState } from '@reown/appkit/react';
