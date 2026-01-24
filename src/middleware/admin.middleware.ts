import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import Admin, { IAdmin } from '../models/Admin.model.js';

interface AdminRequest extends Request {
    admin?: IAdmin;
}

export const authenticateAdmin = async (req: AdminRequest, res: Response, next: NextFunction) => {
    try {
        // Try cookie first, then Authorization header
        let token = req.cookies.admin_token;

        if (!token && req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.replace('Bearer ', '');
        }

        if (!token) throw new ApiError(401, 'Admin authentication required');

        const decoded: any = verifyToken(token);
        const admin = await Admin.findById(decoded.adminId);

        if (!admin || !admin.isActive) throw new ApiError(401, 'Admin not found or inactive');

        req.admin = admin;
        next();
    } catch (error) {
        next(error);
    }
};