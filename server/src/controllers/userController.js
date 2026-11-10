import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import blockchainService from '../services/blockchainService.js';
import { getPricingSettings } from '../services/settingsService.js';

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
 * Obtiene los precios públicos de la suscripción y la cuenta de cobro.
 */
export const getPricing = async (req, res) => {
    try {
        const pricing = await getPricingSettings();
        res.json({
            pricing,
            paymentAddress: blockchainService.serviceWallet || null
        });
    } catch (error) {
        console.error('Error obteniendo precios:', error);
        res.status(500).json({ error: 'Error obteniendo los precios de suscripción' });
    }
};

/**
 * Activa la suscripción de un usuario.
 * El pago se verifica SIEMPRE en la blockchain antes de activar:
 * la transacción debe existir, estar confirmada, venir de la wallet del
 * usuario, llegar a la cuenta de cobro y cubrir el monto configurado.
 */
export const updateSubscription = async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const { transactionHash } = req.body;

        const normalizedWallet = walletAddress.toLowerCase();

        if (!transactionHash || typeof transactionHash !== 'string') {
            return res.status(400).json({
                error: 'Debes enviar el hash de la transacción de pago realizada en BTTChain'
            });
        }

        const user = await User.findOne({ walletAddress: normalizedWallet });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Anti-reutilización: un hash de pago solo puede activar una suscripción
        const alreadyUsed = await Transaction.findOne({ transactionHash: transactionHash.trim() });

        if (alreadyUsed) {
            return res.status(409).json({ error: 'Esta transacción de pago ya fue utilizada' });
        }

        const pricing = await getPricingSettings();
        const requiredAmount = Number(pricing.monthlyPriceBTT);

        let verification;
        try {
            verification = await blockchainService.verifySubscriptionPayment(
                transactionHash,
                requiredAmount,
                normalizedWallet
            );
        } catch (blockchainError) {
            console.error('Error verificando pago en blockchain:', blockchainError);
            return res.status(503).json({
                error: 'No fue posible verificar el pago en la blockchain. Intenta de nuevo.'
            });
        }

        if (!verification.valid) {
            return res.status(400).json({
                error: `Pago inválido: ${verification.reason}`,
                requiredAmountBTT: requiredAmount,
                durationDays: pricing.durationDays
            });
        }

        // Si la suscripción aún está vigente, se extiende desde su vencimiento
        const startDate = new Date();
        const currentEnd = user.subscription?.endDate ? new Date(user.subscription.endDate) : null;
        const baseDate = user.subscription?.isActive && currentEnd && currentEnd > startDate
            ? currentEnd
            : startDate;
        const endDate = new Date(baseDate.getTime() + pricing.durationDays * 24 * 60 * 60 * 1000);

        user.subscription = {
            isActive: true,
            startDate: startDate,
            endDate: endDate,
            transactionHash: verification.transactionHash,
            amountBTT: verification.amountBTT
        };

        await user.save();

        // Registrar el pago verificado en el libro contable para el panel administrativo
        try {
            await Transaction.create({
                walletAddress: user.walletAddress,
                type: 'income',
                concept: `${pricing.planName} DocuChain`,
                category: 'subscription',
                amountBTT: verification.amountBTT,
                transactionHash: verification.transactionHash,
                status: 'confirmed',
                createdBy: user.walletAddress,
                notes: `Verificada on-chain en bloque ${verification.blockNumber}`
            });
        } catch (ledgerError) {
            if (ledgerError?.code === 11000) {
                return res.status(409).json({ error: 'Esta transacción de pago ya fue utilizada' });
            }
            console.error('Error registrando pago en el libro contable:', ledgerError);
        }

        res.json({
            message: 'Pago verificado en blockchain. Suscripción activada exitosamente',
            subscription: {
                ...user.subscription,
                blockNumber: verification.blockNumber,
                blockTimestamp: verification.blockTimestamp
            },
            pricing
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
