import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product.model.js';
import { ApiError } from '../utils/ApiError.js';
import { successResponse } from '../utils/ApiResponse.js';

function extractUploadedUrls(files: Express.Multer.File[] | undefined): string[] {
    if (!files || files.length === 0) return [];
    return files.map((f: any) => f.path || f.secure_url || f.location || '').filter(Boolean);
}

/**
 * Safely flatten existingImages from FormData.
 * FormData can send it as:
 *   - a single string          → ["url"]
 *   - an array of strings      → ["url1", "url2"]
 *   - a JSON-stringified array → parse it
 */
function parseExistingImages(raw: any): string[] {
    if (!raw) return [];

    // Already a proper array of strings
    if (Array.isArray(raw)) {
        return raw.flatMap((item: any) => {
            if (typeof item === 'string') {
                // Could still be a JSON string itself
                if (item.startsWith('[')) {
                    try { return JSON.parse(item) as string[]; } catch { return [item]; }
                }
                return [item];
            }
            return [];
        }).filter((s: string) => s && s.startsWith('http'));
    }

    // Single string value
    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed);
                return Array.isArray(parsed) ? parsed.flat(Infinity).filter((s: any) => typeof s === 'string' && s.startsWith('http')) : [];
            } catch {
                return trimmed.startsWith('http') ? [trimmed] : [];
            }
        }
        return trimmed.startsWith('http') ? [trimmed] : [];
    }

    return [];
}

export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 12;
        const skip = (page - 1) * limit;
        const filter: any = {};

        if (req.query.category) {
            const slug = req.query.category as string;
            const readable = slug.replace(/-/g, ' ');
            const escSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const escReadable = readable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.category = { $regex: new RegExp(`^(${escSlug}|${escReadable})$`, 'i') };
        }

        if (req.query.search) {
            filter.name = { $regex: req.query.search, $options: 'i' };
        }

        if (!req.query.admin) filter.isActive = true;

        let sort: any = { createdAt: -1 };
        if (req.query.sort === 'price') sort = { price: 1 };
        else if (req.query.sort === '-price') sort = { price: -1 };

        const [products, total] = await Promise.all([
            Product.find(filter).sort(sort).skip(skip).limit(limit),
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

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) throw new ApiError(404, 'Product not found');
        successResponse(res, { product });
    } catch (error) {
        next(error);
    }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
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

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) throw new ApiError(404, 'Product not found');

        const newImages = extractUploadedUrls(req.files as Express.Multer.File[]);
        const existingImages = parseExistingImages(req.body.existingImages);

        const images = [...existingImages, ...newImages];

        const updateData: any = {
            ...req.body,
            images: images.length > 0 ? images : product.images,
        };

        if (req.body.price !== undefined) updateData.price = Number(req.body.price);
        if (req.body.originalPrice !== undefined) {
            updateData.originalPrice = req.body.originalPrice ? Number(req.body.originalPrice) : undefined;
        }
        if (req.body.stock !== undefined) updateData.stock = Number(req.body.stock);

        // Remove existingImages from the update payload — it's not a model field
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

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) throw new ApiError(404, 'Product not found');
        successResponse(res, null, 'Product deleted successfully');
    } catch (error) {
        next(error);
    }
};

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