/**
 * App Context - Global State Management
 * Manages provider selection, access mode, and wallet state
 */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAccessStatus } from '../hooks/useContract';

const AppContext = createContext(null);

export function AppProvider({ children }) {
    // Selected AI provider
    const [selectedProvider, setSelectedProvider] = useState(null);
    
    // Selected access mode: 'per-request' | 'premium' | 'credits'
    const [accessMode, setAccessMode] = useState('per-request');
    
    // Selected capability: 'text' | 'image' | 'video'
    const [capability, setCapability] = useState('text');
    
    // Current page: 'home' | 'provider' | 'admin'
    const [currentPage, setCurrentPage] = useState('home');
    
    // Pending request (for retry after payment)
    const [pendingRequest, setPendingRequest] = useState(null);

    // Wallet state
    const { address, isConnected } = useAccount();
    const { isPremium, credits, premiumExpiresAt, isLoading: isLoadingAccess, refetch } = useAccessStatus(address);

    // Navigate to provider page
    const selectProvider = useCallback((providerId) => {
        setSelectedProvider(providerId);
        setCurrentPage('provider');
    }, []);

    // Navigate back to home
    const goHome = useCallback(() => {
        setSelectedProvider(null);
        setCurrentPage('home');
    }, []);

    // Navigate to admin
    const goAdmin = useCallback(() => {
        setCurrentPage('admin');
    }, []);

    // Save pending request for retry
    const savePendingRequest = useCallback((prompt, capability, provider) => {
        setPendingRequest({ prompt, capability, provider, timestamp: Date.now() });
    }, []);

    // Clear pending request
    const clearPendingRequest = useCallback(() => {
        setPendingRequest(null);
    }, []);

    // Get current access type based on wallet state
    const getCurrentAccessType = useCallback(() => {
        if (!isConnected) return 'none';
        if (isPremium) return 'premium';
        if (credits > 0) return 'credits';
        return 'per-request';
    }, [isConnected, isPremium, credits]);

    // Refresh access status
    const refreshAccess = useCallback(() => {
        if (refetch) refetch();
    }, [refetch]);

    // Handle hash-based routing
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.slice(1);
            if (hash === 'admin') {
                setCurrentPage('admin');
            } else if (hash === '' || hash === 'home') {
                setCurrentPage('home');
                setSelectedProvider(null);
            }
        };

        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const value = {
        // Provider
        selectedProvider,
        setSelectedProvider,
        selectProvider,
        
        // Access mode
        accessMode,
        setAccessMode,
        
        // Capability
        capability,
        setCapability,
        
        // Navigation
        currentPage,
        setCurrentPage,
        goHome,
        goAdmin,
        
        // Wallet state
        address,
        isConnected,
        isPremium,
        credits,
        premiumExpiresAt,
        isLoadingAccess,
        getCurrentAccessType,
        refreshAccess,
        
        // Pending request
        pendingRequest,
        savePendingRequest,
        clearPendingRequest
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}

export default AppContext;
