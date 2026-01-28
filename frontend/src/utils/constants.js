/**
 * x402 AI Gateway V2 - Constants & Configuration
 * Extended with 4 providers, 3 access modes, and per-capability pricing
 */

// ═══════════════════════════════════════════════════════════════
//                     CHAIN CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const CHAIN_ID = 10143;
export const CHAIN_NAME = 'Monad Testnet';
export const RPC_URL = 'https://testnet-rpc.monad.xyz/';
export const BLOCK_EXPLORER = 'https://testnet.monadexplorer.com';
export const CURRENCY_SYMBOL = 'USDC';

// ═══════════════════════════════════════════════════════════════
//                     CONTRACT CONFIG
// ═══════════════════════════════════════════════════════════════

export const CONTRACT_ADDRESS = '0x5ED6Aa792Ed7Cd9d364711145D6D0CEb361dcFd4';
export const OWNER_ADDRESS = '0x0c9e972edcae045f043aa8d5edaa42a0311f5bb9';

// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'https://production-pay-per-use-ai.tyzo.nodeops.app';

// ═══════════════════════════════════════════════════════════════
//                     PRICING CONFIGURATION
// ═══════════════════════════════════════════════════════════════

// Contract pricing (what we actually pay)
export const PRICING = {
    // These are now for display only or referenced by backend
    perRequest: '0.01',       // USDC
    premium7Days: '0.50',     // USDC
    premium30Days: '1.50',    // USDC
    creditPack: '0.08',       // USDC (10 credits)
    creditsPerPack: 10
};

// Display pricing per capability (UI display - enhanced for UX)
export const CAPABILITY_PRICING = {
    text: {
        id: 'text',
        name: 'Text Generation',
        icon: '📝',
        description: 'AI text generation & chat',
        price: '0.01',
        credits: 1,
        color: '#a855f7'
    },
    image: {
        id: 'image',
        name: 'Image Generation',
        icon: '🖼️',
        description: 'AI image creation',
        price: '0.05',
        credits: 3,
        color: '#3b82f6'
    },
    video: {
        id: 'video',
        name: 'Video Generation',
        icon: '🎥',
        description: 'AI video synthesis',
        price: '0.10',
        credits: 5,
        color: '#ec4899',
        isPro: true
    }
};

// ═══════════════════════════════════════════════════════════════
//                     AI PROVIDERS
// ═══════════════════════════════════════════════════════════════

export const AI_PROVIDERS = [
    {
        id: 'openai',
        name: 'OpenAI',
        icon: '🤖',
        logo: null,
        description: 'GPT-4 Turbo',
        tagline: 'Most capable language model',
        status: 'MOCK',
        color: '#10a37f',
        gradient: 'linear-gradient(135deg, #10a37f 0%, #1a7f5a 100%)',
        capabilities: ['text', 'image', 'video']
    },
    {
        id: 'gemini',
        name: 'Gemini',
        icon: '✨',
        logo: null,
        description: 'Gemini 1.5 Flash',
        tagline: 'Google\'s multimodal AI',
        status: 'MOCK',
        color: '#4285f4',
        gradient: 'linear-gradient(135deg, #4285f4 0%, #34a853 50%, #fbbc04 100%)',
        capabilities: ['text', 'image', 'video']
    },
    {
        id: 'claude',
        name: 'Claude',
        icon: '🧠',
        logo: null,
        description: 'Claude 3 Sonnet',
        tagline: 'Anthropic\'s helpful assistant',
        status: 'MOCK',
        color: '#cc785c',
        gradient: 'linear-gradient(135deg, #cc785c 0%, #d4a574 100%)',
        capabilities: ['text', 'image']
    },
    {
        id: 'perplexity',
        name: 'Perplexity',
        icon: '🔍',
        logo: null,
        description: 'Perplexity AI',
        tagline: 'AI-powered search engine',
        status: 'MOCK',
        color: '#20b2aa',
        gradient: 'linear-gradient(135deg, #20b2aa 0%, #1a8f8f 100%)',
        capabilities: ['text', 'image']
    }
];

// ═══════════════════════════════════════════════════════════════
//                     ACCESS MODES
// ═══════════════════════════════════════════════════════════════

export const ACCESS_MODES = {
    'per-request': {
        id: 'per-request',
        name: 'Pay Per Request',
        icon: '⚡',
        description: 'One-time payment. Stateless. No commitment.',
        shortDesc: 'Pay only for what you use',
        badge: 'x402',
        badgeClass: 'badge-402',
        features: [
            'Single request authorization',
            'Verified on-chain instantly',
            'No commitment needed',
            'HTTP 402 protocol'
        ],
        pricing: {
            text: '0.01',
            image: '0.05',
            video: '0.10'
        }
    },
    'premium': {
        id: 'premium',
        name: 'Premium Access',
        icon: '👑',
        description: 'Unlimited usage for a fixed duration.',
        shortDesc: 'Unlimited requests',
        badge: 'BEST VALUE',
        badgeClass: 'badge-best',
        features: [
            'Unlimited Text requests',
            'Unlimited Image generation',
            'Unlimited Video synthesis',
            'Priority execution'
        ],
        options: [
            { days: 7, price: '0.50', label: '7 Days', id: 'premium7Days' },
            { days: 30, price: '1.50', label: '30 Days', id: 'premium30Days', recommended: true }
        ]
    },
    'credits': {
        id: 'credits',
        name: 'Credit Packs',
        icon: '🎫',
        description: 'Buy credits upfront, consume per request.',
        shortDesc: 'Prepaid flexibility',
        badge: 'PREPAID',
        badgeClass: 'badge-credits',
        features: [
            'Buy credits in bulk',
            'Use anytime, no expiry',
            'Flexible consumption',
            'Lower per-request cost'
        ],
        consumption: {
            text: 1,
            image: 3,
            video: 5
        },
        packSize: 10,
        packPrice: '0.08',
        id: 'creditPack'
    }
};

// ═══════════════════════════════════════════════════════════════
//                     CONTRACT ABI
// ═══════════════════════════════════════════════════════════════

export const CONTRACT_ABI = [
    // Payment functions
    {
        name: 'payPerRequest',
        type: 'function',
        stateMutability: 'payable',
        inputs: [{ name: 'requestId', type: 'bytes32' }],
        outputs: []
    },
    {
        name: 'buyPro',
        type: 'function',
        stateMutability: 'payable',
        inputs: [{ name: 'durationDays', type: 'uint256' }],
        outputs: []
    },
    {
        name: 'buyCredits',
        type: 'function',
        stateMutability: 'payable',
        inputs: [{ name: 'packs', type: 'uint256' }],
        outputs: []
    },

    // View functions
    {
        name: 'hasPremium',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [{ type: 'bool' }]
    },
    {
        name: 'getCredits',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [{ type: 'uint256' }]
    },
    {
        name: 'getPremiumExpiry',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [{ type: 'uint256' }]
    },
    {
        name: 'getAccessStatus',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [
            { name: 'isPremium', type: 'bool' },
            { name: 'premiumExpiresAt', type: 'uint256' },
            { name: 'creditBalance', type: 'uint256' }
        ]
    },
    {
        name: 'getPricing',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [
            { name: 'requestPrice', type: 'uint256' },
            { name: 'premium7Price', type: 'uint256' },
            { name: 'premium30Price', type: 'uint256' },
            { name: 'creditPackPrice', type: 'uint256' },
            { name: 'creditsPerPack', type: 'uint256' }
        ]
    },

    // Events
    {
        name: 'RequestPaid',
        type: 'event',
        inputs: [
            { name: 'user', type: 'address', indexed: true },
            { name: 'requestId', type: 'bytes32', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false },
            { name: 'timestamp', type: 'uint256', indexed: false }
        ]
    },
    {
        name: 'PremiumPurchased',
        type: 'event',
        inputs: [
            { name: 'user', type: 'address', indexed: true },
            { name: 'durationDays', type: 'uint256', indexed: false },
            { name: 'expiresAt', type: 'uint256', indexed: false }
        ]
    },
    {
        name: 'CreditsPurchased',
        type: 'event',
        inputs: [
            { name: 'user', type: 'address', indexed: true },
            { name: 'packs', type: 'uint256', indexed: false },
            { name: 'totalCredits', type: 'uint256', indexed: false }
        ]
    },

    // Owner functions
    {
        name: 'owner',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'address' }]
    },
    {
        name: 'getContractBalance',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'uint256' }]
    },
    {
        name: 'withdraw',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [],
        outputs: []
    }
];

// ═══════════════════════════════════════════════════════════════
//                     LEGACY COMPATIBILITY
// ═══════════════════════════════════════════════════════════════

// For backwards compatibility with existing code
export const AI_CAPABILITIES = [
    { id: 'text', name: 'Text', icon: '📝', description: 'Text generation & chat', requiresPremium: false },
    { id: 'image', name: 'Image', icon: '🎨', description: 'Image generation', requiresPremium: false },
    { id: 'video', name: 'Video', icon: '🎬', description: 'Video generation', requiresPremium: true }
];
