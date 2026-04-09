import User from '../models/User.js';
import blockchainService from '../services/blockchainService.js';

/**
 * Obtiene o crea un usuario por wallet address
 */
export const getUserOrCreate = async (req, res) => {
    try {
        const { walletAddress } = req.params;

        let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

        if (!user) {
            user = new User({
                walletAddress: walletAddress.toLowerCase()
            });
            await user.save();
        }

        res.json({
            user: {
                walletAddress: user.walletAddress,
                email: user.email,
                subscription: user.subscription,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        res.status(500).json({ error: 'Error obteniendo usuario' });
    }
};

/**
 * Actualiza la suscripción de un usuario
 */
export const updateSubscription = async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const { transactionHash, amountBTT } = req.body;

        const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Calcular fechas de suscripción (1 mes)
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        user.subscription = {
            isActive: true,
            startDate: startDate,
            endDate: endDate,
            transactionHash: transactionHash,
            amountBTT: amountBTT
        };

        await user.save();

        res.json({
            message: 'Suscripción activada exitosamente',
            subscription: user.subscription
        });
    } catch (error) {
        console.error('Error actualizando suscripción:', error);
        res.status(500).json({ error: 'Error actualizando suscripción' });
    }
};

/**
 * Verifica el estado de suscripción de un usuario
 */
export const checkSubscription = async (req, res) => {
    try {
        const { walletAddress } = req.params;

        const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const isActive = user.subscription.isActive &&
            user.subscription.endDate &&
            new Date(user.subscription.endDate) > new Date();

        res.json({
            isActive: isActive,
            subscription: user.subscription,
            daysRemaining: isActive ?
                Math.ceil((new Date(user.subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0
        });
    } catch (error) {
        console.error('Error verificando suscripción:', error);
        res.status(500).json({ error: 'Error verificando suscripción' });
    }
};

/**
 * Actualiza el perfil del usuario
 */
export const updateProfile = async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const { email } = req.body;

        const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (email) {
            user.email = email;
        }

        await user.save();

        res.json({
            message: 'Perfil actualizado exitosamente',
            user: {
                walletAddress: user.walletAddress,
                email: user.email,
                subscription: user.subscription
            }
        });
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({ error: 'Error actualizando perfil' });
    }
};

/**
 * Obtiene el balance de BTT del usuario
 */
export const getBalance = async (req, res) => {
    try {
        const { walletAddress } = req.params;

        const balance = await blockchainService.getBalance(walletAddress);

        res.json({
            walletAddress: walletAddress,
            balance: balance,
            currency: 'BTT'
        });
    } catch (error) {
        console.error('Error obteniendo balance:', error);
        res.status(500).json({ error: 'Error obteniendo balance' });
    }
};

/**
 * Obtiene los límites de documentos del usuario
 */
export const getUserLimits = async (req, res) => {
    try {
        const { walletAddress } = req.params;

        const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

        if (!user) {
            return res.json({
                hasSubscription: false,
                freeDocumentsUsed: 0,
                freeDocumentsLimit: 1,
                remaining: 1,
                canUpload: true
            });
        }

        const hasActiveSubscription = user.subscription.isActive &&
            user.subscription.endDate &&
            new Date(user.subscription.endDate) > new Date();

        if (hasActiveSubscription) {
            return res.json({
                hasSubscription: true,
                unlimited: true,
                canUpload: true
            });
        }

        const remaining = user.freeDocumentsLimit - (user.freeDocumentsUsed || 0);

        res.json({
            hasSubscription: false,
            freeDocumentsUsed: user.freeDocumentsUsed || 0,
            freeDocumentsLimit: user.freeDocumentsLimit,
            remaining: remaining,
            canUpload: remaining > 0
        });
    } catch (error) {
        console.error('Error obteniendo límites:', error);
        res.status(500).json({ error: 'Error obteniendo límites' });
    }
};
