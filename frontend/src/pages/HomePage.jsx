/**
 * HomePage - AI Provider Grid
 * Premium landing page with 4 provider cards
 */
import { useApp } from '../context/AppContext';
import ProviderCard from '../components/ProviderCard';
import PurchaseSection from '../components/PurchaseSection';
import { AI_PROVIDERS, ACCESS_MODES } from '../utils/constants';
import './HomePage.css';

export function HomePage() {
    const { isConnected } = useApp();

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="badge-icon">🔐</span>
                        <span>HTTP 402 • Payment Required</span>
                    </div>
                    
                    <h1 className="hero-title">
                        <span className="title-gradient">Pay-for-AI</span>
                        <br />
                        <span className="title-secondary">on Monad Blockchain</span>
                    </h1>
                    
                    <p className="hero-description">
                        Access premium AI models with crypto micropayments. 
                        No accounts, no subscriptions — just connect your wallet and pay per request.
                    </p>

                    <div className="hero-stats">
                        <div className="stat-item">
                            <span className="stat-value">4</span>
                            <span className="stat-label">AI Providers</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <span className="stat-value">3</span>
                            <span className="stat-label">Access Modes</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <span className="stat-value">&lt;1s</span>
                            <span className="stat-label">Payment Time</span>
                        </div>
                    </div>
                </div>

                {/* Floating decorative elements */}
                <div className="hero-bg-effects">
                    <div className="glow-orb orb-1"></div>
                    <div className="glow-orb orb-2"></div>
                    <div className="glow-orb orb-3"></div>
                </div>
            </section>

            {/* Provider Grid */}
            <section className="providers-section">
                <div className="section-header">
                    <h2>Choose Your AI Provider</h2>
                    <p>Select a provider to view pricing and start generating</p>
                </div>

                <div className="providers-grid stagger-children">
                    {AI_PROVIDERS.map((provider) => (
                        <ProviderCard key={provider.id} provider={provider} />
                    ))}
                </div>

                {!isConnected && (
                    <div className="connect-prompt fade-in">
                        <span className="prompt-icon">👆</span>
                        <span>Connect your wallet to get started</span>
                    </div>
                )}
            </section>

            {/* Purchase Section - Buy Credits or Premium */}
            <PurchaseSection />

            {/* How It Works */}
            <section className="how-section">
                <div className="section-header">
                    <h2>How x402 Works</h2>
                    <p>Seamless blockchain payments in 4 simple steps</p>
                </div>

                <div className="how-steps">
                    <div className="step-card">
                        <div className="step-number">1</div>
                        <h4>Request AI</h4>
                        <p>Send a prompt to any AI provider</p>
                    </div>
                    <div className="step-arrow">→</div>
                    <div className="step-card">
                        <div className="step-number">2</div>
                        <h4>HTTP 402</h4>
                        <p>Server responds with payment request</p>
                    </div>
                    <div className="step-arrow">→</div>
                    <div className="step-card">
                        <div className="step-number">3</div>
                        <h4>Pay via Wallet</h4>
                        <p>Confirm transaction on Monad</p>
                    </div>
                    <div className="step-arrow">→</div>
                    <div className="step-card">
                        <div className="step-number">4</div>
                        <h4>Access Granted</h4>
                        <p>Receive AI response instantly</p>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default HomePage;
