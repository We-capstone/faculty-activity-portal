import express from 'express';
import { journalController } from '../controllers/journalController.js';
import { authenticate } from '../middleware/authMiddleware.js';
const router = express.Router();

/**
 * All routes below are protected by the authenticate middleware.
 * Faculty can manage their own data.
 * Admins can manage all data.
 */

// POST: Create a new journal entry
router.post('/', authenticate, journalController.create);

// GET: Retrieve journals (filtered for Faculty, all for Admin)
router.get('/', authenticate, journalController.getAll);

// PUT: Update an entry (Admin can approve, Faculty can edit PENDING only)
router.put('/:id', authenticate, journalController.update);

// DELETE: Remove an entry
router.delete('/:id', authenticate, journalController.delete);

export default router;