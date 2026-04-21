import express from 'express';
import {
    getCategories,
    getCategoryBySlug,
    getCategoryCounts,
    getAllCategoriesAdmin,
} from '../controllers/category.controller.js';
import { authenticateAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

// ── Public Routes ─────────────────────────────────────────────────────────────
router.get('/', getCategories);
router.get('/counts', getCategoryCounts);
router.get('/:slug', getCategoryBySlug);

// ── Admin Routes ──────────────────────────────────────────────────────────────
router.get('/admin/all', authenticateAdmin, getAllCategoriesAdmin);

export default router;