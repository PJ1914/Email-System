import express from 'express';
import sesConfigController from '../controllers/sesConfigController';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest, schemas } from '../middleware/validator';
import { UserRole } from '../types';

const router = express.Router();

// All SES config routes require authentication.
// Admins see everything; non-admin users see only their own configs.

router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest(schemas.createSESConfig),
  sesConfigController.create
);

router.get('/', authenticate, authorize(UserRole.ADMIN), sesConfigController.getAll);

router.get('/:id', authenticate, authorize(UserRole.ADMIN), sesConfigController.getById);

router.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest(schemas.updateSESConfig),
  sesConfigController.update
);

router.delete('/:id', authenticate, authorize(UserRole.ADMIN), sesConfigController.delete);

// Action endpoints
router.post('/:id/test', authenticate, authorize(UserRole.ADMIN), sesConfigController.testConnection);

router.post(
  '/:id/verify-email',
  authenticate,
  authorize(UserRole.ADMIN),
  sesConfigController.verifyFromEmail
);

router.post(
  '/:id/verify-domain',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest(schemas.verifyDomain),
  sesConfigController.verifyDomain
);

router.post(
  '/:id/email-status',
  authenticate,
  authorize(UserRole.ADMIN),
  sesConfigController.refreshEmailStatus
);

router.post(
  '/:id/domain-status',
  authenticate,
  authorize(UserRole.ADMIN),
  sesConfigController.refreshDomainStatus
);

router.post(
  '/:id/link-email',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest(schemas.linkEmail),
  sesConfigController.linkEmail
);

export default router;
