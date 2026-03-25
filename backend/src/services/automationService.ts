import workflowEngine from './trae/workflowEngine';
import messageService from './messageService';
import sesService from './sesService';
import sesConfigService from './sesConfigService';
import UserModel from '../models/User';
import MessageModel from '../models/Message';
import EmailModel from '../models/Email';
import logger from '../utils/logger';
import { Message } from '../types';

// Keyword → role routing table (Feature 10: Role-Based Email Routing)
const INTENT_ROLE_MAP: Record<string, string> = {
  complaint: 'support',
  support: 'support',
  refund: 'support',
  billing: 'finance',
  payment: 'finance',
  invoice: 'finance',
  subscription: 'finance',
  sales: 'sales',
  demo: 'sales',
  pricing: 'sales',
  purchase: 'sales',
  technical: 'engineering',
  bug: 'engineering',
  error: 'engineering',
  crash: 'engineering',
};

export class AutomationService {
  async processIncomingMessage(message: Message): Promise<void> {
    try {
      logger.info('AutomationService: Processing incoming message', {
        messageId: message.id,
      });

      const email = await EmailModel.findById(message.emailId);
      if (!email) {
        logger.error('AutomationService: Email not found', {
          emailId: message.emailId,
        });
        return;
      }

      const users = await Promise.all(
        email.assignedTo.map((uid) => UserModel.findByUid(uid))
      );

      const autoUsers = users.filter((user) => user && user.autoMode);

      const shouldAutoReply = autoUsers.length > 0;

      // Resolve tenant SES credentials for this email account
      const tenantCreds = await sesConfigService.resolveCredsForEmail(email.id);

      const aiResult = await workflowEngine.processMessage(message, shouldAutoReply);

      await MessageModel.markProcessed(message.id, {
        summary: aiResult.summary,
        tasks: aiResult.tasks,
        priority: aiResult.priority,
        deadline: aiResult.deadline,
        sentiment: aiResult.sentiment,
      });

      // Feature 10: Role-Based Email Routing
      const intent = (aiResult.intent || '').toLowerCase();
      const routeRole = Object.entries(INTENT_ROLE_MAP).find(([kw]) => intent.includes(kw))?.[1];
      if (routeRole) {
        const allUsers = await UserModel.getAll();
        const roleUsers = allUsers.filter((u) => u.role === routeRole);
        if (roleUsers.length > 0) {
          const current = email.assignedTo || [];
          const merged = [...new Set([...current, ...roleUsers.map((u) => u.uid)])];
          await EmailModel.update(email.id, { assignedTo: merged });
          logger.info('AutomationService: Routed to role team', {
            messageId: message.id, role: routeRole, users: roleUsers.length,
          });
        }
      }

      if (shouldAutoReply && aiResult.suggestedReply) {
        if (!tenantCreds) {
          logger.warn('AutomationService: No SES config for email account, skipping auto-reply', {
            emailId: email.id,
          });
        } else {
          logger.info('AutomationService: Sending auto-reply', {
            messageId: message.id,
          });

          await sesService.sendEmail({
            to: message.from,
            subject: `Re: ${message.subject}`,
            body: aiResult.suggestedReply,
            from: email.address,
            isHtml: false,
          }, tenantCreds);

          await MessageModel.update(message.id, {
            isAutoReplied: true,
            autoReply: aiResult.suggestedReply,
          });

          logger.info('AutomationService: Auto-reply sent', {
            messageId: message.id,
          });
        }
      }

      logger.info('AutomationService: Message processing complete', {
        messageId: message.id,
        autoReplied: shouldAutoReply,
      });
    } catch (error: any) {
      logger.error('AutomationService: Failed to process message', {
        messageId: message.id,
        error: error.message,
      });
    }
  }

  async processUnprocessedMessages(): Promise<void> {
    try {
      logger.info('AutomationService: Processing unprocessed messages');

      const messages = await messageService.getUnprocessedMessages();
      logger.info('AutomationService: Found unprocessed messages', {
        count: messages.length,
      });

      for (const message of messages) {
        await this.processIncomingMessage(message);
      }

      logger.info('AutomationService: Batch processing complete');
    } catch (error: any) {
      logger.error('AutomationService: Batch processing failed', {
        error: error.message,
      });
    }
  }

  async startPeriodicProcessing(intervalMs: number = 60000): Promise<void> {
    logger.info('AutomationService: Starting periodic processing', {
      intervalMs,
    });

    setInterval(async () => {
      await this.processUnprocessedMessages();
    }, intervalMs);
  }
}

export default new AutomationService();
