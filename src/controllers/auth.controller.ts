import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User.model.js';
import Admin, { IAdmin } from '../models/Admin.model.js';
import { generateToken } from '../config/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { successResponse } from '../utils/ApiResponse.js';

// Cookie options based on environment
const getCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
        httpOnly: true,
        secure: isProduction, // true in production
        sameSite: isProduction ? 'none' as const : 'strict' as const,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/',
        ...(isProduction && { domain: '.vercel.app' }) // Allow subdomain access
    };
};

// --------------------- USER --------------------- //

// User Registration
export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { fullName, phone, email, password } = req.body;

        const existingUser = await User.findOne({ phone });
        if (existingUser) throw new ApiError(400, 'Phone number already registered');

        const user = await User.create({ fullName, phone, email: email || undefined, password, isGuest: false });

        const token = generateToken({ userId: user._id.toString(), phone: user.phone });

        res.cookie('user_token', token, getCookieOptions());

        successResponse(res, {
            user: { id: user._id, fullName: user.fullName, phone: user.phone, email: user.email },
            token
        }, 'Registration successful', 201);
    } catch (error) {
        next(error);
    }
};

// User Login
export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { phone, password } = req.body;

        const user: IUser | null = await User.findOne({ phone }).select('+password');
        if (!user) throw new ApiError(401, 'Invalid credentials');
        if (!user.password) throw new ApiError(401, 'Invalid credentials');

        const isMatch = await user.comparePassword(password);
        if (!isMatch) throw new ApiError(401, 'Invalid credentials');

        const token = generateToken({ userId: user._id.toString(), phone: user.phone });

        res.cookie('user_token', token, getCookieOptions());

        successResponse(res, {
            user: { id: user._id, fullName: user.fullName, phone: user.phone, email: user.email },
            token
        }, 'Login successful');
    } catch (error) {
        next(error);
    }
};

// --------------------- ADMIN --------------------- //

// Admin Login
export const adminLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        const admin: IAdmin | null = await Admin.findOne({ email }).select('+password');
        if (!admin || !admin.password) throw new ApiError(401, 'Invalid credentials');

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) throw new ApiError(401, 'Invalid credentials');

        admin.lastLogin = new Date();
        await admin.save();

        const token = generateToken({ adminId: admin._id.toString(), email: admin.email, role: admin.role });

        res.cookie('admin_token', token, getCookieOptions());

        successResponse(res, {
            admin: { id: admin._id, fullName: admin.fullName, email: admin.email, role: admin.role },
            token
        }, 'Admin login successful');
    } catch (error) {
        next(error);
    }
};

// --------------------- LOGOUT --------------------- //

export const logout = (req: Request, res: Response) => {
    res.clearCookie('user_token', {
        ...getCookieOptions(),
        maxAge: 0
    });
    successResponse(res, null, 'Logged out successfully');
};

export const adminLogout = (req: Request, res: Response) => {
    res.clearCookie('admin_token', {
        ...getCookieOptions(),
        maxAge: 0
    });
    successResponse(res, null, 'Admin logged out successfully');
};