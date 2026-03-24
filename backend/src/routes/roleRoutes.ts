import express from 'express';
import roleController from '../controllers/roleController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = express.Router();

// Any authenticated user can list roles (needed for create-user dropdowns)
router.get('/', authenticate, roleController.getAll);

// Admin-only mutations
router.post('/', authenticate, authorize(UserRole.ADMIN), roleController.create);
router.put('/:id', authenticate, authorize(UserRole.ADMIN), roleController.update);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), roleController.delete);

export default router;
