/**
 * ProviderCard - Individual AI Provider Card
 * Premium card with hover effects and live/mock badge
 */
import { useApp } from '../context/AppContext';
import { CAPABILITY_PRICING } from '../utils/constants';
import './ProviderCard.css';

export function ProviderCard({ provider }) {
    const { selectProvider, isConnected } = useApp();

    const handleClick = () => {
        selectProvider(provider.id);
    };

    return (
        <div 
            className={`provider-card ${!isConnected ? 'disabled' : ''}`}
            onClick={isConnected ? handleClick : undefined}
            style={{ '--provider-color': provider.color }}
        >
            {/* Gradient border effect */}
            <div className="card-glow"></div>
            
            {/* Card Content */}
            <div className="card-inner">
                {/* Status Badge */}
                <div className="card-badge">
                    {provider.status === 'LIVE' ? (
                        <span className="badge badge-live">
                            <span className="live-dot"></span>
                            LIVE
                        </span>
                    ) : (
                        <span className="badge badge-mock">MOCK</span>
                    )}
                </div>

                {/* Provider Icon */}
                <div className="provider-icon-wrapper">
                    <div 
                        className="provider-icon"
                        style={{ background: provider.gradient }}
                    >
                        {provider.icon}
                    </div>
                </div>

                {/* Provider Info */}
                <div className="provider-info">
                    <h3 className="provider-name">{provider.name}</h3>
                    <p className="provider-model">{provider.description}</p>
                    <p className="provider-tagline">{provider.tagline}</p>
                </div>

                {/* Capabilities */}
                <div className="provider-capabilities">
                    {provider.capabilities.map(cap => {
                        const capInfo = CAPABILITY_PRICING[cap];
                        return (
                            <span 
                                key={cap} 
                                className="capability-tag"
                                title={capInfo.name}
                            >
                                {capInfo.icon}
                            </span>
                        );
                    })}
                </div>

                {/* CTA */}
                <div className="card-cta">
                    <span className="cta-text">
                        {isConnected ? 'Select Provider' : 'Connect Wallet'}
                    </span>
                    <span className="cta-arrow">→</span>
                </div>
            </div>
        </div>
    );
}

export default ProviderCard;
