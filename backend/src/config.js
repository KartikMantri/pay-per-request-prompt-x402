/**
 * x402 AI Gateway - Configuration
 * Loads environment variables and exports config object
 */
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Server
  port: process.env.PORT || 3001,
  
  // Blockchain
  monadRpcUrl: process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz/',
  chainId: parseInt(process.env.CHAIN_ID || '10143'),
  contractAddress: process.env.CONTRACT_ADDRESS,
  
  // AI (Using mock responses for all)

  
  // Pricing (must match contract)
  pricing: {
    perRequest: '0.001',      // ETH
    premium7Days: '0.01',     // ETH
    premium30Days: '0.03',    // ETH
    creditPack: '0.008',      // ETH (10 credits)
    creditsPerPack: 10
  },
  
  // x402 Payment Configuration (PRODUCTION-LEVEL)
  x402: {
    // USDC contract address (EIP-3009 compliant)
    usdcAddress: process.env.USDC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
    
    // Payment receiver (your wallet that receives payments)
    receiverAddress: process.env.X402_RECEIVER_ADDRESS || '0x0000000000000000000000000000000000000000',
    
    // x402 Processor contract address
    processorAddress: process.env.X402_PROCESSOR_ADDRESS || '0x0000000000000000000000000000000000000000',
    
    // Relayer wallet private key (pays gas fees for submitting payments)
    relayerPrivateKey: process.env.RELAYER_PRIVATE_KEY,
    
    // Chain ID for EIP-712
    chainId: parseInt(process.env.CHAIN_ID || '10143'),
    
    // Payment amounts per capability (in USDC)
    amounts: {
      text: process.env.X402_TEXT_AMOUNT || '0.01',   // 0.01 USDC per text request
      image: process.env.X402_IMAGE_AMOUNT || '0.05',  // 0.05 USDC per image
      video: process.env.X402_VIDEO_AMOUNT || '0.10',  // 0.10 USDC per video
      
      // Access bundles (USDC)
      creditPack: '0.08',      // 0.08 USDC for 10 credits
      premium7Days: '0.50',    // 0.50 USDC for 7 days
      premium30Days: '1.50'     // 1.50 USDC for 30 days
    }
  }
};

// Validate required config
export function validateConfig() {
  const required = ['contractAddress'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing config: ${missing.join(', ')}`);
    console.warn('   Some features may not work correctly.');
  }
  
  console.log('📝 Running in MOCK AI mode (no API keys required)');

  
  return missing.length === 0;
}
