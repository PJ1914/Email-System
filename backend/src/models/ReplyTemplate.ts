import { db } from '../config/firebase';

export interface ReplyTemplate {
  id: string;
  name: string;
  subject?: string;
  body: string;
  category?: string;
  createdBy: string;
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ReplyTemplateModel {
  private collection = db.collection('replyTemplates');

  async create(data: Omit<ReplyTemplate, 'id'>): Promise<ReplyTemplate> {
    const docRef = this.collection.doc();
    const template: ReplyTemplate = { ...data, id: docRef.id };
    await docRef.set(template);
    return template;
  }

  async findAll(uid: string): Promise<ReplyTemplate[]> {
    const snapshot = await this.collection
      .where('isGlobal', '==', true)
      .get();

    const userSnapshot = await this.collection
      .where('createdBy', '==', uid)
      .where('isGlobal', '==', false)
      .get();

    const global = snapshot.docs.map((d) => d.data() as ReplyTemplate);
    const personal = userSnapshot.docs.map((d) => d.data() as ReplyTemplate);
    return [...global, ...personal];
  }

  async findById(id: string): Promise<ReplyTemplate | null> {
    const doc = await this.collection.doc(id).get();
    return doc.exists ? (doc.data() as ReplyTemplate) : null;
  }

  async update(id: string, data: Partial<ReplyTemplate>): Promise<void> {
    await this.collection.doc(id).update({ ...data, updatedAt: new Date() });
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }
}

export default new ReplyTemplateModel();
