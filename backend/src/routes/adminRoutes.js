import express from 'express';
import { getApprovals } from '../controllers/adminController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/authMiddleware.js';
import { handleStatusUpdate } from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication AND admin role
router.use(authenticate);
router.use(isAdmin);

// Handles: 
// GET /admin/approvals (All modules)
// GET /admin/approvals?module=journals (Specific module)
// GET /admin/approvals?status=APPROVED (History view)
// router.get('/approvals', getApprovals);
// router.patch('/:module/:id/status', handleStatusUpdate);

export default router;