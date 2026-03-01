import express from 'express';
import {
    getProfile,
    updateProfile,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    changePassword
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate); // All routes require authentication

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', authenticate, changePassword);
router.get('/wishlist', getWishlist);
router.post('/wishlist/:productId', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);

export default router;
