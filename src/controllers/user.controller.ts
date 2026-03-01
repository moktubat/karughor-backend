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

// ─────────────────────────────────────────────────────────────
// 🔐 CHANGE PASSWORD
// PUT /api/users/change-password
// Body: { currentPassword: string, newPassword: string }
// Requires: authenticate middleware
// ─────────────────────────────────────────────────────────────
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return next(new ApiError(400, 'Current password and new password are required'));
        }

        if (newPassword.length < 6) {
            return next(new ApiError(400, 'New password must be at least 6 characters'));
        }

        // Prevent using same password again
        if (currentPassword === newPassword) {
            return next(new ApiError(400, 'New password must be different from current password'));
        }

        const user = await User.findById((req as any).user._id).select('+password');

        if (!user) {
            return next(new ApiError(404, 'User not found'));
        }

        if (!user.password) {
            return next(new ApiError(400, 'No password set for this account'));
        }

        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return next(new ApiError(400, 'Current password is incorrect'));
        }

        // Update password (auto-hashed via pre-save middleware)
        user.password = newPassword;
        await user.save();

        return successResponse(res, null, 'Password changed successfully');
    } catch (err) {
        next(err);
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
