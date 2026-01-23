import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import User, { IUser } from '../models/User.model.js';

interface AuthRequest extends Request {
    user?: IUser;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.user_token || req.headers.authorization?.replace('Bearer ', '');
        if (!token) throw new ApiError(401, 'Authentication required');

        const decoded: any = verifyToken(token);
        const user = await User.findById(decoded.userId);

        if (!user || !user.isActive) throw new ApiError(401, 'User not found or inactive');

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};