import express from 'express';
import {
    createProduct,
    deleteProduct,
    getAllProducts,
    getLowStockProducts,
    getProductById,
    toggleProductStatus,
    updateProduct
} from '../controllers/product.controller.js';
import { authenticateAdmin } from '../middleware/admin.middleware.js';
import { validate } from '../middleware/validator.middleware.js';
import { createProductSchema } from '../middleware/product.validator.js';
import { upload } from '../config/multer.js';

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Admin routes
router.post(
    '/',
    authenticateAdmin,
    upload.array('images', 5),          // ← Cloudinary upload middleware
    validate(createProductSchema),
    createProduct
);
router.put(
    '/:id',
    authenticateAdmin,
    upload.array('images', 5),          // ← also for edit (new images)
    updateProduct
);
router.delete('/:id', authenticateAdmin, deleteProduct);
router.patch('/:id/toggle', authenticateAdmin, toggleProductStatus);
router.get('/admin/low-stock', authenticateAdmin, getLowStockProducts);

export default router;