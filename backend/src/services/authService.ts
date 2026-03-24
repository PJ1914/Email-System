import { auth } from '../config/firebase';
import UserModel from '../models/User';
import { UserRole, User } from '../types';
import { AppError } from '../utils/errorHandler';

export class AuthService {
  async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<{ user: User; token: string }> {
    try {
      // First user becomes admin automatically
      const isEmpty = await UserModel.isEmpty();
      const role = isEmpty ? UserRole.ADMIN : UserRole.USER;

      const userRecord = await auth.createUser({
        email,
        password,
        displayName,
      });

      const user = await UserModel.create({
        uid: userRecord.uid,
        email,
        displayName,
        role,
        autoMode: false,
        assignedEmails: [],
      });

      const token = await auth.createCustomToken(userRecord.uid);

      return { user, token };
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        throw new AppError('Email already exists', 400);
      }
      throw new AppError('Registration failed', 500);
    }
  }

  // Admin-only method to create users with specific roles
  async createUserWithRole(
    email: string,
    password: string,
    displayName: string,
    role: UserRole
  ): Promise<{ user: User; token: string }> {
    try {
      const userRecord = await auth.createUser({
        email,
        password,
        displayName,
      });

      const user = await UserModel.create({
        uid: userRecord.uid,
        email,
        displayName,
        role,
        autoMode: false,
        assignedEmails: [],
      });

      const token = await auth.createCustomToken(userRecord.uid);

      return { user, token };
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        throw new AppError('Email already exists', 400);
      }
      throw new AppError('User creation failed', 500);
    }
  }

  async login(email: string): Promise<User> {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  async getUserByUid(uid: string): Promise<User> {
    const user = await UserModel.findByUid(uid);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  async updateUser(uid: string, data: Partial<User>): Promise<void> {
    await UserModel.update(uid, data);
  }

  async deleteUser(uid: string): Promise<void> {
    await auth.deleteUser(uid);
    await UserModel.delete(uid);
  }

  async setAutoMode(uid: string, autoMode: boolean): Promise<void> {
    await UserModel.update(uid, { autoMode });
  }

  async getAllUsers(): Promise<User[]> {
    return UserModel.getAll();
  }
}

export default new AuthService();
