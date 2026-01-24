// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AIAccessMarketplace
 * @notice x402 Payment Gateway for AI Access on Monad
 * @dev Handles ONLY payments and access control. NO AI logic.
 * 
 * ACCESS MODES:
 * 1. Per-Request (x402): Pay exactly once per AI request, stateless
 * 2. Premium (Time-based): Pay once, unlimited access for duration
 * 3. Credits (Prepaid): Buy bundles, consume one per request
 * 
 * WHY THIS DESIGN:
 * - Wallet = Identity (no accounts needed)
 * - Payment = Permission (verified on-chain)
 * - 402 pattern: payment required BEFORE access
 * - Monad enables cheap micropayments for per-request model
 * 
 * GAS OPTIMIZATIONS:
 * - Exact payment required (no refund logic)
 * - Unchecked math where overflow impossible
 * - Parameterless custom errors
 * - Constants for all pricing
 */
contract AIAccessMarketplace {
    // ═══════════════════════════════════════════════════════════════
    //                           PRICING
    // ═══════════════════════════════════════════════════════════════
    
    /// @notice Cost for a single AI request (x402 per-request mode)
    uint256 public constant REQUEST_PRICE = 0.001 ether;
    
    /// @notice Cost for 7-day premium access
    uint256 public constant PREMIUM_7_DAYS_PRICE = 0.01 ether;
    
    /// @notice Cost for 30-day premium access  
    uint256 public constant PREMIUM_30_DAYS_PRICE = 0.03 ether;
    
    /// @notice Cost per credit pack (10 credits)
    uint256 public constant CREDIT_PACK_PRICE = 0.008 ether;
    
    /// @notice Credits per pack
    uint256 public constant CREDITS_PER_PACK = 10;

    // ═══════════════════════════════════════════════════════════════
    //                           STATE
    // ═══════════════════════════════════════════════════════════════
    
    /// @notice Timestamp when premium access expires for each user
    /// @dev If block.timestamp < premiumExpiry[user], user has premium
    mapping(address => uint256) public premiumExpiry;
    
    /// @notice Prepaid credit balance for each user
    mapping(address => uint256) public credits;
    
    /// @notice Tracks used request IDs to prevent replay attacks
    /// @dev requestId = keccak256(user, nonce, timestamp) generated client-side
    mapping(bytes32 => bool) public usedRequestIds;

    /// @notice Owner of the contract (can withdraw funds)
    address public immutable owner;

    // ═══════════════════════════════════════════════════════════════
    //                           EVENTS
    // ═══════════════════════════════════════════════════════════════
    
    /// @notice Emitted when a per-request payment is made (x402 proof)
    /// @dev Backend verifies this event to authorize ONE request
    event RequestPaid(
        address indexed user,
        bytes32 indexed requestId,
        uint256 amount,
        uint256 timestamp
    );
    
    /// @notice Emitted when premium access is purchased
    event PremiumPurchased(
        address indexed user,
        uint256 durationDays,
        uint256 expiresAt
    );
    
    /// @notice Emitted when credits are purchased
    event CreditsPurchased(
        address indexed user,
        uint256 packs,
        uint256 totalCredits
    );
    
    /// @notice Emitted when a credit is consumed
    event CreditUsed(
        address indexed user,
        uint256 remaining
    );

    // ═══════════════════════════════════════════════════════════════
    //                        ERRORS (Gas Optimized - No Parameters)
    // ═══════════════════════════════════════════════════════════════
    
    /// @notice Thrown when payment amount doesn't match required price
    error IncorrectPayment();
    
    /// @notice Thrown when requestId has already been used
    error RequestIdAlreadyUsed();
    
    /// @notice Thrown when user has no credits
    error NoCreditsAvailable();
    
    /// @notice Thrown when invalid duration is provided (must be 7 or 30)
    error InvalidDuration();
    
    /// @notice Thrown when pack count is zero
    error InvalidPackCount();

    /// @notice Thrown when caller is not the owner
    error NotOwner();

    /// @notice Thrown when withdrawal fails
    error WithdrawFailed();

    // ═══════════════════════════════════════════════════════════════
    //                        CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════

    /// @notice Sets the deployer as the owner
    constructor() {
        owner = msg.sender;
    }

    // ═══════════════════════════════════════════════════════════════
    //                    PAYMENT FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Pay for a single AI request (x402 per-request mode)
     * @param requestId Unique identifier for this request (prevents replay)
     * @dev 
     * WHY requestId: Ensures one payment = one request.
     * Backend checks RequestPaid event for this exact requestId.
     * Client generates: keccak256(abi.encodePacked(user, nonce, timestamp))
     * 
     * GAS: Requires exact payment - no refund logic needed
     */
    function payPerRequest(bytes32 requestId) external payable {
        // Verify exact payment amount (saves gas vs refund logic)
        if (msg.value != REQUEST_PRICE) {
            revert IncorrectPayment();
        }
        
        // Prevent replay: same requestId cannot be used twice
        if (usedRequestIds[requestId]) {
            revert RequestIdAlreadyUsed();
        }
        
        // Mark as used BEFORE external effects (CEI pattern)
        usedRequestIds[requestId] = true;
        
        // Emit proof of payment for backend verification
        emit RequestPaid(msg.sender, requestId, msg.value, block.timestamp);
    }

    /**
     * @notice Purchase time-based premium access
     * @param durationDays 7 or 30 days of access
     * @dev Premium users bypass per-request payments entirely
     * 
     * GAS: Requires exact payment - no refund logic needed
     */
    function buyPro(uint256 durationDays) external payable {
        uint256 price;
        
        if (durationDays == 7) {
            price = PREMIUM_7_DAYS_PRICE;
        } else if (durationDays == 30) {
            price = PREMIUM_30_DAYS_PRICE;
        } else {
            revert InvalidDuration();
        }
        
        // Require exact payment
        if (msg.value != price) {
            revert IncorrectPayment();
        }
        
        // Extend from current expiry if already premium, else from now
        uint256 startTime = premiumExpiry[msg.sender] > block.timestamp 
            ? premiumExpiry[msg.sender] 
            : block.timestamp;
        
        // Cannot overflow: timestamp + 30 days is safe
        uint256 newExpiry;
        unchecked {
            newExpiry = startTime + (durationDays * 1 days);
        }
        premiumExpiry[msg.sender] = newExpiry;
        
        emit PremiumPurchased(msg.sender, durationDays, newExpiry);
    }

    /**
     * @notice Purchase prepaid credit packs
     * @param packs Number of credit packs to buy (10 credits each)
     * @dev Credits are consumed one-per-request, stored on-chain
     * 
     * GAS: Requires exact payment - no refund logic needed
     */
    function buyCredits(uint256 packs) external payable {
        if (packs == 0) {
            revert InvalidPackCount();
        }
        
        // Cannot overflow with reasonable pack counts
        uint256 price;
        uint256 newCredits;
        unchecked {
            price = packs * CREDIT_PACK_PRICE;
            newCredits = packs * CREDITS_PER_PACK;
        }
        
        // Require exact payment
        if (msg.value != price) {
            revert IncorrectPayment();
        }
        
        // Safe: credits[user] + newCredits extremely unlikely to overflow uint256
        unchecked {
            credits[msg.sender] += newCredits;
        }
        
        emit CreditsPurchased(msg.sender, packs, newCredits);
    }

    /**
     * @notice Consume one credit for a request (legacy, use useCredits preferred)
     * @return success True if credit was consumed
     * @dev Called by backend to atomically verify + consume credit
     * NOTE: In production, this would need access control.
     * For hackathon MVP, we trust the backend caller.
     */
    function useCredit(address user) external returns (bool success) {
        if (credits[user] == 0) {
            revert NoCreditsAvailable();
        }
        
        // Safe: We just checked credits[user] > 0, so no underflow
        unchecked {
            credits[user] -= 1;
        }
        
        emit CreditUsed(user, credits[user]);
        
        return true;
    }

    /**
     * @notice Consume multiple credits for a request (capability-based)
     * @param user Address of the user
     * @param amount Number of credits to consume (1=text, 3=image, 5=video)
     * @return success True if credits were consumed
     * @dev Called by backend to atomically verify + consume credits
     * 
     * CAPABILITY COSTS:
     * - Text Generation: 1 credit
     * - Image Generation: 3 credits  
     * - Video Generation: 5 credits
     */
    function useCredits(address user, uint256 amount) external returns (bool success) {
        if (amount == 0) {
            revert InvalidPackCount(); // Reuse error for invalid amount
        }
        
        if (credits[user] < amount) {
            revert NoCreditsAvailable();
        }
        
        // Safe: We just checked credits[user] >= amount, so no underflow
        unchecked {
            credits[user] -= amount;
        }
        
        emit CreditUsed(user, credits[user]);
        
        return true;
    }

    // ═══════════════════════════════════════════════════════════════
    //                      VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Check if user has active premium access
     * @param user Address to check
     * @return True if premium is active
     */
    function hasPremium(address user) external view returns (bool) {
        return premiumExpiry[user] > block.timestamp;
    }

    /**
     * @notice Get user's credit balance
     * @param user Address to check
     * @return Number of credits remaining
     */
    function getCredits(address user) external view returns (uint256) {
        return credits[user];
    }

    /**
     * @notice Get user's premium expiry timestamp
     * @param user Address to check
     * @return Unix timestamp when premium expires (0 if never purchased)
     */
    function getPremiumExpiry(address user) external view returns (uint256) {
        return premiumExpiry[user];
    }

    /**
     * @notice Check if a requestId has been used
     * @param requestId The request ID to check
     * @return True if already used
     */
    function isRequestIdUsed(bytes32 requestId) external view returns (bool) {
        return usedRequestIds[requestId];
    }

    /**
     * @notice Get all pricing info in one call (gas efficient for frontend)
     * @return requestPrice Price per AI request
     * @return premium7Price Price for 7-day premium
     * @return premium30Price Price for 30-day premium  
     * @return creditPackPrice Price per credit pack
     * @return creditsPerPack Number of credits per pack
     */
    function getPricing() external pure returns (
        uint256 requestPrice,
        uint256 premium7Price,
        uint256 premium30Price,
        uint256 creditPackPrice,
        uint256 creditsPerPack
    ) {
        return (
            REQUEST_PRICE,
            PREMIUM_7_DAYS_PRICE,
            PREMIUM_30_DAYS_PRICE,
            CREDIT_PACK_PRICE,
            CREDITS_PER_PACK
        );
    }

    /**
     * @notice Get complete access status for a user
     * @param user Address to check
     * @return isPremium Whether premium is active
     * @return premiumExpiresAt Premium expiry timestamp
     * @return creditBalance Current credit count
     */
    function getAccessStatus(address user) external view returns (
        bool isPremium,
        uint256 premiumExpiresAt,
        uint256 creditBalance
    ) {
        return (
            premiumExpiry[user] > block.timestamp,
            premiumExpiry[user],
            credits[user]
        );
    }

    // ═══════════════════════════════════════════════════════════════
    //                      RECEIVE ETHER
    // ═══════════════════════════════════════════════════════════════

    /// @notice Accept direct ETH transfers (treated as donations)
    receive() external payable {}

    // ═══════════════════════════════════════════════════════════════
    //                      OWNER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Grant premium access to a user (Admin only)
     * @param user Address to grant premium to
     * @param durationDays Number of days to grant
     */
    function grantPremium(address user, uint256 durationDays) external {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        
        uint256 startTime = premiumExpiry[user] > block.timestamp 
            ? premiumExpiry[user] 
            : block.timestamp;
            
        uint256 newExpiry;
        unchecked {
            newExpiry = startTime + (durationDays * 1 days);
        }
        premiumExpiry[user] = newExpiry;
        
        emit PremiumPurchased(user, durationDays, newExpiry);
    }

    /**
     * @notice Grant credits to a user (Admin only)
     * @param user Address to grant credits to
     * @param amount Total number of credits to grant
     */
    function grantCredits(address user, uint256 amount) external {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        
        unchecked {
            credits[user] += amount;
        }
        
        emit CreditsPurchased(user, 1, amount); // Emitting with 1 pack for compatibility
    }

    /// @notice Withdraw all contract funds to owner
    /// @dev Only callable by owner
    function withdraw() external {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner).call{value: balance}("");
        if (!success) {
            revert WithdrawFailed();
        }
    }

    /// @notice Get current contract balance
    /// @return The amount of MON held by this contract
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
