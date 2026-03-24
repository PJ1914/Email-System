import aiService from '../../aiService';
import logger from '../../../utils/logger';

export class SummarizerAgent {
  async execute(messageText: string): Promise<string> {
    try {
      logger.info('SummarizerAgent: Processing message');
      const summary = await aiService.summarize(messageText);
      logger.info('SummarizerAgent: Summary generated', { summary });
      return summary;
    } catch (error: any) {
      logger.error('SummarizerAgent: Failed to generate summary', {
        error: error.message,
      });
      throw error;
    }
  }
}

export default new SummarizerAgent();
