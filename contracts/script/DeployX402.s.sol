// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../src/X402Processor.sol";
import "forge-std/Script.sol";

/**
 * Deployment script for X402Processor contract
 * 
 * Usage:
 * forge script script/DeployX402.s.sol:DeployX402 --rpc-url $MONAD_RPC_URL --private-key $PRIVATE_KEY --broadcast
 */
contract DeployX402 is Script {
    function run() external {
        // Your configuration
        address receiver = 0x0C9E972EDCAE045f043aa8d5eDAA42a0311f5bB9;  // Payment receiver
        address usdc = 0x534b2f3A21130d7a60830c2Df862319e593943A3;      // Monad testnet USDC
        
        vm.startBroadcast();
        
        // Deploy X402Processor
        X402Processor processor = new X402Processor(receiver, usdc);
        
        vm.stopBroadcast();
        
        console.log("==============================================");
        console.log("X402 Processor Deployed!");
        console.log("==============================================");
        console.log("Contract Address:", address(processor));
        console.log("Receiver:", receiver);
        console.log("USDC:", usdc);
        console.log("==============================================");
        console.log("");
        console.log("Add to your backend/.env:");
        console.log("X402_PROCESSOR_ADDRESS=%s", address(processor));
        console.log("==============================================");
    }
}
