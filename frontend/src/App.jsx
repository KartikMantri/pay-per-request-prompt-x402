/**
 * x402 AI Gateway V2 - Main App Component
 */
import { useApp } from './context/AppContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import ProviderPage from './pages/ProviderPage';
import AdminPanel from './components/AdminPanel';
import './App.css';

function App() {
    const { currentPage } = useApp();

    const renderPage = () => {
        switch (currentPage) {
            case 'admin':
                return <AdminPanel />;
            case 'provider':
                return <ProviderPage />;
            case 'home':
            default:
                return <HomePage />;
        }
    };

    return (
        <div className="app">
            <Header />
            <main className="main-content">
                {renderPage()}
            </main>
            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <span className="footer-icon">⚡</span>
                        <span>x402 AI Gateway</span>
                    </div>
                    <div className="footer-divider">•</div>
                    <div className="footer-tagline">Payment = Permission</div>
                    <div className="footer-divider">•</div>
                    <div className="footer-powered">
                        Powered by <span className="monad-text">Monad</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;
