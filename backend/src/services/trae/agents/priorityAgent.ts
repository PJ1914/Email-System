import aiService from '../../aiService';
import logger from '../../../utils/logger';
import { Priority } from '../../../types';

export class PriorityAgent {
  async execute(messageText: string): Promise<Priority> {
    try {
      logger.info('PriorityAgent: Detecting priority');
      const priority = await aiService.detectPriority(messageText);
      logger.info('PriorityAgent: Priority detected', { priority });
      return priority as Priority;
    } catch (error: any) {
      logger.error('PriorityAgent: Failed to detect priority', {
        error: error.message,
      });
      return Priority.MEDIUM;
    }
  }
}

export default new PriorityAgent();
