import express from 'express';
import { facultyController } from '../controllers/facultyController.js';
import {authenticate} from '../middleware/authMiddleware.js';
// import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/:module', authenticate, facultyController.create);
router.get('/:module', authenticate, facultyController.getAll);
router.get('/:module/:id', authenticate, facultyController.getOne);
router.put('/:module/:id', authenticate, facultyController.update);
router.delete('/:module/:id', authenticate, facultyController.delete);

//router.post('/:module/:id/upload-proof', authenticate, facultyController.uploadProof);
router.post(
  '/:module/:id/proof',
  authenticate,
  upload.single('file'),
  facultyController.uploadProof
);
router.get(
  '/:module/:id/proof',
  authenticate,
  facultyController.getProof
);

router.post('/:module/validate', authenticate, facultyController.validateDuplicate);

export default router;
