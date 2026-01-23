import { Request, Response, NextFunction } from 'express';
import User from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { successResponse } from '../utils/ApiResponse.js';

// Get user profile
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById((req as any).user._id).select('-password');
        successResponse(res, { user });
    } catch (error) {
        next(error);
    }
};

// Update profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { fullName, email, address } = req.body;

        const user = await User.findByIdAndUpdate(
            (req as any).user._id,
            { fullName, email, address },
            { new: true, runValidators: true }
        ).select('-password');

        successResponse(res, { user }, 'Profile updated successfully');
    } catch (error) {
        next(error);
    }
};

// Get wishlist
export const getWishlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById((req as any).user._id).populate('wishlist');
        successResponse(res, { wishlist: user.wishlist });
    } catch (error) {
        next(error);
    }
};

// Add to wishlist
export const addToWishlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId } = req.params;

        const user = await User.findById((req as any).user._id);

        if (user.wishlist.includes(productId)) {
            throw new ApiError(400, 'Product already in wishlist');
        }

        user.wishlist.push(productId);
        await user.save();

        successResponse(res, { wishlist: user.wishlist }, 'Added to wishlist');
    } catch (error) {
        next(error);
    }
};

// Remove from wishlist
export const removeFromWishlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId } = req.params;

        const user = await User.findByIdAndUpdate(
            (req as any).user._id,
            { $pull: { wishlist: productId } },
            { new: true }
        );

        successResponse(res, { wishlist: user.wishlist }, 'Removed from wishlist');
    } catch (error) {
        next(error);
    }
};
