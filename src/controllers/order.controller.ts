import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order.model.js';
import Product from '../models/Product.model.js';
import Settings from '../models/Settings.model.js';
import { ApiError } from '../utils/ApiError.js';
import { successResponse } from '../utils/ApiResponse.js';
import { sendMail } from '../config/email.js';
import { orderConfirmationTemplate } from '../utils/emailTemplates.js';
import mongoose from 'mongoose';

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { customer, items, notes } = req.body;

        const settings = await Settings.findOne().session(session);
        const deliveryCharge =
            customer.address.deliveryLocation === 'inside_dhaka'
                ? (settings?.insideDhakaCharge ?? 70)
                : (settings?.outsideDhakaCharge ?? 120);

        let subtotal = 0;
        const orderItems: any[] = [];

        for (const item of items) {
            const product = await Product.findById(item.productId).session(session);
            if (!product) throw new ApiError(404, `Product not found: ${item.productId}`);
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
                subtotal: itemSubtotal,
            });

            // Atomic stock decrement inside transaction
            await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: -item.quantity } },
                { session, new: true }
            );
        }

        const total = subtotal + deliveryCharge;
        const count = await Order.countDocuments().session(session);
        const orderNumber = `ORD-${String(count + 1).padStart(5, '0')}`;

        const [order] = await Order.create(
            [{
                orderNumber,
                customer: { userId: (req as any).user?._id || null, ...customer },
                items: orderItems,
                subtotal,
                deliveryCharge,
                discount: 0,
                total,
                customerNotes: notes,
                statusHistory: [{ status: 'new', timestamp: new Date() }],
            }],
            { session }
        );

        await session.commitTransaction();

        // Send email outside transaction — failure here won't roll back order
        if (customer.email) {
            sendMail({
                to: customer.email,
                subject: `✅ Order Confirmed — ${orderNumber} | Karughor`,
                html: orderConfirmationTemplate({
                    customerName: customer.name,
                    orderNumber,
                    items: orderItems.map((i: any) => ({
                        productName: i.productName,
                        quantity: i.quantity,
                        price: i.price,
                        subtotal: i.subtotal,
                    })),
                    subtotal,
                    deliveryCharge,
                    total,
                    deliveryLocation: customer.address.deliveryLocation,
                    address: {
                        street: customer.address.street,
                        area: customer.address.area,
                        city: customer.address.city,
                    },
                    customerNotes: notes,
                }),
            }).catch(() => { });
        }

        successResponse(res, { order }, 'Order placed successfully', 201);
    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};


export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.productId', 'name images');
        if (!order) throw new ApiError(404, 'Order not found');
        if ((req as any).user && order.customer.userId?.toString() !== (req as any).user._id.toString()) {
            throw new ApiError(403, 'Not authorized to view this order');
        }
        successResponse(res, { order });
    } catch (error) {
        next(error);
    }
};

export const getUserOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page = 1, limit = 10 } = req.query as any;
        const userId = (req as any).user._id;
        const [orders, total] = await Promise.all([
            Order.find({ 'customer.userId': userId })
                .sort({ createdAt: -1 })
                .limit(Number(limit))
                .skip((Number(page) - 1) * Number(limit)),
            Order.countDocuments({ 'customer.userId': userId }),
        ]);
        successResponse(res, {
            orders,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
        });
    } catch (error) {
        next(error);
    }
};

export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query as any;
        const query: any = {};
        if (status && status !== 'all') query.status = status;
        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'customer.name': { $regex: search, $options: 'i' } },
                { 'customer.phone': { $regex: search, $options: 'i' } },
            ];
        }
        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort({ createdAt: -1 })
                .limit(Number(limit))
                .skip((Number(page) - 1) * Number(limit)),
            Order.countDocuments(query),
        ]);
        successResponse(res, {
            orders,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
        });
    } catch (error) {
        next(error);
    }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status, note } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) throw new ApiError(404, 'Order not found');

        order.status = status;
        if (!order.statusHistory) order.statusHistory = [];
        order.statusHistory.push({ status, timestamp: new Date(), note });

        if (status === 'delivered') {
            order.deliveredAt = new Date();
            order.paymentStatus = 'collected';
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