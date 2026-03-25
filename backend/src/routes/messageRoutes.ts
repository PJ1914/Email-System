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
router.get('/stream', authenticate, messageController.stream);           // SSE
router.get('/export', authenticate, messageController.exportCsv);        // CSV export
router.post('/bulk', authenticate, messageController.bulkAction);        // Bulk actions
router.patch('/:id/read', authenticate, messageController.markRead);     // Mark read
router.post('/:id/reply', authenticate, messageController.reply);        // Reply
router.get('/:emailId/inbox', authenticate, checkEmailAccess, messageController.getInbox);
router.get('/:id', authenticate, messageController.getById);
router.delete('/:id', authenticate, messageController.delete);

export default router;

