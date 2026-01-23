import express from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { authenticateAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

router.get('/', getSettings);
router.put('/', authenticateAdmin, updateSettings);

export default router;
