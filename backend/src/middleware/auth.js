/**
 * Authentication Middleware
 * Verifies wallet signatures for x402 authorization
 * 
 * WHY: We need to prove the requester owns the wallet
 * that made the payment. Signatures prove ownership.
 */
import { verifySignature } from '../services/blockchain.js';

/**
 * Verify wallet signature middleware
 * 
 * Expected request body:
 * {
 *   address: "0x...",
 *   signature: "0x...",
 *   message: "Sign this to prove wallet ownership: <timestamp>",
 *   timestamp: 1234567890
 * }
 */
export function verifyWalletAuth(req, res, next) {
    const { address, signature, message, timestamp } = req.body;

    // Check required fields
    if (!address || !signature || !message) {
        return res.status(400).json({
            error: 'Missing authentication fields',
            required: ['address', 'signature', 'message']
        });
    }

    // Verify signature age (5 minute window)
    if (timestamp) {
        const signatureAge = Date.now() - timestamp;
        const maxAge = 5 * 60 * 1000; // 5 minutes

        if (signatureAge > maxAge) {
            return res.status(401).json({
                error: 'Signature expired',
                message: 'Please sign a new message'
            });
        }
    }

    // Verify signature matches address
    const recoveredAddress = verifySignature(message, signature);

    if (!recoveredAddress) {
        return res.status(401).json({
            error: 'Invalid signature',
            message: 'Could not verify wallet ownership'
        });
    }

    // Case-insensitive address comparison
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        return res.status(401).json({
            error: 'Signature mismatch',
            message: 'Signature does not match provided address'
        });
    }

    // Attach verified address to request
    req.verifiedAddress = recoveredAddress;

    next();
}

/**
 * Optional auth - allows requests without signature for demo purposes
 * Still verifies if signature is provided
 */
export function optionalWalletAuth(req, res, next) {
    const { address, signature, message } = req.body;

    if (signature && message && address) {
        // If auth provided, verify it
        return verifyWalletAuth(req, res, next);
    }

    // No auth provided - allow for demo mode
    req.verifiedAddress = address || null;
    req.authSkipped = true;

    next();
}
