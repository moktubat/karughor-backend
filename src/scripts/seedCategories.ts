// Add this function inside your seed.ts file (or run separately)
// Seeder for Karughor categories with icons

import Category from '../models/Category.model.js';

export const seedCategories = async () => {
    try {
        const count = await Category.countDocuments();
        if (count > 0) {
            console.log('ℹ️  Categories already exist, skipping seed');
            return;
        }

        const categories = [
            { name: 'Jute Rug', slug: 'jute-rug', icon: 'GiWoodenChair', sortOrder: 1 },
            { name: "Ladies' Bags and Purses", slug: 'ladies-bags-purses', icon: 'FaShoppingBag', sortOrder: 2 },
            { name: 'Planter Baskets', slug: 'planter-baskets', icon: 'GiFlowerPot', sortOrder: 3 },
            { name: 'Laundry Baskets', slug: 'laundry-baskets', icon: 'MdLocalLaundryService', sortOrder: 4 },
            { name: 'Shotoronji (Traditional Floor Mat)', slug: 'shotoronji', icon: 'BsGrid3X2Gap', sortOrder: 5 },
            { name: 'Dining Placemats', slug: 'dining-placemats', icon: 'FaUtensils', sortOrder: 6 },
            { name: 'Wall Art', slug: 'wall-art', icon: 'MdWallpaper', sortOrder: 7 },
            {
                name: 'Three-Piece Sets', slug: 'three-piece-sets', icon: 'FaTshirt', sortOrder: 8,
                subCategories: [
                    { name: 'Batik', slug: 'batik', isActive: true },
                    { name: 'Jomjom', slug: 'jomjom', isActive: true },
                    { name: 'Block Print', slug: 'block-print', isActive: true },
                    { name: 'Party Wear', slug: 'party-wear', isActive: true },
                ]
            },
            {
                name: 'Bed Sheets', slug: 'bed-sheets', icon: 'FaBed', sortOrder: 9,
                subCategories: [
                    { name: 'Hometex Bed Sheets', slug: 'hometex-bed-sheets', isActive: true },
                    { name: 'Hand-Embroidered Bed Sheets', slug: 'hand-embroidered-bed-sheets', isActive: true },
                ]
            },
            { name: 'Nakshi Kantha', slug: 'nakshi-kantha', icon: 'GiSewingNeedle', sortOrder: 10 },
        ];

        await Category.insertMany(categories);
        console.log('✅ Categories seeded successfully');
    } catch (error: any) {
        console.error('❌ Error seeding categories:', error.message);
    }
};