import express from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import orderRoutes from './order.routes.js';
import userRoutes from './user.routes.js';
import adminRoutes from './admin.routes.js';
import settingsRoutes from './settings.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/settings', settingsRoutes);

export default router;
