import express from 'express';
import messageController from '../controllers/messageController';
import { authenticate, checkEmailAccess } from '../middleware/auth';
import { validateRequest, schemas } from '../middleware/validator';

const router = express.Router();

router.post(
  '/send',
  authenticate,
  validateRequest(schemas.sendMessage),
  messageController.send
);

router.get('/inbox', authenticate, messageController.getUserInbox);
router.get('/sent', authenticate, messageController.getSent);
router.get('/:emailId/inbox', authenticate, checkEmailAccess, messageController.getInbox);
router.get('/:id', authenticate, messageController.getById);
router.delete('/:id', authenticate, messageController.delete);

export default router;
