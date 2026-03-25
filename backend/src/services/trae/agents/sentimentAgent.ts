import aiService from '../../aiService';
import logger from '../../../utils/logger';

export type Sentiment = 'positive' | 'negative' | 'neutral' | 'urgent' | 'frustrated';

export class SentimentAgent {
  async execute(messageText: string): Promise<Sentiment> {
    try {
      logger.info('SentimentAgent: Analyzing sentiment');
      const sentiment = await aiService.detectSentiment(messageText);
      logger.info('SentimentAgent: Sentiment detected', { sentiment });
      return sentiment;
    } catch (error: any) {
      logger.error('SentimentAgent: Failed to detect sentiment', {
        error: error.message,
      });
      return 'neutral';
    }
  }
}

export default new SentimentAgent();
