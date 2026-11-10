import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';
import { FileCheck, User, LogOut, Wallet, Pencil, Check, X } from 'lucide-react';
import {
    uploadDocument,
    storeInBlockchain,
    updateDocumentDescription,
    getUserDocuments,
    checkSubscription,
    updateSubscription,
    getUserLimits,
    getUserOrCreate,
    getPricing,
    checkAdminAccess
} from '../services/api';
import { calculateFileHash, formatHash, copyToClipboard } from '../utils/hashUtils';
import AdminPanel from './AdminPanel';

const formatDate = (date) => date
    ? new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '-';

const Dashboard = () => {
    const { account, connectWallet, disconnectWallet, isConnected, getBalance, signer, chainId, switchToBTTChain } = useWeb3();
    const [isAdmin, setIsAdmin] = useState(false);
    const [file, setFile] = useState(null);
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const [balance, setBalance] = useState('0');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [userLimits, setUserLimits] = useState(null);
    const [pricing, setPricing] = useState(null);
    const [paymentAddress, setPaymentAddress] = useState(null);
    const [showPayModal, setShowPayModal] = useState(false);
    const [paying, setPaying] = useState(false);
    const [payStep, setPayStep] = useState('');
    const [payError, setPayError] = useState('');
    const [editingDocId, setEditingDocId] = useState(null);
    const [editingDescription, setEditingDescription] = useState('');
    const [savingDescription, setSavingDescription] = useState(false);

    const subscriptionPriceLabel = pricing
        ? `${Number(pricing.monthlyPriceBTT).toLocaleString('es-ES')} BTT / ${pricing.durationDays} días`
        : '1000 BTT/mes';

    useEffect(() => {
        if (isConnected && account) {
            loadUserData();
        }
    }, [isConnected, account]);

    useEffect(() => {
        let cancelled = false;

        if (!isConnected || !account) {
            setIsAdmin(false);
            return;
        }

        checkAdminAccess(account.toLowerCase())
            .then(access => {
                if (!cancelled) setIsAdmin(!!access.isAdmin);
            })
            .catch(() => {
                if (!cancelled) setIsAdmin(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isConnected, account]);

    const loadUserData = async () => {
        try {
            const normalizedAccount = account.toLowerCase();

            // Primero, asegurarse de que el usuario existe en la BD
            await getUserOrCreate(normalizedAccount);

            // Luego cargar todos los datos
            const [docsData, subData, bal, limits, pricingData] = await Promise.all([
                getUserDocuments(normalizedAccount),
                checkSubscription(normalizedAccount),
                getBalance(),
                getUserLimits(normalizedAccount),
                getPricing()
            ]);

            setDocuments(docsData.documents || []);
            setSubscription(subData);
            setBalance(bal);
            setUserLimits(limits);
            setPricing(pricingData.pricing);
            setPaymentAddress(pricingData.paymentAddress || null);
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

    const handleStartEditDescription = (document) => {
        setEditingDocId(document.id);
        setEditingDescription(document.description || '');
    };

    const handleCancelEditDescription = () => {
        setEditingDocId(null);
        setEditingDescription('');
    };

    const handleSaveDescription = async (documentId) => {
        try {
            setSavingDescription(true);
            setMessage({ type: '', text: '' });

            const result = await updateDocumentDescription(documentId, {
                walletAddress: account.toLowerCase(),
                description: editingDescription
            });

            setDocuments(prev => prev.map(document =>
                document.id === documentId
                    ? { ...document, description: result.document.description }
                    : document
            ));

            setEditingDocId(null);
            setEditingDescription('');
            setMessage({ type: 'success', text: 'Descripción actualizada exitosamente' });
        } catch (error) {
            console.error('Error actualizando descripción:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Error actualizando la descripción'
            });
        } finally {
            setSavingDescription(false);
        }
    };

    const handleSubscribe = () => {
        setPayError('');
        setShowPayModal(true);
    };

    const closePayModal = () => {
        if (paying) return;
        setShowPayModal(false);
        setPayError('');
    };

    const previewDates = () => {
        const start = new Date();
        const currentEnd = subscription?.subscription?.endDate
            ? new Date(subscription.subscription.endDate)
            : null;
        const isActiveNow = subscription?.isActive && currentEnd && currentEnd > start;
        const base = isActiveNow ? currentEnd : start;
        const days = pricing?.durationDays ?? 30;
        const end = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
        return { start, end, extended: !!isActiveNow };
    };

    const handleConfirmPayment = async () => {
        if (!signer || !paymentAddress || !pricing?.monthlyPriceBTT) {
            setPayError('No hay wallet conectada o el servicio de cobro no está configurado.');
            return;
        }

        if (chainId !== '199' && chainId !== '1029') {
            try {
                await switchToBTTChain();
            } catch {
                setPayError('No fue posible cambiar a la red BTTChain. Conéctala manualmente en MetaMask.');
            }
            return;
        }

        try {
            setPaying(true);
            setPayError('');

            setPayStep('Esperando tu confirmación en MetaMask...');
            const tx = await signer.sendTransaction({
                to: paymentAddress,
                value: ethers.parseEther(String(pricing.monthlyPriceBTT))
            });

            setPayStep('Enviando pago a la blockchain...');
            const receipt = await tx.wait();

            if (receipt.status !== 1) {
                throw new Error('La transacción fue revertida en la blockchain');
            }

            setPayStep('Verificando pago en la blockchain...');
            const result = await updateSubscription(account.toLowerCase(), {
                transactionHash: receipt.hash
            });

            setShowPayModal(false);
            setMessage({
                type: 'success',
                text: `${result.message}. Vigente desde ${formatDate(result.subscription.startDate)} hasta ${formatDate(result.subscription.endDate)} (TX: ${formatHash(receipt.hash)})`
            });
            loadUserData();
        } catch (error) {
            console.error('Error al pagar suscripción:', error);
            if (error.code === 4001 || /rejected|user denied|cancelado/i.test(error.message || '')) {
                setPayError('Cancelaste la transacción en MetaMask. No se realizó ningún pago.');
            } else {
                setPayError(error.response?.data?.error || error.message || 'Error al procesar el pago');
            }
        } finally {
            setPaying(false);
            setPayStep('');
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
                                Suscribirse ({subscriptionPriceLabel}) - Documentos ilimitados
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
                            Suscribirse ({subscriptionPriceLabel})
                        </button>
                    </div>
                )}

                {subscription && subscription.isActive && (
                    <div className="subscription-alert alert alert-success">
                        <p>
                            ✓ Suscripción activa - Documentos ilimitados.<br />
                            Vigente desde: <strong>{formatDate(subscription.subscription?.startDate)}</strong> ·
                            Vence: <strong>{formatDate(subscription.subscription?.endDate)}</strong> ·
                            Días restantes: <strong>{subscription.daysRemaining}</strong>
                            {subscription.daysRemaining <= 5 && (
                                <> · ⚠️ Tu suscripción está por vencer</>
                            )}
                        </p>
                        <button onClick={handleSubscribe} className="btn btn-outline btn-sm">
                            Renovar ({subscriptionPriceLabel})
                        </button>
                    </div>
                )}

                {/* Messages */}
                {message.text && (
                    <div className={`alert alert-${message.type}`}>
                        {message.text}
                    </div>
                )}

                {/* Upload */}
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

                {/* Documents */}
                <div className="documents-section">
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

                                            {editingDocId === doc.id ? (
                                                <div className="description-edit">
                                                    <label className="form-label">Descripción</label>
                                                    <textarea
                                                        className="form-input"
                                                        rows="3"
                                                        maxLength="1000"
                                                        value={editingDescription}
                                                        onChange={(e) => setEditingDescription(e.target.value)}
                                                        placeholder="Escribe una descripción para este documento..."
                                                    />
                                                    <div className="description-actions">
                                                        <button
                                                            type="button"
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => handleSaveDescription(doc.id)}
                                                            disabled={savingDescription}
                                                        >
                                                            <Check size={14} />
                                                            {savingDescription ? 'Guardando...' : 'Guardar'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline btn-sm"
                                                            onClick={handleCancelEditDescription}
                                                            disabled={savingDescription}
                                                        >
                                                            <X size={14} />
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p>
                                                    <strong>Descripción:</strong>{' '}
                                                    {doc.description || <span className="text-muted">Sin descripción</span>}
                                                    <button
                                                        type="button"
                                                        className="edit-description-btn"
                                                        onClick={() => handleStartEditDescription(doc)}
                                                    >
                                                        <Pencil size={14} />
                                                        Editar
                                                    </button>
                                                </p>
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

                {/* Payment confirmation modal */}
                {showPayModal && pricing && (
                    <div className="modal-overlay" onClick={closePayModal}>
                        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                            <h2>Confirmar pago de suscripción</h2>

                            <div className="pay-summary">
                                <p><strong>Plan:</strong> {pricing.planName}</p>
                                <p><strong>Monto:</strong> {Number(pricing.monthlyPriceBTT).toLocaleString('es-ES')} BTT</p>
                                <p><strong>Duración:</strong> {pricing.durationDays} días</p>
                                <p><strong>Inicio:</strong> {formatDate(previewDates().start)}</p>
                                <p><strong>Vencimiento:</strong> {formatDate(previewDates().end)}</p>
                                {previewDates().extended && (
                                    <p className="pay-extended">
                                        Se extiende tu suscripción vigente desde {formatDate(subscription.subscription.endDate)}.
                                    </p>
                                )}
                                <p><strong>Cuenta de cobro:</strong></p>
                                <p className="pay-address">
                                    <span>{paymentAddress ? `${paymentAddress.slice(0, 10)}...${paymentAddress.slice(-8)}` : 'No configurada'}</span>
                                    {paymentAddress && (
                                        <button
                                            type="button"
                                            className="edit-description-btn"
                                            onClick={() => copyToClipboard(paymentAddress)}
                                        >
                                            <Pencil size={14} />
                                            Copiar
                                        </button>
                                    )}
                                </p>
                            </div>

                            <p className="limit-warning">
                                MetaMask te pedirá confirmar el envío de {Number(pricing.monthlyPriceBTT).toLocaleString('es-ES')} BTT
                                desde tu wallet ({formatHash(account, 6)}). El pago se verificará en la blockchain antes de
                                activar la suscripción; no se activa ninguna suscripción sin un pago real y verificado.
                            </p>

                            {payError && (
                                <div className="alert alert-error">{payError}</div>
                            )}

                            {payStep && (
                                <div className="alert alert-info">{payStep}</div>
                            )}

                            <div className="modal-actions">
                                <button onClick={closePayModal} className="btn btn-outline" disabled={paying}>
                                    <X size={18} />
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmPayment}
                                    className="btn btn-primary"
                                    disabled={paying || !signer || !paymentAddress}
                                >
                                    <Wallet size={18} />
                                    {paying ? 'Procesando...' : `Pagar ${Number(pricing.monthlyPriceBTT).toLocaleString('es-ES')} BTT`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Admin panel inline for administrator wallets */}
                {isAdmin && <AdminPanel embedded />}
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

        .description-edit {
          margin: 10px 0;
        }

        .description-edit textarea {
          margin-top: 6px;
          resize: vertical;
        }

        .description-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .edit-description-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-left: 8px;
          padding: 0;
          border: none;
          background: none;
          color: var(--primary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .edit-description-btn:hover {
          text-decoration: underline;
        }

        .text-muted {
          color: var(--text-light);
          font-style: italic;
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
