import summarizerAgent from './agents/summarizerAgent';
import taskExtractorAgent from './agents/taskExtractorAgent';
import priorityAgent from './agents/priorityAgent';
import deadlineAgent from './agents/deadlineAgent';
import intentAgent from './agents/intentAgent';
import replyAgent from './agents/replyAgent';
import sentimentAgent from './agents/sentimentAgent';
import logger from '../../utils/logger';
import { Message, AIAgentResult } from '../../types';

export class WorkflowEngine {
  async processMessage(message: Message, autoReply: boolean = false): Promise<AIAgentResult> {
    try {
      logger.info('WorkflowEngine: Starting message processing', {
        messageId: message.id,
      });

      const messageText = `Subject: ${message.subject}\n\nBody: ${message.body}`;

      logger.info('WorkflowEngine: Steps 1-5 running in parallel');

      // Run all analysis agents concurrently — ~6x faster than sequential
      const [summary, tasks, priority, deadline, intent, sentiment] = await Promise.all([
        summarizerAgent.execute(messageText),
        taskExtractorAgent.execute(messageText, message.id),
        priorityAgent.execute(messageText),
        deadlineAgent.execute(messageText),
        intentAgent.execute(messageText),
        sentimentAgent.execute(messageText),
      ]);

      logger.info('WorkflowEngine: Steps 1-5 complete', {
        tasksCount: tasks.length,
        priority,
        hasDeadline: !!deadline,
      });

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
        sentiment,
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
