import User from '../models/User.js';

/**
 * Obtiene las wallets administradoras configuradas por variable de entorno.
 * Soporta ADMIN_WALLETS (lista separada por comas) o ADMIN_WALLET (una sola).
 */
const getConfiguredAdminWallets = () => {
    const raw = process.env.ADMIN_WALLETS || process.env.ADMIN_WALLET || '';
    return raw
        .split(',')
        .map(wallet => wallet.trim().toLowerCase())
        .filter(Boolean);
};

export const isAdminWallet = async (walletAddress) => {
    if (!walletAddress) return false;

    const wallet = walletAddress.toString().toLowerCase();

    if (getConfiguredAdminWallets().includes(wallet)) {
        return true;
    }

    const user = await User.findOne({ walletAddress: wallet });
    return !!user && user.role === 'admin';
};

/**
 * Middleware que exige que la petición venga de una wallet administradora.
 * La wallet se recibe por el header x-wallet-address (también se acepta
 * walletAddress en query o body).
 */
export const adminAuth = async (req, res, next) => {
    try {
        const walletAddress = (
            req.headers['x-wallet-address'] ||
            req.query.walletAddress ||
            req.body?.walletAddress ||
            ''
        ).toString().toLowerCase();

        if (!walletAddress) {
            return res.status(401).json({
                error: 'Wallet administradora requerida'
            });
        }

        const authorized = await isAdminWallet(walletAddress);

        if (!authorized) {
            return res.status(403).json({
                error: 'Acceso denegado: esta wallet no es administradora'
            });
        }

        req.adminWallet = walletAddress;
        next();
    } catch (error) {
        console.error('Error verificando wallet administradora:', error);
        res.status(500).json({ error: 'Error verificando permisos de administrador' });
    }
};
