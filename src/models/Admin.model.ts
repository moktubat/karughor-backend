import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdmin extends Document {
    fullName: string;
    email: string;
    password?: string;
    phone?: string;
    profileImage?: string;
    role: 'super_admin' | 'admin';
    storeInfo?: {
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
    };
    isActive: boolean;
    lastLogin?: Date;
    comparePassword?: (candidatePassword: string) => Promise<boolean>;
}

const adminSchema: Schema<IAdmin> = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    phone: String,
    profileImage: String,
    role: { type: String, enum: ['super_admin', 'admin'], default: 'admin' },
    storeInfo: {
        name: String,
        email: String,
        phone: String,
        address: String
    },
    isActive: { type: Boolean, default: true },
    lastLogin: Date
}, { timestamps: true });

// Hash password
adminSchema.pre<IAdmin>('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password
adminSchema.methods.comparePassword = async function (candidatePassword: string) {
    return await bcrypt.compare(candidatePassword, this.password!);
};

export default mongoose.model<IAdmin>('Admin', adminSchema);
