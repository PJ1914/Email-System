import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import UserModel from '../models/User';
import RoleModel from '../models/Role';
import { AppError } from '../utils/errorHandler';
import { UserRole } from '../types';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
    isAdmin: boolean;
  };
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);

    const user = await UserModel.findByUid(decodedToken.uid);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Resolve admin status from the dynamic roles collection
    const roleDoc = await RoleModel.findByName(user.role as string);
    const isAdmin = roleDoc?.isAdmin ?? user.role === UserRole.ADMIN;

    req.user = {
      uid: user.uid,
      email: user.email,
      role: user.role as string,
      isAdmin,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid token', 401));
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Allow if the user's role is in the list, OR if admin access is required
    // and this user's role has isAdmin: true in the roles collection
    const allowed =
      roles.includes(req.user.role) ||
      (roles.includes(UserRole.ADMIN) && req.user.isAdmin);

    if (!allowed) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};

export const checkEmailAccess = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { emailId } = req.params;
    const user = await UserModel.findByUid(req.user!.uid);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role === UserRole.ADMIN || req.user?.isAdmin) {
      return next();
    }

    if (!user.assignedEmails.includes(emailId)) {
      throw new AppError('Access denied to this email', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};
