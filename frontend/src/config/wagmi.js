/**
 * Wagmi + RainbowKit Configuration
 * Sets up Monad testnet for wallet connection
 */
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';

// Define Monad Testnet chain
const monadTestnet = {
    id: 10143,
    name: 'Monad Testnet',
    nativeCurrency: {
        decimals: 18,
        name: 'Monad',
        symbol: 'MON',
    },
    rpcUrls: {
        default: { http: ['https://testnet-rpc.monad.xyz/'] },
        public: { http: ['https://testnet-rpc.monad.xyz/'] },
    },
    blockExplorers: {
        default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
    },
    testnet: true,
};

// RainbowKit config - Simplified for local development
export const config = getDefaultConfig({
    appName: 'x402 AI Gateway',
    projectId: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', // Dummy ID for local testing
    chains: [monadTestnet],
    transports: {
        [monadTestnet.id]: http('https://testnet-rpc.monad.xyz/'),
    },
    ssr: false,
});

export { monadTestnet };
