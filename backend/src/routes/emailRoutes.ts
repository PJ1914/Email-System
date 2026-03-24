import express from 'express';
import emailController from '../controllers/emailController';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest, schemas } from '../middleware/validator';
import { UserRole } from '../types';

const router = express.Router();

router.post(
  '/create',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest(schemas.createEmail),
  emailController.create
);

router.post(
  '/assign',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validateRequest(schemas.assignEmail),
  emailController.assign
);

router.get('/', authenticate, emailController.getAll);
router.get('/:id', authenticate, emailController.getById);

router.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  emailController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  emailController.delete
);

export default router;
