/**
 * AccessModeSelector - Pay-Per-Request Only
 * Directs users to home page for Premium/Credits
 */
import { ACCESS_MODES } from '../utils/constants';
import './AccessModeSelector.css';

export function AccessModeSelector({ selectedMode, onSelectMode }) {
    const perRequestMode = ACCESS_MODES['per-request'];

    return (
        <div className="mode-selector">
            {/* Pay-Per-Request Card */}
            <button
                className={`mode-card ${selectedMode === 'per-request' ? 'active' : ''}`}
                onClick={() => onSelectMode('per-request')}
            >
                {/* Selection indicator */}
                <div className="mode-selection-indicator">
                    <div className="indicator-dot"></div>
                </div>

                {/* Icon */}
                <div className="mode-card-icon">{perRequestMode.icon}</div>

                {/* Content */}
                <div className="mode-card-content">
                    <div className="mode-card-header">
                        <h3 className="mode-card-title">{perRequestMode.name}</h3>
                        <span className={`badge ${perRequestMode.badgeClass}`}>{perRequestMode.badge}</span>
                    </div>
                    <p className="mode-card-desc">{perRequestMode.shortDesc}</p>
                </div>

                {/* Features Preview */}
                <div className="mode-card-features">
                    {perRequestMode.features.slice(0, 2).map((feature, idx) => (
                        <span key={idx} className="feature-item">
                            <span className="feature-check">✓</span>
                            {feature}
                        </span>
                    ))}
                </div>
            </button>

            {/* Info Message for Premium/Credits */}
            <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                border: '1px solid rgba(102, 126, 234, 0.3)',
                borderRadius: '8px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>👑 💳</div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#a0aec0' }}>
                    <strong style={{ color: '#e2e8f0' }}>Want Premium or Credits?</strong><br />
                    Visit the <strong style={{ color: '#667eea' }}>Buy Access</strong> section on the home page to purchase Premium subscriptions or Credit packs.
                </p>
            </div>
        </div>
    );
}

export default AccessModeSelector;
