import { db } from '../config/firebase';
import { SESConfig } from '../types';

/**
 * Firestore model for multi-tenant AWS SES configurations.
 * Each organisation (college, startup, enterprise) stores its own
 * SES credentials here so mail is sent from their verified domain.
 *
 * SECURITY NOTE: secretAccessKey is stored in Firestore.
 * In a production deployment, replace with an encryption layer (e.g.
 * Google Cloud KMS) or a dedicated secrets manager before going live.
 */
export class SESConfigModel {
  private collection = db.collection('sesConfigs');

  async create(config: Omit<SESConfig, 'createdAt' | 'updatedAt'>): Promise<SESConfig> {
    const now = new Date();
    const data: SESConfig = { ...config, createdAt: now, updatedAt: now };
    await this.collection.doc(config.id).set(data);
    return data;
  }

  async findById(id: string): Promise<SESConfig | null> {
    const doc = await this.collection.doc(id).get();
    return doc.exists ? (doc.data() as SESConfig) : null;
  }

  async getAll(): Promise<SESConfig[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map((d) => d.data() as SESConfig);
  }

  async getByCreator(uid: string): Promise<SESConfig[]> {
    const snapshot = await this.collection.where('createdBy', '==', uid).get();
    return snapshot.docs.map((d) => d.data() as SESConfig);
  }

  async update(id: string, data: Partial<SESConfig>): Promise<void> {
    await this.collection.doc(id).update({ ...data, updatedAt: new Date() });
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }
}

export default new SESConfigModel();
