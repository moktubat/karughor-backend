import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISettings extends Document {
    codEnabled: boolean;
    maxCodAmount: number;
    insideDhakaCharge: number;
    outsideDhakaCharge: number;
    taxPercentage: number;
    autoCancel: boolean;
    autoCancelHours: number;
    updatedBy?: Types.ObjectId;
}

const settingsSchema: Schema<ISettings> = new mongoose.Schema({
    codEnabled: { type: Boolean, default: true },
    maxCodAmount: { type: Number, default: 50000 },
    insideDhakaCharge: { type: Number, default: 70 },
    outsideDhakaCharge: { type: Number, default: 120 },
    taxPercentage: { type: Number, default: 0 },
    autoCancel: { type: Boolean, default: false },
    autoCancelHours: { type: Number, default: 48 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

export default mongoose.model<ISettings>('Settings', settingsSchema);
