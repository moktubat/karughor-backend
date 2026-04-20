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
import { upload } from '../config/multer.js';

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Admin routes — removed validate() from create/update since images come via multipart
// Validation of text fields is handled inside the controller
router.post(
    '/',
    authenticateAdmin,
    upload.array('images', 5),
    createProduct
);
router.put(
    '/:id',
    authenticateAdmin,
    upload.array('images', 5),
    updateProduct
);
router.delete('/:id', authenticateAdmin, deleteProduct);
router.patch('/:id/toggle', authenticateAdmin, toggleProductStatus);
router.get('/admin/low-stock', authenticateAdmin, getLowStockProducts);

export default router;