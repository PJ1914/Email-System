import aiService from '../../aiService';
import logger from '../../../utils/logger';

export class DeadlineAgent {
  async execute(messageText: string): Promise<Date | null> {
    try {
      logger.info('DeadlineAgent: Detecting deadline');
      const deadline = await aiService.detectDeadline(messageText);
      logger.info('DeadlineAgent: Deadline detected', { deadline });
      return deadline;
    } catch (error: any) {
      logger.error('DeadlineAgent: Failed to detect deadline', {
        error: error.message,
      });
      return null;
    }
  }
}

export default new DeadlineAgent();
