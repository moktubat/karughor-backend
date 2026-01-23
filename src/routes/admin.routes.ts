import express from 'express';
import {
    getDashboardStats,
    getRevenueStats,
    getAdminProfile,
    updateAdminProfile,
    changeAdminPassword
} from '../controllers/admin.controller.js';
import { authenticateAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

router.use(authenticateAdmin); // All routes require admin auth

router.get('/dashboard/stats', getDashboardStats);
router.get('/revenue/stats', getRevenueStats);
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);
router.put('/profile/password', changeAdminPassword);

export default router;
