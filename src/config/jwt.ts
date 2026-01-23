import jwt from 'jsonwebtoken';

interface Payload {
    [key: string]: any;
}

export const generateToken = (payload: Payload): string => {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });
};

export const verifyToken = (token: string): any => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
        throw new Error('Invalid token');
    }
};
