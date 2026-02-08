import express from 'express';
const router = express.Router();
import { getFacultyStats, getAdminStats } from '../controllers/analyticsController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';

router.get('/faculty/stats', authenticate, getFacultyStats);
router.get('/admin/stats', authenticate, isAdmin, getAdminStats);

export default router;