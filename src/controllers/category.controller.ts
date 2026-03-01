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

// POST /api/admin/categories
export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, icon, description, isActive, sortOrder } = req.body;

        // Generate slug from name
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // Check duplicate slug
        const existing = await Category.findOne({ slug });
        if (existing) throw new ApiError(400, 'A category with this name already exists');

        const category = await Category.create({ name, slug, icon, description, isActive, sortOrder });
        successResponse(res, { category }, 'Category created successfully', 201);
    } catch (error) {
        next(error);
    }
};

// PUT /api/admin/categories/:id
export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, icon, description, isActive, sortOrder } = req.body;

        const updateData: any = { icon, description, isActive, sortOrder };
        if (name) {
            updateData.name = name;
            updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }

        const category = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        if (!category) throw new ApiError(404, 'Category not found');

        successResponse(res, { category }, 'Category updated successfully');
    } catch (error) {
        next(error);
    }
};

// DELETE /api/admin/categories/:id
export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) throw new ApiError(404, 'Category not found');

        successResponse(res, null, 'Category deleted successfully');
    } catch (error) {
        next(error);
    }
};

// ─── Sub-Categories ───────────────────────────────────────────────────────────

// POST /api/admin/categories/:id/sub
export const addSubCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name } = req.body;
        if (!name) throw new ApiError(400, 'Sub-category name is required');

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const category = await Category.findById(req.params.id);
        if (!category) throw new ApiError(404, 'Category not found');

        category.subCategories.push({ name, slug, isActive: true });
        await category.save();

        successResponse(res, { category }, 'Sub-category added');
    } catch (error) {
        next(error);
    }
};

// PUT /api/admin/categories/:id/sub/:subId
export const updateSubCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, isActive } = req.body;

        const category = await Category.findById(req.params.id);
        if (!category) throw new ApiError(404, 'Category not found');

        const sub = category.subCategories.find((s) => s._id!.toString() === req.params.subId);
        if (!sub) throw new ApiError(404, 'Sub-category not found');

        if (name) { sub.name = name; sub.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
        if (typeof isActive === 'boolean') sub.isActive = isActive;

        await category.save();
        successResponse(res, { category }, 'Sub-category updated');
    } catch (error) {
        next(error);
    }
};

// DELETE /api/admin/categories/:id/sub/:subId
export const deleteSubCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) throw new ApiError(404, 'Category not found');

        category.subCategories = category.subCategories.filter(
            (s) => s._id!.toString() !== req.params.subId
        );
        await category.save();

        successResponse(res, { category }, 'Sub-category deleted');
    } catch (error) {
        next(error);
    }
};