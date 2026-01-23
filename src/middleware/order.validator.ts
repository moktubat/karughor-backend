import { z } from 'zod';

export const createOrderSchema = z.object({
    customer: z.object({
        name: z.string().min(1, 'Customer name is required'),
        phone: z.string().regex(/^[0-9+\-\s()]+$/, 'Invalid phone number'),
        email: z.string().email().optional().or(z.literal('')),
        address: z.object({
            street: z.string().min(1, 'Street address is required'),
            area: z.string().min(1, 'Area is required'),
            city: z.string().min(1, 'City is required'),
            deliveryLocation: z.enum(['inside_dhaka', 'outside_dhaka'])
        })
    }),
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().min(1)
    })).min(1, 'At least one item is required'),
    notes: z.string().optional()
});
