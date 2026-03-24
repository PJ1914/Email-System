import RoleModel from '../models/Role';
import { Role } from '../types';
import { AppError } from '../utils/errorHandler';

export class RoleService {
  async getRoles(): Promise<Role[]> {
    return RoleModel.getAll();
  }

  async createRole(data: {
    displayName: string;
    isAdmin: boolean;
    description?: string;
  }): Promise<Role> {
    const name = data.displayName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    if (!name) throw new AppError('Invalid role name', 400);

    try {
      return await RoleModel.create({
        name,
        displayName: data.displayName.trim(),
        isAdmin: data.isAdmin ?? false,
        description: data.description?.trim() ?? '',
        isSystem: false,
      });
    } catch (err: any) {
      throw new AppError(err.message, 400);
    }
  }

  async updateRole(
    id: string,
    data: { displayName?: string; isAdmin?: boolean; description?: string }
  ): Promise<void> {
    const role = await RoleModel.findById(id);
    if (!role) throw new AppError('Role not found', 404);

    // System roles cannot have isAdmin changed (admin stays admin, user stays non-admin)
    const update: Partial<Role> = {
      description: data.description?.trim(),
    };

    if (!role.isSystem) {
      if (data.displayName !== undefined) update.displayName = data.displayName.trim();
      if (data.isAdmin !== undefined) update.isAdmin = data.isAdmin;
    }

    try {
      await RoleModel.update(id, update);
    } catch (err: any) {
      throw new AppError(err.message, 400);
    }
  }

  async deleteRole(id: string): Promise<void> {
    try {
      await RoleModel.delete(id);
    } catch (err: any) {
      throw new AppError(err.message, 400);
    }
  }
}

export default new RoleService();
