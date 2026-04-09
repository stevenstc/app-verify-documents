import { Link } from 'react-router-dom';
import { FileCheck, Home, Search, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="container">
                <div className="nav-content">
                    <Link to="/" className="logo">
                        <FileCheck size={32} />
                        <span>DocuChain</span>
                    </Link>

                    <div className="nav-links">
                        <Link to="/" className="nav-link">
                            <Home size={18} />
                            Inicio
                        </Link>
                        <Link to="/verify" className="nav-link">
                            <Search size={18} />
                            Verificar
                        </Link>
                        <Link to="/dashboard" className="nav-link nav-link-primary">
                            <LayoutDashboard size={18} />
                            Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .navbar {
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .nav-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: var(--primary);
          font-size: 24px;
          font-weight: 700;
        }

        .nav-links {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          text-decoration: none;
          color: var(--text);
          font-weight: 500;
          border-radius: 6px;
          transition: all 0.3s;
        }

        .nav-link:hover {
          background: var(--light);
          color: var(--primary);
        }

        .nav-link-primary {
          background: var(--primary);
          color: white;
        }

        .nav-link-primary:hover {
          background: var(--primary-dark);
          color: white;
        }

        @media (max-width: 768px) {
          .nav-content {
            flex-direction: column;
            gap: 16px;
          }

          .nav-links {
            width: 100%;
            justify-content: center;
          }

          .nav-link {
            flex: 1;
            justify-content: center;
          }
        }
      `}</style>
        </nav>
    );
};

export default Navbar;
