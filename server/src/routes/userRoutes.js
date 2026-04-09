import express from 'express';
import {
    getUserOrCreate,
    updateSubscription,
    checkSubscription,
    updateProfile,
    getBalance,
    getUserLimits
} from '../controllers/userController.js';

const router = express.Router();

// Rutas
router.get('/:walletAddress', getUserOrCreate);
router.post('/:walletAddress/subscription', updateSubscription);
router.get('/:walletAddress/subscription/status', checkSubscription);
router.get('/:walletAddress/limits', getUserLimits);
router.put('/:walletAddress/profile', updateProfile);
router.get('/:walletAddress/balance', getBalance);

export default router;
