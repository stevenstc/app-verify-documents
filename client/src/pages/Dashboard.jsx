import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Upload, FileCheck, User, LogOut, Wallet } from 'lucide-react';
import {
    uploadDocument,
    storeInBlockchain,
    getUserDocuments,
    checkSubscription,
    updateSubscription,
    getUserLimits,
    getUserOrCreate
} from '../services/api';
import { calculateFileHash, formatHash, copyToClipboard } from '../utils/hashUtils';

const Dashboard = () => {
    const { account, connectWallet, disconnectWallet, isConnected, getBalance } = useWeb3();
    const [activeTab, setActiveTab] = useState('upload');
    const [file, setFile] = useState(null);
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const [balance, setBalance] = useState('0');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [userLimits, setUserLimits] = useState(null);

    useEffect(() => {
        if (isConnected && account) {
            loadUserData();
        }
    }, [isConnected, account]);

    const loadUserData = async () => {
        try {
            const normalizedAccount = account.toLowerCase();

            // Primero, asegurarse de que el usuario existe en la BD
            await getUserOrCreate(normalizedAccount);

            // Luego cargar todos los datos
            const [docsData, subData, bal, limits] = await Promise.all([
                getUserDocuments(normalizedAccount),
                checkSubscription(normalizedAccount),
                getBalance(),
                getUserLimits(normalizedAccount)
            ]);

            setDocuments(docsData.documents || []);
            setSubscription(subData);
            setBalance(bal);
            setUserLimits(limits);
        } catch (error) {
            console.error('Error cargando datos:', error);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setMessage({ type: '', text: '' });
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage({ type: 'error', text: 'Por favor selecciona un archivo' });
            return;
        }

        if (!isConnected) {
            setMessage({ type: 'error', text: 'Por favor conecta tu wallet' });
            return;
        }

        try {
            setUploading(true);
            setMessage({ type: '', text: '' });

            const formData = new FormData();
            formData.append('file', file);
            formData.append('walletAddress', account.toLowerCase());
            formData.append('description', description);

            const result = await uploadDocument(formData);

            let successMessage = `Documento cargado exitosamente. Hash: ${formatHash(result.document.fileHash)}`;

            if (result.userLimits && !result.userLimits.unlimited) {
                successMessage += ` (${result.userLimits.remaining} documentos gratis restantes)`;
            }

            setMessage({
                type: 'success',
                text: successMessage
            });

            setFile(null);
            setDescription('');
            loadUserData();

        } catch (error) {
            console.error('Error subiendo documento:', error);

            const errorData = error.response?.data;

            if (errorData?.needsSubscription) {
                setMessage({
                    type: 'warning',
                    text: `${errorData.error}. ${errorData.message}`
                });
            } else {
                setMessage({
                    type: 'error',
                    text: errorData?.error || 'Error al cargar el documento'
                });
            }
        } finally {
            setUploading(false);
        }
    };

    const handleStoreInBlockchain = async (documentId) => {
        try {
            setMessage({ type: '', text: '' });

            const result = await storeInBlockchain(documentId, account.toLowerCase());

            setMessage({
                type: 'success',
                text: `Hash almacenado en blockchain. TX: ${formatHash(result.transactionHash)}`
            });

            loadUserData();
        } catch (error) {
            console.error('Error almacenando en blockchain:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Error almacenando en blockchain'
            });
        }
    };

    const handleSubscribe = async () => {
        try {
            setMessage({ type: '', text: '' });

            // Aquí iría la lógica para procesar el pago en BTT
            // Por ahora simularemos una transacción exitosa

            const txHash = '0x' + Math.random().toString(36).substring(2, 15);

            await updateSubscription(account.toLowerCase(), {
                transactionHash: txHash,
                amountBTT: 1000
            });

            setMessage({
                type: 'success',
                text: 'Suscripción activada exitosamente'
            });

            loadUserData();
        } catch (error) {
            console.error('Error activando suscripción:', error);
            setMessage({
                type: 'error',
                text: 'Error al activar la suscripción'
            });
        }
    };

    if (!isConnected) {
        return (
            <div className="dashboard-container">
                <div className="connect-wallet-container">
                    <Wallet size={80} color="#2563eb" />
                    <h2>Conecta tu Wallet</h2>
                    <p>Para usar DocuChain, necesitas conectar tu wallet MetaMask</p>
                    <button onClick={connectWallet} className="btn btn-primary btn-lg">
                        Conectar MetaMask
                    </button>
                </div>

                <style jsx>{`
          .connect-wallet-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            text-align: center;
            padding: 40px;
          }
          
          .connect-wallet-container h2 {
            margin: 20px 0 10px;
            font-size: 32px;
            color: var(--dark);
          }
          
          .connect-wallet-container p {
            color: var(--text-light);
            margin-bottom: 30px;
            font-size: 18px;
          }
        `}</style>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <div className="container">
                    <div className="header-content">
                        <h1>Dashboard</h1>
                        <div className="user-info">
                            <div className="wallet-address">
                                <User size={20} />
                                <span>{formatHash(account, 6)}</span>
                            </div>
                            <div className="balance">
                                <Wallet size={20} />
                                <span>{Number(balance).toFixed(2)} BTT</span>
                            </div>
                            <button onClick={disconnectWallet} className="btn btn-outline btn-sm">
                                <LogOut size={18} />
                                Desconectar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                {/* User Limits Info */}
                {userLimits && !userLimits.hasSubscription && (
                    <div className="subscription-alert alert alert-info">
                        <p>
                            📄 Plan Gratuito: Has usado {userLimits.freeDocumentsUsed} de {userLimits.freeDocumentsLimit} documento(s) gratis.
                            {userLimits.remaining > 0 ? (
                                ` Te quedan ${userLimits.remaining} documento(s) gratis.`
                            ) : (
                                ' Alcanzaste el límite.'
                            )}
                        </p>
                        {userLimits.remaining === 0 && (
                            <button onClick={handleSubscribe} className="btn btn-primary">
                                Suscribirse (1000 BTT/mes) - Documentos ilimitados
                            </button>
                        )}
                    </div>
                )}

                {/* Subscription Status */}
                {subscription && !subscription.isActive && userLimits && userLimits.remaining > 0 && (
                    <div className="subscription-alert alert alert-warning">
                        <p>
                            💎 Obtén acceso ilimitado: Suscríbete para certificar documentos sin límites.
                        </p>
                        <button onClick={handleSubscribe} className="btn btn-primary">
                            Suscribirse (1000 BTT/mes)
                        </button>
                    </div>
                )}

                {subscription && subscription.isActive && (
                    <div className="subscription-alert alert alert-success">
                        <p>
                            ✓ Suscripción activa - Documentos ilimitados. Días restantes: {subscription.daysRemaining}
                        </p>
                    </div>
                )}

                {/* Messages */}
                {message.text && (
                    <div className={`alert alert-${message.type}`}>
                        {message.text}
                    </div>
                )}

                {/* Tabs */}
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upload')}
                    >
                        <Upload size={20} />
                        Cargar Documento
                    </button>
                    <button
                        className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
                        onClick={() => setActiveTab('documents')}
                    >
                        <FileCheck size={20} />
                        Mis Documentos
                    </button>
                </div>

                {/* Upload Tab */}
                {activeTab === 'upload' && (
                    <div className="tab-content card">
                        <h2>Cargar Nuevo Documento</h2>
                        <div className="form-group">
                            <label className="form-label">Seleccionar Archivo</label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="form-input"
                            />
                            {file && (
                                <div className="file-info">
                                    <p>Archivo: {file.name}</p>
                                    <p>Tamaño: {(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Descripción (opcional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="form-input"
                                rows="3"
                                placeholder="Añade una descripción para este documento..."
                            />
                        </div>

                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading || (userLimits && !userLimits.canUpload)}
                            className="btn btn-primary"
                        >
                            {uploading ? 'Procesando...' : 'Cargar y Calcular Hash'}
                        </button>

                        {userLimits && !userLimits.canUpload && (
                            <p className="limit-warning">
                                ⚠️ Has alcanzado el límite de documentos gratuitos. Suscríbete para continuar.
                            </p>
                        )}
                    </div>
                )}

                {/* Documents Tab */}
                {activeTab === 'documents' && (
                    <div className="tab-content">
                        <h2>Mis Documentos ({documents.length})</h2>

                        {documents.length === 0 ? (
                            <div className="empty-state card">
                                <FileCheck size={60} color="#9ca3af" />
                                <p>No tienes documentos cargados aún</p>
                            </div>
                        ) : (
                            <div className="documents-grid">
                                {documents.map((doc) => (
                                    <div key={doc.id} className="document-card card">
                                        <div className="document-header">
                                            <h3>{doc.fileName}</h3>
                                            {doc.storedInBlockchain && (
                                                <span className="badge badge-success">En Blockchain</span>
                                            )}
                                        </div>

                                        <div className="document-info">
                                            <p><strong>Hash:</strong> {formatHash(doc.fileHash)}</p>
                                            <p><strong>Tamaño:</strong> {(doc.fileSize / 1024).toFixed(2)} KB</p>
                                            <p><strong>Fecha:</strong> {new Date(doc.createdAt).toLocaleDateString()}</p>

                                            {doc.description && (
                                                <p><strong>Descripción:</strong> {doc.description}</p>
                                            )}

                                            {doc.blockchainTxHash && (
                                                <p>
                                                    <strong>TX Hash:</strong>
                                                    <a
                                                        href={`https://bttcscan.com/tx/${doc.blockchainTxHash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {formatHash(doc.blockchainTxHash)}
                                                    </a>
                                                </p>
                                            )}
                                        </div>

                                        {!doc.storedInBlockchain && (
                                            <button
                                                onClick={() => handleStoreInBlockchain(doc.id)}
                                                className="btn btn-primary btn-sm"
                                            >
                                                Almacenar en Blockchain
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
        .dashboard-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 0;
          margin-bottom: 30px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }

        .header-content h1 {
          font-size: 32px;
          font-weight: 700;
        }

        .user-info {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .wallet-address, .balance {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 20px;
        }

        .subscription-alert {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          border-bottom: 2px solid var(--border);
        }

        .tab {
          padding: 12px 24px;
          border: none;
          background: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-light);
          font-size: 16px;
          font-weight: 600;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
        }

        .tab:hover {
          color: var(--primary);
        }

        .tab.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }

        .tab-content {
          margin-bottom: 30px;
        }

        .tab-content h2 {
          font-size: 24px;
          margin-bottom: 20px;
          color: var(--dark);
        }

        .file-info {
          margin-top: 10px;
          padding: 10px;
          background: var(--light);
          border-radius: 6px;
        }

        .file-info p {
          margin: 4px 0;
          color: var(--text-light);
          font-size: 14px;
        }

        .limit-warning {
          margin-top: 16px;
          padding: 12px;
          background: #fef3c7;
          color: #92400e;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
        }

        .documents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .document-card {
          padding: 20px;
        }

        .document-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 15px;
        }

        .document-header h3 {
          font-size: 18px;
          color: var(--dark);
          word-break: break-word;
        }

        .badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge-success {
          background: #d1fae5;
          color: #065f46;
        }

        .document-info {
          margin-bottom: 15px;
        }

        .document-info p {
          margin: 8px 0;
          font-size: 14px;
          color: var(--text);
        }

        .document-info strong {
          color: var(--dark);
        }

        .document-info a {
          color: var(--primary);
          text-decoration: none;
        }

        .document-info a:hover {
          text-decoration: underline;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-state p {
          margin-top: 20px;
          color: var(--text-light);
          font-size: 18px;
        }

        .btn-sm {
          padding: 8px 16px;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            align-items: start;
          }

          .user-info {
            flex-direction: column;
            width: 100%;
          }

          .documents-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
};

export default Dashboard;
