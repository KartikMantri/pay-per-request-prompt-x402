/**
 * AI Chat Interface
 * Chat component integrated with access mode and x402 payment handling
 */
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAIRequest } from '../hooks/useAIRequest';
import PaymentRequired from './PaymentRequired';
import { CAPABILITY_PRICING } from '../utils/constants';
import './AIChat.css';

export function AIChat({ provider }) {
    const { isConnected, accessMode, capability, setCapability, refreshAccess } = useApp();
    const { sendRequest, isLoading, error, paymentRequired, clearPaymentRequired } = useAIRequest();

    const [prompt, setPrompt] = useState('');
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: prompt,
            capability,
            provider: provider.id,
            timestamp: new Date().toLocaleTimeString()
        };

        setMessages(prev => [...prev, userMessage]);
        setPrompt('');

        const result = await sendRequest(prompt, capability, provider.id);

        if (result.success) {
            const aiMessage = {
                id: Date.now(),
                type: 'ai',
                content: result.data.response?.content || result.data.response,
                accessType: result.data.accessType,
                provider: result.data.response?.provider || provider.id,
                isMock: result.data.response?.isMock,
                timestamp: new Date().toLocaleTimeString()
            };
            setMessages(prev => [...prev, aiMessage]);
            
            // Refresh access status to update credits display
            refreshAccess();
        }
    };

    const handlePaymentComplete = () => {
        clearPaymentRequired();
        // Can retry automatically here
    };

    const handleRetry = (requestId = null) => {
        if (messages.length > 0) {
            const lastUserMessage = [...messages].reverse().find(m => m.type === 'user');
            if (lastUserMessage) {
                // Pass requestId for per-request payments
                sendRequest(lastUserMessage.content, lastUserMessage.capability, lastUserMessage.provider, requestId);
            }
        }
    };

    // Available capabilities for this provider
    const providerCaps = provider.capabilities || ['text', 'image', 'video'];

    return (
        <div className="ai-chat">
            {/* Capability Selector */}
            <div className="chat-toolbar">
                <div className="capability-selector">
                    {providerCaps.map(capId => {
                        const cap = CAPABILITY_PRICING[capId];
                        return (
                            <button
                                key={capId}
                                className={`cap-btn ${capability === capId ? 'active' : ''}`}
                                onClick={() => setCapability(capId)}
                            >
                                <span className="cap-icon">{cap.icon}</span>
                                <span className="cap-name">{cap.name}</span>
                            </button>
                        );
                    })}
                </div>
                <div className="mode-indicator">
                    <span className="mode-icon">
                        {accessMode === 'per-request' && '⚡'}
                        {accessMode === 'premium' && '👑'}
                        {accessMode === 'credits' && '🎫'}
                    </span>
                    <span className="mode-label">
                        {accessMode === 'per-request' && 'Per-Request'}
                        {accessMode === 'premium' && 'Premium'}
                        {accessMode === 'credits' && 'Credits'}
                    </span>
                </div>
            </div>

            {/* Messages Area */}
            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">{provider.icon}</div>
                        <h3>Ready to chat with {provider.name}</h3>
                        <p>Your messages are protected by x402 payment protocol</p>
                    </div>
                ) : (
                    <div className="messages-list">
                        {messages.map(msg => (
                            <div key={msg.id} className={`message ${msg.type}`}>
                                <div className="message-avatar">
                                    {msg.type === 'user' ? '👤' : provider.icon}
                                </div>
                                <div className="message-body">
                                    <div className="message-header">
                                        <span className="message-sender">
                                            {msg.type === 'user' ? 'You' : provider.name}
                                        </span>
                                        <span className="message-time">{msg.timestamp}</span>
                                        {msg.type === 'ai' && (
                                            <div className="message-badges">
                                                {msg.accessType && (
                                                    <span className={`msg-badge ${msg.accessType}`}>
                                                        {msg.accessType === 'premium' && '👑 Premium'}
                                                        {msg.accessType === 'credits' && '🎫 Credit'}
                                                        {msg.accessType === 'per-request' && '⚡ Paid'}
                                                        {msg.accessType === 'demo' && '🎮 Demo'}
                                                    </span>
                                                )}
                                                {msg.isMock && <span className="msg-badge mock">Mock</span>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="message-content">
                                        {typeof msg.content === 'string' ? (
                                            <p>{msg.content}</p>
                                        ) : (
                                            <div className="media-response">
                                                <p>{msg.content?.description}</p>
                                                {msg.content?.mockImageUrl && (
                                                    <img src={msg.content.mockImageUrl} alt="AI Generated" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* 402 Payment Required Overlay */}
                {paymentRequired && (
                    <div className="payment-overlay">
                        <PaymentRequired
                            paymentData={paymentRequired}
                            onPaymentComplete={handlePaymentComplete}
                            onRetry={handleRetry}
                        />
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="loading-state">
                        <div className="loading-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <span>Generating response...</span>
                    </div>
                )}

                {/* Error State */}
                {error && !paymentRequired && (
                    <div className="error-state">
                        <span className="error-icon">❌</span>
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form className="input-area" onSubmit={handleSubmit}>
                <div className="input-wrapper">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={isConnected ? `Ask ${provider.name} anything...` : 'Connect wallet to start...'}
                        disabled={!isConnected || isLoading}
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <button
                        type="submit"
                        className="send-btn"
                        disabled={!isConnected || isLoading || !prompt.trim()}
                    >
                        {isLoading ? (
                            <span className="spin">⏳</span>
                        ) : (
                            <span>→</span>
                        )}
                    </button>
                </div>
                <div className="input-footer">
                    <span className="footer-hint">Press Enter to send, Shift+Enter for new line</span>
                </div>
            </form>
        </div>
    );
}

export default AIChat;
