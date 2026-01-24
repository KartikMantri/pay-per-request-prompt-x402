/**
 * Custom hooks for contract interactions
 */
import { useState } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useWalletClient, useSwitchChain, useAccount } from 'wagmi';
import { parseEther, keccak256, encodePacked } from 'viem';
import { CONTRACT_ADDRESS, CONTRACT_ABI, PRICING, API_URL } from '../utils/constants';
import { useX402Client } from '../utils/x402Client';
import { ethers } from 'ethers';

/**
 * Hook to read user's access status from contract
 */
export function useAccessStatus(address) {
    const { data, isLoading, refetch } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getAccessStatus',
        args: [address],
        enabled: !!address && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
    });

    return {
        isPremium: data?.isPremium ?? data?.[0] ?? false,
        premiumExpiresAt: data?.premiumExpiresAt ? Number(data.premiumExpiresAt) : (data?.[1] ? Number(data[1]) : 0),
        credits: data?.creditBalance !== undefined ? Number(data.creditBalance) : (data?.[2] ? Number(data[2]) : 0),
        isLoading,
        refetch
    };
}

/**
 * Hook for per-request payment (x402)
 */
export function usePayPerRequest() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
    
    // Store the requestId so it can be used for retry
    const [currentRequestId, setCurrentRequestId] = useState(null);

    const pay = async () => {
        // Generate unique requestId
        const requestId = keccak256(
            encodePacked(
                ['address', 'uint256', 'uint256'],
                [CONTRACT_ADDRESS, BigInt(Date.now()), BigInt(Math.floor(Math.random() * 1000000))]
            )
        );

        // Store it for retry
        setCurrentRequestId(requestId);

        writeContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'payPerRequest',
            args: [requestId],
            value: parseEther(PRICING.perRequest),
        });

        return requestId;
    };
    
    const resetRequestId = () => setCurrentRequestId(null);

    return {
        pay,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
        requestId: currentRequestId,
        resetRequestId
    };
}

/**
 * Hook for buying premium access
 */
export function useBuyPremium() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const buyPremium = (days) => {
        const price = days === 7 ? PRICING.premium7Days : PRICING.premium30Days;

        writeContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'buyPro',
            args: [BigInt(days)],
            value: parseEther(price),
        });
    };

    return {
        buyPremium,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error
    };
}

/**
 * Hook for buying credits
 */
export function useBuyCredits() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const buyCredits = (packs) => {
        const price = (parseFloat(PRICING.creditPack) * packs).toString();

        writeContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'buyCredits',
            args: [BigInt(packs)],
            value: parseEther(price),
        });
    };

    return {
        buyCredits,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error
    };
}

/**
 * Generate a unique request ID for per-request payments
 */
export function generateRequestId(address) {
    return keccak256(
        encodePacked(
            ['address', 'uint256', 'uint256'],
            [address, BigInt(Date.now()), BigInt(Math.floor(Math.random() * 1000000))]
        )
    );
}

/**
 * Hook for purchasing credits or premium via x402 (USDC)
 */
export function usePurchase() {
    const { address, chainId } = useAccount();
    const { data: walletClient } = useWalletClient();
    const { switchChainAsync } = useSwitchChain();
    const x402Client = useX402Client();

    const [isPending, setIsPending] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);

    const buy = async (type, args = {}) => {
        setIsPending(true);
        setError(null);
        setIsSuccess(false);

        try {
            if (!walletClient) throw new Error('Wallet not connected');

            // Ensure correct network
            const targetChainId = 10143;
            if (chainId !== targetChainId) {
                await switchChainAsync({ chainId: targetChainId });
            }

            const ethersProvider = new ethers.BrowserProvider(walletClient);
            const signer = await ethersProvider.getSigner();
            await x402Client.setWallet({ signer });

            console.log(`🛒 Initiating purchase: ${type}...`);
            
            const result = await x402Client.fetch(`${API_URL}/api/ai/purchase`, {
                method: 'POST',
                body: JSON.stringify({
                    address,
                    type,
                    ...args
                })
            });

            if (!result.success) {
                throw new Error(result.data?.error || 'Purchase failed');
            }

            console.log('✅ Purchase successful:', result.data);
            setIsSuccess(true);
            return result.data;

        } catch (err) {
            console.error('Purchase error:', err);
            setError(err.message);
            throw err;
        } finally {
            setIsPending(false);
        }
    };

    return {
        buy,
        isPending,
        isConfirming,
        isSuccess,
        error
    };
}
