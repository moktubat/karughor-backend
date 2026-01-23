import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate = (schema: ZodSchema<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error: any) {
            const errors = error.errors.map((err: any) => ({
                field: err.path.join('.'),
                message: err.message
            }));

            res.status(400).json({
                success: false,
                error: { message: 'Validation failed', details: errors, statusCode: 400 }
            });
        }
    };
};
