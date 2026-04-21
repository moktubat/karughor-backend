import jwt, { SignOptions, Secret } from 'jsonwebtoken';

interface Payload {
    [key: string]: any;
}

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required but not set');
}

const JWT_SECRET: Secret = process.env.JWT_SECRET;
const JWT_EXPIRE = (process.env.JWT_EXPIRE || '30d') as `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}` | number;

export const generateToken = (payload: Payload): string => {
    const options: SignOptions = { expiresIn: JWT_EXPIRE };
    return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): Payload => {
    try {
        return jwt.verify(token, JWT_SECRET) as Payload;
    } catch (error) {
        throw new Error('Invalid token');
    }
};