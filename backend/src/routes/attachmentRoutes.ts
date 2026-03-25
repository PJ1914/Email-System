import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  uploadMiddleware,
  uploadAttachment,
  downloadAttachment,
  deleteAttachment,
} from '../controllers/attachmentController';

const router = Router();

router.post('/', authenticate, uploadMiddleware, uploadAttachment);
router.get('/:id', authenticate, downloadAttachment);
router.delete('/:id', authenticate, deleteAttachment);

export default router;
