/**
 * Production-Level x402 Payment Module
 * Implements EIP-712 typed signing and EIP-3009 gasless token transfers
 * 
 * FLOW:
 * 1. User makes request → 402 response with payment details
 * 2. User signs EIP-712 typed message + EIP-3009 USDC authorization
 * 3. Relayer (backend) submits authorization to blockchain (pays gas)
 * 4. USDC transfers from user → receiver wallet
 * 5. Request retries with proof → AI response delivered
 */

import { ethers } from 'ethers';
import { config } from '../config.js';

// EIP-3009 USDC ABI (Circle USDC standard)
const USDC_ABI = [
    // EIP-3009: Transfer with authorization
    'function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external',
    'function authorizationState(address authorizer, bytes32 nonce) external view returns (bool)',
    'function DOMAIN_SEPARATOR() external view returns (bytes32)',
    'function name() external view returns (string)',
    'function version() external view returns (string)',
    'function balanceOf(address account) external view returns (uint256)',
    
    // Events
    'event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce)'
];

// x402 Payment Processor ABI
const X402_PROCESSOR_ABI = [
    'function processPayment(address from, uint256 amount, bytes32 nonce, uint256 deadline, string calldata memo, bytes calldata signature, tuple(uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) usdcAuth) external',
    'function verifyPaymentSignature(address from, uint256 amount, bytes32 nonce, uint256 deadline, string calldata memo, bytes calldata signature) external view returns (bool)',
    'event PaymentProcessed(address indexed from, uint256 amount, bytes32 indexed paymentHash)'
];

let provider = null;
let usdcContract = null;
let relayerWallet = null;
let x402ProcessorContract = null;

/**
 * Initialize x402 payment system
 */
export function initX402Payment() {
    try {
        provider = new ethers.JsonRpcProvider(config.monadRpcUrl);
        
        // Initialize USDC contract (EIP-3009 compliant)
        if (config.x402.usdcAddress && config.x402.usdcAddress !== '0x0000000000000000000000000000000000000000') {
            usdcContract = new ethers.Contract(
                config.x402.usdcAddress,
                USDC_ABI,
                provider
            );
            console.log('✅ USDC contract initialized:', config.x402.usdcAddress);
        }
        
        // Initialize relayer wallet (pays gas fees)
        if (config.x402.relayerPrivateKey) {
            relayerWallet = new ethers.Wallet(config.x402.relayerPrivateKey, provider);
            console.log('✅ Relayer wallet ready:', relayerWallet.address);
            
            // Initialize x402 processor with relayer as signer
            if (config.x402.processorAddress) {
                x402ProcessorContract = new ethers.Contract(
                    config.x402.processorAddress,
                    X402_PROCESSOR_ABI,
                    relayerWallet
                );
                console.log('✅ x402 Processor connected:', config.x402.processorAddress);
            }
        } else {
            console.warn('⚠️  No relayer private key - payments will not be processed');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize x402:', error.message);
        return false;
    }
}

/**
 * Generate EIP-712 domain for x402 payments
 */
function getX402Domain() {
    return {
        name: 'x402 Payment',
        version: '1',
        chainId: config.x402.chainId || 10143, // Monad testnet
        verifyingContract: config.x402.processorAddress
    };
}

/**
 * Generate EIP-712 types for x402 payment
 */
function getX402PaymentTypes() {
    return {
        Payment: [
            { name: 'from', type: 'address' },
            { name: 'amount', type: 'uint256' },
            { name: 'nonce', type: 'bytes32' },
            { name: 'deadline', type: 'uint256' },
            { name: 'memo', type: 'string' }
        ]
    };
}

/**
 * Create 402 Payment Required response
 * @param {string} requestId - Unique request identifier
 * @param {string} capability - Requested capability (text, image, video)
 * @returns {Object} 402 response data
 */
export function create402Response(requestId, capability = 'text') {
    const amounts = {
        text: config.x402.amounts?.text || '0.01',
        image: config.x402.amounts?.image || '0.05',
        video: config.x402.amounts?.video || '0.10'
    };
    
    const amount = amounts[capability] || amounts.text;
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const nonce = ethers.id(requestId); // Use requestId as nonce
    
    return {
        error: 'Payment Required',
        code: 402,
        payment: {
            // Payment details for EIP-712 signing
            amount: ethers.parseUnits(amount, 6).toString(), // USDC has 6 decimals
            amountFormatted: amount,
            receiver: config.x402.receiverAddress,
            token: config.x402.usdcAddress,
            tokenSymbol: 'USDC',
            network: 'monad-testnet',
            chainId: config.x402.chainId || 10143,
            
            // x402 payment data
            nonce,
            deadline,
            memo: `AI Request: ${capability} - ${requestId}`,
            
            // EIP-712 domain and types
            domain: getX402Domain(),
            types: getX402PaymentTypes(),
            
            // x402 processor
            processorAddress: config.x402.processorAddress,
            
            // Instructions
            instruction: 'Sign the payment authorization and USDC transfer authorization, then retry your request'
        }
    };
}

/**
 * Create a specialized 402 response for credit pack or premium purchases
 * @param {string} requestId - Unique ID for the purchase request
 * @param {string} type - 'creditPack', 'premium7Days', or 'premium30Days'
 * @param {number} packs - Number of packs (for creditPack)
 * @returns {Object} 402 JSON response
 */
export function createPurchase402Response(requestId, type, packs = 1) {
    let amount = config.x402.amounts[type] || '0.01';
    
    // Multiply price by pack count for credit packs
    if (type === 'creditPack' && packs > 1) {
        amount = (parseFloat(amount) * packs).toFixed(2);
    }

    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour
    const nonce = ethers.id(requestId);

    return {
        error: 'Payment Required',
        code: 402,
        payment: {
            amount: ethers.parseUnits(amount, 6).toString(),
            amountFormatted: amount,
            receiver: config.x402.receiverAddress,
            token: config.x402.usdcAddress,
            tokenSymbol: 'USDC',
            network: 'monad-testnet',
            chainId: config.x402.chainId || 10143,
            nonce,
            deadline,
            memo: `Purchase: ${type}${type === 'creditPack' ? ` (${packs} packs)` : ''} - ${requestId}`,
            domain: getX402Domain(),
            types: getX402PaymentTypes(),
            processorAddress: config.x402.processorAddress,
            instruction: `Sign USDC authorization to purchase ${type === 'creditPack' ? `${packs * 10} credits` : type}`
        }
    };
}

/**
 * Verify EIP-712 payment signature
 * @param {Object} paymentData - Payment authorization data
 * @returns {Promise<Object>} Verification result
 */
export async function verifyPaymentSignature(paymentData) {
    try {
        const { from, amount, nonce, deadline, memo, signature } = paymentData;
        
        console.log('🔐 Verifying payment signature:', {
            from,
            amount: amount?.toString(),
            nonce,
            deadline,
            memo,
            signatureLength: signature?.length
        });
        
        if (!x402ProcessorContract) {
            throw new Error('x402 processor not initialized');
        }
        
        // On-chain verification
        console.log('🔐 Verifying signature on-chain...');
        const isValid = await x402ProcessorContract.verifyPaymentSignature(
            from,
            amount,
            nonce,
            deadline,
            memo || '',
            signature
        );
        
        console.log('🔐 On-chain verification result:', isValid);
        
        return {
            valid: isValid,
            from,
            amount: ethers.formatUnits(amount, 6)
        };
    } catch (error) {
        console.error('❌ Signature verification failed:', error.message);
        return {
            valid: false,
            error: error.message
        };
    }
}
/**
 * Process x402 payment with EIP-3009 USDC authorization
 * PRODUCTION: Actually transfers USDC tokens via smart contract
 * 
 * @param {Object} paymentData - Complete payment data with signatures
 * @returns {Promise<Object>} Processing result
 */
export async function processPayment(paymentData) {
    try {
        const {
            from,
            amount,
            nonce,
            deadline,
            memo,
            signature,
            usdcAuth
        } = paymentData;
        
        console.log('💳 ===== PAYMENT PROCESSING START =====');
        console.log('📋 Payment Data:', {
            from,
            amount,
            nonce,
            deadline,
            memo,
            hasSignature: !!signature,
            signatureLength: signature?.length,
            hasUsdcAuth: !!usdcAuth,
            usdcAuthDetails: usdcAuth ? {
                validAfter: usdcAuth.validAfter,
                validBefore: usdcAuth.validBefore,
                nonce: usdcAuth.nonce,
                v: usdcAuth.v,
                hasR: !!usdcAuth.r,
                hasS: !!usdcAuth.s
            } : null
        });
        
        // Validate inputs
        if (!from || !amount || !nonce || !deadline || !signature || !usdcAuth) {
            const missing = [];
            if (!from) missing.push('from');
            if (!amount) missing.push('amount');
            if (!nonce) missing.push('nonce');
            if (!deadline) missing.push('deadline');
            if (!signature) missing.push('signature');
            if (!usdcAuth) missing.push('usdcAuth');
            throw new Error(`Missing required payment data: ${missing.join(', ')}`);
        }
        
        // Check if relayer is initialized
        if (!relayerWallet) {
            console.error('❌ Relayer wallet not initialized');
            throw new Error('Relayer wallet not initialized');
        }
        
        if (!x402ProcessorContract) {
            console.error('❌ x402 Processor contract not initialized');
            throw new Error('x402 Processor contract not initialized');
        }
        
        console.log('✅ Relayer wallet:', relayerWallet.address);
        console.log('✅ x402 Processor:', await x402ProcessorContract.getAddress());
        
        // Check relayer has gas
        const relayerBalance = await provider.getBalance(relayerWallet.address);
        console.log('💰 Relayer balance:', ethers.formatEther(relayerBalance), 'MON');
        
        if (relayerBalance < ethers.parseEther('0.001')) {
            throw new Error('Relayer wallet has insufficient gas');
        }
        
        console.log(`💳 Processing payment from ${from.substring(0, 10)}... Amount: ${ethers.formatUnits(amount, 6)} USDC`);
        
        // Verify payment signature on-chain
        console.log('🔍 Verifying payment signature on-chain...');
        console.log('🔍 Signature details:', {
            signatureType: typeof signature,
            signatureLength: signature?.length,
            signaturePreview: signature?.substring(0, 20) + '...',
            from,
            amount: amount.toString(),
            nonce,
            deadline: deadline.toString(),
            memoLength: (memo || '').length
        });
        
        try {
            const isValidSig = await x402ProcessorContract.verifyPaymentSignature(
                from,
                amount,
                nonce,
                deadline,
                memo || '',
                signature
            );
            console.log('🔍 On-chain signature verification result:', isValidSig);
            
            if (!isValidSig) {
                throw new Error('On-chain signature verification failed');
            }
        } catch (verifyError) {
            console.error('❌ Signature verification error:', verifyError.message);
            console.error('❌ Error code:', verifyError.code);
            console.error('❌ Error reason:', verifyError.reason);
            throw new Error(`Signature verification failed: ${verifyError.message}`);
        }
        
        // Process payment through x402 processor
        console.log('📤 Sending transaction to x402 processor...');
        console.log('📋 Transaction params:', {
            from,
            amount: amount.toString(),
            nonce,
            deadline,
            memo: memo || '',
            usdcAuth: {
                validAfter: usdcAuth.validAfter,
                validBefore: usdcAuth.validBefore,
                nonce: usdcAuth.nonce,
                v: usdcAuth.v
            }
        });
        
        try {
            const tx = await x402ProcessorContract.processPayment(
                from,
                amount,
                nonce,
                deadline,
                memo || '',
                signature,
                {
                    validAfter: usdcAuth.validAfter,
                    validBefore: usdcAuth.validBefore,
                    nonce: usdcAuth.nonce,
                    v: usdcAuth.v,
                    r: usdcAuth.r,
                    s: usdcAuth.s
                }
            );
            
            console.log('📤 Transaction sent:', tx.hash);
            
            // Wait for confirmation
            console.log('⏳ Waiting for confirmation...');
            const receipt = await tx.wait();
            
            console.log('✅ Payment processed successfully!');
            console.log('📝 Transaction hash:', receipt.hash);
            console.log('📝 Block number:', receipt.blockNumber);
            console.log('💳 ===== PAYMENT PROCESSING END =====');
            
            return {
                success: true,
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                from,
                amount: ethers.formatUnits(amount, 6),
                receiver: config.x402.receiverAddress
            };
        } catch (txError) {
            console.error('❌ Transaction error:', txError.message);
            console.error('❌ Transaction error reason:', txError.reason);
            console.error('❌ Transaction error code:', txError.code);
            throw new Error(`Transaction failed: ${txError.reason || txError.message}`);
        }
        
    } catch (error) {
        console.error('❌ Payment processing failed:', error.message);
        console.error('❌ Full error:', error);
        return {
            success: false,
            error: error.message,
            details: error.reason || error.message
        };
    }
}

/**
 * Check if a payment nonce has been used
 * @param {string} nonce - Payment nonce (bytes32)
 * @param {string} authorizer - User address
 * @returns {Promise<boolean>}
 */
export async function isPaymentUsed(nonce, authorizer) {
    try {
        if (!usdcContract) return false;
        
        const isUsed = await usdcContract.authorizationState(authorizer, nonce);
        return isUsed;
    } catch (error) {
        console.error('Error checking payment state:', error.message);
        return false;
    }
}

/**
 * Get user's USDC balance
 * @param {string} address - User address
 * @returns {Promise<string>} Balance in USDC
 */
export async function getUSDCBalance(address) {
    try {
        if (!usdcContract) return '0';
        
        const balance = await usdcContract.balanceOf(address);
        return ethers.formatUnits(balance, 6);
    } catch (error) {
        console.error('Error getting USDC balance:', error.message);
        return '0';
    }
}

export {
    provider,
    usdcContract,
    relayerWallet,
    x402ProcessorContract
};
