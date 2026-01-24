/**
 * ProviderPage - Access Mode Selection & Chat
 * Shows 3 access modes with detailed pricing per capability
 */
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AI_PROVIDERS, ACCESS_MODES, CAPABILITY_PRICING } from '../utils/constants';
import AccessModeSelector from '../components/AccessModeSelector';
import PricingTable from '../components/PricingTable';
import AIChat from '../components/AIChat';
import './ProviderPage.css';

export function ProviderPage() {
    const { selectedProvider, accessMode, setAccessMode, isConnected } = useApp();
    const [showChat, setShowChat] = useState(false);

    const provider = AI_PROVIDERS.find(p => p.id === selectedProvider);

    if (!provider) {
        return (
            <div className="provider-page">
                <div className="error-state">
                    <span className="error-icon">❌</span>
                    <p>Provider not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="provider-page">
            <div className="provider-page-container">
                {/* Provider Header */}
                <section className="provider-header">
                    <div 
                        className="provider-hero-icon"
                        style={{ background: provider.gradient }}
                    >
                        {provider.icon}
                    </div>
                    <div className="provider-hero-info">
                        <div className="provider-hero-badges">
                            {provider.isLive ? (
                                <span className="badge badge-live">
                                    <span className="live-dot"></span>
                                    LIVE
                                </span>
                            ) : (
                                <span className="badge badge-mock">MOCK</span>
                            )}
                        </div>
                        <h1 className="provider-hero-name">{provider.name}</h1>
                        <p className="provider-hero-desc">{provider.description} — {provider.tagline}</p>
                        
                        {/* Capabilities */}
                        <div className="provider-hero-caps">
                            {provider.capabilities.map(cap => {
                                const capInfo = CAPABILITY_PRICING[cap];
                                return (
                                    <div key={cap} className="cap-pill">
                                        <span className="cap-icon">{capInfo.icon}</span>
                                        <span className="cap-name">{capInfo.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Access Mode Selection */}
                <section className="mode-section">
                    <div className="section-header">
                        <h2>Choose Access Mode</h2>
                        <p>Select how you want to pay for AI access</p>
                    </div>

                    <AccessModeSelector
                        selectedMode={accessMode}
                        onSelectMode={setAccessMode}
                    />
                </section>

                {/* Pricing Table */}
                <section className="pricing-section">
                    <div className="section-header">
                        <h2>Pricing Details</h2>
                        <p>
                            {accessMode === 'per-request' && 'Pay per individual request — x402 protocol'}
                            {accessMode === 'premium' && 'Unlimited access for a fixed duration'}
                            {accessMode === 'credits' && 'Buy credits upfront, use as needed'}
                        </p>
                    </div>

                    <PricingTable 
                        mode={accessMode}
                        capabilities={provider.capabilities}
                    />
                </section>

                {/* Start Chat Button */}
                {!showChat && (
                    <section className="start-section">
                        <button
                            className="btn btn-primary btn-lg start-chat-btn"
                            onClick={() => setShowChat(true)}
                            disabled={!isConnected}
                        >
                            <span>🚀</span>
                            <span>{isConnected ? 'Start Chatting' : 'Connect Wallet to Start'}</span>
                        </button>
                    </section>
                )}

                {/* Chat Interface */}
                {showChat && (
                    <section className="chat-section fade-in">
                        <div className="section-header">
                            <h2>Chat with {provider.name}</h2>
                            <p>Your requests are protected by x402 protocol</p>
                        </div>
                        <AIChat provider={provider} />
                    </section>
                )}
            </div>
        </div>
    );
}

export default ProviderPage;
