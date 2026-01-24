// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {AIAccessMarketplace} from "../src/AIAccessMarketplace.sol";

/**
 * @title Deploy Script for AIAccessMarketplace
 * @notice Deploys to Monad testnet
 * @dev Run with: forge script script/Deploy.s.sol --rpc-url $MONAD_RPC --broadcast
 */
contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        AIAccessMarketplace marketplace = new AIAccessMarketplace();
        
        console.log("AIAccessMarketplace deployed to:", address(marketplace));
        console.log("Network: Monad Testnet");
        console.log("Chain ID: 10143");
        
        // Log pricing for verification
        (
            uint256 requestPrice,
            uint256 premium7Price,
            uint256 premium30Price,
            uint256 creditPackPrice,
            uint256 creditsPerPack
        ) = marketplace.getPricing();
        
        console.log("\n=== Pricing ===");
        console.log("Per Request:", requestPrice, "wei");
        console.log("Premium 7 Days:", premium7Price, "wei");
        console.log("Premium 30 Days:", premium30Price, "wei");
        console.log("Credit Pack (credits per pack):", creditsPerPack);
        console.log("Credit Pack Price:", creditPackPrice, "wei");
        
        vm.stopBroadcast();
    }
}
