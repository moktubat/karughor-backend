import { z } from 'zod';

export const createProductSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().min(1, 'Description is required'),
    category: z.string().min(1, 'Category is required'),
    brand: z.string().optional(),
    price: z.coerce.number().min(0, 'Price must be positive'),
    originalPrice: z.coerce.number().optional(),
    stock: z.coerce.number().min(0, 'Stock cannot be negative'),
    lowStockThreshold: z.coerce.number().default(10),
    isActive: z.preprocess(
        (val) => val === 'true' || val === true,
        z.boolean()
    ).default(true),
    specifications: z.record(z.string()).optional(),
    inTheBox: z.array(z.string()).optional(),
    systemRequirements: z.array(z.string()).optional()
});