import { db } from '../config/firebase';
import { Role } from '../types';

export class RoleModel {
  private collection = db.collection('roles');

  async create(data: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
    const existing = await this.findByName(data.name);
    if (existing) throw new Error(`Role "${data.name}" already exists`);

    const now = new Date();
    const ref = this.collection.doc();
    const role: Role = { ...data, id: ref.id, createdAt: now, updatedAt: now };
    await ref.set(role);
    return role;
  }

  async findById(id: string): Promise<Role | null> {
    const doc = await this.collection.doc(id).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() } as Role) : null;
  }

  async findByName(name: string): Promise<Role | null> {
    const snap = await this.collection.where('name', '==', name).limit(1).get();
    return snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as Role);
  }

  async getAll(): Promise<Role[]> {
    const snap = await this.collection.orderBy('createdAt', 'asc').get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Role));
  }

  async update(id: string, data: Partial<Omit<Role, 'id' | 'createdAt'>>): Promise<void> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) throw new Error('Role not found');

    if (data.name) {
      const existing = await this.findByName(data.name);
      if (existing && existing.id !== id) throw new Error(`Role "${data.name}" already exists`);
    }

    await this.collection.doc(id).update({ ...data, updatedAt: new Date() });
  }

  async delete(id: string): Promise<void> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) throw new Error('Role not found');
    const role = doc.data() as Role;
    if (role.isSystem) throw new Error('Cannot delete system roles');
    await this.collection.doc(id).delete();
  }

  /** Seeds the two built-in roles on first startup */
  async seedDefaults(): Promise<void> {
    const defaults: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'admin',
        displayName: 'Admin',
        isAdmin: true,
        description: 'Full platform access',
        isSystem: true,
      },
      {
        name: 'user',
        displayName: 'User',
        isAdmin: false,
        description: 'Standard user access',
        isSystem: true,
      },
    ];

    for (const d of defaults) {
      const existing = await this.findByName(d.name);
      if (!existing) await this.create(d);
    }
  }
}

export default new RoleModel();
