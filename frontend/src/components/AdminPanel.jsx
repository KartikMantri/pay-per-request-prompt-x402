/**
 * Admin Panel Component
 * Owner-only panel for contract management
 */
import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACT_ADDRESS, CONTRACT_ABI, OWNER_ADDRESS, BLOCK_EXPLORER } from '../utils/constants';
import './AdminPanel.css';

export function AdminPanel() {
    const { address, isConnected } = useAccount();
    const [showConfirm, setShowConfirm] = useState(false);

    // Check if connected wallet is owner
    const isOwner = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

    // Read contract balance
    const { data: balance, isLoading: isLoadingBalance, refetch: refetchBalance } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getContractBalance',
        enabled: isOwner,
    });

    // Withdraw function
    const { writeContract, data: txHash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

    // Refetch balance after successful withdrawal
    useEffect(() => {
        if (isSuccess) {
            refetchBalance();
            setShowConfirm(false);
        }
    }, [isSuccess, refetchBalance]);

    const handleWithdraw = () => {
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'withdraw',
        });
    };

    const formattedBalance = balance ? formatEther(balance) : '0';

    if (!isConnected) {
        return (
            <div className="admin-panel">
                <div className="admin-container">
                    <div className="admin-header">
                        <h1>👑 Admin Panel</h1>
                        <p>Contract owner management</p>
                    </div>
                    <div className="admin-card">
                        <div className="not-connected">
                            <span className="icon">🔌</span>
                            <h3>Wallet Not Connected</h3>
                            <p>Please connect your wallet to access the admin panel</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isOwner) {
        return (
            <div className="admin-panel">
                <div className="admin-container">
                    <div className="admin-header">
                        <h1>👑 Admin Panel</h1>
                        <p>Contract owner management</p>
                    </div>
                    <div className="admin-card">
                        <div className="not-owner">
                            <span className="icon">🚫</span>
                            <h3>Access Denied</h3>
                            <p>Only the contract owner can access this panel</p>
                            <div className="wallet-info">
                                <span className="label">Your wallet:</span>
                                <code>{address?.slice(0, 10)}...{address?.slice(-8)}</code>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-panel">
            <div className="admin-container">
                {/* Header */}
                <div className="admin-header">
                    <div className="header-badge">
                        <span className="badge badge-premium">OWNER ACCESS</span>
                    </div>
                    <h1>👑 Admin Panel</h1>
                    <p>Manage your x402 AI Gateway contract</p>
                </div>

                {/* Stats Grid */}
                <div className="admin-stats">
                    <div className="stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-content">
                            <span className="stat-label">Contract Balance</span>
                            <span className="stat-value">
                                {isLoadingBalance ? 'Loading...' : `${parseFloat(formattedBalance).toFixed(6)} MON`}
                            </span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📄</div>
                        <div className="stat-content">
                            <span className="stat-label">Contract Address</span>
                            <a 
                                href={`${BLOCK_EXPLORER}/address/${CONTRACT_ADDRESS}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="stat-link"
                            >
                                {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-8)}
                            </a>
                        </div>
                    </div>
                </div>

                {/* Withdraw Card */}
                <div className="admin-card withdraw-card">
                    <h2>Withdraw Funds</h2>
                    <p>Transfer all contract funds to owner wallet</p>

                    <div className="withdraw-info">
                        <div className="info-row">
                            <span className="info-label">Available:</span>
                            <span className="info-value">{parseFloat(formattedBalance).toFixed(6)} MON</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Recipient:</span>
                            <span className="info-value">{address?.slice(0, 10)}...{address?.slice(-8)}</span>
                        </div>
                    </div>

                    {!showConfirm ? (
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={() => setShowConfirm(true)}
                            disabled={parseFloat(formattedBalance) === 0}
                        >
                            <span>💸</span>
                            Withdraw All Funds
                        </button>
                    ) : (
                        <div className="confirm-section">
                            <p className="confirm-warning">⚠️ Are you sure you want to withdraw all funds?</p>
                            <div className="confirm-buttons">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowConfirm(false)}
                                    disabled={isPending || isConfirming}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleWithdraw}
                                    disabled={isPending || isConfirming}
                                >
                                    {isPending || isConfirming ? (
                                        <>
                                            <span className="spin">⏳</span>
                                            {isConfirming ? 'Confirming...' : 'Processing...'}
                                        </>
                                    ) : (
                                        'Confirm Withdraw'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Success */}
                    {isSuccess && (
                        <div className="success-alert">
                            <span>✅</span>
                            Withdrawal successful!
                            <a 
                                href={`${BLOCK_EXPLORER}/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View transaction →
                            </a>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="error-alert">
                            <span>❌</span>
                            {error.message?.split('\n')[0] || 'Transaction failed'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminPanel;
