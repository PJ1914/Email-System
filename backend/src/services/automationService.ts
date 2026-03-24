import workflowEngine from './trae/workflowEngine';
import messageService from './messageService';
import sesService from './sesService';
import UserModel from '../models/User';
import MessageModel from '../models/Message';
import EmailModel from '../models/Email';
import logger from '../utils/logger';
import { Message } from '../types';

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

      const aiResult = await workflowEngine.processMessage(message, shouldAutoReply);

      await MessageModel.markProcessed(message.id, {
        summary: aiResult.summary,
        tasks: aiResult.tasks,
        priority: aiResult.priority,
        deadline: aiResult.deadline,
      });

      if (shouldAutoReply && aiResult.suggestedReply) {
        logger.info('AutomationService: Sending auto-reply', {
          messageId: message.id,
        });

        await sesService.sendEmail({
          to: message.from,
          subject: `Re: ${message.subject}`,
          body: aiResult.suggestedReply,
          from: email.address,
        });

        await MessageModel.update(message.id, {
          isAutoReplied: true,
          autoReply: aiResult.suggestedReply,
        });

        logger.info('AutomationService: Auto-reply sent', {
          messageId: message.id,
        });
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
