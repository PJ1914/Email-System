import express, { Application } from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './utils/errorHandler';
import logger from './utils/logger';

import authRoutes from './routes/authRoutes';
import emailRoutes from './routes/emailRoutes';
import messageRoutes from './routes/messageRoutes';
import sesConfigRoutes from './routes/sesConfigRoutes';
import roleRoutes from './routes/roleRoutes';
import webhookRoutes from './routes/webhookRoutes';
import replyTemplateRoutes from './routes/replyTemplateRoutes';
import attachmentRoutes from './routes/attachmentRoutes';
import RoleModel from './models/Role';

const app: Application = express();

app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
  });
  next();
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ses-config', sesConfigRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/reply-templates', replyTemplateRoutes);
app.use('/api/attachments', attachmentRoutes);

// Seed default roles (admin + user) on startup
RoleModel.seedDefaults().catch((err) =>
  logger.error('Failed to seed default roles', { err })
);

app.use(errorHandler);

export default app;
