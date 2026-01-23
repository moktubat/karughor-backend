import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Admin from '../models/Admin.model.js';
import Settings from '../models/Settings.model.js';
import Product from '../models/Product.model.js';

dotenv.config();

const seedAdmin = async () => {
    try {
        const adminExists = await Admin.findOne({ email: process.env.ADMIN_EMAIL });

        if (!adminExists) {
            await Admin.create({
                fullName: process.env.ADMIN_NAME || 'Admin User',
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD,
                phone: process.env.ADMIN_PHONE,
                role: 'super_admin',
                isActive: true
            });
            console.log('✅ Admin user created');
        } else {
            console.log('ℹ️  Admin user already exists');
        }
    } catch (error: any) {
        console.error('❌ Error creating admin:', error.message);
    }
};

const seedSettings = async () => {
    try {
        const settingsExists = await Settings.findOne();

        if (!settingsExists) {
            // Find the admin user we just created
            const adminUser = await Admin.findOne({ email: process.env.ADMIN_EMAIL });

            if (!adminUser) {
                console.error('❌ Admin user not found. Cannot create settings with updatedBy field.');
                return;
            }

            await Settings.create({
                codEnabled: true,
                maxCodAmount: 50000,
                insideDhakaCharge: 70,
                outsideDhakaCharge: 120,
                taxPercentage: 0,
                autoCancel: false,
                autoCancelHours: 48,
                updatedBy: adminUser._id // <-- ADD THIS LINE
            });
            console.log('✅ Settings created and linked to admin');
        } else {
            console.log('ℹ️  Settings already exist');
        }
    } catch (error: any) {
        console.error('❌ Error creating settings:', error.message);
    }
};

const seedProducts = async () => {
    try {
        const count = await Product.countDocuments();

        if (count === 0) {
            const sampleProducts = [
                {
                    name: 'Logitech G502 Hero Gaming Mouse',
                    description: 'High performance gaming mouse with HERO 25K sensor',
                    category: 'Gaming Mouse',
                    brand: 'Logitech',
                    price: 89,
                    originalPrice: 120,
                    images: ['https://images.unsplash.com/photo-1527814050087-3793815479db?w=400'],
                    stock: 45,
                    isActive: true
                },
                {
                    name: 'Logitech G435 Wireless Gaming Headset',
                    description: 'Lightweight wireless gaming headset with Bluetooth',
                    category: 'Gaming Headset',
                    brand: 'Logitech',
                    price: 280,
                    images: ['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400'],
                    stock: 12,
                    isActive: true
                },
                {
                    name: 'Mechanical Gaming Keyboard',
                    description: 'RGB backlit mechanical keyboard with blue switches',
                    category: 'Keyboard',
                    brand: 'Generic',
                    price: 120,
                    images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400'],
                    stock: 8,
                    isActive: true
                }
            ];

            await Product.insertMany(sampleProducts);
            console.log('✅ Sample products created');
        } else {
            console.log('ℹ️  Products already exist');
        }
    } catch (error: any) {
        console.error('❌ Error creating products:', error.message);
    }
};

const runSeeds = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('📦 Connected to MongoDB');

        await seedAdmin();
        await seedSettings();
        await seedProducts();

        console.log('🎉 Seeding completed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

(async () => {
    try {
        await runSeeds();
    } catch (error) {
        console.error('❌ An unhandled error occurred during seeding:', error);
        process.exit(1);
    }
})();
