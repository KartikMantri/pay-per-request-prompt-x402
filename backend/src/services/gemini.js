/**
 * Mock AI Service
 * Handles AI generation requests without needing real API keys
 * 
 * WHY: We use mock responses for the demo to ensure zero friction 
 * for newcomers while maintaining the x402 payment validation logic.
 */

/**
 * Initialize AI client (Mock)
 */
export function initGemini() {
    console.log('✅ AI Service initialized (MOCK mode)');
    return true;
}

/**
 * Generate AI response
 * @param {string} prompt - User's prompt
 * @param {string} capability - 'text', 'image', or 'video'
 * @param {string} provider - AI provider ID
 * @returns {Promise<Object>}
 */
export async function generateResponse(prompt, capability = 'text', provider = 'gemini') {
    // Log for demo purposes
    console.log(`🤖 AI Request: [${provider}] [${capability}] "${prompt.substring(0, 50)}..."`);

    // Add a small artificial delay to simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 800));

    return generateMockResponse(prompt, capability, provider);
}

/**
 * Generate mock response for demo
 * WHY: We need to demonstrate the x402 flow even without real API keys
 */
function generateMockResponse(prompt, capability, provider) {
    const providerName = {
        'chatgpt': 'ChatGPT',
        'claude': 'Claude',
        'perplexity': 'Perplexity',
        'gemini': 'Gemini'
    }[provider] || provider;

    let content;

    switch (capability) {
        case 'image':
            content = {
                type: 'image',
                description: `[${providerName} Image Generation Mock]\n\nPrompt: "${prompt}"\n\n🎨 In production, this would generate an image based on your prompt using ${providerName}'s image generation capabilities.\n\nFor the hackathon demo, imagine a beautiful AI-generated image here!`,
                mockImageUrl: `https://placehold.co/512x512/6366f1/white?text=${encodeURIComponent('AI Generated')}`
            };
            break;

        case 'video':
            content = {
                type: 'video',
                description: `[${providerName} Video Generation Mock]\n\nPrompt: "${prompt}"\n\n🎬 Premium Feature: Video generation requires active premium access.\n\nIn production, this would create a video based on your prompt.`,
                mockVideoUrl: null
            };
            break;

        default: // text
            content = generateMockTextResponse(prompt, providerName);
    }

    return {
        success: true,
        provider: provider,
        capability,
        content,
        timestamp: Date.now(),
        model: `${providerName}-mock`,
        isMock: true
    };
}

/**
 * Generate contextual mock text response
 */
function generateMockTextResponse(prompt, providerName) {
    const lowerPrompt = prompt.toLowerCase();

    // Context-aware mock responses
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
        return `Hello! I'm ${providerName} (mock mode for demo). Your x402 payment was verified on Monad! How can I help you today?`;
    }

    if (lowerPrompt.includes('code') || lowerPrompt.includes('program')) {
        return `Here's a sample response from ${providerName} (mock mode):\n\n\`\`\`javascript\n// x402 Payment Verification Example\nconst verifyPayment = async (requestId) => {\n  const paid = await contract.isRequestIdUsed(requestId);\n  if (!paid) throw new Error('402 Payment Required');\n  return true;\n};\n\`\`\`\n\n💡 This response was served after verifying your Monad payment!`;
    }

    if (lowerPrompt.includes('explain') || lowerPrompt.includes('what is')) {
        return `Great question! Here's ${providerName}'s explanation (mock mode):\n\nThe x402 protocol enables wallet-native payments for AI access. Instead of subscriptions, you pay per-request using your crypto wallet.\n\nKey benefits:\n• No accounts needed - wallet is identity\n• Pay only for what you use\n• Instant access after payment\n• Works on Monad for fast, cheap transactions\n\n🔗 This response verified your payment on-chain before serving!`;
    }

    // Default response
    return `Response from ${providerName} (mock mode for hackathon demo):\n\nYour prompt: "${prompt}"\n\n✅ x402 Payment verified on Monad blockchain\n✅ Access granted\n✅ Response generated\n\nIn production, this would be a real AI-generated response. The key demo point is that payment verification happened BEFORE this response was served.\n\nThis is the x402 pattern: Payment = Permission.`;
}

export const genAI = null;
export const model = null;
