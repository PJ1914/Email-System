import { Request, Response } from 'express';
import authService from '../services/authService';
import RoleModel from '../models/Role';
import { asyncHandler } from '../utils/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/errorHandler';

export class AuthController {
  // Public registration - first user becomes admin, others become regular users
  register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, displayName } = req.body;

    const result = await authService.register(email, password, displayName);

    res.status(201).json({
      status: 'success',
      data: {
        user: result.user,
        token: result.token,
      },
      message: result.user.role === 'admin' 
        ? 'Admin account created successfully (first user)' 
        : 'Account created successfully',
    });
  });

  // Admin-only endpoint to create users with specific roles
  createUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password, displayName, role } = req.body;

    const result = await authService.createUserWithRole(
      email,
      password,
      displayName,
      role
    );

    res.status(201).json({
      status: 'success',
      data: {
        user: result.user,
        token: result.token,
      },
      message: `User created with role: ${role}`,
    });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await authService.login(email);

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  });

  getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await authService.getUserByUid(req.user!.uid);

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  });

  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { displayName } = req.body;

    await authService.updateUser(req.user!.uid, { displayName });

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
    });
  });

  setAutoMode = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { autoMode } = req.body;

    await authService.setAutoMode(req.user!.uid, autoMode);

    res.status(200).json({
      status: 'success',
      message: 'Auto mode updated successfully',
    });
  });

  getAllUsers = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const users = await authService.getAllUsers();

    res.status(200).json({
      status: 'success',
      data: { users },
    });
  });

  updateUserRole = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { uid } = req.params;
    const { role } = req.body;

    if (!role) throw new AppError('role is required', 400);

    const roleDoc = await RoleModel.findByName(role);
    if (!roleDoc) throw new AppError(`Role "${role}" does not exist`, 400);

    await authService.updateUser(uid, { role } as any);

    res.status(200).json({ status: 'success', message: `User role updated to "${roleDoc.displayName}"` });
  });
}

export default new AuthController();
