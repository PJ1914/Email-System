export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
}

export interface Role {
  id: string;
  name: string;        // unique slug, e.g. "hr_manager"
  displayName: string; // e.g. "HR Manager"
  isAdmin: boolean;    // grants admin-level access
  description: string;
  isSystem: boolean;   // built-in roles (admin/user) cannot be deleted
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
  sesConfigId?: string; // optional link to a tenant SES config
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
  summary?: string;
  tasks?: Task[];
  priority?: Priority;
  deadline?: Date;
  isAutoReplied: boolean;
  isSent: boolean;      // true = outgoing, false = incoming
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

export interface AIAgentResult {
  summary?: string;
  tasks?: Task[];
  priority?: Priority;
  deadline?: Date;
  intent?: string;
  suggestedReply?: string;
}

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'failed';

export interface SESConfig {
  id: string;
  organizationName: string;
  createdBy: string; // uid of admin who created it
  accessKeyId: string;
  secretAccessKey: string; // stored server-side only, never returned to client
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
