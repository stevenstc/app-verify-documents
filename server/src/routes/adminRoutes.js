import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import {
    getAdminAccess,
    getStats,
    getTransactions,
    createTransaction,
    getClientsWithDocuments,
    getExpiredSubscriptions,
    getPricing,
    updatePricing
} from '../controllers/adminController.js';

const router = express.Router();

// Todas las rutas administrativas exigen una wallet administradora
router.use(adminAuth);

router.get('/access', getAdminAccess);
router.get('/stats', getStats);
router.get('/transactions', getTransactions);
router.post('/transactions', createTransaction);
router.get('/clients/documents', getClientsWithDocuments);
router.get('/subscriptions/expired', getExpiredSubscriptions);
router.get('/settings/pricing', getPricing);
router.put('/settings/pricing', updatePricing);

export default router;
