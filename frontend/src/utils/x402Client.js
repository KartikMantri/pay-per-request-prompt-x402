/**
 * Production x402 Client for Frontend
 * Handles automatic payment on 402 responses with EIP-712/EIP-3009
 * 
 * FLOW:
 * 1. Make API request
 * 2. If 402 → extract payment details
 * 3. Sign EIP-712 message (payment authorization)
 * 4. Sign EIP-3009 USDC authorization
 * 5. Retry request with signatures
 * 6. Return AI response
 */

import { ethers } from 'ethers';

// EIP-3009 Transfer Authorization type
const TRANSFER_WITH_AUTHORIZATION_TYPEHASH = ethers.id(
    'TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)'
);

/**
 * x402 Client class
 */
export class X402Client {
    constructor() {
        this.wallet = null;
        this.signer = null;
        this.usdcContract = null;
    }

    /**
     * Set wallet connector (from wagmi)
     * @param {Object} wallet - Wallet connector with signer
     */
    async setWallet(wallet) {
        this.wallet = wallet;
        this.signer = wallet.signer;
    }

    /**
     * Get EIP-712 domain for USDC
     * @param {string} usdcAddress - USDC contract address
     * @param {number} chainId - Chain ID
     * @returns {Object} EIP-712 domain
     */
    getUSDCDomain(usdcAddress, chainId) {
        return {
            name: 'USDC',      // Actual USDC contract name on Monad testnet
            version: '2',       // USDC version
            chainId,
            verifyingContract: usdcAddress
        };
    }

    /**
     * Generate EIP-3009 USDC authorization signature
     * @param {Object} params - Authorization parameters
     * @returns {Promise<Object>} Signed authorization
     */
    async signUSDCAuthorization(params) {
        const {
            from,
            to,
            amount,
            validAfter,
            validBefore,
            nonce,
            usdcAddress,
            chainId
        } = params;

        // EIP-712 domain for USDC
        const domain = this.getUSDCDomain(usdcAddress, chainId);

        // EIP-712 types for EIP-3009
        const types = {
            TransferWithAuthorization: [
                { name: 'from', type: 'address' },
                { name: 'to', type: 'address' },
                { name: 'value', type: 'uint256' },
                { name: 'validAfter', type: 'uint256' },
                { name: 'validBefore', type: 'uint256' },
                { name: 'nonce', type: 'bytes32' }
            ]
        };

        // Value to sign
        const value = {
            from,
            to,
            value: amount,
            validAfter,
            validBefore,
            nonce
        };

        // Sign using EIP-712
        const signature = await this.signer.signTypedData(domain, types, value);
        const sig = ethers.Signature.from(signature);

        return {
            validAfter,
            validBefore,
            nonce,
            v: sig.v,
            r: sig.r,
            s: sig.s
        };
    }

    /**
     * Sign x402 payment authorization (EIP-712)
     * @param {Object} paymentData - Payment data from 402 response
     * @param {string} userAddress - User's wallet address
     * @returns {Promise<string>} EIP-712 signature
     */
    async signPaymentAuthorization(paymentData, userAddress) {
        const { domain, types, amount, nonce, deadline, memo } = paymentData;

        // EIP-712 requires proper types - uint256 must be BigInt, not string
        const value = {
            from: userAddress,
            amount: BigInt(amount),  // Convert string to BigInt for uint256
            nonce,  // Already bytes32 hex string
            deadline: BigInt(deadline),  // Convert to BigInt for uint256
            memo: memo || ''
        };

        console.log('📝 Signing EIP-712 payment:', {
            from: value.from,
            amount: value.amount.toString(),
            nonce: value.nonce,
            deadline: value.deadline.toString(),
            memo: value.memo
        });

        // Sign using EIP-712
        const signature = await this.signer.signTypedData(domain, types, value);
        return signature;
    }

    /**
     * Make an x402-protected API request
     * Automatically handles 402 responses and payment
     * 
     * @param {string} url - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<Object>} API response data
     */
    async fetch(url, options = {}) {
        if (!this.signer) {
            throw new Error('Wallet not connected. Call setWallet() first.');
        }

        const userAddress = await this.signer.getAddress();

        // Make initial request
        const response = await window.fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        // If not 402, return response
        if (response.status !== 402) {
            const data = await response.json();
            return { success: response.ok, status: response.status, data };
        }

        // Handle 402 Payment Required
        console.log('💳 402 Payment Required - Processing payment...');
        const paymentRequired = await response.json();
        const { payment } = paymentRequired;

        if (!payment) {
            throw new Error('Invalid 402 response: missing payment details');
        }

        try {
            // Step 1: Sign payment authorization (EIP-712)
            console.log('📝 Signing payment authorization...');
            const paymentSignature = await this.signPaymentAuthorization(payment, userAddress);

            // Step 2: Sign USDC authorization (EIP-3009)
            console.log('📝 Signing USDC authorization...');
            const now = Math.floor(Date.now() / 1000);
            const usdcAuth = await this.signUSDCAuthorization({
                from: userAddress,
                to: payment.receiver,
                amount: payment.amount,
                validAfter: now - 60,  // Valid from 1 minute ago
                validBefore: now + 3600,  // Valid for 1 hour
                nonce: payment.nonce,  // Use same nonce as payment
                usdcAddress: payment.token,
                chainId: payment.chainId
            });

            // Step 3: Retry request with Payment signatures
            console.log('🔄 Retrying request with payment proof...');
            
            // Parse original body
            const originalBody = options.body ? JSON.parse(options.body) : {};

            const retryResponse = await window.fetch(url, {
                ...options,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                body: JSON.stringify({
                    ...originalBody,
                    
                    // Ensure address is included
                    address: userAddress,
                    
                    // Add x402 payment data
                    paymentSignature,
                    usdcAuth: {
                        validAfter: usdcAuth.validAfter,
                        validBefore: usdcAuth.validBefore,
                        nonce: usdcAuth.nonce,
                        v: usdcAuth.v,
                        r: usdcAuth.r,
                        s: usdcAuth.s
                    },
                    paymentData: {
                        amount: payment.amount.toString(), // Ensure it's a string, not BigInt
                        nonce: payment.nonce,
                        deadline: payment.deadline.toString(), // Ensure it's a string, not BigInt
                        memo: payment.memo || ''
                    }
                })
            });

            const retryData = await retryResponse.json();

            if (!retryResponse.ok) {
                console.error('❌ Payment retry failed:', {
                    status: retryResponse.status,
                    error: retryData.error,
                    message: retryData.message,
                    details: retryData.details,
                    fullResponse: retryData
                });
                const errorMsg = retryData.message || retryData.error || 'Payment processing failed';
                const errorDetails = retryData.details ? ` (${retryData.details})` : '';
                throw new Error(`${errorMsg}${errorDetails}`);
            }

            console.log('✅ Payment successful!');
            return { success: true, status: retryResponse.status, data: retryData };

        } catch (error) {
            console.error('❌ Payment failed:', error);
            throw error;
        }
    }
}

// Export a singleton instance
export const x402Client = new X402Client();

/**
 * Helper hook-like function for React components
 * Usage: const client = useX402Client(wallet);
 */
export function useX402Client(wallet) {
    if (wallet && wallet.signer) {
        x402Client.setWallet(wallet);
    }
    return x402Client;
}
