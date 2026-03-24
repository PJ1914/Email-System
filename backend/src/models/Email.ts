import { db } from '../config/firebase';
import { Email } from '../types';

export class EmailModel {
  private collection = db.collection('emails');

  async create(email: Omit<Email, 'id' | 'createdAt' | 'updatedAt'>): Promise<Email> {
    const now = new Date();
    const docRef = this.collection.doc();
    const emailData: Email = {
      ...email,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(emailData);
    return emailData;
  }

  async findById(id: string): Promise<Email | null> {
    const doc = await this.collection.doc(id).get();
    return doc.exists ? (doc.data() as Email) : null;
  }

  async findByAddress(address: string): Promise<Email | null> {
    const snapshot = await this.collection.where('address', '==', address).limit(1).get();
    return snapshot.empty ? null : (snapshot.docs[0].data() as Email);
  }

  async getAll(): Promise<Email[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map((doc) => doc.data() as Email);
  }

  async getAllActive(): Promise<Email[]> {
    const snapshot = await this.collection.where('isActive', '==', true).get();
    return snapshot.docs.map((doc) => doc.data() as Email);
  }

  async getByUser(uid: string): Promise<Email[]> {
    const snapshot = await this.collection.where('assignedTo', 'array-contains', uid).get();
    return snapshot.docs.map((doc) => doc.data() as Email);
  }

  async update(id: string, data: Partial<Email>): Promise<void> {
    await this.collection.doc(id).update({
      ...data,
      updatedAt: new Date(),
    });
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  async assignUser(emailId: string, uid: string): Promise<void> {
    const email = await this.findById(emailId);
    if (!email) {
      throw new Error('Email not found');
    }

    const assignedTo = email.assignedTo || [];
    if (!assignedTo.includes(uid)) {
      assignedTo.push(uid);
      await this.update(emailId, { assignedTo });
    }
  }

  async removeUser(emailId: string, uid: string): Promise<void> {
    const email = await this.findById(emailId);
    if (!email) {
      throw new Error('Email not found');
    }

    const assignedTo = (email.assignedTo || []).filter((id) => id !== uid);
    await this.update(emailId, { assignedTo });
  }
}

export default new EmailModel();
