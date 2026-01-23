import { Response } from 'express';

export class ApiResponse {
    success: boolean;
    data?: any;
    message?: string;

    constructor(success: boolean, data: any = null, message: string = '') {
        this.success = success;
        if (data) this.data = data;
        if (message) this.message = message;
    }
}

export const successResponse = (res: Response, data: any, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json(new ApiResponse(true, data, message));
};

export const errorResponse = (res: Response, message: string, statusCode = 400) => {
    return res.status(statusCode).json(new ApiResponse(false, null, message));
};
