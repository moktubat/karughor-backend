import { Request, Response, NextFunction } from 'express';
import Category from '../models/Category.model.js';
import { ApiError } from '../utils/ApiError.js';
import { successResponse } from '../utils/ApiResponse.js';

// ─── Public ──────────────────────────────────────────────────────────────────

// GET /api/categories  – active categories (public)
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

// GET /api/categories/:slug  – single category with subcategories
export const getCategoryBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const category = await Category.findOne({ slug: req.params.slug, isActive: true });
        if (!category) throw new ApiError(404, 'Category not found');

        successResponse(res, { category });
    } catch (error) {
        next(error);
    }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

// GET /api/admin/categories  – all categories (admin)
export const getAllCategoriesAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categories = await Category.find().sort({ sortOrder: 1, createdAt: 1 });
        successResponse(res, { categories });
    } catch (error) {
        next(error);
    }
};


