import { Request, Response, NextFunction } from 'express';
import Settings from '../models/Settings.model.js';
import { successResponse } from '../utils/ApiResponse.js';

// Get settings
export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let settings = await Settings.findOne();

        if (!settings) {
            settings = await Settings.create({});
        }

        successResponse(res, { settings });
    } catch (error) {
        next(error);
    }
};

// Update settings
export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let settings = await Settings.findOne();

        if (!settings) {
            settings = new Settings(req.body);
        } else {
            Object.assign(settings, req.body);
        }

        settings.updatedBy = (req as any).admin._id;
        await settings.save();

        successResponse(res, { settings }, 'Settings updated successfully');
    } catch (error) {
        next(error);
    }
};
