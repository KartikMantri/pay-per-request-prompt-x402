// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {AIAccessMarketplace} from "../src/AIAccessMarketplace.sol";

contract AIAccessMarketplaceTest is Test {
    AIAccessMarketplace public marketplace;
    
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");

    // Re-declare events for testing
    event RequestPaid(
        address indexed user,
        bytes32 indexed requestId,
        uint256 amount,
        uint256 timestamp
    );

    event PremiumPurchased(
        address indexed user,
        uint256 durationDays,
        uint256 expiresAt
    );

    event CreditsPurchased(
        address indexed user,
        uint256 packs,
        uint256 totalCredits
    );

    event CreditUsed(
        address indexed user,
        uint256 remaining
    );
    
    function setUp() public {
        marketplace = new AIAccessMarketplace();
        
        // Fund test users
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    // ═══════════════════════════════════════════════════════════════
    //                    PER-REQUEST TESTS
    // ═══════════════════════════════════════════════════════════════

    function test_PayPerRequest_Success() public {
        bytes32 requestId = keccak256(abi.encodePacked(user1, uint256(1), block.timestamp));
        
        vm.prank(user1);
        marketplace.payPerRequest{value: 0.001 ether}(requestId);
        
        assertTrue(marketplace.isRequestIdUsed(requestId));
    }

    function test_PayPerRequest_EmitsEvent() public {
        bytes32 requestId = keccak256(abi.encodePacked(user1, uint256(1), block.timestamp));
        
        vm.expectEmit(true, true, false, true);
        emit RequestPaid(user1, requestId, 0.001 ether, block.timestamp);
        
        vm.prank(user1);
        marketplace.payPerRequest{value: 0.001 ether}(requestId);
    }

    function test_PayPerRequest_RevertOnReplay() public {
        bytes32 requestId = keccak256(abi.encodePacked(user1, uint256(1), block.timestamp));
        
        vm.prank(user1);
        marketplace.payPerRequest{value: 0.001 ether}(requestId);
        
        // Second attempt with same requestId should fail
        vm.expectRevert(AIAccessMarketplace.RequestIdAlreadyUsed.selector);
        
        vm.prank(user1);
        marketplace.payPerRequest{value: 0.001 ether}(requestId);
    }

    function test_PayPerRequest_RevertOnIncorrectPayment() public {
        bytes32 requestId = keccak256(abi.encodePacked(user1, uint256(1), block.timestamp));
        
        // Too little payment
        vm.expectRevert(AIAccessMarketplace.IncorrectPayment.selector);
        
        vm.prank(user1);
        marketplace.payPerRequest{value: 0.0005 ether}(requestId);
    }

    function test_PayPerRequest_RevertOnOverpayment() public {
        bytes32 requestId = keccak256(abi.encodePacked(user1, uint256(1), block.timestamp));
        
        // Too much payment (now requires exact)
        vm.expectRevert(AIAccessMarketplace.IncorrectPayment.selector);
        
        vm.prank(user1);
        marketplace.payPerRequest{value: 0.005 ether}(requestId);
    }

    function test_PayPerRequest_ExactPayment() public {
        bytes32 requestId = keccak256(abi.encodePacked(user1, uint256(1), block.timestamp));
        
        uint256 balanceBefore = user1.balance;
        
        vm.prank(user1);
        marketplace.payPerRequest{value: 0.001 ether}(requestId);
        
        // Should lose exactly 0.001 ether
        assertEq(balanceBefore - user1.balance, 0.001 ether);
    }

    // ═══════════════════════════════════════════════════════════════
    //                    PREMIUM TESTS
    // ═══════════════════════════════════════════════════════════════

    function test_BuyPro_7Days() public {
        vm.prank(user1);
        marketplace.buyPro{value: 0.01 ether}(7);
        
        assertTrue(marketplace.hasPremium(user1));
        assertEq(marketplace.getPremiumExpiry(user1), block.timestamp + 7 days);
    }

    function test_BuyPro_30Days() public {
        vm.prank(user1);
        marketplace.buyPro{value: 0.03 ether}(30);
        
        assertTrue(marketplace.hasPremium(user1));
        assertEq(marketplace.getPremiumExpiry(user1), block.timestamp + 30 days);
    }

    function test_BuyPro_ExtendsPremium() public {
        vm.prank(user1);
        marketplace.buyPro{value: 0.01 ether}(7);
        
        uint256 firstExpiry = marketplace.getPremiumExpiry(user1);
        
        // Buy again
        vm.prank(user1);
        marketplace.buyPro{value: 0.01 ether}(7);
        
        // Should extend from first expiry, not reset
        assertEq(marketplace.getPremiumExpiry(user1), firstExpiry + 7 days);
    }

    function test_BuyPro_RevertOnInvalidDuration() public {
        vm.expectRevert(AIAccessMarketplace.InvalidDuration.selector);
        
        vm.prank(user1);
        marketplace.buyPro{value: 0.05 ether}(14);
    }

    function test_BuyPro_RevertOnIncorrectPayment() public {
        // Too little
        vm.expectRevert(AIAccessMarketplace.IncorrectPayment.selector);
        vm.prank(user1);
        marketplace.buyPro{value: 0.005 ether}(7);
    }

    function test_BuyPro_RevertOnOverpayment() public {
        // Too much (now requires exact)
        vm.expectRevert(AIAccessMarketplace.IncorrectPayment.selector);
        vm.prank(user1);
        marketplace.buyPro{value: 0.02 ether}(7);
    }

    function test_HasPremium_FalseAfterExpiry() public {
        vm.prank(user1);
        marketplace.buyPro{value: 0.01 ether}(7);
        
        assertTrue(marketplace.hasPremium(user1));
        
        // Warp past expiry
        vm.warp(block.timestamp + 8 days);
        
        assertFalse(marketplace.hasPremium(user1));
    }

    // ═══════════════════════════════════════════════════════════════
    //                    CREDIT TESTS
    // ═══════════════════════════════════════════════════════════════

    function test_BuyCredits_OnePack() public {
        vm.prank(user1);
        marketplace.buyCredits{value: 0.008 ether}(1);
        
        assertEq(marketplace.getCredits(user1), 10);
    }

    function test_BuyCredits_MultiplePacks() public {
        vm.prank(user1);
        marketplace.buyCredits{value: 0.04 ether}(5);
        
        assertEq(marketplace.getCredits(user1), 50);
    }

    function test_BuyCredits_RevertOnIncorrectPayment() public {
        vm.expectRevert(AIAccessMarketplace.IncorrectPayment.selector);
        vm.prank(user1);
        marketplace.buyCredits{value: 0.005 ether}(1);
    }

    function test_BuyCredits_RevertOnOverpayment() public {
        vm.expectRevert(AIAccessMarketplace.IncorrectPayment.selector);
        vm.prank(user1);
        marketplace.buyCredits{value: 0.01 ether}(1);
    }

    function test_UseCredit_Success() public {
        vm.prank(user1);
        marketplace.buyCredits{value: 0.008 ether}(1);
        
        marketplace.useCredit(user1);
        
        assertEq(marketplace.getCredits(user1), 9);
    }

    function test_UseCredit_RevertOnZeroCredits() public {
        vm.expectRevert(AIAccessMarketplace.NoCreditsAvailable.selector);
        
        marketplace.useCredit(user1);
    }

    function test_UseCredit_EmitsEvent() public {
        vm.prank(user1);
        marketplace.buyCredits{value: 0.008 ether}(1);
        
        vm.expectEmit(true, false, false, true);
        emit CreditUsed(user1, 9);
        
        marketplace.useCredit(user1);
    }

    // ═══════════════════════════════════════════════════════════════
    //                    VIEW FUNCTION TESTS
    // ═══════════════════════════════════════════════════════════════

    function test_GetPricing() public view {
        (
            uint256 requestPrice,
            uint256 premium7Price,
            uint256 premium30Price,
            uint256 creditPackPrice,
            uint256 creditsPerPack
        ) = marketplace.getPricing();
        
        assertEq(requestPrice, 0.001 ether);
        assertEq(premium7Price, 0.01 ether);
        assertEq(premium30Price, 0.03 ether);
        assertEq(creditPackPrice, 0.008 ether);
        assertEq(creditsPerPack, 10);
    }

    function test_GetAccessStatus() public {
        vm.startPrank(user1);
        marketplace.buyPro{value: 0.01 ether}(7);
        marketplace.buyCredits{value: 0.016 ether}(2);
        vm.stopPrank();
        
        (bool isPremium, uint256 expiresAt, uint256 creditBalance) = marketplace.getAccessStatus(user1);
        
        assertTrue(isPremium);
        assertEq(expiresAt, block.timestamp + 7 days);
        assertEq(creditBalance, 20);
    }
}
