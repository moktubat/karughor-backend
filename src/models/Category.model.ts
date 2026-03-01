import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISubCategory {
    name: string;
    slug: string;
    isActive: boolean;
}

export interface ICategory extends Document {
    name: string;
    slug: string;
    icon: string; // icon name string (e.g. "FaBed")
    description?: string;
    isActive: boolean;
    sortOrder: number;
    subCategories: ISubCategory[];
    createdAt: Date;
    updatedAt: Date;
}

const subCategorySchema = new Schema<ISubCategory>({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
});

const categorySchema = new Schema<ICategory>(
    {
        name: { type: String, required: [true, 'Category name is required'], trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        icon: { type: String, default: 'FaTag' },
        description: { type: String },
        isActive: { type: Boolean, default: true },
        sortOrder: { type: Number, default: 0 },
        subCategories: [subCategorySchema],
    },
    { timestamps: true }
);

// Auto-generate slug from name if not provided
categorySchema.pre('save', function (next) {
    if (!this.slug) {
        this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    next();
});

export default mongoose.model<ICategory>('Category', categorySchema);