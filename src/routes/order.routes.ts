import express from 'express';
import {
    createOrder,
    getOrderById,
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
    cancelOrderByUser,
} from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authenticateAdmin } from '../middleware/admin.middleware.js';
import { validate } from '../middleware/validator.middleware.js';
import { createOrderSchema } from '../middleware/order.validator.js';

const router = express.Router();

// ── Admin routes — must come BEFORE /:id so /admin/all is not swallowed ──────
router.get('/admin/all', authenticateAdmin, getAllOrders);
router.patch('/admin/:id/status', authenticateAdmin, updateOrderStatus);

// ── Guest checkout (no auth required) ─────────────────────────────────────────
router.post('/guest', validate(createOrderSchema), createOrder);

// ── Authenticated user routes ──────────────────────────────────────────────────
router.post('/', authenticate, validate(createOrderSchema), createOrder);
router.get('/my-orders', authenticate, getUserOrders);

// User cancel — must come before /:id
router.patch('/:id/cancel', authenticate, cancelOrderByUser);

// Admin status update via /:id/status (kept for backward compat with modal)
router.patch('/:id/status', authenticateAdmin, updateOrderStatus);

// Generic order lookup
router.get('/:id', getOrderById);

export default router;