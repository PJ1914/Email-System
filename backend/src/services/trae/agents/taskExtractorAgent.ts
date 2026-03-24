import aiService from '../../aiService';
import priorityAgent from './priorityAgent';
import logger from '../../../utils/logger';
import { Task } from '../../../types';

export class TaskExtractorAgent {
  async execute(messageText: string, messageId: string): Promise<Task[]> {
    try {
      logger.info('TaskExtractorAgent: Extracting tasks');
      const taskDescriptions = await aiService.extractTasks(messageText);

      const tasks: Task[] = await Promise.all(
        taskDescriptions.map(async (description, index) => ({
          id: `${messageId}-task-${index}`,
          description,
          priority: await priorityAgent.execute(description),
          status: 'pending' as any,
          extractedFrom: messageId,
          createdAt: new Date(),
        }))
      );

      logger.info('TaskExtractorAgent: Tasks extracted', {
        count: tasks.length,
      });
      return tasks;
    } catch (error: any) {
      logger.error('TaskExtractorAgent: Failed to extract tasks', {
        error: error.message,
      });
      return [];
    }
  }
}

export default new TaskExtractorAgent();
