import express from 'express';
const router = express.Router();
import { getResearchStats } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/authMiddleware.js';

// Unified endpoint: The controller determines the scope (Admin vs Faculty) 
// based on the JWT token attached by the authenticate middleware.
router.get('/stats', authenticate, getResearchStats);
router.get('/faculty/stats', authenticate, getResearchStats);
router.get('/admin/stats', authenticate, getResearchStats);
export default router;
