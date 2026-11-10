import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import {
    ShieldCheck,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Wallet,
    FileText,
    AlertTriangle,
    Users,
    Search,
    Plus,
    X,
    ArrowLeft,
    ArrowRight,
    Landmark,
    Coins
} from 'lucide-react';
import {
    checkAdminAccess,
    getAdminStats,
    getAdminTransactions,
    createAdminTransaction,
    getAdminClientsWithDocuments,
    getAdminExpiredSubscriptions,
    getAdminPricing,
    updateAdminPricing
} from '../services/api';

const formatWallet = (wallet = '') =>
    wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : '-';

const formatBTT = (value = 0) =>
    `${Number(value).toLocaleString('es-ES', { maximumFractionDigits: 6 })} BTT`;

const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString('es-ES') : '-';

const statusLabel = {
    confirmed: 'Confirmado',
    pending: 'Pendiente',
    failed: 'Fallido'
};

const emptyForm = {
    walletAddress: '',
    type: 'income',
    concept: '',
    category: 'other',
    amountBTT: '',
    transactionHash: '',
    notes: ''
};

const AdminPanel = ({ embedded = false }) => {
    const { account, connectWallet, isConnected } = useWeb3();
    const [isAdmin, setIsAdmin] = useState(embedded ? true : null);
    const [activeView, setActiveView] = useState('overview');
    const [loading, setLoading] = useState(null);
    const [loaded, setLoaded] = useState({});
    const [message, setMessage] = useState({ type: '', text: '' });

    const [stats, setStats] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [transactionSummary, setTransactionSummary] = useState(null);
    const [transactionPage, setTransactionPage] = useState(1);
    const [transactionPages, setTransactionPages] = useState(1);
    const [transactionFilter, setTransactionFilter] = useState('all');
    const [transactionSearch, setTransactionSearch] = useState('');

    const [clients, setClients] = useState([]);
    const [clientPage, setClientPage] = useState(1);
    const [clientPages, setClientPages] = useState(1);
    const [clientSearch, setClientSearch] = useState('');

    const [expired, setExpired] = useState([]);
    const [expiredPage, setExpiredPage] = useState(1);
    const [expiredPages, setExpiredPages] = useState(1);

    const [pricing, setPricing] = useState(null);
    const [pricingForm, setPricingForm] = useState({
        planName: '',
        monthlyPriceBTT: '',
        durationDays: ''
    });

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        if (!isConnected || !account) {
            setIsAdmin(null);
            setLoaded({});
            return;
        }

        if (embedded) {
            setIsAdmin(true);
            loadStats();
            return;
        }

        let cancelled = false;

        const verifyAccess = async () => {
            try {
                const access = await checkAdminAccess(account.toLowerCase());
                if (cancelled) return;
                setIsAdmin(access.isAdmin);
                if (access.isAdmin) {
                    loadStats();
                }
            } catch (error) {
                if (cancelled) return;
                console.error('Error verificando acceso administrador:', error);
                setIsAdmin(false);
            }
        };

        verifyAccess();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isConnected, account, embedded]);

    const handleError = (error) => {
        if (error.response?.status === 403) {
            setIsAdmin(false);
            return;
        }
        setMessage({
            type: 'error',
            text: error.response?.data?.error || 'Error consultando el panel administrativo'
        });
    };

    const loadStats = async () => {
        try {
            setLoading('overview');
            setMessage({ type: '', text: '' });
            const data = await getAdminStats(account.toLowerCase());
            setStats(data);
            setLoaded(prev => ({ ...prev, overview: true }));
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(null);
        }
    };

    const loadTransactions = async (page = transactionPage, filter = transactionFilter, search = transactionSearch) => {
        try {
            setLoading('transactions');
            setMessage({ type: '', text: '' });

            const params = { page, limit: 20 };
            if (filter !== 'all') params.type = filter;
            if (search.trim()) params.q = search.trim();

            const data = await getAdminTransactions(account.toLowerCase(), params);
            setTransactions(data.transactions || []);
            setTransactionSummary(data.summary);
            setTransactionPage(data.pagination.page);
            setTransactionPages(data.pagination.pages);
            setLoaded(prev => ({ ...prev, transactions: true }));
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(null);
        }
    };

    const loadClients = async (page = clientPage, search = clientSearch) => {
        try {
            setLoading('clients');
            setMessage({ type: '', text: '' });

            const params = { page, limit: 20 };
            if (search.trim()) params.q = search.trim();

            const data = await getAdminClientsWithDocuments(account.toLowerCase(), params);
            setClients(data.clients || []);
            setClientPage(data.pagination.page);
            setClientPages(data.pagination.pages);
            setLoaded(prev => ({ ...prev, clients: true }));
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(null);
        }
    };

    const loadExpired = async (page = expiredPage) => {
        try {
            setLoading('expired');
            setMessage({ type: '', text: '' });

            const data = await getAdminExpiredSubscriptions(account.toLowerCase(), { page, limit: 20 });
            setExpired(data.subscriptions || []);
            setExpiredPage(data.pagination.page);
            setExpiredPages(data.pagination.pages);
            setLoaded(prev => ({ ...prev, expired: true }));
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(null);
        }
    };

    const loadPricing = async () => {
        try {
            setLoading('pricing');
            setMessage({ type: '', text: '' });

            const data = await getAdminPricing(account.toLowerCase());
            setPricing(data.pricing);
            setPricingForm({
                planName: data.pricing.planName,
                monthlyPriceBTT: data.pricing.monthlyPriceBTT,
                durationDays: data.pricing.durationDays
            });
            setLoaded(prev => ({ ...prev, pricing: true }));
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(null);
        }
    };

    const handleUpdatePricing = async (event) => {
        event.preventDefault();

        try {
            setLoading('pricing-save');
            setMessage({ type: '', text: '' });

            const data = await updateAdminPricing(account.toLowerCase(), {
                planName: pricingForm.planName,
                monthlyPriceBTT: Number(pricingForm.monthlyPriceBTT),
                durationDays: Number(pricingForm.durationDays)
            });

            setPricing(data.pricing);
            setPricingForm({
                planName: data.pricing.planName,
                monthlyPriceBTT: data.pricing.monthlyPriceBTT,
                durationDays: data.pricing.durationDays
            });
            setMessage({ type: 'success', text: 'Precios de suscripción actualizados' });
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(null);
        }
    };

    const refreshAll = () => {
        loadStats();
        if (loaded.transactions) loadTransactions(transactionPage);
        if (loaded.clients) loadClients(clientPage);
        if (loaded.expired) loadExpired(expiredPage);
        if (loaded.pricing) loadPricing();
    };

    const openView = (view) => {
        setActiveView(view);

        if (view === 'overview' && !loaded.overview) loadStats();
        if (view === 'transactions' && !loaded.transactions) loadTransactions(1);
        if (view === 'clients' && !loaded.clients) loadClients(1);
        if (view === 'expired' && !loaded.expired) loadExpired(1);
        if (view === 'pricing' && !loaded.pricing) loadPricing();
    };

    const handleCreateMovement = async (event) => {
        event.preventDefault();

        try {
            setLoading('create');
            setMessage({ type: '', text: '' });

            await createAdminTransaction(account.toLowerCase(), {
                ...form,
                amountBTT: Number(form.amountBTT)
            });

            setForm(emptyForm);
            setShowForm(false);
            setMessage({ type: 'success', text: 'Movimiento registrado en el libro contable' });

            await Promise.all([
                loadTransactions(1),
                loadStats()
            ]);
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(null);
        }
    };

    if (!isConnected) {
        return (
            <div className="admin-container">
                <div className="admin-gate card">
                    <Wallet size={70} color="#2563eb" />
                    <h2>Panel Administrativo</h2>
                    <p>Conecta la wallet administradora para acceder al panel contable.</p>
                    <button onClick={connectWallet} className="btn btn-primary btn-lg">
                        Conectar MetaMask
                    </button>
                </div>
            </div>
        );
    }

    if (isAdmin === null) {
        return (
            <div className="admin-container">
                <div className="admin-gate card">
                    <RefreshCw size={50} color="#6b7280" />
                    <p>Verificando permisos de administrador...</p>
                </div>
            </div>
        );
    }

    if (isAdmin === false) {
        return (
            <div className="admin-container">
                <div className="admin-gate card">
                    <ShieldCheck size={70} color="#ef4444" />
                    <h2>Acceso denegado</h2>
                    <p>
                        La wallet {formatWallet(account)} no está autorizada para ver el panel administrativo.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            {!embedded && (
                <div className="admin-header">
                    <div className="container">
                        <div className="admin-header-content">
                            <div>
                                <h1>
                                    <ShieldCheck size={28} />
                                    Panel Administrativo
                                </h1>
                                <p className="admin-wallet">{formatWallet(account)}</p>
                            </div>
                            <button
                                onClick={refreshAll}
                                className="btn btn-outline btn-sm"
                                disabled={!!loading}
                            >
                                <RefreshCw size={16} />
                                Actualizar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="container">
                {embedded && (
                    <div className="embedded-heading">
                        <h2>
                            <ShieldCheck size={22} />
                            Panel Administrativo
                        </h2>
                        <button
                            onClick={refreshAll}
                            className="btn btn-outline btn-sm"
                            disabled={!!loading}
                        >
                            <RefreshCw size={16} />
                            Actualizar
                        </button>
                    </div>
                )}

                {message.text && (
                    <div className={`alert alert-${message.type}`}>{message.text}</div>
                )}

                <div className="admin-actions">
                    <button
                        className={`admin-action ${activeView === 'overview' ? 'active' : ''}`}
                        onClick={() => openView('overview')}
                    >
                        <Landmark size={18} />
                        Resumen contable
                    </button>
                    <button
                        className={`admin-action ${activeView === 'transactions' ? 'active' : ''}`}
                        onClick={() => openView('transactions')}
                    >
                        <TrendingUp size={18} />
                        Ingresos y pagos
                    </button>
                    <button
                        className={`admin-action ${activeView === 'clients' ? 'active' : ''}`}
                        onClick={() => openView('clients')}
                    >
                        <Users size={18} />
                        Clientes con documentos
                    </button>
                    <button
                        className={`admin-action ${activeView === 'expired' ? 'active' : ''}`}
                        onClick={() => openView('expired')}
                    >
                        <AlertTriangle size={18} />
                        Suscripciones vencidas
                    </button>
                    <button
                        className={`admin-action ${activeView === 'pricing' ? 'active' : ''}`}
                        onClick={() => openView('pricing')}
                    >
                        <Coins size={18} />
                        Precios de suscripción
                    </button>
                </div>

                {activeView === 'overview' && (
                    <div className="admin-panel card">
                        <div className="panel-heading">
                            <h2>Resumen contable</h2>
                            <button onClick={loadStats} className="btn btn-outline btn-sm" disabled={loading === 'overview'}>
                                <RefreshCw size={14} />
                                {loading === 'overview' ? 'Consultando...' : 'Consultar'}
                            </button>
                        </div>

                        {!stats ? (
                            <p className="admin-empty">Pulsa consultar para cargar el resumen.</p>
                        ) : (
                            <>
                                <div className="stat-grid">
                                    <div className="stat-card stat-income">
                                        <TrendingUp size={20} />
                                        <span>Ingresos totales</span>
                                        <strong>{formatBTT(stats.totals.incomeBTT)}</strong>
                                    </div>
                                    <div className="stat-card stat-expense">
                                        <TrendingDown size={20} />
                                        <span>Pagos totales</span>
                                        <strong>{formatBTT(stats.totals.expenseBTT)}</strong>
                                    </div>
                                    <div className="stat-card stat-net">
                                        <Landmark size={20} />
                                        <span>Balance neto</span>
                                        <strong>{formatBTT(stats.totals.netBTT)}</strong>
                                    </div>
                                    <div className="stat-card">
                                        <Users size={20} />
                                        <span>Clientes</span>
                                        <strong>{stats.clients.total}</strong>
                                    </div>
                                    <div className="stat-card">
                                        <FileText size={20} />
                                        <span>Docs con clientes</span>
                                        <strong>{stats.clients.withDocuments}</strong>
                                    </div>
                                    <div className="stat-card">
                                        <AlertTriangle size={20} />
                                        <span>Suscripciones vencidas</span>
                                        <strong>{stats.subscriptions.expired}</strong>
                                    </div>
                                </div>

                                <div className="stat-secondary">
                                    <div>
                                        <span>Ingresos del mes</span>
                                        <strong>{formatBTT(stats.currentMonth.incomeBTT)}</strong>
                                    </div>
                                    <div>
                                        <span>Pagos del mes</span>
                                        <strong>{formatBTT(stats.currentMonth.expenseBTT)}</strong>
                                    </div>
                                    <div>
                                        <span>Suscripciones activas</span>
                                        <strong>{stats.subscriptions.active}</strong>
                                    </div>
                                    <div>
                                        <span>Documentos certificados</span>
                                        <strong>{stats.documents.total} ({stats.documents.onBlockchain} en blockchain)</strong>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeView === 'transactions' && (
                    <div className="admin-panel card">
                        <div className="panel-heading">
                            <h2>Ingresos y pagos</h2>
                            <div className="panel-heading-actions">
                                <button onClick={() => setShowForm(prev => !prev)} className="btn btn-primary btn-sm">
                                    {showForm ? <X size={14} /> : <Plus size={14} />}
                                    {showForm ? 'Cancelar' : 'Registrar movimiento'}
                                </button>
                                <button
                                    onClick={() => loadTransactions(transactionPage)}
                                    className="btn btn-outline btn-sm"
                                    disabled={loading === 'transactions'}
                                >
                                    <RefreshCw size={14} />
                                    Consultar
                                </button>
                            </div>
                        </div>

                        {showForm && (
                            <form onSubmit={handleCreateMovement} className="movement-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Tipo</label>
                                        <select
                                            className="form-input"
                                            value={form.type}
                                            onChange={e => setForm({ ...form, type: e.target.value })}
                                            required
                                        >
                                            <option value="income">Ingreso</option>
                                            <option value="expense">Pago</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Monto BTT</label>
                                        <input
                                            className="form-input"
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={form.amountBTT}
                                            onChange={e => setForm({ ...form, amountBTT: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Concepto</label>
                                    <input
                                        className="form-input"
                                        value={form.concept}
                                        onChange={e => setForm({ ...form, concept: e.target.value })}
                                        placeholder="Ej. Pago de suscripción"
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Wallet del cliente</label>
                                        <input
                                            className="form-input"
                                            value={form.walletAddress}
                                            onChange={e => setForm({ ...form, walletAddress: e.target.value })}
                                            placeholder="0x..."
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Categoría</label>
                                        <select
                                            className="form-input"
                                            value={form.category}
                                            onChange={e => setForm({ ...form, category: e.target.value })}
                                        >
                                            <option value="subscription">Suscripción</option>
                                            <option value="document_certification">Certificación</option>
                                            <option value="infrastructure">Infraestructura</option>
                                            <option value="marketing">Marketing</option>
                                            <option value="gas_fees">Gas fees</option>
                                            <option value="refund">Reembolso</option>
                                            <option value="other">Otro</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Hash de transacción (opcional)</label>
                                        <input
                                            className="form-input"
                                            value={form.transactionHash}
                                            onChange={e => setForm({ ...form, transactionHash: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Notas (opcional)</label>
                                        <input
                                            className="form-input"
                                            value={form.notes}
                                            onChange={e => setForm({ ...form, notes: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary" disabled={loading === 'create'}>
                                    {loading === 'create' ? 'Guardando...' : 'Guardar movimiento'}
                                </button>
                            </form>
                        )}

                        <div className="table-toolbar">
                            <div className="filter-buttons">
                                {[
                                    { key: 'all', label: 'Todos' },
                                    { key: 'income', label: 'Ingresos' },
                                    { key: 'expense', label: 'Pagos' }
                                ].map(filter => (
                                    <button
                                        key={filter.key}
                                        className={`filter-btn ${transactionFilter === filter.key ? 'active' : ''}`}
                                        onClick={() => {
                                            setTransactionFilter(filter.key);
                                            loadTransactions(1, filter.key, transactionSearch);
                                        }}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                            <div className="search-box">
                                <Search size={16} />
                                <input
                                    value={transactionSearch}
                                    onChange={e => setTransactionSearch(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') loadTransactions(1, transactionFilter, transactionSearch);
                                    }}
                                    placeholder="Buscar concepto, wallet o hash"
                                />
                            </div>
                        </div>

                        {transactionSummary && (
                            <div className="summary-line">
                                <span>Ingresos: <strong>{formatBTT(transactionSummary.incomeBTT)}</strong></span>
                                <span>Pagos: <strong>{formatBTT(transactionSummary.expenseBTT)}</strong></span>
                                <span>Neto: <strong>{formatBTT(transactionSummary.netBTT)}</strong></span>
                            </div>
                        )}

                        {transactions.length === 0 ? (
                            <p className="admin-empty">No hay movimientos para mostrar.</p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Tipo</th>
                                            <th>Concepto</th>
                                            <th>Cliente</th>
                                            <th>Monto</th>
                                            <th>Estado</th>
                                            <th>TX</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map(transaction => (
                                            <tr key={transaction.id}>
                                                <td>{formatDate(transaction.createdAt)}</td>
                                                <td>
                                                    <span className={`pill ${transaction.type === 'income' ? 'pill-income' : 'pill-expense'}`}>
                                                        {transaction.type === 'income' ? 'Ingreso' : 'Pago'}
                                                    </span>
                                                </td>
                                                <td>{transaction.concept}</td>
                                                <td>{formatWallet(transaction.walletAddress)}</td>
                                                <td>{formatBTT(transaction.amountBTT)}</td>
                                                <td>{statusLabel[transaction.status] || transaction.status}</td>
                                                <td>
                                                    {transaction.transactionHash
                                                        ? formatWallet(transaction.transactionHash)
                                                        : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="pagination">
                            <button
                                className="btn btn-outline btn-sm"
                                disabled={transactionPage <= 1 || loading === 'transactions'}
                                onClick={() => loadTransactions(transactionPage - 1)}
                            >
                                <ArrowLeft size={14} />
                                Anterior
                            </button>
                            <span>Página {transactionPage} de {transactionPages}</span>
                            <button
                                className="btn btn-outline btn-sm"
                                disabled={transactionPage >= transactionPages || loading === 'transactions'}
                                onClick={() => loadTransactions(transactionPage + 1)}
                            >
                                Siguiente
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {activeView === 'clients' && (
                    <div className="admin-panel card">
                        <div className="panel-heading">
                            <h2>Clientes con documentos</h2>
                            <button
                                onClick={() => loadClients(clientPage)}
                                className="btn btn-outline btn-sm"
                                disabled={loading === 'clients'}
                            >
                                <RefreshCw size={14} />
                                Consultar
                            </button>
                        </div>

                        <div className="table-toolbar">
                            <div className="search-box">
                                <Search size={16} />
                                <input
                                    value={clientSearch}
                                    onChange={e => setClientSearch(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') loadClients(1, clientSearch);
                                    }}
                                    placeholder="Buscar por wallet o email"
                                />
                            </div>
                        </div>

                        {clients.length === 0 ? (
                            <p className="admin-empty">No hay clientes con documentos para mostrar.</p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Cliente</th>
                                            <th>Email</th>
                                            <th>Documentos</th>
                                            <th>En blockchain</th>
                                            <th>Último documento</th>
                                            <th>Suscripción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clients.map(client => (
                                            <tr key={client.walletAddress}>
                                                <td>{formatWallet(client.walletAddress)}</td>
                                                <td>{client.email || '-'}</td>
                                                <td>{client.documents}</td>
                                                <td>{client.onBlockchain}</td>
                                                <td>{formatDate(client.lastDocumentAt)}</td>
                                                <td>
                                                    <span className={`pill ${client.subscription.isActive ? 'pill-active' : 'pill-expired'}`}>
                                                        {client.subscription.isActive ? 'Activa' : 'Vencida'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="pagination">
                            <button
                                className="btn btn-outline btn-sm"
                                disabled={clientPage <= 1 || loading === 'clients'}
                                onClick={() => loadClients(clientPage - 1)}
                            >
                                <ArrowLeft size={14} />
                                Anterior
                            </button>
                            <span>Página {clientPage} de {clientPages}</span>
                            <button
                                className="btn btn-outline btn-sm"
                                disabled={clientPage >= clientPages || loading === 'clients'}
                                onClick={() => loadClients(clientPage + 1)}
                            >
                                Siguiente
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {activeView === 'expired' && (
                    <div className="admin-panel card">
                        <div className="panel-heading">
                            <h2>Suscripciones vencidas</h2>
                            <button
                                onClick={() => loadExpired(expiredPage)}
                                className="btn btn-outline btn-sm"
                                disabled={loading === 'expired'}
                            >
                                <RefreshCw size={14} />
                                Consultar
                            </button>
                        </div>

                        {expired.length === 0 ? (
                            <p className="admin-empty">No hay suscripciones vencidas para mostrar.</p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Cliente</th>
                                            <th>Email</th>
                                            <th>Último pago</th>
                                            <th>Vencimiento</th>
                                            <th>Días vencida</th>
                                            <th>Monto pagado</th>
                                            <th>TX</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expired.map(subscription => (
                                            <tr key={subscription.walletAddress}>
                                                <td>{formatWallet(subscription.walletAddress)}</td>
                                                <td>{subscription.email || '-'}</td>
                                                <td>{formatDate(subscription.startDate)}</td>
                                                <td>{formatDate(subscription.endDate)}</td>
                                                <td>{subscription.overdueDays}</td>
                                                <td>{formatBTT(subscription.amountBTT)}</td>
                                                <td>
                                                    {subscription.lastTransactionHash
                                                        ? formatWallet(subscription.lastTransactionHash)
                                                        : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="pagination">
                            <button
                                className="btn btn-outline btn-sm"
                                disabled={expiredPage <= 1 || loading === 'expired'}
                                onClick={() => loadExpired(expiredPage - 1)}
                            >
                                <ArrowLeft size={14} />
                                Anterior
                            </button>
                            <span>Página {expiredPage} de {expiredPages}</span>
                            <button
                                className="btn btn-outline btn-sm"
                                disabled={expiredPage >= expiredPages || loading === 'expired'}
                                onClick={() => loadExpired(expiredPage + 1)}
                            >
                                Siguiente
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {activeView === 'pricing' && (
                    <div className="admin-panel card">
                        <div className="panel-heading">
                            <h2>Precios de suscripción</h2>
                            <button
                                onClick={loadPricing}
                                className="btn btn-outline btn-sm"
                                disabled={loading === 'pricing'}
                            >
                                <RefreshCw size={14} />
                                Consultar
                            </button>
                        </div>

                        {!pricing ? (
                            <p className="admin-empty">Pulsa consultar para cargar los precios actuales.</p>
                        ) : (
                            <>
                                <div className="stat-grid">
                                    <div className="stat-card stat-net">
                                        <Coins size={20} />
                                        <span>Plan actual</span>
                                        <strong>{pricing.planName}</strong>
                                    </div>
                                    <div className="stat-card stat-income">
                                        <TrendingUp size={20} />
                                        <span>Precio</span>
                                        <strong>{formatBTT(pricing.monthlyPriceBTT)}</strong>
                                    </div>
                                    <div className="stat-card">
                                        <Landmark size={20} />
                                        <span>Duración</span>
                                        <strong>{pricing.durationDays} días</strong>
                                    </div>
                                </div>

                                <form onSubmit={handleUpdatePricing} className="movement-form">
                                    <div className="form-group">
                                        <label className="form-label">Nombre del plan</label>
                                        <input
                                            className="form-input"
                                            value={pricingForm.planName}
                                            onChange={e => setPricingForm({ ...pricingForm, planName: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Precio en BTT</label>
                                            <input
                                                className="form-input"
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={pricingForm.monthlyPriceBTT}
                                                onChange={e => setPricingForm({ ...pricingForm, monthlyPriceBTT: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Duración en días</label>
                                            <input
                                                className="form-input"
                                                type="number"
                                                min="1"
                                                max="3650"
                                                step="1"
                                                value={pricingForm.durationDays}
                                                onChange={e => setPricingForm({ ...pricingForm, durationDays: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button type="submit" className="btn btn-primary" disabled={loading === 'pricing-save'}>
                                        {loading === 'pricing-save' ? 'Guardando...' : 'Actualizar precios'}
                                    </button>
                                </form>

                                <p className="pricing-hint">
                                    Los cambios se aplican a las nuevas suscripciones. Última actualización: {formatDate(pricing.updatedAt)}.
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
                .admin-container {
                    padding-bottom: 40px;
                }

                .admin-gate {
                    max-width: 520px;
                    margin: 80px auto;
                    padding: 50px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                }

                .admin-header {
                    background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
                    color: white;
                    padding: 26px 0;
                    margin-bottom: 24px;
                }

                .embedded-heading {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin: 0 0 18px;
                    padding-top: 8px;
                }

                .embedded-heading h2 {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 22px;
                    color: var(--dark);
                }

                .admin-header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .admin-header h1 {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 28px;
                }

                .admin-wallet {
                    opacity: 0.8;
                    margin-top: 6px;
                    font-size: 14px;
                }

                .admin-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-bottom: 24px;
                }

                .admin-action {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 18px;
                    border: 2px solid var(--border);
                    background: white;
                    border-radius: 8px;
                    font-weight: 600;
                    color: var(--text);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .admin-action:hover {
                    border-color: var(--primary);
                    color: var(--primary);
                }

                .admin-action.active {
                    background: var(--primary);
                    border-color: var(--primary);
                    color: white;
                }

                .admin-panel {
                    padding: 24px;
                    margin-bottom: 30px;
                }

                .panel-heading {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .panel-heading h2 {
                    font-size: 22px;
                    color: var(--dark);
                }

                .panel-heading-actions {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .stat-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 16px;
                }

                .stat-card {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    padding: 18px;
                    border-radius: 10px;
                    background: var(--light);
                    border: 1px solid var(--border);
                }

                .stat-card span {
                    color: var(--text-light);
                    font-size: 13px;
                    font-weight: 600;
                }

                .stat-card strong {
                    font-size: 20px;
                    color: var(--dark);
                }

                .stat-income {
                    border-left: 4px solid var(--secondary);
                }

                .stat-expense {
                    border-left: 4px solid var(--danger);
                }

                .stat-net {
                    border-left: 4px solid var(--primary);
                }

                .stat-secondary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 12px;
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid var(--border);
                }

                .stat-secondary div {
                    display: flex;
                    justify-content: space-between;
                    gap: 10px;
                    font-size: 14px;
                }

                .stat-secondary span {
                    color: var(--text-light);
                }

                .table-toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .filter-buttons {
                    display: flex;
                    gap: 8px;
                }

                .filter-btn {
                    padding: 8px 14px;
                    border: 1px solid var(--border);
                    background: white;
                    border-radius: 20px;
                    cursor: pointer;
                    font-weight: 600;
                    color: var(--text-light);
                }

                .filter-btn.active {
                    background: var(--primary);
                    border-color: var(--primary);
                    color: white;
                }

                .search-box {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    background: white;
                }

                .search-box input {
                    border: none;
                    outline: none;
                    min-width: 240px;
                    font-size: 14px;
                }

                .summary-line {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                    padding: 12px 16px;
                    background: var(--light);
                    border-radius: 8px;
                    margin-bottom: 16px;
                    font-size: 14px;
                }

                .table-wrapper {
                    overflow-x: auto;
                }

                .admin-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 14px;
                }

                .admin-table th {
                    text-align: left;
                    padding: 10px 12px;
                    background: var(--light);
                    color: var(--text-light);
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    border-bottom: 1px solid var(--border);
                    white-space: nowrap;
                }

                .admin-table td {
                    padding: 12px;
                    border-bottom: 1px solid var(--border);
                    color: var(--text);
                    white-space: nowrap;
                }

                .pill {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                }

                .pill-income,
                .pill-active {
                    background: #d1fae5;
                    color: #065f46;
                }

                .pill-expense,
                .pill-expired {
                    background: #fee2e2;
                    color: #991b1b;
                }

                .pagination {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 16px;
                    margin-top: 20px;
                    font-size: 14px;
                    color: var(--text-light);
                }

                .admin-empty {
                    padding: 30px 10px;
                    text-align: center;
                    color: var(--text-light);
                }

                .pricing-hint {
                    margin-top: 16px;
                    font-size: 13px;
                    color: var(--text-light);
                }

                .movement-form {
                    padding: 18px;
                    background: var(--light);
                    border-radius: 10px;
                    margin-bottom: 20px;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 16px;
                }

                @media (max-width: 768px) {
                    .table-toolbar {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .search-box input {
                        min-width: 0;
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
};

export default AdminPanel;
