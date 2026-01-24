/**
 * PricingTable - Detailed Pricing per Capability
 * Shows pricing based on selected access mode
 */
import { ACCESS_MODES, CAPABILITY_PRICING, CURRENCY_SYMBOL } from '../utils/constants';
import './PricingTable.css';

export function PricingTable({ mode, capabilities }) {
    const modeConfig = ACCESS_MODES[mode];

    if (!modeConfig) return null;

    // Per-request pricing
    if (mode === 'per-request') {
        return (
            <div className="pricing-table">
                <div className="pricing-header">
                    <span className="header-icon">⚡</span>
                    <div>
                        <h3>Pay Per Request</h3>
                        <p>Each request triggers HTTP 402 payment</p>
                    </div>
                </div>

                <div className="capability-prices">
                    {capabilities.map(capId => {
                        const cap = CAPABILITY_PRICING[capId];
                        return (
                            <div key={capId} className="price-row">
                                <div className="price-capability">
                                    <span className="cap-icon">{cap.icon}</span>
                                    <div className="cap-info">
                                        <span className="cap-name">{cap.name}</span>
                                        <span className="cap-desc">{cap.description}</span>
                                    </div>
                                </div>
                                <div className="price-value">
                                    <span className="price-amount">{modeConfig.pricing[capId]}</span>
                                    <span className="price-currency">{CURRENCY_SYMBOL}</span>
                                    <span className="price-unit">/ request</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="pricing-footer">
                    <div className="footer-item">
                        <span className="footer-icon">🔐</span>
                        <span>x402 Protocol verified</span>
                    </div>
                    <div className="footer-item">
                        <span className="footer-icon">⚡</span>
                        <span>Instant on-chain payment</span>
                    </div>
                </div>
            </div>
        );
    }

    // Premium pricing
    if (mode === 'premium') {
        return (
            <div className="pricing-table">
                <div className="pricing-header premium-header">
                    <span className="header-icon">👑</span>
                    <div>
                        <h3>Premium Access</h3>
                        <p>Unlimited requests for all capabilities</p>
                    </div>
                </div>

                <div className="premium-options">
                    {modeConfig.options.map(option => (
                        <div 
                            key={option.days} 
                            className={`premium-option ${option.recommended ? 'recommended' : ''}`}
                        >
                            {option.recommended && (
                                <div className="recommended-badge">
                                    <span className="badge badge-best">BEST VALUE</span>
                                </div>
                            )}
                            <div className="option-duration">{option.label}</div>
                            <div className="option-price">
                                <span className="price-amount">{option.price}</span>
                                <span className="price-currency">{CURRENCY_SYMBOL}</span>
                            </div>
                            <ul className="option-includes">
                                <li>✓ Unlimited Text</li>
                                <li>✓ Unlimited Image</li>
                                <li>✓ Unlimited Video</li>
                                <li>✓ Priority execution</li>
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="pricing-footer">
                    <div className="footer-item">
                        <span className="footer-icon">♾️</span>
                        <span>No request limits</span>
                    </div>
                    <div className="footer-item">
                        <span className="footer-icon">🚀</span>
                        <span>Bypass 402 prompts</span>
                    </div>
                </div>
            </div>
        );
    }

    // Credits pricing
    if (mode === 'credits') {
        return (
            <div className="pricing-table">
                <div className="pricing-header credits-header">
                    <span className="header-icon">🎫</span>
                    <div>
                        <h3>Credit Packs</h3>
                        <p>Buy credits in advance, use as needed</p>
                    </div>
                </div>

                <div className="credits-pack">
                    <div className="pack-info">
                        <div className="pack-name">1 Credit Pack</div>
                        <div className="pack-contents">
                            <span className="pack-amount">{modeConfig.packSize} credits</span>
                        </div>
                    </div>
                    <div className="pack-price">
                        <span className="price-amount">{modeConfig.packPrice}</span>
                        <span className="price-currency">{CURRENCY_SYMBOL}</span>
                    </div>
                </div>

                <div className="credits-consumption">
                    <h4>Credit Consumption</h4>
                    <div className="consumption-grid">
                        {capabilities.map(capId => {
                            const cap = CAPABILITY_PRICING[capId];
                            return (
                                <div key={capId} className="consumption-row">
                                    <div className="consumption-cap">
                                        <span className="cap-icon">{cap.icon}</span>
                                        <span className="cap-name">{cap.name}</span>
                                    </div>
                                    <div className="consumption-value">
                                        <span className="credits-used">{modeConfig.consumption[capId]}</span>
                                        <span className="credits-label">credit{modeConfig.consumption[capId] > 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="pricing-footer">
                    <div className="footer-item">
                        <span className="footer-icon">📦</span>
                        <span>Buy multiple packs</span>
                    </div>
                    <div className="footer-item">
                        <span className="footer-icon">⏳</span>
                        <span>Credits never expire</span>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

export default PricingTable;
