/**
 * AI Routes
 * Handles AI generation requests with PRODUCTION x402 authorization
 * 
 * FLOW:
 * 1. Check if payment signature is provided in request
 * 2. If yes → process EIP-3009 payment → verify → grant access
 * 3. If no → check on-chain access (premium/credits)
 * 4. If no access → 402 Payment Required with EIP-712 payment details
 * 5. If access → call AI → return response
 */
import express from 'express';
import fs from 'fs';
import { optionalWalletAuth } from '../middleware/auth.js';
import { checkAccess, getAccessStatus, consumeCredits, grantCredits, grantPremium } from '../services/blockchain.js';
import { 
    create402Response, 
    createPurchase402Response,
    processPayment, 
    verifyPaymentSignature 
} from '../services/x402PaymentModule.js';
import { generateResponse } from '../services/gemini.js';
import { config } from '../config.js';

const router = express.Router();

/**
 * POST /api/ai/generate
 * PRODUCTION x402 AI generation endpoint with EIP-712/EIP-3009
 * 
 * Request body:
 * {
 *   address: "0x...",
 *   signature: "0x...",  // Wallet auth signature
 *   message: "...",
 *   prompt: "Your AI prompt",
 *   capability: "text" | "image" | "video",
 *   provider: "gemini" | "chatgpt" | "claude" | "perplexity",
 * 
 *   // x402 Payment (optional - provided after user signs)
 *   paymentSignature: "0x...",  // EIP-712 payment authorization
 *   usdcAuth: {  // EIP-3009 USDC authorization
 *     validAfter: number,
 *     validBefore: number,
 *     nonce: "0x...",
 *     v: number,
 *     r: "0x...",
 *     s: "0x..."
 *   },
 *   paymentData: {  // Payment details from 402 response
 *     amount: "100000",  // USDC amount (6 decimals)
 *     nonce: "0x...",
 *     deadline: number,
 *     memo: "..."
 *   }
 * }
 */
router.post('/generate', optionalWalletAuth, async (req, res) => {
    const { 
        prompt, 
        capability = 'text', 
        provider = 'gemini',
        // x402 payment data (provided if user already signed)
        paymentSignature,
        usdcAuth,
        paymentData
    } = req.body;
    
    // For x402 payments, get address from body (payment signature verifies ownership)
    // For regular auth, use verified address from middleware
    const address = req.body.address || req.verifiedAddress;
    
    // DEBUG: Log address to file for verification
    fs.appendFileSync('requester_debug.log', `[${new Date().toISOString()}] REQUESTER: ${address}\n`);
    
    console.log('📨 Request received:', { 
        address: address?.substring(0, 10) + '...', 
        hasPaymentSignature: !!paymentSignature,
        capability 
    });

    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        return res.status(400).json({
            error: 'Invalid prompt',
            message: 'Please provide a valid prompt'
        });
    }

    // Validate capability
    const validCapabilities = ['text', 'image', 'video'];
    if (!validCapabilities.includes(capability)) {
        return res.status(400).json({
            error: 'Invalid capability',
            message: 'Capability must be one of: text, image, video'
        });
    }

    // ═══════════════════════════════════════════════════════════════
    //          STEP 1: CHECK IF PAYMENT IS PROVIDED
    // ═══════════════════════════════════════════════════════════════
    
    let paidViaX402 = false;  // Track if user paid via x402
    let actualAccessType = 'per-request';  // Track actual access method
    
    if (paymentSignature && usdcAuth && paymentData) {
        // User has provided payment signatures - process payment
        console.log('💳 Processing x402 payment...');
        console.log('📋 Received payment data (DETAILED):');
        console.log('   address:', address);
        console.log('   paymentSignature:', paymentSignature);
        console.log('   paymentData:', JSON.stringify(paymentData, null, 2));
        console.log('   usdcAuth:', JSON.stringify(usdcAuth, null, 2));
        console.log('');
        
        try {
            // Convert string amounts to BigInt for smart contract
            const amountBigInt = BigInt(paymentData.amount);
            const deadlineBigInt = BigInt(paymentData.deadline);
            
            const paymentResult = await processPayment({
                from: address,
                amount: amountBigInt,
                nonce: paymentData.nonce,
                deadline: deadlineBigInt,
                memo: paymentData.memo,
                signature: paymentSignature,
                usdcAuth
            });
            
            console.log('💳 Payment result:', paymentResult);
            
            if (!paymentResult.success) {
                console.error('❌ Payment failed:', paymentResult);
                return res.status(402).json({
                    error: 'Payment failed',
                    message: paymentResult.error || 'Payment processing failed',
                    details: paymentResult.details
                });
            }
            
            console.log('✅ Payment verified via x402 - granting access');
            paidViaX402 = true;  // Mark that user paid via x402
            actualAccessType = 'per-request';  // x402 payment = per-request mode
            // Payment successful - skip all other checks and go to AI generation
            
        } catch (error) {
            console.error('❌ Payment processing error:', error);
            return res.status(402).json({
                error: 'Payment processing failed',
                message: error.message
            });
        }
    } else {
        // ═══════════════════════════════════════════════════════════════
        //   STEP 2: CHECK ON-CHAIN ACCESS (Premium/Credits - NO x402)
        // ═══════════════════════════════════════════════════════════════
        
        console.log('🔍 Checking on-chain access (premium/credits)...');
        
        const access = await checkAccess(address, null, capability);
        
        console.log('🔍 Access check result:', {
            allowed: access.allowed,
            accessType: access.accessType,
            creditsUsed: access.creditsUsed
        });
        
        if (!access.allowed) {
            // No access - return 402 with x402 payment option
            console.log('❌ No access - returning 402 for x402 payment');
            const requestId = `${address}-${Date.now()}`;
            const payment402 = create402Response(requestId, capability);
            
            return res.status(402).json(payment402);
        }
        
        // Has access via premium or credits
        console.log(`✅ Access granted via ${access.accessType}`);
        actualAccessType = access.accessType;  // Use actual access type (premium/credits)
        
        // Consume credits if using credit-based access
        if (access.accessType === 'credits' && access.creditsUsed > 0) {
            console.log(`💳 Consuming ${access.creditsUsed} credits...`);
            await consumeCredits(address, access.creditsUsed);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //                    ACCESS GRANTED - GENERATE AI
    // ═══════════════════════════════════════════════════════════════

    try {
        const aiResponse = await generateResponse(prompt, capability, provider);

        return res.status(200).json({
            success: true,
            accessType: actualAccessType,
            accessMessage: actualAccessType === 'per-request' 
                ? 'Access granted via x402 payment' 
                : `Access granted via ${actualAccessType}`,

            // AI Response
            response: aiResponse
        });

    } catch (error) {
        console.error('AI generation error:', error);

        return res.status(500).json({
            error: 'AI generation failed',
            message: error.message
        });
    }
});

/**
 * POST /api/ai/purchase
 * Purchase credits or premium via x402 (USDC)
 * 
 * Request body:
 * {
 *   address: "0x...",
 *   type: "creditPack" | "premium7Days" | "premium30Days",
 *   
 *   // x402 Payment (optional - provided after user signs)
 *   paymentSignature: "0x...",
 *   usdcAuth: { ... },
 *   paymentData: { ... }
 * }
 */
router.post('/purchase', optionalWalletAuth, async (req, res) => {
    const { 
        type,
        packs = 1, // Default to 1 pack
        paymentSignature,
        usdcAuth,
        paymentData
    } = req.body;
    
    const address = req.body.address || req.verifiedAddress;
    
    if (!type) {
        return res.status(400).json({ error: 'Purchase type required' });
    }

    // 1. If payment is provided, process it
    if (paymentSignature && usdcAuth && paymentData) {
        try {
            console.log(`💳 Processing purchase payment for ${type} (${packs} packs)...`);
            const amountBigInt = BigInt(paymentData.amount);
            const deadlineBigInt = BigInt(paymentData.deadline);
            
            const paymentResult = await processPayment({
                from: address,
                amount: amountBigInt,
                nonce: paymentData.nonce,
                deadline: deadlineBigInt,
                memo: paymentData.memo,
                signature: paymentSignature,
                usdcAuth
            });
            
            if (!paymentResult.success) {
                return res.status(402).json({
                    error: 'Payment failed',
                    message: paymentResult.error
                });
            }
            
            // 2. Grant access on-chain after successful payment
            console.log(`✅ Payment success - granting ${type} to ${address}`);
            let grantResult = false;
            
            if (type === 'creditPack') {
                const totalCredits = parseInt(packs) * 10;
                grantResult = await grantCredits(address, totalCredits);
            } else if (type === 'premium7Days') {
                grantResult = await grantPremium(address, 7);
            } else if (type === 'premium30Days') {
                grantResult = await grantPremium(address, 30);
            }
            
            if (!grantResult) {
                console.error(`❌ Grant failed for ${type} to ${address}`);
                return res.status(500).json({
                    error: 'Access grant failed',
                    message: 'Payment was successful but on-chain grant failed. Please contact support.',
                    txHash: paymentResult.txHash
                });
            }
            
            console.log(`✨ Successfully granted ${type} to ${address}`);
            
            return res.status(200).json({
                success: true,
                message: `Successfully purchased ${type}`,
                txHash: paymentResult.txHash
            });
            
        } catch (error) {
            console.error('Purchase error:', error);
            return res.status(500).json({ error: 'Internal server error', message: error.message });
        }
    } else {
        // 3. If no payment, return 402 with purchase options
        const requestId = `purchase-${type}-${address}-${Date.now()}`;
        try {
            const payment402 = createPurchase402Response(requestId, type, parseInt(packs));
            return res.status(402).json(payment402);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
});

/**
 * GET /api/ai/pricing
 * Get current pricing information
 */
router.get('/pricing', (req, res) => {
    res.json({
        pricing: config.pricing,
        currency: 'MON',
        network: 'Monad Testnet',
        chainId: config.chainId,
        contract: config.contractAddress
    });
});

/**
 * GET /api/ai/access/:address
 * Check access status for an address
 */
router.get('/access/:address', async (req, res) => {
    const { address } = req.params;

    if (!address || !address.startsWith('0x')) {
        return res.status(400).json({
            error: 'Invalid address',
            message: 'Please provide a valid Ethereum address'
        });
    }

    const status = await getAccessStatus(address);

    res.json({
        address,
        ...status,
        pricing: config.pricing
    });
});

/**
 * GET /api/ai/providers
 * List available AI providers and capabilities
 */
router.get('/providers', (req, res) => {
    res.json({
        providers: [
            {
                id: 'gemini',
                name: 'Gemini',
                description: 'Google\'s Gemini 1.5 Flash',
                capabilities: ['text', 'image'],
                isReal: false
            },
            {
                id: 'chatgpt',
                name: 'ChatGPT',
                description: 'OpenAI GPT-4',
                capabilities: ['text', 'image'],
                isReal: false  // Mock for demo
            },
            {
                id: 'claude',
                name: 'Claude',
                description: 'Anthropic Claude 3',
                capabilities: ['text'],
                isReal: false  // Mock for demo
            },
            {
                id: 'perplexity',
                name: 'Perplexity',
                description: 'Perplexity AI Search',
                capabilities: ['text'],
                isReal: false  // Mock for demo
            }
        ],
        capabilities: [
            { id: 'text', name: 'Text Generation', requiresPremium: false },
            { id: 'image', name: 'Image Generation', requiresPremium: false },
            { id: 'video', name: 'Video Generation', requiresPremium: true }
        ]
    });
});

export default router;
