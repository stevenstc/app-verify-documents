import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Document from '../models/Document.js';
import { getPricingSettings, savePricingSettings } from '../services/settingsService.js';

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePagination = (query) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 25, 1), 100);
    return { page, limit, skip: (page - 1) * limit };
};

const toNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
};

/**
 * Confirma que la wallet autenticada es administradora.
 */
export const getAdminAccess = async (req, res) => {
    res.json({
        isAdmin: true,
        walletAddress: req.adminWallet
    });
};

/**
 * Obtiene los precios actuales de la suscripción.
 */
export const getPricing = async (req, res) => {
    try {
        const pricing = await getPricingSettings();
        res.json({ pricing });
    } catch (error) {
        console.error('Error obteniendo precios:', error);
        res.status(500).json({ error: 'Error obteniendo los precios de suscripción' });
    }
};

/**
 * Actualiza los precios de la suscripción desde el panel administrativo.
 */
export const updatePricing = async (req, res) => {
    try {
        const { planName, monthlyPriceBTT, durationDays } = req.body;
        const price = Number(monthlyPriceBTT);
        const duration = Number(durationDays);

        if (!Number.isFinite(price) || price < 0) {
            return res.status(400).json({ error: 'El precio mensual en BTT debe ser un número válido' });
        }

        if (!Number.isInteger(duration) || duration < 1 || duration > 3650) {
            return res.status(400).json({ error: 'La duración debe ser un número entero de días entre 1 y 3650' });
        }

        const pricing = await savePricingSettings({
            planName,
            monthlyPriceBTT: price,
            durationDays: duration,
            updatedBy: req.adminWallet
        });

        res.json({
            message: 'Precios actualizados exitosamente',
            pricing
        });
    } catch (error) {
        console.error('Error actualizando precios:', error);
        res.status(500).json({ error: 'Error actualizando los precios de suscripción' });
    }
};

/**
 * Resumen contable y de clientes del negocio.
 */
export const getStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

        const [totalsAgg, monthAgg, totalClients, clientsWithDocuments, totalDocuments, onBlockchain, activeSubscriptions, expiredSubscriptions] =
            await Promise.all([
                Transaction.aggregate([
                    { $match: { status: 'confirmed' } },
                    { $group: { _id: '$type', total: { $sum: '$amountBTT' } } }
                ]),
                Transaction.aggregate([
                    { $match: { status: 'confirmed', createdAt: { $gte: startOfMonth } } },
                    { $group: { _id: '$type', total: { $sum: '$amountBTT' } } }
                ]),
                User.countDocuments({}),
                Document.distinct('owner'),
                Document.countDocuments({}),
                Document.countDocuments({ storedInBlockchain: true }),
                User.countDocuments({
                    'subscription.isActive': true,
                    'subscription.endDate': { $gt: now }
                }),
                User.countDocuments({
                    'subscription.endDate': { $lte: now }
                })
            ]);

        const sumByType = (rows) => ({
            income: toNumber(rows.find(row => row._id === 'income')?.total),
            expense: toNumber(rows.find(row => row._id === 'expense')?.total)
        });

        const totals = sumByType(totalsAgg);
        const month = sumByType(monthAgg);
        const clientsWithDocsCount = clientsWithDocuments.filter(Boolean).length;

        res.json({
            totals: {
                incomeBTT: totals.income,
                expenseBTT: totals.expense,
                netBTT: totals.income - totals.expense
            },
            currentMonth: {
                incomeBTT: month.income,
                expenseBTT: month.expense,
                netBTT: month.income - month.expense
            },
            clients: {
                total: totalClients,
                withDocuments: clientsWithDocsCount,
                withoutDocuments: Math.max(totalClients - clientsWithDocsCount, 0)
            },
            subscriptions: {
                active: activeSubscriptions,
                expired: expiredSubscriptions
            },
            documents: {
                total: totalDocuments,
                onBlockchain
            },
            generatedAt: now.toISOString()
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas administrativas:', error);
        res.status(500).json({ error: 'Error obteniendo el resumen administrativo' });
    }
};

/**
 * Lista movimientos contables (ingresos y pagos) con filtros y paginación.
 */
export const getTransactions = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const filter = {};

        if (req.query.type && ['income', 'expense'].includes(req.query.type)) {
            filter.type = req.query.type;
        }

        if (req.query.category) {
            filter.category = req.query.category;
        }

        if (req.query.status && ['pending', 'confirmed', 'failed'].includes(req.query.status)) {
            filter.status = req.query.status;
        }

        if (req.query.q) {
            const regex = new RegExp(escapeRegex(req.query.q.trim()), 'i');
            filter.$or = [
                { concept: regex },
                { walletAddress: regex },
                { transactionHash: regex }
            ];
        }

        if (req.query.from || req.query.to) {
            filter.createdAt = {};
            if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
            if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
        }

        const [transactions, total, totalsAgg] = await Promise.all([
            Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Transaction.countDocuments(filter),
            Transaction.aggregate([
                { $match: filter },
                { $group: { _id: '$type', total: { $sum: '$amountBTT' } } }
            ])
        ]);

        const incomeBTT = toNumber(totalsAgg.find(row => row._id === 'income')?.total);
        const expenseBTT = toNumber(totalsAgg.find(row => row._id === 'expense')?.total);

        res.json({
            transactions: transactions.map(transaction => ({
                id: transaction._id,
                walletAddress: transaction.walletAddress,
                type: transaction.type,
                concept: transaction.concept,
                category: transaction.category,
                amountBTT: transaction.amountBTT,
                transactionHash: transaction.transactionHash,
                status: transaction.status,
                notes: transaction.notes,
                createdAt: transaction.createdAt
            })),
            summary: {
                incomeBTT,
                expenseBTT,
                netBTT: incomeBTT - expenseBTT
            },
            pagination: {
                page,
                limit,
                total,
                pages: Math.max(Math.ceil(total / limit), 1)
            }
        });
    } catch (error) {
        console.error('Error obteniendo movimientos contables:', error);
        res.status(500).json({ error: 'Error obteniendo los movimientos contables' });
    }
};

/**
 * Registra manualmente un ingreso o pago en el libro contable.
 */
export const createTransaction = async (req, res) => {
    try {
        const { walletAddress, type, concept, category, amountBTT, transactionHash, status, notes, relatedDocument } = req.body;

        if (!type || !['income', 'expense'].includes(type)) {
            return res.status(400).json({ error: 'El tipo debe ser income o expense' });
        }

        if (!concept || !concept.trim()) {
            return res.status(400).json({ error: 'El concepto es requerido' });
        }

        const amount = Number(amountBTT);

        if (!Number.isFinite(amount) || amount < 0) {
            return res.status(400).json({ error: 'El monto en BTT debe ser un número válido' });
        }

        if (!walletAddress) {
            return res.status(400).json({ error: 'La wallet del cliente es requerida' });
        }

        if (transactionHash) {
            const existing = await Transaction.findOne({ transactionHash });
            if (existing) {
                return res.status(409).json({
                    error: 'Ya existe un movimiento con este hash de transacción',
                    transactionId: existing._id
                });
            }
        }

        const transaction = await Transaction.create({
            walletAddress: walletAddress.toLowerCase(),
            type,
            concept: concept.trim(),
            category: category || 'other',
            amountBTT: amount,
            transactionHash: transactionHash || undefined,
            status: status || 'confirmed',
            relatedDocument: relatedDocument || undefined,
            notes: notes || undefined,
            createdBy: req.adminWallet
        });

        res.status(201).json({
            message: 'Movimiento registrado exitosamente',
            transaction: {
                id: transaction._id,
                walletAddress: transaction.walletAddress,
                type: transaction.type,
                concept: transaction.concept,
                category: transaction.category,
                amountBTT: transaction.amountBTT,
                transactionHash: transaction.transactionHash,
                status: transaction.status,
                createdAt: transaction.createdAt
            }
        });
    } catch (error) {
        console.error('Error registrando movimiento contable:', error);
        res.status(500).json({ error: 'Error registrando el movimiento contable' });
    }
};

/**
 * Clientes con documentos subidos, cantidad de documentos y estado de suscripción.
 */
export const getClientsWithDocuments = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const now = new Date();
        const matchStage = {};

        if (req.query.q) {
            const regex = new RegExp(escapeRegex(req.query.q.trim()), 'i');
            matchStage.$or = [
                { '_id': regex },
                { 'user.email': regex }
            ];
        }

        const pipeline = [
            {
                $group: {
                    _id: '$owner',
                    documents: { $sum: 1 },
                    onBlockchain: {
                        $sum: { $cond: ['$storedInBlockchain', 1, 0] }
                    },
                    lastDocumentAt: { $max: '$createdAt' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: 'walletAddress',
                    as: 'user'
                }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            { $sort: { documents: -1, lastDocumentAt: -1 } }
        ];

        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }

        pipeline.push({
            $facet: {
                data: [{ $skip: skip }, { $limit: limit }],
                total: [{ $count: 'count' }]
            }
        });

        const [result] = await Document.aggregate(pipeline);
        const total = result.total[0]?.count || 0;

        res.json({
            clients: result.data.map(client => {
                const subscription = client.user?.subscription || {};
                const isActive = !!subscription.isActive &&
                    !!subscription.endDate &&
                    new Date(subscription.endDate) > now;

                return {
                    walletAddress: client._id,
                    email: client.user?.email || null,
                    documents: client.documents,
                    onBlockchain: client.onBlockchain,
                    lastDocumentAt: client.lastDocumentAt,
                    subscription: {
                        isActive,
                        endDate: subscription.endDate || null
                    },
                    role: client.user?.role || 'user'
                };
            }),
            pagination: {
                page,
                limit,
                total,
                pages: Math.max(Math.ceil(total / limit), 1)
            }
        });
    } catch (error) {
        console.error('Error obteniendo clientes con documentos:', error);
        res.status(500).json({ error: 'Error obteniendo clientes con documentos' });
    }
};

/**
 * Clientes cuya suscripción ya venció.
 */
export const getExpiredSubscriptions = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const now = new Date();
        const filter = {
            'subscription.startDate': { $exists: true },
            'subscription.endDate': { $lte: now }
        };

        if (req.query.q) {
            const regex = new RegExp(escapeRegex(req.query.q.trim()), 'i');
            filter.$or = [
                { walletAddress: regex },
                { email: regex }
            ];
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .sort({ 'subscription.endDate': 1 })
                .skip(skip)
                .limit(limit)
                .select('walletAddress email subscription role createdAt')
                .lean(),
            User.countDocuments(filter)
        ]);

        res.json({
            subscriptions: users.map(user => {
                const endDate = user.subscription.endDate;
                const overdueDays = Math.max(
                    Math.floor((now - new Date(endDate)) / (1000 * 60 * 60 * 24)),
                    0
                );

                return {
                    walletAddress: user.walletAddress,
                    email: user.email || null,
                    startDate: user.subscription.startDate,
                    endDate,
                    overdueDays,
                    isActiveFlag: user.subscription.isActive,
                    lastTransactionHash: user.subscription.transactionHash || null,
                    amountBTT: user.subscription.amountBTT || 0,
                    role: user.role
                };
            }),
            pagination: {
                page,
                limit,
                total,
                pages: Math.max(Math.ceil(total / limit), 1)
            }
        });
    } catch (error) {
        console.error('Error obteniendo suscripciones vencidas:', error);
        res.status(500).json({ error: 'Error obteniendo suscripciones vencidas' });
    }
};
