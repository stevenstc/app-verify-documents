import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Web3Provider } from './context/Web3Context';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import VerifyPage from './pages/VerifyPage';
import './styles/index.css';

function App() {
    return (
        <Web3Provider>
            <Router>
                <div className="app">
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/verify" element={<VerifyPage />} />
                    </Routes>
                    <footer className="footer">
                        <div className="container">
                            <p>&copy; 2026 DocuChain. Verificación de Documentos en BTTChain.</p>
                        </div>
                    </footer>
                </div>
            </Router>

            <style jsx>{`
        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .footer {
          margin-top: auto;
          background: var(--dark);
          color: white;
          padding: 30px 0;
          text-align: center;
        }

        .footer p {
          margin: 0;
          opacity: 0.8;
        }
      `}</style>
        </Web3Provider>
    );
}

export default App;
