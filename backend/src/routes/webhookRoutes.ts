import express from 'express';
import { sesInbound } from '../controllers/webhookController';

const router = express.Router();

// SNS posts with Content-Type: text/plain sometimes — accept both
router.post(
  '/ses-inbound',
  express.text({ type: ['application/json', 'text/plain', '*/*'], limit: '10mb' }),
  sesInbound
);

export default router;
