import express from 'express';
import {
    getCategories,
    getCategoryBySlug,
    getAllCategoriesAdmin,
    createCategory,
    updateCategory,
    deleteCategory,
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
} from '../controllers/category.controller.js';
import { authenticateAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

// ── Public Routes ─────────────────────────────────────────────────────────────
router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);

// ── Admin Routes ──────────────────────────────────────────────────────────────
router.get('/admin/all', authenticateAdmin, getAllCategoriesAdmin);
router.post('/admin', authenticateAdmin, createCategory);
router.put('/admin/:id', authenticateAdmin, updateCategory);
router.delete('/admin/:id', authenticateAdmin, deleteCategory);

// Sub-categories
router.post('/admin/:id/sub', authenticateAdmin, addSubCategory);
router.put('/admin/:id/sub/:subId', authenticateAdmin, updateSubCategory);
router.delete('/admin/:id/sub/:subId', authenticateAdmin, deleteSubCategory);

export default router;