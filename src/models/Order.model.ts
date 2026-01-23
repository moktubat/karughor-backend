import mongoose, { Document, Schema, Types } from 'mongoose';

interface ICustomer {
    userId?: Types.ObjectId;
    name: string;
    phone: string;
    email?: string;
    address: {
        street?: string;
        area?: string;
        city?: string;
        deliveryLocation: 'inside_dhaka' | 'outside_dhaka';
    };
}

interface IOrderItem {
    productId: Types.ObjectId;
    productName?: string;
    productImage?: string;
    price?: number;
    quantity: number;
    subtotal?: number;
}

export interface IOrder extends Document {
    orderNumber: string;
    customer: ICustomer;
    items: IOrderItem[];
    subtotal: number;
    deliveryCharge: number;
    discount: number;
    total: number;
    paymentMethod: 'COD';
    paymentStatus: 'pending' | 'collected';
    status: 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
    statusHistory?: {
        status: string;
        timestamp: Date;
        note?: string;
    }[];
    orderDate?: Date;
    confirmedAt?: Date;
    shippedAt?: Date;
    deliveredAt?: Date;
    cancelledAt?: Date;
    customerNotes?: string;
    adminNotes?: string;
    isPaid?: boolean;
}

const orderSchema: Schema<IOrder> = new mongoose.Schema({
    orderNumber: { type: String, required: true, unique: true },
    customer: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: { type: String, required: true },
        phone: { type: String, required: true },
        email: String,
        address: {
            street: String,
            area: String,
            city: String,
            deliveryLocation: { type: String, enum: ['inside_dhaka', 'outside_dhaka'], required: true }
        }
    },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: String,
        productImage: String,
        price: Number,
        quantity: { type: Number, required: true, min: 1 },
        subtotal: Number
    }],
    subtotal: { type: Number, required: true },
    deliveryCharge: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['COD'], default: 'COD' },
    paymentStatus: { type: String, enum: ['pending', 'collected'], default: 'pending' },
    status: { type: String, enum: ['new', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'], default: 'new' },
    statusHistory: [{
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String
    }],
    orderDate: { type: Date, default: Date.now },
    confirmedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    customerNotes: String,
    adminNotes: String
}, { timestamps: true });

// Virtual field
orderSchema.virtual('isPaid').get(function (this: IOrder) {
    return this.status === 'delivered';
});

// Generate order number
orderSchema.pre<IOrder>('save', async function (next) {
    if (!this.orderNumber) {
        const count = await mongoose.model<IOrder>('Order').countDocuments();
        this.orderNumber = `ORD-${String(count + 1).padStart(3, '0')}`;
    }
    next();
});

export default mongoose.model<IOrder>('Order', orderSchema);
