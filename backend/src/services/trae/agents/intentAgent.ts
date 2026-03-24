import aiService from '../../aiService';
import logger from '../../../utils/logger';

export class IntentAgent {
  async execute(messageText: string): Promise<string> {
    try {
      logger.info('IntentAgent: Detecting intent');
      const intent = await aiService.detectIntent(messageText);
      logger.info('IntentAgent: Intent detected', { intent });
      return intent;
    } catch (error: any) {
      logger.error('IntentAgent: Failed to detect intent', {
        error: error.message,
      });
      return 'other';
    }
  }
}

export default new IntentAgent();
