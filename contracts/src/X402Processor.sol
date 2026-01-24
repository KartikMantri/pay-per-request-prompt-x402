// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * x402 Payment Processor
 * Handles EIP-712 payment authorizations and EIP-3009 USDC token transfers
 */

interface IERC20EIP3009 {
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
    
    function authorizationState(address authorizer, bytes32 nonce) external view returns (bool);
}

contract X402Processor {
    // EIP-712 Domain
    bytes32 public DOMAIN_SEPARATOR;
    
    // Payment authorization typehash
    bytes32 public constant PAYMENT_TYPEHASH = keccak256(
        "Payment(address from,uint256 amount,bytes32 nonce,uint256 deadline,string memo)"
    );
    
    // Track used payment nonces
    mapping(address => mapping(bytes32 => bool)) public usedNonces;
    
    // Payment receiver
    address public immutable receiver;
    
    // USDC contract
    IERC20EIP3009 public immutable usdc;
    
    event PaymentProcessed(
        address indexed from,
        uint256 amount,
        bytes32 indexed paymentHash
    );
    
    constructor(address _receiver, address _usdc) {
        receiver = _receiver;
        usdc = IERC20EIP3009(_usdc);
        
        // Initialize EIP-712 domain
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("x402 Payment"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
    }
    
    /**
     * Verify payment signature
     */
    function verifyPaymentSignature(
        address from,
        uint256 amount,
        bytes32 nonce,
        uint256 deadline,
        string calldata memo,
        bytes calldata signature
    ) public view returns (bool) {
        // Check if already used
        if (usedNonces[from][nonce]) {
            return false;
        }
        
        // Check deadline
        if (block.timestamp > deadline) {
            return false;
        }
        
        // Construct EIP-712 hash
        bytes32 structHash = keccak256(
            abi.encode(PAYMENT_TYPEHASH, from, amount, nonce, deadline, keccak256(bytes(memo)))
        );
        
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );
        
        // Recover signer
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);
        address signer = ecrecover(digest, v, r, s);
        
        return signer == from;
    }
    
    struct USDCAuth {
        uint256 validAfter;
        uint256 validBefore;
        bytes32 nonce;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }
    
    /**
     * Process x402 payment with EIP-3009 USDC authorization
     */
    function processPayment(
        address from,
        uint256 amount,
        bytes32 nonce,
        uint256 deadline,
        string calldata memo,
        bytes calldata signature,
        USDCAuth calldata usdcAuth
    ) external {
        // Verify payment signature
        require(
            verifyPaymentSignature(from, amount, nonce, deadline, memo, signature),
            "Invalid payment signature"
        );
        
        // Mark nonce as used
        usedNonces[from][nonce] = true;
        
        // Process USDC transfer using EIP-3009
        usdc.transferWithAuthorization(
            from,
            receiver,
            amount,
            usdcAuth.validAfter,
            usdcAuth.validBefore,
            usdcAuth.nonce,
            usdcAuth.v,
            usdcAuth.r,
            usdcAuth.s
        );
        
        emit PaymentProcessed(from, amount, keccak256(abi.encode(from, amount, nonce)));
    }
    
    /**
     * Split signature into r, s, v
     */
    function splitSignature(bytes memory sig)
        internal
        pure
        returns (bytes32 r, bytes32 s, uint8 v)
    {
        require(sig.length == 65, "Invalid signature length");
        
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
}
