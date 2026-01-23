import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product.model.js';
import { ApiError } from '../utils/ApiError.js';
import { successResponse } from '../utils/ApiResponse.js';

// Get all products
export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page = 1, limit = 20, category, search, sort = '-createdAt' } = req.query as any;

        const query: any = { isActive: true };
        if (category) query.category = category;
        if (search) query.$text = { $search: search };

        const products = await Product.find(query)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-__v');

        const total = await Product.countDocuments(query);

        successResponse(res, {
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get single product
export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            throw new ApiError(404, 'Product not found');
        }

        successResponse(res, { product });
    } catch (error) {
        next(error);
    }
};

// Create product (Admin)
export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await Product.create(req.body);
        successResponse(res, { product }, 'Product created successfully', 201);
    } catch (error) {
        next(error);
    }
};

// Update product (Admin)
export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
            throw new ApiError(404, 'Product not found');
        }

        successResponse(res, { product }, 'Product updated successfully');
    } catch (error) {
        next(error);
    }
};

// Delete product (Admin)
export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            throw new ApiError(404, 'Product not found');
        }

        successResponse(res, null, 'Product deleted successfully');
    } catch (error) {
        next(error);
    }
};

// Toggle product status (Admin)
export const toggleProductStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            throw new ApiError(404, 'Product not found');
        }

        product.isActive = !product.isActive;
        await product.save();

        successResponse(res, { product }, 'Product status updated');
    } catch (error) {
        next(error);
    }
};

// Get low stock products (Admin)
export const getLowStockProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const products = await Product.find({
            $expr: { $lte: ['$stock', '$lowStockThreshold'] },
            stock: { $gt: 0 },
            isActive: true
        });

        successResponse(res, { products });
    } catch (error) {
        next(error);
    }
};
