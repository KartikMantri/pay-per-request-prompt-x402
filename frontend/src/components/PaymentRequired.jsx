/**
 * 402 Payment Required Component
 * Premium overlay showing payment options when x402 is triggered
 */
import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useApp } from '../context/AppContext';
import { usePayPerRequest } from '../hooks/useContract';
import { CURRENCY_SYMBOL, PRICING } from '../utils/constants';
import './PaymentRequired.css';

export function PaymentRequired({ paymentData, onPaymentComplete, onRetry }) {
    const { isConnected } = useAccount();
    const { refreshAccess } = useApp();

    const { 
        pay: payPerRequest, 
        isPending: isPayingRequest, 
        isConfirming: isConfirmingRequest, 
        isSuccess: requestSuccess,
        requestId: paidRequestId,
        resetRequestId
    } = usePayPerRequest();



    const isProcessing = isPayingRequest || isConfirmingRequest;

    // Handle successful payment
    useEffect(() => {
        if (requestSuccess) {
            refreshAccess();
            const timer = setTimeout(() => {
                if (onPaymentComplete) onPaymentComplete();
                // Pass requestId to retry for per-request payments
                if (onRetry) onRetry(requestSuccess ? paidRequestId : null);
                // Reset the requestId after use
                if (requestSuccess && resetRequestId) resetRequestId();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [requestSuccess, onPaymentComplete, onRetry, refreshAccess, paidRequestId, resetRequestId]);

    const handlePayment = async () => {
        if (!isConnected) return;
        await payPerRequest();
    };



    if (!isConnected) {
        return (
            <div className="payment-required-card">
                <div className="pr-badge">
                    <span className="badge-icon">⚠️</span>
                    <span>402 PAYMENT REQUIRED</span>
                </div>
                <h3>Connect Your Wallet</h3>
                <p>Please connect your wallet to access AI services</p>
            </div>
        );
    }

    return (
        <div className="payment-required-card scale-in">
            {/* 402 Badge */}
            <div className="pr-badge">
                <span className="badge-icon">⚠️</span>
                <span>HTTP 402 • PAYMENT REQUIRED</span>
            </div>

            <h3>Payment Required to Access AI</h3>
            <p>Pay for this single request with x402</p>



            {/* Payment Details */}
            <div className="pr-details">
                {/* Per-Request */}
                <div className="pr-option">
                    <div className="option-header">
                        <h4>Per-Request Payment</h4>
                        <span className="badge badge-402">x402</span>
                    </div>
                    <p>Pay for exactly ONE AI request. Stateless, no commitment.</p>
                    <div className="price-display">
                        <span className="price-value">{PRICING.perRequest}</span>
                        <span className="price-currency">{CURRENCY_SYMBOL}</span>
                    </div>
                    <ul className="option-features">
                        <li>✓ Single request authorization</li>
                        <li>✓ Verified on-chain instantly</li>
                        <li>✓ No commitment needed</li>
                    </ul>
                </div>
            </div>

            {/* Pay Button */}
            <button
                className="btn btn-primary btn-lg pay-btn"
                onClick={handlePayment}
                disabled={isProcessing}
            >
                {isProcessing ? (
                    <>
                        <span className="spin">⏳</span>
                        {isConfirmingRequest
                            ? 'Confirming on Monad...'
                            : 'Processing...'}
                    </>
                ) : (
                    <>
                        <span>💳</span>
                        Pay with Monad
                    </>
                )}
            </button>

            {/* Success Message */}
            {requestSuccess && (
                <div className="success-message fade-in">
                    <span>✅</span>
                    Payment confirmed! Access granted.
                </div>
            )}

            {/* How it works */}
            <div className="pr-how">
                <div className="how-step">
                    <span className="step-num">1</span>
                    <span>Request AI</span>
                </div>
                <span className="step-arrow">→</span>
                <div className="how-step">
                    <span className="step-num">2</span>
                    <span>402 Response</span>
                </div>
                <span className="step-arrow">→</span>
                <div className="how-step">
                    <span className="step-num">3</span>
                    <span>Pay via Wallet</span>
                </div>
                <span className="step-arrow">→</span>
                <div className="how-step">
                    <span className="step-num">4</span>
                    <span>Access Granted</span>
                </div>
            </div>
        </div>
    );
}

export default PaymentRequired;
