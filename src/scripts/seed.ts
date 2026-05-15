
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Admin from '../models/Admin.model.js';
import Settings from '../models/Settings.model.js';
import Category from '../models/Category.model.js';

dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// SEED ADMIN
// ─────────────────────────────────────────────────────────────────────────────
const seedAdmin = async (): Promise<void> => {
    try {
        const adminExists = await Admin.findOne({ email: process.env.ADMIN_EMAIL });

        if (!adminExists) {
            await Admin.create({
                fullName: process.env.ADMIN_NAME || 'Admin User',
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD,
                phone: process.env.ADMIN_PHONE,
                role: 'super_admin',
                isActive: true,
            });
            console.log('✅ Admin user created');
        } else {
            console.log('ℹ️  Admin user already exists — skipping');
        }
    } catch (error: any) {
        console.error('❌ Error creating admin:', error.message);
        throw error;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// SEED SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
const seedSettings = async (): Promise<void> => {
    try {
        const settingsExists = await Settings.findOne();

        if (!settingsExists) {
            const adminUser = await Admin.findOne({ email: process.env.ADMIN_EMAIL });

            if (!adminUser) {
                throw new Error('Admin user not found. Run seedAdmin() first.');
            }

            await Settings.create({
                codEnabled: true,
                maxCodAmount: 50000,
                insideDhakaCharge: 70,
                outsideDhakaCharge: 120,
                taxPercentage: 0,
                autoCancel: false,
                autoCancelHours: 48,
                updatedBy: adminUser._id,
            });
            console.log('✅ Settings created');
        } else {
            console.log('ℹ️  Settings already exist — skipping');
        }
    } catch (error: any) {
        console.error('❌ Error creating settings:', error.message);
        throw error;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// SEED CATEGORIES  (matches staticCategories.ts & categoryDefaults.ts exactly)
// ─────────────────────────────────────────────────────────────────────────────
const seedCategories = async (): Promise<void> => {
    try {
        const count = await Category.countDocuments();

        if (count > 0) {
            console.log('ℹ️  Categories already exist — skipping');
            return;
        }

        const categories = [
            {
                name: 'Jute Rug',
                slug: 'jute-rug',
                icon: 'GiBasket',
                description: 'Handwoven jute rugs made by Bangladeshi artisans.',
                isActive: true,
                sortOrder: 1,
                subCategories: [],
            },
            {
                name: "Ladies' Bags and Purses",
                slug: 'ladies-bags-purses',
                icon: 'FaShoppingBag',
                description: 'Handcrafted jute and fabric bags and purses.',
                isActive: true,
                sortOrder: 2,
                subCategories: [],
            },
            {
                name: 'Planter Baskets',
                slug: 'planter-baskets',
                icon: 'GiFlowerPot',
                description: 'Natural jute and woven planter baskets for indoor plants.',
                isActive: true,
                sortOrder: 3,
                subCategories: [],
            },
            {
                name: 'Laundry Baskets',
                slug: 'laundry-baskets',
                icon: 'MdLocalLaundryService',
                description: 'Eco-friendly woven laundry and storage baskets.',
                isActive: true,
                sortOrder: 4,
                subCategories: [],
            },
            {
                name: 'Shotoronji',
                slug: 'shotoronji',
                icon: 'BsGrid3X2Gap',
                description: 'Traditional Bangladeshi hand-woven floor mats.',
                isActive: true,
                sortOrder: 5,
                subCategories: [],
            },
            {
                name: 'Dining Placemats',
                slug: 'dining-placemats',
                icon: 'FaUtensils',
                description: 'Natural jute and cotton dining placemats.',
                isActive: true,
                sortOrder: 6,
                subCategories: [],
            },
            {
                name: 'Wall Art',
                slug: 'wall-art',
                icon: 'MdWallpaper',
                description: 'Handcrafted wall art pieces by Bangladeshi artisans.',
                isActive: true,
                sortOrder: 7,
                subCategories: [],
            },
            {
                name: 'Three-Piece Sets',
                slug: 'three-piece-sets',
                icon: 'FaTshirt',
                description: 'Traditional Bangladeshi three-piece clothing sets.',
                isActive: true,
                sortOrder: 8,
                subCategories: [
                    { name: 'Batik',        slug: 'batik',        isActive: true },
                    { name: 'Jomjom',       slug: 'jomjom',       isActive: true },
                    { name: 'Block Print',  slug: 'block-print',  isActive: true },
                    { name: 'Party Wear',   slug: 'party-wear',   isActive: true },
                ],
            },
            {
                name: 'Bed Sheets',
                slug: 'bed-sheets',
                icon: 'FaBed',
                description: 'Pure cotton and hand-embroidered bed sheets.',
                isActive: true,
                sortOrder: 9,
                subCategories: [
                    { name: 'Hometex Bed Sheets',           slug: 'hometex-bed-sheets',           isActive: true },
                    { name: 'Hand-Embroidered Bed Sheets',  slug: 'hand-embroidered-bed-sheets',  isActive: true },
                ],
            },
            {
                name: 'Nakshi Kantha',
                slug: 'nakshi-kantha',
                icon: 'GiSewingNeedle',
                description: 'Traditional hand-stitched Bangladeshi Nakshi Kantha embroidery.',
                isActive: true,
                sortOrder: 10,
                subCategories: [],
            },
        ];

        await Category.insertMany(categories);
        console.log(`✅ ${categories.length} categories seeded`);
    } catch (error: any) {
        console.error('❌ Error seeding categories:', error.message);
        throw error;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN — runs all seeds in order
// ─────────────────────────────────────────────────────────────────────────────
const runSeeds = async (): Promise<void> => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.error('❌ MONGODB_URI is not set in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log('📦 Connected to MongoDB');

        await seedAdmin();
        await seedSettings();
        await seedCategories();

        console.log('\n🎉 All seeds completed successfully');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 MongoDB disconnected');
        process.exit(0);
    }
};

runSeeds();