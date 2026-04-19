import express, { Request, Response } from 'express';
import {
    adminLogin, adminLogout, forgotPassword,
    login, logout, register, resetPassword,
} from '../controllers/auth.controller.js';
import { adminLoginSchema, loginSchema, registerSchema } from '../middleware/auth.validator.js';
import { validate } from '../middleware/validator.middleware.js';
import { authenticateAdmin } from '../middleware/admin.middleware.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', otpLimiter, resetPassword);

router.post('/admin/login', authLimiter, validate(adminLoginSchema), adminLogin);
router.post('/admin/logout', adminLogout);
router.get('/admin/me', authenticateAdmin, (req: Request, res: Response) => {
    res.json({ success: true, data: { admin: (req as any).admin } });
});

export default router;