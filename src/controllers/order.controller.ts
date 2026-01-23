import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order.model.js';
import Product from '../models/Product.model.js';
import Settings from '../models/Settings.model.js';
import { ApiError } from '../utils/ApiError.js';
import { successResponse } from '../utils/ApiResponse.js';

// Create order (Guest or Authenticated)
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { customer, items, notes } = req.body;

        const settings = await Settings.findOne();
        const deliveryCharge = customer.address.deliveryLocation === 'inside_dhaka'
            ? settings?.insideDhakaCharge
            : settings?.outsideDhakaCharge;

        let subtotal = 0;
        const orderItems: any[] = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                throw new ApiError(404, `Product not found: ${item.productId}`);
            }

            if (product.stock < item.quantity) {
                throw new ApiError(400, `Insufficient stock for ${product.name}`);
            }

            const itemSubtotal = product.price * item.quantity;
            subtotal += itemSubtotal;

            orderItems.push({
                productId: product._id,
                productName: product.name,
                productImage: product.images[0] || '',
                price: product.price,
                quantity: item.quantity,
                subtotal: itemSubtotal
            });

            product.stock -= item.quantity;
            await product.save();
        }

        const total = subtotal + (deliveryCharge || 0);

        const order = await Order.create({
            customer: {
                userId: (req as any).user?._id,
                ...customer
            },
            items: orderItems,
            subtotal,
            deliveryCharge,
            discount: 0,
            total,
            customerNotes: notes,
            statusHistory: [{
                status: 'new',
                timestamp: new Date()
            }]
        });

        successResponse(res, { order }, 'Order placed successfully', 201);
    } catch (error) {
        next(error);
    }
};

// Get order by ID
export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.productId', 'name images');

        if (!order) throw new ApiError(404, 'Order not found');

        if ((req as any).user && order.customer.userId?.toString() !== (req as any).user._id.toString()) {
            throw new ApiError(403, 'Not authorized to view this order');
        }

        successResponse(res, { order });
    } catch (error) {
        next(error);
    }
};

// Get user orders
export const getUserOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page = 1, limit = 10 } = req.query as any;

        const orders = await Order.find({ 'customer.userId': (req as any).user._id })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Order.countDocuments({ 'customer.userId': (req as any).user._id });

        successResponse(res, {
            orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get all orders (Admin)
export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query as any;

        const query: any = {};
        if (status && status !== 'all') query.status = status;
        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'customer.name': { $regex: search, $options: 'i' } },
                { 'customer.phone': { $regex: search, $options: 'i' } }
            ];
        }

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Order.countDocuments(query);

        successResponse(res, {
            orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Update order status (Admin)
export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status, note } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) throw new ApiError(404, 'Order not found');

        order.status = status;
        order.statusHistory.push({ status, timestamp: new Date(), note });

        if (status === 'delivered') {
            order.paymentStatus = 'collected';
            order.deliveredAt = new Date();
        } else if (status === 'confirmed') {
            order.confirmedAt = new Date();
        } else if (status === 'shipped') {
            order.shippedAt = new Date();
        } else if (status === 'cancelled') {
            order.cancelledAt = new Date();

            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
            }
        }

        await order.save();
        successResponse(res, { order }, 'Order status updated');
    } catch (error) {
        next(error);
    }
};
