export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  isAdmin: boolean;
  description: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  autoMode: boolean;
  assignedEmails: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Email {
  id: string;
  address: string;
  provider: string;
  createdBy: string;
  assignedTo: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  emailId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  isSent: boolean;
  summary?: string;
  tasks?: Task[];
  priority?: Priority;
  deadline?: Date;
  isAutoReplied: boolean;
  autoReply?: string;
  receivedAt: Date;
  processedAt?: Date;
}

export interface Task {
  id: string;
  description: string;
  priority: Priority;
  deadline?: Date;
  status: TaskStatus;
  extractedFrom: string;
  createdAt: Date;
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface AuthResponse {
  user: User;
  token?: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'failed';

export interface SESConfig {
  id: string;
  organizationName: string;
  createdBy: string;
  accessKeyId: string;
  secretAccessKey: string; // always '••••••••' from API
  region: string;
  fromEmail: string;
  fromName: string;
  domain?: string;
  domainVerificationStatus: VerificationStatus;
  domainVerificationToken?: string;
  emailVerificationStatus: VerificationStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
