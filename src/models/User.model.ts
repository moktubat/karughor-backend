import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    fullName: string;
    phone: string;
    email?: string;
    password?: string;
    profileImage?: string;
    address?: {
        street?: string;
        area?: string;
        city?: string;
        deliveryLocation?: 'inside_dhaka' | 'outside_dhaka';
    };
    isGuest: boolean;
    wishlist: mongoose.Types.ObjectId[];
    isActive: boolean;
    resetOTP?: string;
    resetOTPExpiry?: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema: Schema<IUser> = new Schema(
    {
        fullName: { type: String, required: [true, 'Full name is required'], trim: true },
        phone: { type: String, required: [true, 'Phone number is required'], unique: true, trim: true },
        email: { type: String, trim: true, lowercase: true, sparse: true },
        password: { type: String, select: false },
        profileImage: String,
        address: {
            street: String,
            area: String,
            city: String,
            deliveryLocation: { type: String, enum: ['inside_dhaka', 'outside_dhaka'] }
        },
        isGuest: { type: Boolean, default: false },
        wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
        isActive: { type: Boolean, default: true },
        resetOTP: { type: String, select: false },
        resetOTPExpiry: { type: Date, select: false }
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
