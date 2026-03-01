import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js';

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req: any, file: Express.Multer.File) => {
        const folder = req.baseUrl.includes('product')
            ? 'karughor/products'
            : 'karughor/profiles';

        return {
            folder,
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            transformation: [{ width: 800, quality: 'auto', fetch_format: 'auto' }],
            public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        };
    },
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'));
    }
};

export const upload = multer({
    storage,
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE!) || 5242880 },
    fileFilter,
});
