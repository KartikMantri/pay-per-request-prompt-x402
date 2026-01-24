/**
 * PurchaseSection - Buy Credits or Premium
 * Allows users to purchase credits or premium access directly from homepage
 */
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useApp } from '../context/AppContext';
import { usePurchase } from '../hooks/useContract';
import { PRICING, CURRENCY_SYMBOL } from '../utils/constants';
import './PurchaseSection.css';

export function PurchaseSection() {
    const { isConnected } = useAccount();
    const { isPremium, credits, premiumExpiresAt, refreshAccess } = useApp();
    
    const [selectedPremiumDays, setSelectedPremiumDays] = useState(30);
    const [creditPacks, setCreditPacks] = useState(1);
    const [lastPurchaseType, setLastPurchaseType] = useState(null); // Track which button was clicked
    
    // Purchase hook (x402/USDC)
    const { 
        buy, 
        isPending: isPurchasePending, 
        isSuccess: isPurchaseSuccess,
        error: purchaseError
    } = usePurchase();

    const isProcessing = isPurchasePending;

    // Refresh access status on success
    if (isPurchaseSuccess) {
        setTimeout(() => {
            refreshAccess();
            setLastPurchaseType(null); // Reset after refresh
        }, 1500);
    }

    const handleBuyPremium = () => {
        if (!isConnected) return;
        setLastPurchaseType('premium');
        buy(selectedPremiumDays === 7 ? 'premium7Days' : 'premium30Days');
    };

    const handleBuyCredits = () => {
        if (!isConnected) return;
        setLastPurchaseType('credits');
        buy('creditPack', { packs: creditPacks });
    };

    // Format premium expiry date
    const formatExpiry = (timestamp) => {
        if (!timestamp || timestamp === 0) return null;
        const date = new Date(timestamp * 1000);
        if (date < new Date()) return null;
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    const premiumExpiry = formatExpiry(premiumExpiresAt);

    if (!isConnected) {
        return (
            <section className="purchase-section">
                <div className="section-header">
                    <h2>Buy Access</h2>
                    <p>Connect your wallet to purchase credits or premium access</p>
                </div>
                <div className="connect-required">
                    <span className="required-icon">🔗</span>
                    <span>Connect wallet to purchase</span>
                </div>
            </section>
        );
    }

    return (
        <section className="purchase-section">
            {/* x402 Pay-Per-Request Info */}
            <div className="x402-info-banner" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '2rem',
                color: 'white',
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💳</div>
                <h3 style={{ 
                    margin: '0 0 0.5rem 0', 
                    fontSize: '1.35rem', 
                    fontWeight: '700',
                    fontFamily: 'Space Grotesk, Outfit, Inter, sans-serif',
                    letterSpacing: '0.5px',
                    background: 'linear-gradient(135deg, #fbbf24 0%, #fde047 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    x402 Pay-Per-Request Available
                </h3>
                <p style={{ 
                    margin: 0, 
                    fontSize: '0.95rem', 
                    fontFamily: 'Poppins, Inter, system-ui, sans-serif', 
                    fontWeight: '400',
                    color: '#e0e7ff',
                    lineHeight: '1.6'
                }}>
                    No commitment needed! Choose from any AI provider <strong style={{ color: '#fbbf24', fontWeight: '600' }}>above</strong> to use <strong style={{ color: '#fde047', fontWeight: '600' }}>Pay-Per-Request</strong> — pay only for what you use with x402.
                </p>
            </div>

            <div className="section-header">
                <h2>Buy Access</h2>
                <p>Purchase credits or premium to skip per-request payments</p>
            </div>

            {/* Current Status */}
            <div className="current-status">
                <div className="status-item">
                    <span className="status-icon">🎫</span>
                    <span className="status-label">Credits:</span>
                    <span className="status-value">{credits || 0}</span>
                </div>
                <div className="status-item">
                    <span className="status-icon">👑</span>
                    <span className="status-label">Premium:</span>
                    <span className="status-value">
                        {isPremium ? `Active until ${premiumExpiry}` : 'Not Active'}
                    </span>
                </div>
            </div>

            <div className="purchase-grid">
                {/* Premium Card */}
                <div className="purchase-card premium-card">
                    <div className="card-header">
                        <span className="card-icon">👑</span>
                        <h3>Premium Access</h3>
                        <span className="card-badge best">BEST VALUE</span>
                    </div>
                    <p className="card-desc">Unlimited AI requests for a set duration</p>
                    
                    <div className="duration-options">
                        <button 
                            className={`duration-btn ${selectedPremiumDays === 7 ? 'active' : ''}`}
                            onClick={() => setSelectedPremiumDays(7)}
                            disabled={isProcessing}
                        >
                            <span className="dur-days">7 Days</span>
                            <span className="dur-price">{PRICING.premium7Days} {CURRENCY_SYMBOL}</span>
                        </button>
                        <button 
                            className={`duration-btn ${selectedPremiumDays === 30 ? 'active' : ''}`}
                            onClick={() => setSelectedPremiumDays(30)}
                            disabled={isProcessing}
                        >
                            <span className="dur-days">30 Days</span>
                            <span className="dur-price">{PRICING.premium30Days} {CURRENCY_SYMBOL}</span>
                            <span className="dur-badge">Popular</span>
                        </button>
                    </div>

                    <ul className="card-features">
                        <li>✓ Unlimited Text Generation</li>
                        <li>✓ Unlimited Image Generation</li>
                        <li>✓ Unlimited Video Generation</li>
                        <li>✓ No per-request payments</li>
                    </ul>

                    <button 
                        className="buy-btn premium-btn"
                        onClick={handleBuyPremium}
                        disabled={isProcessing}
                    >
                        {isProcessing && lastPurchaseType === 'premium' ? (
                            <>⏳ Processing...</>
                        ) : (
                            <>Buy {selectedPremiumDays} Days Premium</>
                        )}
                    </button>

                    {isPurchaseSuccess && lastPurchaseType === 'premium' && (
                        <div className="success-msg">✅ Premium activated!</div>
                    )}
                    {purchaseError && lastPurchaseType === 'premium' && (
                        <div className="error-msg">❌ {purchaseError}</div>
                    )}
                </div>

                {/* Credits Card */}
                <div className="purchase-card credits-card">
                    <div className="card-header">
                        <span className="card-icon">🎫</span>
                        <h3>Credit Pack</h3>
                        <span className="card-badge prepaid">PREPAID</span>
                    </div>
                    <p className="card-desc">Buy credits in advance, use anytime</p>
                    
                    <div className="credits-selector-container">
                        <div className="credits-selector">
                            <button 
                                className="credits-btn" 
                                onClick={() => setCreditPacks(Math.max(1, creditPacks - 1))}
                                disabled={creditPacks <= 1 || isProcessing}
                            >
                                −
                            </button>
                            <div className="credits-display">
                                <span className="credits-count">{creditPacks * 10}</span>
                                <span className="credits-label">Credits</span>
                            </div>
                            <button 
                                className="credits-btn" 
                                onClick={() => setCreditPacks(creditPacks + 1)}
                                disabled={isProcessing}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="credits-info">
                        <div className="credits-amount">
                            <span className="amount-value">{creditPacks * 10}</span>
                            <span className="amount-label">Credits</span>
                        </div>
                        <div className="credits-price">
                            <span className="price-value">{(parseFloat(PRICING.creditPack) * creditPacks).toFixed(2)}</span>
                            <span className="price-currency">{CURRENCY_SYMBOL}</span>
                        </div>
                    </div>

                    <ul className="card-features">
                        <li>📝 Text: 1 credit/request</li>
                        <li>🖼️ Image: 3 credits/request</li>
                        <li>🎬 Video: 5 credits/request</li>
                        <li>♾️ Credits never expire</li>
                    </ul>

                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <button 
                            className="buy-btn credits-btn"
                            onClick={handleBuyCredits}
                            disabled={isProcessing}
                        >
                            {isProcessing && lastPurchaseType === 'credits' ? (
                                <>⏳ Processing...</>
                            ) : (
                                <>💳 Buy {creditPacks * 10} Credits</>
                            )}
                        </button>
                    </div>

                    {isPurchaseSuccess && lastPurchaseType === 'credits' && (
                        <div className="success-msg">✅ Credits added!</div>
                    )}
                    {purchaseError && lastPurchaseType === 'credits' && (
                        <div className="error-msg">❌ {purchaseError}</div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default PurchaseSection;
