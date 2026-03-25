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

export type Sentiment = 'positive' | 'negative' | 'neutral' | 'urgent' | 'frustrated';

export interface SLAStatus {
  required: number;    // ms — required response time
  elapsed: number;     // ms — time elapsed since received
  breached: boolean;
  percentage: number;  // 0–100
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
  sentiment?: Sentiment;
  isRead?: boolean;
  isAutoReplied: boolean;
  isSent: boolean;      // true = outgoing, false = incoming
  autoReply?: string;
  threadId?: string;
  inReplyTo?: string;
  slaBreach?: boolean;
  slaRequired?: number; // ms
  receivedAt: Date;
  processedAt?: Date;
  scheduledAt?: Date;
  attachments?: Attachment[];
  category?: string;
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

export interface Attachment {
  filename: string;
  contentType: string;
  size: number;
  url?: string;       // S3/Firebase Storage URL after upload
  content?: string;   // base64 for small files
}

export interface AIAgentResult {
  summary?: string;
  tasks?: Task[];
  priority?: Priority;
  deadline?: Date;
  intent?: string;
  suggestedReply?: string;
  sentiment?: Sentiment;
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
