import { Link } from 'react-router-dom';
import { Shield, FileCheck, Lock, Zap, DollarSign, Users } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div className="hero-content">
                        <h1 className="hero-title">
                            Verifica y Certifica tus Documentos en Blockchain
                        </h1>
                        <p className="hero-subtitle">
                            Protege la autenticidad de tus documentos con la tecnología blockchain de BTTChain.
                            Verificación inmutable, segura y confiable.
                        </p>
                        <div className="hero-buttons">
                            <Link to="/dashboard" className="btn btn-primary btn-lg">
                                Comenzar Ahora
                            </Link>
                            <Link to="/verify" className="btn btn-outline btn-lg">
                                Verificar Documento
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features section">
                <div className="container">
                    <h2 className="section-title text-center">¿Por qué DocuChain?</h2>
                    <div className="features-grid">
                        <div className="feature-card card">
                            <div className="feature-icon">
                                <Shield size={40} color="#2563eb" />
                            </div>
                            <h3>Seguridad Blockchain</h3>
                            <p>
                                Tu documento queda registrado en BTTChain, una blockchain inmutable
                                que garantiza la autenticidad y previene falsificaciones.
                            </p>
                        </div>

                        <div className="feature-card card">
                            <div className="feature-icon">
                                <FileCheck size={40} color="#10b981" />
                            </div>
                            <h3>Verificación Instantánea</h3>
                            <p>
                                Verifica cualquier documento en segundos. Solo sube el archivo
                                y obtendrás confirmación inmediata de su autenticidad.
                            </p>
                        </div>

                        <div className="feature-card card">
                            <div className="feature-icon">
                                <Lock size={40} color="#f59e0b" />
                            </div>
                            <h3>Hash SHA-256</h3>
                            <p>
                                Utilizamos SHA-256 para generar una huella digital única de cada
                                documento, sin almacenar el contenido original.
                            </p>
                        </div>

                        <div className="feature-card card">
                            <div className="feature-icon">
                                <Zap size={40} color="#ef4444" />
                            </div>
                            <h3>Rápido y Eficiente</h3>
                            <p>
                                Proceso optimizado que te permite certificar documentos en minutos
                                con tarifas mínimas en la red BTTChain.
                            </p>
                        </div>

                        <div className="feature-card card">
                            <div className="feature-icon">
                                <DollarSign size={40} color="#8b5cf6" />
                            </div>
                            <h3>Precios Accesibles</h3>
                            <p>
                                Suscripción mensual desde 1000 BTT. Certifica documentos ilimitados
                                y mantén un registro completo de tus archivos.
                            </p>
                        </div>

                        <div className="feature-card card">
                            <div className="feature-icon">
                                <Users size={40} color="#06b6d4" />
                            </div>
                            <h3>Control Total</h3>
                            <p>
                                Conecta tu wallet MetaMask y gestiona todos tus documentos desde
                                un panel intuitivo y fácil de usar.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section className="how-it-works section">
                <div className="container">
                    <h2 className="section-title text-center">¿Cómo Funciona?</h2>
                    <div className="steps">
                        <div className="step">
                            <div className="step-number">1</div>
                            <h3>Conecta tu Wallet</h3>
                            <p>Conecta MetaMask y asegúrate de estar en la red BTTChain</p>
                        </div>

                        <div className="step">
                            <div className="step-number">2</div>
                            <h3>Sube tu Documento</h3>
                            <p>Selecciona el archivo que deseas certificar (PDF, imagen, etc.)</p>
                        </div>

                        <div className="step">
                            <div className="step-number">3</div>
                            <h3>Genera el Hash</h3>
                            <p>El sistema calcula automáticamente el hash SHA-256 del documento</p>
                        </div>

                        <div className="step">
                            <div className="step-number">4</div>
                            <h3>Almacena en Blockchain</h3>
                            <p>El hash se registra en BTTChain de forma permanente e inmutable</p>
                        </div>

                        <div className="step">
                            <div className="step-number">5</div>
                            <h3>Verifica Cuando Quieras</h3>
                            <p>Verifica la autenticidad del documento en cualquier momento</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="pricing section">
                <div className="container">
                    <h2 className="section-title text-center">Modelo de Negocio</h2>
                    <div className="pricing-content">
                        <div className="pricing-card card">
                            <div className="pricing-header">
                                <h3>Suscripción Mensual</h3>
                                <div className="price">
                                    <span className="amount">1000</span>
                                    <span className="currency">BTT/mes</span>
                                </div>
                            </div>
                            <ul className="pricing-features">
                                <li>✓ Documentos ilimitados</li>
                                <li>✓ Verificación instantánea</li>
                                <li>✓ Storage en blockchain</li>
                                <li>✓ Panel de administración</li>
                                <li>✓ Historial completo</li>
                                <li>✓ Soporte prioritario</li>
                            </ul>
                            <Link to="/dashboard" className="btn btn-primary btn-block">
                                Suscribirse Ahora
                            </Link>
                        </div>

                        <div className="business-model">
                            <h3>¿Cómo Funciona el Modelo de Suscripción?</h3>
                            <ul>
                                <li>
                                    <strong>Pago Automático:</strong> Cada mes se cobra automáticamente
                                    1000 BTT desde tu wallet conectada.
                                </li>
                                <li>
                                    <strong>Acceso Continuo:</strong> Mientras tu suscripción esté activa,
                                    puedes certificar documentos sin límite.
                                </li>
                                <li>
                                    <strong>Cancelación Flexible:</strong> Cancela en cualquier momento
                                    desde tu panel de usuario.
                                </li>
                                <li>
                                    <strong>Verificación Gratuita:</strong> Cualquiera puede verificar
                                    documentos sin necesidad de suscripción.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta section">
                <div className="container">
                    <div className="cta-content">
                        <h2>¿Listo para Proteger tus Documentos?</h2>
                        <p>Únete a DocuChain y aprovecha el poder de la blockchain</p>
                        <Link to="/dashboard" className="btn btn-primary btn-lg">
                            Empezar Gratis
                        </Link>
                    </div>
                </div>
            </section>

            <style jsx>{`
        .hero {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 100px 0;
          text-align: center;
        }

        .hero-title {
          font-size: 48px;
          font-weight: 800;
          margin-bottom: 20px;
          line-height: 1.2;
        }

        .hero-subtitle {
          font-size: 20px;
          margin-bottom: 40px;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
          opacity: 0.9;
        }

        .hero-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-lg {
          padding: 16px 32px;
          font-size: 18px;
        }

        .section-title {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 50px;
          color: var(--dark);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
        }

        .feature-card {
          text-align: center;
        }

        .feature-icon {
          margin-bottom: 20px;
        }

        .feature-card h3 {
          font-size: 24px;
          margin-bottom: 12px;
          color: var(--dark);
        }

        .feature-card p {
          color: var(--text-light);
          line-height: 1.6;
        }

        .steps {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .step {
          flex: 1;
          min-width: 180px;
          text-align: center;
        }

        .step-number {
          width: 60px;
          height: 60px;
          background: var(--primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          margin: 0 auto 20px;
        }

        .step h3 {
          font-size: 18px;
          margin-bottom: 10px;
          color: var(--dark);
        }

        .step p {
          color: var(--text-light);
          font-size: 14px;
        }

        .pricing-content {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 40px;
          align-items: start;
        }

        .pricing-card {
          text-align: center;
        }

        .pricing-header {
          margin-bottom: 30px;
        }

        .pricing-header h3 {
          font-size: 28px;
          margin-bottom: 20px;
          color: var(--dark);
        }

        .price {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 8px;
        }

        .amount {
          font-size: 48px;
          font-weight: 800;
          color: var(--primary);
        }

        .currency {
          font-size: 18px;
          color: var(--text-light);
        }

        .pricing-features {
          list-style: none;
          margin-bottom: 30px;
          text-align: left;
        }

        .pricing-features li {
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
          color: var(--text);
        }

        .btn-block {
          width: 100%;
        }

        .business-model h3 {
          font-size: 24px;
          margin-bottom: 20px;
          color: var(--dark);
        }

        .business-model ul {
          list-style: none;
        }

        .business-model li {
          padding: 15px 0;
          color: var(--text);
          line-height: 1.6;
        }

        .business-model strong {
          color: var(--primary);
        }

        .cta {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .cta-content {
          text-align: center;
        }

        .cta-content h2 {
          font-size: 40px;
          margin-bottom: 16px;
        }

        .cta-content p {
          font-size: 20px;
          margin-bottom: 30px;
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 32px;
          }

          .hero-subtitle {
            font-size: 16px;
          }

          .pricing-content {
            grid-template-columns: 1fr;
          }

          .steps {
            flex-direction: column;
          }
        }
      `}</style>
        </div>
    );
};

export default LandingPage;
