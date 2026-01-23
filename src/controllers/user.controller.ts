import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { successResponse } from '../utils/ApiResponse.js';

// Get user profile
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById((req as any).user._id).select('-password');
        if (!user) throw new ApiError(404, 'User not found');

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

        if (!user) throw new ApiError(404, 'User not found');

        successResponse(res, { user }, 'Profile updated successfully');
    } catch (error) {
        next(error);
    }
};

// Get wishlist
export const getWishlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById((req as any).user._id).populate('wishlist');
        if (!user) throw new ApiError(404, 'User not found');

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
        if (!user) throw new ApiError(404, 'User not found');

        // Check if product already in wishlist
        if (user.wishlist.some(id => id.toString() === productId)) {
            throw new ApiError(400, 'Product already in wishlist');
        }

        user.wishlist.push(new mongoose.Types.ObjectId(productId));
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

        const user = await User.findById((req as any).user._id);
        if (!user) throw new ApiError(404, 'User not found');

        user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
        await user.save();

        successResponse(res, { wishlist: user.wishlist }, 'Removed from wishlist');
    } catch (error) {
        next(error);
    }
};
