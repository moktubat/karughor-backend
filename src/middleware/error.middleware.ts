import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            error: { message: err.message, statusCode: err.statusCode }
        });
    }

    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e: any) => e.message);
        return res.status(400).json({
            success: false,
            error: { message: messages.join(', '), statusCode: 400 }
        });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            success: false,
            error: { message: `${field} already exists`, statusCode: 400 }
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, error: { message: 'Invalid token', statusCode: 401 } });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error: { message: 'Token expired', statusCode: 401 } });
    }

    res.status(500).json({ success: false, error: { message: err.message || 'Internal server error', statusCode: 500 } });
};
