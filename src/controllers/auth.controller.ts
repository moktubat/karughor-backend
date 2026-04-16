import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import User, { IUser } from '../models/User.model.js';
import Admin, { IAdmin } from '../models/Admin.model.js';
import { generateToken } from '../config/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { successResponse } from '../utils/ApiResponse.js';
import { sendMail } from '../config/email.js';
import {
    welcomeEmailTemplate,
    forgotPasswordEmailTemplate,
} from '../utils/emailTemplates.js';

// Cookie options
const getCookieOptions = () => ({
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
});

// ─────────────────────────────────────────────────────────────────────────────
// USER REGISTRATION
// ─────────────────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { fullName, phone, email, password } = req.body;

        const existingUser = await User.findOne({ phone });
        if (existingUser) throw new ApiError(400, 'Phone number already registered');

        const user = await User.create({
            fullName,
            phone,
            email: email || undefined,
            password,
            isGuest: false,
        });

        const token = generateToken({ userId: user._id.toString(), phone: user.phone });

        res.cookie('user_token', token, getCookieOptions());

        // ── Send welcome email (non-blocking) ───────────────────────────────
        if (email) {
            sendMail({
                to: email,
                subject: '🎉 Welcome to Karughor — Your Account is Ready!',
                html: welcomeEmailTemplate({ fullName, phone, email }),
            }).catch(() => { }); // fire-and-forget
        }

        successResponse(res, {
            user: { id: user._id, fullName: user.fullName, phone: user.phone, email: user.email },
            token,
        }, 'Registration successful', 201);
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// USER LOGIN
// ─────────────────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { phone, password } = req.body;

        const user: IUser | null = await User.findOne({ phone }).select('+password');
        if (!user || !user.password) throw new ApiError(401, 'Invalid credentials');

        const isMatch = await user.comparePassword(password);
        if (!isMatch) throw new ApiError(401, 'Invalid credentials');

        const token = generateToken({ userId: user._id.toString(), phone: user.phone });

        res.cookie('user_token', token, getCookieOptions());

        successResponse(res, {
            user: { id: user._id, fullName: user.fullName, phone: user.phone, email: user.email },
            token,
        }, 'Login successful');
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD — sends OTP via SMS console AND email (if email on file)
// POST /api/auth/forgot-password
// Body: { phone: string }
// ─────────────────────────────────────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { phone } = req.body;
        if (!phone) return next(new ApiError(400, 'Phone number is required'));

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

        // ── TODO: Integrate SMS (SSL Wireless / Twilio) ──────────────────────
        console.log(`🔑 [OTP] Password reset OTP for ${phone}: ${otp}`);

        // ── Send OTP via email (if user has email) ───────────────────────────
        if (user.email) {
            sendMail({
                to: user.email,
                subject: '🔐 Your Karughor Password Reset OTP',
                html: forgotPasswordEmailTemplate({
                    fullName: user.fullName,
                    phone,
                    otp,
                    expiresInMinutes: 15,
                }),
            }).catch(() => { });
        }

        return successResponse(res, null, 'OTP sent to your phone number.');
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// RESET PASSWORD
// POST /api/auth/reset-password
// Body: { phone, otp, newPassword }
// ─────────────────────────────────────────────────────────────────────────────
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
        if (!user) return next(new ApiError(400, 'Invalid OTP or phone number'));

        if (!user.resetOTP || user.resetOTP !== otp) {
            return next(new ApiError(400, 'Invalid OTP'));
        }
        if (!user.resetOTPExpiry || user.resetOTPExpiry < new Date()) {
            return next(new ApiError(400, 'OTP has expired. Please request a new one.'));
        }

        user.password = newPassword;
        user.resetOTP = undefined;
        user.resetOTPExpiry = undefined;
        await user.save();

        return successResponse(res, null, 'Password reset successfully. You can now log in.');
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN LOGIN
// ─────────────────────────────────────────────────────────────────────────────
export const adminLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email }).select('+password');
        if (!admin || !admin.password) throw new ApiError(401, 'Invalid credentials');

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) throw new ApiError(401, 'Invalid credentials');

        admin.lastLogin = new Date();
        await admin.save();

        const token = generateToken({
            adminId: admin._id.toString(),
            email: admin.email,
            role: admin.role,
        });

        // ✅ keep cookie (for API)
        res.cookie('admin_token', token, getCookieOptions());

        // ✅ ALSO send token in response
        successResponse(res, {
            admin: {
                id: admin._id,
                fullName: admin.fullName,
                email: admin.email,
                role: admin.role
            },
            token // 🔥 IMPORTANT
        }, 'Admin login successful');
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
export const logout = (req: Request, res: Response) => {
    res.clearCookie('user_token', { ...getCookieOptions(), maxAge: 0 });
    successResponse(res, null, 'Logged out successfully');
};

export const adminLogout = (req: Request, res: Response) => {
    res.clearCookie('admin_token', { ...getCookieOptions(), maxAge: 0 });
    successResponse(res, null, 'Admin logged out successfully');
};