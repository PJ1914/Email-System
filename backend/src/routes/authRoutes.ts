import express from 'express';
import authController from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest, schemas } from '../middleware/validator';
import { UserRole } from '../types';

const router = express.Router();

// Public routes
router.post('/register', validateRequest(schemas.register), authController.register);
router.post('/login', validateRequest(schemas.login), authController.login);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/auto-mode', authenticate, validateRequest(schemas.updateAutoMode), authController.setAutoMode);

// Admin-only routes
router.post(
  '/users/create',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest(schemas.createUserWithRole),
  authController.createUser
);

router.get(
  '/users',
  authenticate,
  authorize(UserRole.ADMIN),
  authController.getAllUsers
);

router.put(
  '/users/:uid/role',
  authenticate,
  authorize(UserRole.ADMIN),
  authController.updateUserRole
);

export default router;
