/**
 * Blockchain Service
 * Handles all on-chain verification for x402 access control
 * 
 * WHY THIS EXISTS:
 * - Verifies wallet ownership via signatures
 * - Checks on-chain access (premium, credits, per-request)
 * - Ensures payment before access (x402 pattern)
 */
import { ethers } from 'ethers';
import { config } from '../config.js';

// Contract ABI - only the functions we need
const CONTRACT_ABI = [
    // Read functions
    'function hasPremium(address user) view returns (bool)',
    'function getCredits(address user) view returns (uint256)',
    'function isRequestIdUsed(bytes32 requestId) view returns (bool)',
    'function getAccessStatus(address user) view returns (bool isPremium, uint256 premiumExpiresAt, uint256 creditBalance)',
    'function getPricing() view returns (uint256 requestPrice, uint256 premium7Price, uint256 premium30Price, uint256 creditPackPrice, uint256 creditsPerPack)',

    // Write functions
    'function useCredit(address user) returns (bool)',
    'function useCredits(address user, uint256 amount) returns (bool)',
    'function grantPremium(address user, uint256 durationDays)',
    'function grantCredits(address user, uint256 amount)',

    // Events
    'event RequestPaid(address indexed user, bytes32 indexed requestId, uint256 amount, uint256 timestamp)'
];

// Credit costs per capability
const CREDIT_COSTS = {
    text: 1,
    image: 3,
    video: 5
};

let provider = null;
let contract = null;
let signedContract = null;  // For write operations (consuming credits)

/**
 * Initialize blockchain connection
 */
export function initBlockchain() {
    try {
        // Create provider with longer timeout for Monad testnet
        provider = new ethers.JsonRpcProvider(config.monadRpcUrl, undefined, {
            staticNetwork: true,
            polling: true,
            pollingInterval: 4000,
            batchMaxCount: 1
        });

        if (config.contractAddress && config.contractAddress !== '0x0000000000000000000000000000000000000000') {
            contract = new ethers.Contract(config.contractAddress, CONTRACT_ABI, provider);
            console.log('✅ Connected to contract:', config.contractAddress);
            
            // Create signer for write operations if private key is available
            if (process.env.PRIVATE_KEY) {
                const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
                signedContract = new ethers.Contract(config.contractAddress, CONTRACT_ABI, signer);
                console.log('✅ Backend wallet ready for credit consumption');
            } else {
                console.warn('⚠️  No PRIVATE_KEY - credits won\'t be consumed on-chain');
            }
        } else {
            console.warn('⚠️  No contract address configured. Running in demo mode.');
        }

        return true;
    } catch (error) {
        console.error('❌ Failed to initialize blockchain:', error.message);
        return false;
    }
}

/**
 * Verify a signed message and recover the signer address
 * @param {string} message - The original message that was signed
 * @param {string} signature - The signature from the wallet
 * @returns {string|null} The recovered address or null if invalid
 */
export function verifySignature(message, signature) {
    try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        return recoveredAddress;
    } catch (error) {
        console.error('Signature verification failed:', error.message);
        return null;
    }
}

/**
 * Check if user has premium access
 * @param {string} address - User wallet address
 * @returns {Promise<boolean>}
 */
export async function checkPremium(address) {
    if (!contract) return false;

    // Retry up to 3 times for timeout issues
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            return await contract.hasPremium(address);
        } catch (error) {
            console.error(`Error checking premium (attempt ${attempt}/3):`, error.message);
            if (attempt < 3) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }
    return false;
}

/**
 * Check user's credit balance
 * @param {string} address - User wallet address
 * @returns {Promise<number>}
 */
export async function getCredits(address) {
    if (!contract) return 0;

    // Retry up to 3 times for timeout issues
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const credits = await contract.getCredits(address);
            return Number(credits);
        } catch (error) {
            console.error(`Error getting credits (attempt ${attempt}/3):`, error.message);
            if (attempt < 3) {
                await new Promise(r => setTimeout(r, 1000)); // Wait 1 second before retry
            }
        }
    }
    return 0;
}

/**
 * Consume credits from user's balance on-chain
 * @param {string} address - User wallet address
 * @param {number} amount - Number of credits to consume (1=text, 3=image, 5=video)
 * @returns {Promise<boolean>}
 */
export async function consumeCredits(address, amount) {
    if (!signedContract) {
        console.warn('⚠️ No signer available - credits not consumed on-chain');
        return false;
    }

    try {
        console.log(`💳 Consuming ${amount} credits from ${address.substring(0, 10)}...`);
        const tx = await signedContract.useCredits(address, amount);
        await tx.wait();
        console.log(`✅ Credits consumed: ${amount} from ${address.substring(0, 10)}...`);
        return true;
    } catch (error) {
        console.error('❌ Error consuming credits:', error.message);
        return false;
    }
}

/**
 * Grant premium access to a user on-chain
 * @param {string} address - User wallet address
 * @param {number} durationDays - Number of days to grant
 * @returns {Promise<boolean>}
 */
export async function grantPremium(address, durationDays) {
    if (!signedContract) {
        console.warn('⚠️ No signer available - premium not granted on-chain');
        return false;
    }

    try {
        console.log(`👑 Granting ${durationDays} days of premium to ${address.substring(0, 10)}...`);
        const tx = await signedContract.grantPremium(address, durationDays);
        await tx.wait();
        console.log(`✅ Premium granted: ${durationDays} days to ${address.substring(0, 10)}...`);
        return true;
    } catch (error) {
        console.error('❌ Error granting premium:', error.message);
        console.error('❌ Full Error:', error);
        return false;
    }
}

/**
 * Grant credits to a user on-chain
 * @param {string} address - User wallet address
 * @param {number} amount - Number of credits to grant
 * @returns {Promise<boolean>}
 */
export async function grantCredits(address, amount) {
    if (!signedContract) {
        console.warn('⚠️ No signer available - credits not granted on-chain');
        return false;
    }

    try {
        console.log(`🎫 Granting ${amount} credits to ${address.substring(0, 10)}...`);
        const tx = await signedContract.grantCredits(address, amount);
        await tx.wait();
        console.log(`✅ Credits granted: ${amount} to ${address.substring(0, 10)}...`);
        return true;
    } catch (error) {
        console.error('❌ Error granting credits:', error.message);
        console.error('❌ Full Error:', error);
        return false;
    }
}

/**
 * Check if a per-request payment was made
 * WHY: This is the core x402 verification
 * @param {string} address - User wallet address  
 * @param {string} requestId - The unique request ID (bytes32 hex)
 * @returns {Promise<boolean>}
 */
export async function verifyRequestPayment(address, requestId) {
    if (!contract) return false;

    try {
        // First check if the requestId is marked as used in contract
        const isUsed = await contract.isRequestIdUsed(requestId);

        if (!isUsed) {
            return false;
        }

        // For additional security, we could query past events to verify
        // the payment was made by the correct address
        // For hackathon MVP, isRequestIdUsed is sufficient

        return true;
    } catch (error) {
        console.error('Error verifying payment:', error.message);
        return false;
    }
}

/**
 * Get complete access status for a user
 * @param {string} address - User wallet address
 * @returns {Promise<Object>}
 */
export async function getAccessStatus(address) {
    if (!contract) {
        // Demo mode - return mock data
        return {
            isPremium: false,
            premiumExpiresAt: 0,
            credits: 0,
            demoMode: true
        };
    }

    try {
        const [isPremium, premiumExpiresAt, creditBalance] = await contract.getAccessStatus(address);

        return {
            isPremium,
            premiumExpiresAt: Number(premiumExpiresAt),
            credits: Number(creditBalance),
            demoMode: false
        };
    } catch (error) {
        console.error('Error getting access status:', error.message);
        return {
            isPremium: false,
            premiumExpiresAt: 0,
            credits: 0,
            error: error.message
        };
    }
}

/**
 * Determine access type and whether request should be allowed
 * This is the main x402 authorization check
 * 
 * FLOW:
 * 1. Premium active? → ALLOW
 * 2. Credits >= required? → ALLOW (and consume credits based on capability)
 * 3. Per-request payment made? → ALLOW
 * 4. None of the above? → 402 PAYMENT REQUIRED
 * 
 * @param {string} address - User wallet address
 * @param {string} requestId - Per-request payment ID (optional)
 * @param {string} capability - The capability being requested (text, image, video)
 * @returns {Promise<Object>}
 */
export async function checkAccess(address, requestId = null, capability = 'text') {
    // Demo mode - always allow
    if (!contract) {
        return {
            allowed: true,
            accessType: 'demo',
            message: 'Demo mode - no payment verification'
        };
    }

    try {
        // 1. Check premium first (most privileged)
        const isPremium = await checkPremium(address);
        if (isPremium) {
            return {
                allowed: true,
                accessType: 'premium',
                message: 'Premium access verified'
            };
        }

        // 2. Check credits (capability-based consumption)
        const credits = await getCredits(address);
        const requiredCredits = CREDIT_COSTS[capability] || 1;
        
        if (credits >= requiredCredits) {
            // Sufficient credits available
            return {
                allowed: true,
                accessType: 'credits',
                creditsUsed: requiredCredits,
                creditsRemaining: credits - requiredCredits,
                message: `${requiredCredits} credit(s) will be consumed for ${capability}`
            };
        }

        // 3. Check per-request payment
        if (requestId) {
            const paymentVerified = await verifyRequestPayment(address, requestId);
            if (paymentVerified) {
                return {
                    allowed: true,
                    accessType: 'per-request',
                    message: 'Per-request payment verified'
                };
            }
        }

        // 4. No valid access - return 402
        return {
            allowed: false,
            accessType: null,
            message: 'Payment required',
            pricing: config.pricing
        };

    } catch (error) {
        console.error('Access check error:', error.message);
        return {
            allowed: false,
            accessType: null,
            message: 'Access verification failed',
            error: error.message
        };
    }
}

export { provider, contract };
