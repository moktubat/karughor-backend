import express from 'express';
import {
    createOrder,
    getOrderById,
    getUserOrders,
    getAllOrders,
    updateOrderStatus
} from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authenticateAdmin } from '../middleware/admin.middleware.js';
import { validate } from '../middleware/validator.middleware.js';
import { createOrderSchema } from '../middleware/order.validator.js';

const router = express.Router();

// Guest checkout (no auth required)
router.post('/guest', validate(createOrderSchema), createOrder);

// User routes (optional auth)
router.post('/', authenticate, validate(createOrderSchema), createOrder);
router.get('/my-orders', authenticate, getUserOrders);
router.get('/:id', getOrderById);

// Admin routes
router.get('/admin/all', authenticateAdmin, getAllOrders);
router.patch('/:id/status', authenticateAdmin, updateOrderStatus);

export default router;
