import { getGeminiModel } from '../config/gemini';
import logger from '../utils/logger';
import { AppError } from '../utils/errorHandler';

export class AIService {
  private model;
  private maxRetries = 3;

  constructor() {
    this.model = getGeminiModel();
  }

  private async generateWithRetry(prompt: string, retries = 0): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      logger.error('AI generation failed', { error: error.message, retries });

      if (retries < this.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retries + 1)));
        return this.generateWithRetry(prompt, retries + 1);
      }

      throw new AppError('AI service unavailable', 503);
    }
  }

  async summarize(text: string): Promise<string> {
    const prompt = `Summarize the following email message in 2-3 concise sentences. Focus on the main points and key information:

Email:
${text}

Summary:`;

    return await this.generateWithRetry(prompt);
  }

  async extractTasks(text: string): Promise<string[]> {
    const prompt = `Extract all actionable tasks from the following email. Return only the task descriptions, one per line. If there are no tasks, return "No tasks found".

Email:
${text}

Tasks:`;

    const response = await this.generateWithRetry(prompt);
    const tasks = response
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.toLowerCase().includes('no tasks'));

    return tasks;
  }

  async detectPriority(text: string): Promise<'low' | 'medium' | 'high' | 'urgent'> {
    const prompt = `Analyze the following email and determine its priority level. Respond with ONLY ONE WORD: low, medium, high, or urgent.

Consider:
- Urgency keywords (ASAP, urgent, immediate, critical)
- Deadlines mentioned
- Tone and language
- Importance indicators

Email:
${text}

Priority (one word only):`;

    const response = await this.generateWithRetry(prompt);
    const priority = response.trim().toLowerCase();

    if (['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return priority as 'low' | 'medium' | 'high' | 'urgent';
    }

    return 'medium';
  }

  async detectDeadline(text: string): Promise<Date | null> {
    const prompt = `Extract any deadline or due date mentioned in the following email. Return ONLY the date in ISO format (YYYY-MM-DD) or "none" if no deadline is mentioned.

Email:
${text}

Deadline (ISO format or "none"):`;

    const response = await this.generateWithRetry(prompt);
    const dateMatch = response.match(/\d{4}-\d{2}-\d{2}/);

    if (dateMatch) {
      return new Date(dateMatch[0]);
    }

    return null;
  }

  async detectIntent(text: string): Promise<string> {
    const prompt = `Analyze the following email and identify the sender's primary intent. Choose ONE from: inquiry, request, complaint, feedback, notification, meeting, or other.

Email:
${text}

Intent (one word):`;

    const response = await this.generateWithRetry(prompt);
    return response.trim().toLowerCase();
  }

  async generateReply(
    originalMessage: string,
    summary: string,
    intent: string,
    tasks: string[]
  ): Promise<string> {
    const prompt = `Generate a professional email reply based on the following information:

Original Message:
${originalMessage}

Summary: ${summary}
Intent: ${intent}
Extracted Tasks: ${tasks.join(', ')}

Generate a polite, professional response that:
1. Acknowledges receipt of the email
2. Addresses the main points
3. Confirms understanding of any tasks
4. Provides a professional closing

Reply:`;

    return await this.generateWithRetry(prompt);
  }
}

export default new AIService();
