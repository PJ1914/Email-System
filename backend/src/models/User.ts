import { db } from '../config/firebase';
import { User } from '../types';

export class UserModel {
  private collection = db.collection('users');

  async create(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date();
    const userData: User = {
      ...user,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.doc(user.uid).set(userData);
    return userData;
  }

  async findByUid(uid: string): Promise<User | null> {
    const doc = await this.collection.doc(uid).get();
    return doc.exists ? (doc.data() as User) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const snapshot = await this.collection.where('email', '==', email).limit(1).get();
    return snapshot.empty ? null : (snapshot.docs[0].data() as User);
  }

  async update(uid: string, data: Partial<User>): Promise<void> {
    await this.collection.doc(uid).update({
      ...data,
      updatedAt: new Date(),
    });
  }

  async delete(uid: string): Promise<void> {
    await this.collection.doc(uid).delete();
  }

  async getAll(): Promise<User[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map((doc) => doc.data() as User);
  }

  async assignEmail(uid: string, emailId: string): Promise<void> {
    const user = await this.findByUid(uid);
    if (!user) {
      throw new Error('User not found');
    }

    const assignedEmails = user.assignedEmails || [];
    if (!assignedEmails.includes(emailId)) {
      assignedEmails.push(emailId);
      await this.update(uid, { assignedEmails });
    }
  }

  async removeEmail(uid: string, emailId: string): Promise<void> {
    const user = await this.findByUid(uid);
    if (!user) {
      throw new Error('User not found');
    }

    const assignedEmails = (user.assignedEmails || []).filter((id) => id !== emailId);
    await this.update(uid, { assignedEmails });
  }

  async isEmpty(): Promise<boolean> {
    const snapshot = await this.collection.limit(1).get();
    return snapshot.empty;
  }
}

export default new UserModel();
