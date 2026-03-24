import summarizerAgent from './agents/summarizerAgent';
import taskExtractorAgent from './agents/taskExtractorAgent';
import priorityAgent from './agents/priorityAgent';
import deadlineAgent from './agents/deadlineAgent';
import intentAgent from './agents/intentAgent';
import replyAgent from './agents/replyAgent';
import logger from '../../utils/logger';
import { Message, AIAgentResult } from '../../types';

export class WorkflowEngine {
  async processMessage(message: Message, autoReply: boolean = false): Promise<AIAgentResult> {
    try {
      logger.info('WorkflowEngine: Starting message processing', {
        messageId: message.id,
      });

      const messageText = `Subject: ${message.subject}\n\nBody: ${message.body}`;

      logger.info('WorkflowEngine: Step 1 - Summarizing');
      const summary = await summarizerAgent.execute(messageText);

      logger.info('WorkflowEngine: Step 2 - Extracting tasks');
      const tasks = await taskExtractorAgent.execute(messageText, message.id);

      logger.info('WorkflowEngine: Step 3 - Detecting priority');
      const priority = await priorityAgent.execute(messageText);

      logger.info('WorkflowEngine: Step 4 - Detecting deadline');
      const deadline = await deadlineAgent.execute(messageText);

      logger.info('WorkflowEngine: Step 5 - Detecting intent');
      const intent = await intentAgent.execute(messageText);

      let suggestedReply: string | undefined;

      if (autoReply) {
        logger.info('WorkflowEngine: Step 6 - Generating auto-reply');
        suggestedReply = await replyAgent.execute(messageText, summary, intent, tasks);
      }

      const result: AIAgentResult = {
        summary,
        tasks,
        priority,
        deadline: deadline || undefined,
        intent,
        suggestedReply,
      };

      logger.info('WorkflowEngine: Processing complete', {
        messageId: message.id,
        tasksCount: tasks.length,
        priority,
        hasDeadline: !!deadline,
        autoReply,
      });

      return result;
    } catch (error: any) {
      logger.error('WorkflowEngine: Processing failed', {
        messageId: message.id,
        error: error.message,
      });
      throw error;
    }
  }

  async processMultipleMessages(
    messages: Message[],
    autoReply: boolean = false
  ): Promise<Map<string, AIAgentResult>> {
    const results = new Map<string, AIAgentResult>();

    for (const message of messages) {
      try {
        const result = await this.processMessage(message, autoReply);
        results.set(message.id, result);
      } catch (error) {
        logger.error('WorkflowEngine: Failed to process message', {
          messageId: message.id,
        });
      }
    }

    return results;
  }
}

export default new WorkflowEngine();
