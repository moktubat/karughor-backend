import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import User, { IUser } from '../models/User.model.js';
import Admin, { IAdmin } from '../models/Admin.model.js';
import { generateToken } from '../config/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { successResponse } from '../utils/ApiResponse.js';

// Cookie options based on environment
const getCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production';

    const options = {
        httpOnly: true,
        secure: true, // ALWAYS true in production
        sameSite: 'none' as const, // MUST be 'none' for cross-origin
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/',
        // NO DOMAIN - let the browser handle it
    };

    console.log('📦 [Backend] Cookie options:', options);
    return options;
};


// --------------------- USER --------------------- //

// User Registration
export const register = async (req: Request, res: Response, next: NextFunction) => {
    console.log('🟢 [Backend] Register request received:', {
        body: { ...req.body, password: '[REDACTED]' },
        headers: req.headers,
        cookies: req.cookies
    });

    try {
        const { fullName, phone, email, password } = req.body;

        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            console.log('❌ [Backend] Phone already registered');
            throw new ApiError(400, 'Phone number already registered');
        }

        const user = await User.create({ fullName, phone, email: email || undefined, password, isGuest: false });
        console.log('🟢 [Backend] User created:', user._id);

        const token = generateToken({ userId: user._id.toString(), phone: user.phone });
        console.log('🟢 [Backend] Token generated');

        const cookieOptions = getCookieOptions();
        res.cookie('user_token', token, cookieOptions);
        console.log('📦 [Backend] Cookie set with options:', cookieOptions);

        successResponse(res, {
            user: { id: user._id, fullName: user.fullName, phone: user.phone, email: user.email },
            token
        }, 'Registration successful', 201);

        console.log('✅ [Backend] Registration response sent');
    } catch (error) {
        console.error('❌ [Backend] Registration error:', error);
        next(error);
    }
};

// User Login
export const login = async (req: Request, res: Response, next: NextFunction) => {
    console.log('🟢 [Backend] Login request received:', {
        body: { ...req.body, password: '[REDACTED]' },
        headers: req.headers,
        origin: req.headers.origin,
        cookies: req.cookies
    });

    try {
        const { phone, password } = req.body;

        const user: IUser | null = await User.findOne({ phone }).select('+password');
        if (!user) {
            console.log('❌ [Backend] User not found:', phone);
            throw new ApiError(401, 'Invalid credentials');
        }
        if (!user.password) {
            console.log('❌ [Backend] No password set for user');
            throw new ApiError(401, 'Invalid credentials');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('❌ [Backend] Password mismatch');
            throw new ApiError(401, 'Invalid credentials');
        }

        console.log('🟢 [Backend] User authenticated:', user._id);

        const token = generateToken({ userId: user._id.toString(), phone: user.phone });
        console.log('🟢 [Backend] Token generated:', {
            tokenLength: token.length,
            tokenStart: token.substring(0, 20)
        });

        const cookieOptions = getCookieOptions();
        res.cookie('user_token', token, cookieOptions);
        console.log('📦 [Backend] Cookie set:', {
            name: 'user_token',
            options: cookieOptions,
            tokenLength: token.length
        });

        const responseData = {
            user: { id: user._id, fullName: user.fullName, phone: user.phone, email: user.email },
            token
        };

        console.log('✅ [Backend] Sending login response:', {
            hasUser: !!responseData.user,
            hasToken: !!responseData.token,
            userId: responseData.user.id
        });

        successResponse(res, responseData, 'Login successful');

        console.log('✅ [Backend] Login response sent');
        console.log('📦 [Backend] Response headers:', res.getHeaders());
    } catch (error) {
        console.error('❌ [Backend] Login error:', error);
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────
// 🔐 FORGOT PASSWORD
// POST /api/auth/forgot-password
// Body: { phone: string }
// ─────────────────────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return next(new ApiError(400, 'Phone number is required'));
        }

        const user = await User.findOne({ phone }).select('+resetOTP +resetOTPExpiry');

        // Always return success (prevent user enumeration)
        if (!user) {
            return successResponse(res, null, 'If this phone is registered, an OTP will be sent.');
        }

        // Generate secure 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        user.resetOTP = otp;
        user.resetOTPExpiry = expiry;

        await user.save({ validateBeforeSave: false });

        // TODO: Integrate SMS Provider (SSL Wireless / Twilio / Infobip etc.)
        console.log(`🔑 Password reset OTP for ${phone}: ${otp}`);

        return successResponse(res, null, 'OTP sent to your phone number.');
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────────────────────
// 🔐 RESET PASSWORD
// POST /api/auth/reset-password
// Body: { phone: string, otp: string, newPassword: string }
// ─────────────────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { phone, otp, newPassword } = req.body;

        if (!phone || !otp || !newPassword) {
            return next(new ApiError(400, 'Phone, OTP, and new password are required'));
        }

        if (newPassword.length < 6) {
            return next(new ApiError(400, 'Password must be at least 6 characters'));
        }

        const user = await User.findOne({ phone }).select('+resetOTP +resetOTPExpiry +password');

        if (!user) {
            return next(new ApiError(400, 'Invalid OTP or phone number'));
        }

        if (!user.resetOTP || user.resetOTP !== otp) {
            return next(new ApiError(400, 'Invalid OTP'));
        }

        if (!user.resetOTPExpiry || user.resetOTPExpiry < new Date()) {
            return next(new ApiError(400, 'OTP has expired. Please request a new one.'));
        }

        // Update password (will auto-hash if you use pre-save middleware)
        user.password = newPassword;

        // Clear OTP fields
        user.resetOTP = undefined;
        user.resetOTPExpiry = undefined;

        await user.save();

        return successResponse(res, null, 'Password reset successfully. You can now log in.');
    } catch (err) {
        next(err);
    }
};


// --------------------- ADMIN --------------------- //

// Admin Login
export const adminLogin = async (req: Request, res: Response, next: NextFunction) => {
    console.log('🟢 [Backend] Admin login request received:', {
        body: { ...req.body, password: '[REDACTED]' },
        headers: req.headers,
        origin: req.headers.origin,
        cookies: req.cookies
    });

    try {
        const { email, password } = req.body;

        const admin: IAdmin | null = await Admin.findOne({ email }).select('+password');
        if (!admin || !admin.password) {
            console.log('❌ [Backend] Admin not found or no password');
            throw new ApiError(401, 'Invalid credentials');
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            console.log('❌ [Backend] Admin password mismatch');
            throw new ApiError(401, 'Invalid credentials');
        }

        console.log('🟢 [Backend] Admin authenticated:', admin._id);

        admin.lastLogin = new Date();
        await admin.save();

        const token = generateToken({ adminId: admin._id.toString(), email: admin.email, role: admin.role });
        console.log('🟢 [Backend] Admin token generated:', {
            tokenLength: token.length,
            tokenStart: token.substring(0, 20)
        });

        const cookieOptions = getCookieOptions();
        res.cookie('admin_token', token, cookieOptions);
        console.log('📦 [Backend] Admin cookie set:', {
            name: 'admin_token',
            options: cookieOptions,
            tokenLength: token.length
        });

        const responseData = {
            admin: { id: admin._id, fullName: admin.fullName, email: admin.email, role: admin.role },
            token
        };

        console.log('✅ [Backend] Sending admin login response:', {
            hasAdmin: !!responseData.admin,
            hasToken: !!responseData.token,
            adminId: responseData.admin.id
        });

        successResponse(res, responseData, 'Admin login successful');

        console.log('✅ [Backend] Admin login response sent');
        console.log('📦 [Backend] Response headers:', res.getHeaders());
    } catch (error) {
        console.error('❌ [Backend] Admin login error:', error);
        next(error);
    }
};

// --------------------- LOGOUT --------------------- //

export const logout = (req: Request, res: Response) => {
    console.log('🟢 [Backend] Logout request received');

    res.clearCookie('user_token', {
        ...getCookieOptions(),
        maxAge: 0
    });

    console.log('✅ [Backend] User cookie cleared');
    successResponse(res, null, 'Logged out successfully');
};

export const adminLogout = (req: Request, res: Response) => {
    console.log('🟢 [Backend] Admin logout request received');

    res.clearCookie('admin_token', {
        ...getCookieOptions(),
        maxAge: 0
    });

    console.log('✅ [Backend] Admin cookie cleared');
    successResponse(res, null, 'Admin logged out successfully');
};