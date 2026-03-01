import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product.model.js';
import { ApiError } from '../utils/ApiError.js';
import { successResponse } from '../utils/ApiResponse.js';

// ── helpers ───────────────────────────────────────────────────────────────────
/** Extract Cloudinary URLs from multer-storage-cloudinary files */
function extractUploadedUrls(files: Express.Multer.File[] | undefined): string[] {
    if (!files || files.length === 0) return [];
    // multer-storage-cloudinary attaches the secure URL as `path`
    return files.map((f: any) => f.path || f.secure_url);
}

// ── GET all products ──────────────────────────────────────────────────────────
export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 12;
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (req.query.category) filter.category = req.query.category;
        if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };

        // Non-admin: only show active products
        if (!req.query.admin) filter.isActive = true;

        const [products, total] = await Promise.all([
            Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Product.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data: {
                products,
                pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            },
        });
    } catch (error) {
        next(error);
    }
};

// ── GET single product ────────────────────────────────────────────────────────
export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) throw new ApiError(404, 'Product not found');
        successResponse(res, { product });
    } catch (error) {
        next(error);
    }
};

// ── CREATE product (Admin) ────────────────────────────────────────────────────
export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Images come from multer-storage-cloudinary via req.files
        const uploadedImages = extractUploadedUrls(req.files as Express.Multer.File[]);

        if (uploadedImages.length === 0) {
            throw new ApiError(400, 'At least one product image is required');
        }

        const product = await Product.create({
            ...req.body,
            price: Number(req.body.price),
            originalPrice: req.body.originalPrice ? Number(req.body.originalPrice) : undefined,
            stock: Number(req.body.stock),
            images: uploadedImages,
        });

        successResponse(res, { product }, 'Product created successfully', 201);
    } catch (error) {
        next(error);
    }
};

// ── UPDATE product (Admin) ────────────────────────────────────────────────────
export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) throw new ApiError(404, 'Product not found');

        // New files uploaded this request
        const newImages = extractUploadedUrls(req.files as Express.Multer.File[]);

        // Keep existing images that weren't removed in the frontend
        // Frontend sends retained URLs as repeated `existingImages` fields
        const existingImages: string[] = req.body.existingImages
            ? Array.isArray(req.body.existingImages)
                ? req.body.existingImages
                : [req.body.existingImages]
            : [];

        const images = [...existingImages, ...newImages];

        const updateData: any = {
            ...req.body,
            images: images.length > 0 ? images : product.images, // fall back to old
        };

        // Cast numbers
        if (req.body.price !== undefined) updateData.price = Number(req.body.price);
        if (req.body.originalPrice !== undefined)
            updateData.originalPrice = req.body.originalPrice ? Number(req.body.originalPrice) : undefined;
        if (req.body.stock !== undefined) updateData.stock = Number(req.body.stock);

        // Remove the raw field so it doesn't overwrite the merged array
        delete updateData.existingImages;

        const updated = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        successResponse(res, { product: updated }, 'Product updated successfully');
    } catch (error) {
        next(error);
    }
};

// ── DELETE product (Admin) ────────────────────────────────────────────────────
export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) throw new ApiError(404, 'Product not found');
        successResponse(res, null, 'Product deleted successfully');
    } catch (error) {
        next(error);
    }
};

// ── TOGGLE status (Admin) ─────────────────────────────────────────────────────
export const toggleProductStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) throw new ApiError(404, 'Product not found');
        product.isActive = !product.isActive;
        await product.save();
        successResponse(res, { product }, 'Product status updated');
    } catch (error) {
        next(error);
    }
};

// ── LOW STOCK (Admin) ─────────────────────────────────────────────────────────
export const getLowStockProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const products = await Product.find({
            $expr: { $lte: ['$stock', '$lowStockThreshold'] },
            stock: { $gt: 0 },
        }).sort({ stock: 1 });

        successResponse(res, { products });
    } catch (error) {
        next(error);
    }
};