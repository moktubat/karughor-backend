import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    description: string;
    category: string;
    brand?: string;
    price: number;
    originalPrice?: number;
    images: string[];
    stock: number;
    lowStockThreshold: number;
    isActive: boolean;
    specifications?: Map<string, string>;
    inTheBox?: string[];
    systemRequirements?: string[];
    isLowStock?: boolean;
    isOutOfStock?: boolean;
}

const productSchema: Schema<IProduct> = new mongoose.Schema({
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'] },
    category: { type: String, required: [true, 'Category is required'] },
    brand: String,
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    originalPrice: Number,
    images: [String],
    stock: { type: Number, required: true, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    isActive: { type: Boolean, default: true },
    specifications: { type: Map, of: String },
    inTheBox: [String],
    systemRequirements: [String]
}, { timestamps: true });

// Virtual fields
productSchema.virtual('isLowStock').get(function (this: IProduct) {
    return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

productSchema.virtual('isOutOfStock').get(function (this: IProduct) {
    return this.stock === 0;
});

// Text index for search
productSchema.index({ name: 'text', description: 'text', category: 'text' });

export default mongoose.model<IProduct>('Product', productSchema);
