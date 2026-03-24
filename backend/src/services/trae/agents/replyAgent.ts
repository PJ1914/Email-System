import aiService from '../../aiService';
import logger from '../../../utils/logger';
import { Task } from '../../../types';

export class ReplyAgent {
  async execute(
    messageText: string,
    summary: string,
    intent: string,
    tasks: Task[]
  ): Promise<string> {
    try {
      logger.info('ReplyAgent: Generating reply');
      const taskDescriptions = tasks.map((t) => t.description);
      const reply = await aiService.generateReply(
        messageText,
        summary,
        intent,
        taskDescriptions
      );
      logger.info('ReplyAgent: Reply generated');
      return reply;
    } catch (error: any) {
      logger.error('ReplyAgent: Failed to generate reply', {
        error: error.message,
      });
      return ''; // Return empty string — automationService checks truthiness before sending
    }
  }
}

export default new ReplyAgent();
