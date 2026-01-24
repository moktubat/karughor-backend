import 'dotenv/config';

import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { connectDB } from './config/database.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();
const PORT: number | string = process.env.PORT || 5000;

console.log('🔵 [Server] Starting server...');
console.log('🔵 [Server] Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: PORT,
    FRONTEND_URL: process.env.FRONTEND_URL
});

// Connect to MongoDB
connectDB();

// CORS Configuration - UPDATED FOR PRODUCTION
const corsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        console.log('🔵 [CORS] Request from origin:', origin);
        
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) {
            console.log('✅ [CORS] No origin header - allowing');
            return callback(null, true);
        }
        
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'http://localhost:3000',
            'https://karughor.vercel.app'
        ];
        
        console.log('🔵 [CORS] Allowed origins:', allowedOrigins);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log('✅ [CORS] Origin allowed:', origin);
            callback(null, true);
        } else {
            console.log('❌ [CORS] Origin not allowed:', origin);
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['set-cookie']
};

console.log('🔵 [Server] CORS options configured');

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging middleware
app.use((req: Request, res: Response, next) => {
    console.log('📥 [Server] Incoming request:', {
        method: req.method,
        path: req.path,
        origin: req.headers.origin,
        cookies: req.cookies,
        hasCookieHeader: !!req.headers.cookie,
        timestamp: new Date().toISOString()
    });
    next();
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req: Request, res: Response) => {
    console.log('🟢 [Server] Health check');
    res.status(200).json({
        status: 'OK',
        message: 'Server is running',
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api', routes);

// 404 handler
app.use((req: Request, res: Response) => {
    console.log('❌ [Server] 404 - Route not found:', req.path);
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path
    });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log('✅ [Server] Ready to accept requests');
});