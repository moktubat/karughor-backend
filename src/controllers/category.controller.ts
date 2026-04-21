import { Request, Response, NextFunction } from 'express';
import Category from '../models/Category.model.js';
import Product from '../models/Product.model.js';
import { ApiError } from '../utils/ApiError.js';
import { successResponse } from '../utils/ApiResponse.js';

// ── Public ──────────────────────────────────────────────────────────────────
// GET /api/categories
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categories = await Category.find({ isActive: true })
            .sort({ sortOrder: 1, createdAt: 1 })
            .select('-__v');

        successResponse(res, { categories });
    } catch (error) {
        next(error);
    }
};

// GET /api/categories/:slug
export const getCategoryBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const category = await Category.findOne({ slug: req.params.slug, isActive: true });
        if (!category) throw new ApiError(404, 'Category not found');

        successResponse(res, { category });
    } catch (error) {
        next(error);
    }
};

// ✅ NEW: GET /api/categories/counts
// Returns product count per category name — avoids fetching 1000 products client-side.
export const getCategoryCounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const counts = await Product.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: { $toLower: '$category' },
                    count: { $sum: 1 },
                },
            },
        ]);

        // Build a map: { "jute rug": 12, "nakshi kantha": 5, ... }
        const countsMap: Record<string, number> = {};
        for (const entry of counts) {
            if (entry._id) countsMap[entry._id] = entry.count;
        }

        successResponse(res, { counts: countsMap });
    } catch (error) {
        next(error);
    }
};

// ── Admin ─────────────────────────────────────────────────────────────────────
// GET /api/admin/categories
export const getAllCategoriesAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categories = await Category.find().sort({ sortOrder: 1, createdAt: 1 });
        successResponse(res, { categories });
    } catch (error) {
        next(error);
    }
};