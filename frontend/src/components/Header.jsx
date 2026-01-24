/**
 * Premium Header Component
 * Shows branding, navigation, access status, and wallet connection
 */
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useApp } from '../context/AppContext';
import { AI_PROVIDERS } from '../utils/constants';
import './Header.css';

export function Header() {
    const {
        isConnected,
        isPremium,
        credits,
        premiumExpiresAt,
        isLoadingAccess,
        selectedProvider,
        goHome,
        goAdmin,
        currentPage
    } = useApp();

    // Format premium expiry
    const formatExpiry = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp * 1000);
        const now = new Date();
        const diff = date - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) return `${days}d ${hours}h left`;
        if (hours > 0) return `${hours}h left`;
        return 'Expiring soon';
    };

    // Get current provider info
    const currentProvider = selectedProvider
        ? AI_PROVIDERS.find(p => p.id === selectedProvider)
        : null;

    return (
        <header className="header">
            <div className="header-container">
                {/* Logo & Brand */}
                <div className="header-brand" onClick={goHome}>
                    <div className="logo">
                        <span className="logo-icon">⚡</span>
                        <span className="logo-text">x402</span>
                    </div>
                    <div className="brand-tagline">AI Gateway</div>
                </div>

                {/* Center - Provider indicator or Nav */}
                <div className="header-center">
                    {currentProvider && currentPage === 'provider' ? (
                        <div className="current-provider">
                            <button className="back-btn" onClick={goHome}>
                                ← Back
                            </button>
                            <div className="provider-indicator">
                                <span className="provider-icon">{currentProvider.icon}</span>
                                <span className="provider-name">{currentProvider.name}</span>
                                {currentProvider.isLive ? (
                                    <span className="badge badge-live">LIVE</span>
                                ) : (
                                    <span className="badge badge-mock">MOCK</span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <nav className="header-nav">
                            <a 
                                href="#" 
                                className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
                                onClick={(e) => { e.preventDefault(); goHome(); }}
                            >
                                Providers
                            </a>
                        </nav>
                    )}
                </div>

                {/* Right - Access Status + Wallet */}
                <div className="header-right">
                    {isConnected && (
                        <div className="access-status">
                            {isLoadingAccess ? (
                                <div className="status-badge loading">
                                    <span className="status-dot"></span>
                                    Loading...
                                </div>
                            ) : isPremium ? (
                                <div className="status-badge premium">
                                    <span className="status-icon">👑</span>
                                    <div className="status-info">
                                        <span className="status-label">Premium</span>
                                        <span className="status-detail">{formatExpiry(premiumExpiresAt)}</span>
                                    </div>
                                </div>
                            ) : credits > 0 ? (
                                <div className="status-badge credits">
                                    <span className="status-icon">🎫</span>
                                    <div className="status-info">
                                        <span className="status-label">{credits} Credits</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="status-badge payg">
                                    <span className="status-icon">⚡</span>
                                    <span className="status-label">Pay-as-you-go</span>
                                </div>
                            )}
                        </div>
                    )}

                    <ConnectButton
                        showBalance={true}
                        chainStatus="icon"
                        accountStatus="address"
                    />
                </div>
            </div>

            {/* Protocol Banner */}
            <div className="protocol-banner">
                <div className="banner-content">
                    <div className="banner-item">
                        <span className="banner-icon">🔐</span>
                        <span>x402 Protocol</span>
                    </div>
                    <div className="banner-divider"></div>
                    <div className="banner-item">
                        <span className="banner-icon">⚡</span>
                        <span>Monad Testnet</span>
                    </div>
                    <div className="banner-divider"></div>
                    <div className="banner-item">
                        <span className="banner-icon">💰</span>
                        <span>DeFi Access Control</span>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;
