import express, { Request, Response } from 'express';
import { adminLogin, adminLogout, forgotPassword, login, logout, register, resetPassword } from '../controllers/auth.controller.js';
import { adminLoginSchema, loginSchema, registerSchema } from '../middleware/auth.validator.js';
import { validate } from '../middleware/validator.middleware.js';
import { authenticateAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

// User routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Admin routes
router.post('/admin/login', validate(adminLoginSchema), adminLogin);
router.post('/admin/logout', adminLogout);

router.get('/admin/me', authenticateAdmin, (req: Request, res: Response) => {
    return res.json({
        success: true,
        data: {
            admin: (req as any).admin,
        },
    });
});

export default router;