import { db } from '../config/firebase';

export interface AttachmentDoc {
  id: string;
  messageId?: string;
  filename: string;
  contentType: string;
  size: number;          // bytes
  data: string;          // base64-encoded content
  uploadedBy: string;
  createdAt: Date;
}

export class AttachmentModel {
  private col = db.collection('attachments');

  async create(
    payload: Omit<AttachmentDoc, 'id' | 'createdAt'>,
  ): Promise<AttachmentDoc> {
    const ref = this.col.doc();
    const doc: AttachmentDoc = { ...payload, id: ref.id, createdAt: new Date() };
    await ref.set(doc);
    return doc;
  }

  async findById(id: string): Promise<AttachmentDoc | null> {
    const snap = await this.col.doc(id).get();
    return snap.exists ? (snap.data() as AttachmentDoc) : null;
  }

  async delete(id: string): Promise<void> {
    await this.col.doc(id).delete();
  }
}

export default new AttachmentModel();
