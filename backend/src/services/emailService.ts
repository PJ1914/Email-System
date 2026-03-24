import EmailModel from '../models/Email';
import UserModel from '../models/User';
import { Email } from '../types';
import { AppError } from '../utils/errorHandler';

export class EmailService {
  async createEmail(
    address: string,
    provider: string,
    createdBy: string,
    isActive: boolean = true
  ): Promise<Email> {
    const existing = await EmailModel.findByAddress(address);
    if (existing) {
      throw new AppError('Email address already exists', 400);
    }

    return await EmailModel.create({
      address,
      provider,
      createdBy,
      assignedTo: [],
      isActive,
    });
  }

  async getAllEmails(): Promise<Email[]> {
    return await EmailModel.getAll();
  }

  async getEmailsByUser(uid: string, isAdmin: boolean): Promise<Email[]> {
    if (isAdmin) {
      return await EmailModel.getAll();
    }
    return await EmailModel.getByUser(uid);
  }

  async getEmailById(id: string): Promise<Email> {
    const email = await EmailModel.findById(id);
    if (!email) {
      throw new AppError('Email not found', 404);
    }
    return email;
  }

  async assignEmail(emailId: string, userIds: string[]): Promise<void> {
    const email = await EmailModel.findById(emailId);
    if (!email) {
      throw new AppError('Email not found', 404);
    }

    for (const uid of userIds) {
      await EmailModel.assignUser(emailId, uid);
      await UserModel.assignEmail(uid, emailId);
    }
  }

  async removeUserFromEmail(emailId: string, uid: string): Promise<void> {
    await EmailModel.removeUser(emailId, uid);
    await UserModel.removeEmail(uid, emailId);
  }

  async updateEmail(id: string, data: Partial<Email>): Promise<void> {
    const email = await EmailModel.findById(id);
    if (!email) {
      throw new AppError('Email not found', 404);
    }
    await EmailModel.update(id, data);
  }

  async deleteEmail(id: string): Promise<void> {
    const email = await EmailModel.findById(id);
    if (!email) {
      throw new AppError('Email not found', 404);
    }

    for (const uid of email.assignedTo) {
      await UserModel.removeEmail(uid, id);
    }

    await EmailModel.delete(id);
  }
}

export default new EmailService();
