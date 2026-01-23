import express, { Request, Response, NextFunction } from 'express';
import { adminLogin, adminLogout, login, logout, register } from '../controllers/auth.controller.js';
import { adminLoginSchema, loginSchema, registerSchema } from '../middleware/auth.validator.js';
import { validate } from '../middleware/validator.middleware.js';

const router = express.Router();

// User routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);

// Admin routes
router.post('/admin/login', validate(adminLoginSchema), adminLogin);
router.post('/admin/logout', adminLogout);

export default router;
