/**
 * Hook for AI API requests with PRODUCTION x402 payment handling
 * Now uses x402Client for automatic EIP-712/EIP-3009 payments
 */
import { useState, useCallback } from 'react';
import { useAccount, useWalletClient, useSwitchChain } from 'wagmi';
import { ethers } from 'ethers';
import { useX402Client } from '../utils/x402Client';
import { API_URL } from '../utils/constants';

export function useAIRequest() {
    const { address, chainId } = useAccount();
    const { data: walletClient } = useWalletClient();
    const { switchChainAsync } = useSwitchChain();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [response, setResponse] = useState(null);
    const [paymentRequired, setPaymentRequired] = useState(null);

    // Initialize x402 client with wallet
    const x402Client = useX402Client();

    const sendRequest = useCallback(async (prompt, capability = 'text', aiProvider = 'gemini') => {
        setIsLoading(true);
        setError(null);
        setPaymentRequired(null);
        setResponse(null);

        try {
            if (!walletClient) {
                throw new Error('Wallet not connected');
            }

            // Ensure we are on the correct network (10143)
            const targetChainId = 10143;
            if (chainId !== targetChainId) {
                console.log(`🔄 Switching network to Chain ID ${targetChainId}...`);
                try {
                    await switchChainAsync({ chainId: targetChainId });
                } catch (switchError) {
                    console.error('Failed to switch network:', switchError);
                    throw new Error(`Please switch your wallet to Monad Testnet (Chain ID: ${targetChainId})`);
                }
            }

            // Set up x402 client with ethers signer from wagmi
            // FIXED: Renamed to ethersProvider to avoid shadowing the aiProvider parameter
            const ethersProvider = new ethers.BrowserProvider(walletClient);
            const signer = await ethersProvider.getSigner();
            
            // Get the actual address from the signer (ensures correct account)
            const signerAddress = await signer.getAddress();
            console.log('🔐 Using signer address:', signerAddress);
            
            await x402Client.setWallet({ signer });

            // Use x402Client.fetch for automatic payment handling
            const result = await x402Client.fetch(`${API_URL}/api/ai/generate`, {
                method: 'POST',
                body: JSON.stringify({
                    address: signerAddress, // Use the actual signer address, not wagmi's address
                    prompt,
                    capability,
                    provider: aiProvider  // Use the renamed parameter
                })
            });

            if (result.status === 402) {
                // Payment was required but failed
                setPaymentRequired(result.data);
                return { success: false, paymentRequired: result.data };
            }

            if (!result.success) {
                throw new Error(result.data?.error || 'Request failed');
            }

            // Success
            setResponse(result.data);
            return { success: true, data: result.data };

        } catch (err) {
            console.error('AI Request error:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [address, walletClient, x402Client]);

    const clearPaymentRequired = useCallback(() => {
        setPaymentRequired(null);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        sendRequest,
        isLoading,
        error,
        response,
        paymentRequired,
        clearPaymentRequired,
        clearError
    };
}

/**
 * Hook to check access status from API
 */
export function useCheckAccess() {
    const [status, setStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const checkAccess = useCallback(async (address) => {
        if (!address) return null;

        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/ai/access/${address}`);
            const data = await res.json();
            setStatus(data);
            return data;
        } catch (err) {
            console.error('Failed to check access:', err);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { checkAccess, status, isLoading };
}
