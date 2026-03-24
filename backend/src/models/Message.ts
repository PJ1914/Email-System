import { db } from '../config/firebase';
import { Message } from '../types';

export class MessageModel {
  private collection = db.collection('messages');

  async create(message: Omit<Message, 'id'>): Promise<Message> {
    const docRef = this.collection.doc();
    const messageData: Message = {
      ...message,
      id: docRef.id,
    };

    await docRef.set(messageData);
    return messageData;
  }

  async findById(id: string): Promise<Message | null> {
    const doc = await this.collection.doc(id).get();
    return doc.exists ? (doc.data() as Message) : null;
  }

  async getByEmail(emailId: string, limit: number = 50): Promise<Message[]> {
    const snapshot = await this.collection
      .where('emailId', '==', emailId)
      .get();

    const messages = snapshot.docs.map((doc) => doc.data() as Message);
    // Sort client-side to avoid requiring composite Firestore index
    messages.sort((a, b) =>
      new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );
    return messages.slice(0, limit);
  }

  async getUnprocessed(): Promise<Message[]> {
    const snapshot = await this.collection
      .where('processedAt', '==', null)
      .get();

    const messages = snapshot.docs.map((doc) => doc.data() as Message);
    messages.sort((a, b) =>
      new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
    );
    return messages;
  }

  async update(id: string, data: Partial<Message>): Promise<void> {
    await this.collection.doc(id).update(data);
  }

  async markProcessed(id: string, aiResults: Partial<Message>): Promise<void> {
    await this.collection.doc(id).update({
      ...aiResults,
      processedAt: new Date(),
    });
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  async getInboxByUser(uid: string, limit: number = 50, isAdmin: boolean = false): Promise<Message[]> {
    // Get user's assigned email IDs first
    const userDoc = await db.collection('users').doc(uid).get();
    let assignedEmails: string[] = userDoc.data()?.assignedEmails || [];

    // Admin fallback: if no emails assigned yet, show all emails' messages
    if (assignedEmails.length === 0 && isAdmin) {
      const allEmails = await db.collection('emails').where('isActive', '==', true).get();
      assignedEmails = allEmails.docs.map((d) => d.id);
    }

    if (assignedEmails.length === 0) return [];

    // Query messages for user's assigned emails (Firestore 'in' supports up to 10 items)
    // Filter isSent client-side to avoid requiring a composite Firestore index
    const snapshot = await this.collection
      .where('emailId', 'in', assignedEmails.slice(0, 10))
      .get();

    const messages = snapshot.docs
      .map((doc) => doc.data() as Message)
      .filter((m) => !m.isSent); // client-side filter to avoid composite index
    messages.sort((a, b) =>
      new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );
    return messages.slice(0, limit);
  }

  async getSentByUser(uid: string, limit: number = 50): Promise<Message[]> {
    // All messages where the logged-in user was the sender (from == uid)
    // Filter isSent client-side to avoid requiring a composite Firestore index
    const snapshot = await this.collection
      .where('from', '==', uid)
      .get();

    const messages = snapshot.docs
      .map((doc) => doc.data() as Message)
      .filter((m) => m.isSent);
    messages.sort((a, b) =>
      new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );
    return messages.slice(0, limit);
  }
}

export default new MessageModel();
