import { Request, Response, NextFunction } from 'express';
import Admin from '../models/Admin.model.js';
import Order from '../models/Order.model.js';
import Product from '../models/Product.model.js';
import { ApiError } from '../utils/ApiError.js';
import { successResponse } from '../utils/ApiResponse.js';

// Get dashboard stats
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            totalOrders,
            todayOrders,
            deliveredOrders,
            totalRevenue,
            pendingOrders,
            lowStockProducts
        ] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ orderDate: { $gte: today } }),
            Order.countDocuments({ status: 'delivered' }),
            Order.aggregate([
                { $match: { status: 'delivered' } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]),
            Order.countDocuments({ status: { $in: ['new', 'confirmed', 'shipped'] } }),
            Product.countDocuments({
                $expr: { $lte: ['$stock', '$lowStockThreshold'] },
                stock: { $gt: 0 }
            })
        ]);

        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('orderNumber customer.name customer.phone items status total orderDate');

        successResponse(res, {
            stats: {
                totalOrders,
                todayOrders,
                deliveredOrders,
                totalRevenue: totalRevenue[0]?.total || 0,
                pendingOrders,
                lowStockProducts
            },
            recentOrders
        });
    } catch (error) {
        next(error);
    }
};

// Get revenue stats
export const getRevenueStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { period = 'month' } = req.query as any;

        let dateFilter: any = {};
        const now = new Date();

        switch (period) {
            case 'today':
                dateFilter = { orderDate: { $gte: new Date(now.setHours(0, 0, 0, 0)) } };
                break;
            case 'week':
                const weekAgo = new Date(now.setDate(now.getDate() - 7));
                dateFilter = { orderDate: { $gte: weekAgo } };
                break;
            case 'month':
                const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
                dateFilter = { orderDate: { $gte: monthAgo } };
                break;
            case 'year':
                const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
                dateFilter = { orderDate: { $gte: yearAgo } };
                break;
        }

        const revenue = await Order.aggregate([
            { $match: { status: 'delivered', ...dateFilter } },
            { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
        ]);

        const dailySales = await Order.aggregate([
            { $match: { status: 'delivered', ...dateFilter } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' } },
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: -1 } },
            { $limit: 7 }
        ]);

        const topProducts = await Order.aggregate([
            { $match: { status: 'delivered' } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    name: { $first: '$items.productName' },
                    sold: { $sum: '$items.quantity' },
                    revenue: { $sum: '$items.subtotal' }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 5 }
        ]);

        successResponse(res, {
            revenue: revenue[0] || { total: 0, count: 0 },
            dailySales,
            topProducts
        });
    } catch (error) {
        next(error);
    }
};

// Get admin profile
export const getAdminProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const admin = await Admin.findById((req as any).admin._id).select('-password');
        successResponse(res, { admin });
    } catch (error) {
        next(error);
    }
};

// Update admin profile
export const updateAdminProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { fullName, phone, storeInfo } = req.body;

        const admin = await Admin.findByIdAndUpdate(
            (req as any).admin._id,
            { fullName, phone, storeInfo },
            { new: true }
        ).select('-password');

        successResponse(res, { admin }, 'Profile updated successfully');
    } catch (error) {
        next(error);
    }
};

// Change admin password
export const changeAdminPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const admin = await Admin.findById((req as any).admin._id).select('+password');

        if (!admin) {
            throw new ApiError(404, 'Admin not found');
        }

        const isMatch = await admin.comparePassword!(currentPassword);
        if (!isMatch) {
            throw new ApiError(400, 'Current password is incorrect');
        }

        admin.password = newPassword;
        await admin.save();

        successResponse(res, null, 'Password changed successfully');
    } catch (error) {
        next(error);
    }
};