import { Response } from 'express';
import roleService from '../services/roleService';
import { asyncHandler } from '../utils/errorHandler';
import { AuthRequest } from '../middleware/auth';

export class RoleController {
  getAll = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const roles = await roleService.getRoles();
    res.status(200).json({ status: 'success', data: { roles } });
  });

  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { displayName, isAdmin, description } = req.body;
    const role = await roleService.createRole({ displayName, isAdmin, description });
    res.status(201).json({ status: 'success', data: { role }, message: 'Role created' });
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { displayName, isAdmin, description } = req.body;
    await roleService.updateRole(id, { displayName, isAdmin, description });
    res.status(200).json({ status: 'success', message: 'Role updated' });
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    await roleService.deleteRole(id);
    res.status(200).json({ status: 'success', message: 'Role deleted' });
  });
}

export default new RoleController();
