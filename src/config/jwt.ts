import jwt, { SignOptions, Secret } from 'jsonwebtoken';

interface Payload {
    [key: string]: any;
}

// Ensure JWT_SECRET is defined
const JWT_SECRET: Secret = process.env.JWT_SECRET || '';
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not defined");
}

// JWT_EXPIRE can be string (like '30d') or number (seconds)
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
