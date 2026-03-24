import MessageModel from '../models/Message';
import EmailModel from '../models/Email';
import sesService from './sesService';
import sesConfigService from './sesConfigService';
import { Message } from '../types';
import { AppError } from '../utils/errorHandler';

export class MessageService {
  async sendMessage(
    emailId: string,
    to: string,
    subject: string,
    body: string,
    from: string
  ): Promise<Message> {
    const email = await EmailModel.findById(emailId);
    if (!email) {
      throw new AppError('Email not found', 404);
    }

    // Resolve per-tenant SES credentials — required, no silent fallback to global
    const tenantCreds = await sesConfigService.resolveCredsForEmail(emailId);
    if (!tenantCreds) {
      throw new AppError(
        'This email account is not linked to any SES configuration. Go to SES Configuration → Link Email Account first.',
        400
      );
    }

    await sesService.sendEmail({
      to,
      subject,
      body,
      from: email.address,
      isHtml: true,
    }, tenantCreds);

    const message = await MessageModel.create({
      emailId,
      from,
      to,
      subject,
      body,
      isAutoReplied: false,
      isSent: true,
      receivedAt: new Date(),
    });

    return message;
  }

  async getInbox(emailId: string, limit: number = 50): Promise<Message[]> {
    return await MessageModel.getByEmail(emailId, limit);
  }

  async getMessageById(id: string): Promise<Message> {
    const message = await MessageModel.findById(id);
    if (!message) {
      throw new AppError('Message not found', 404);
    }
    return message;
  }

  async getUserInbox(uid: string, limit: number = 50): Promise<Message[]> {
    return await MessageModel.getInboxByUser(uid, limit);
  }

  async getSent(uid: string, limit: number = 50): Promise<Message[]> {
    return await MessageModel.getSentByUser(uid, limit);
  }

  async receiveMessage(messageData: Omit<Message, 'id'>): Promise<Message> {
    return await MessageModel.create(messageData);
  }

  async updateMessage(id: string, data: Partial<Message>): Promise<void> {
    await MessageModel.update(id, data);
  }

  async deleteMessage(id: string): Promise<void> {
    await MessageModel.delete(id);
  }

  async getUnprocessedMessages(): Promise<Message[]> {
    return await MessageModel.getUnprocessed();
  }
}

export default new MessageService();
