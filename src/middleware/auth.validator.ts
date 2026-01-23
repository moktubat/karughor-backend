import { z } from 'zod';

export const registerSchema = z.object({
    fullName: z.string().min(3, 'Name must be at least 3 characters'),
    phone: z.string().regex(/^[0-9+\-\s()]+$/, 'Invalid phone number'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});

export const loginSchema = z.object({
    phone: z.string().min(1, 'Phone is required'),
    password: z.string().min(1, 'Password is required')
});

export const adminLoginSchema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(1, 'Password is required')
});
