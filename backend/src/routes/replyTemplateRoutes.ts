import express from 'express';
import replyTemplateController from '../controllers/replyTemplateController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, replyTemplateController.list);
router.post('/', authenticate, replyTemplateController.create);
router.put('/:id', authenticate, replyTemplateController.update);
router.delete('/:id', authenticate, replyTemplateController.delete);

export default router;
