const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const ENDPOINTS = {
  AUTH: {
    REGISTER: `${API_URL}/auth/register`,
    LOGIN: `${API_URL}/auth/login`,
    PROFILE: `${API_URL}/auth/profile`,
    AUTO_MODE: `${API_URL}/auth/auto-mode`,
    USERS: `${API_URL}/auth/users`,
    CREATE_USER: `${API_URL}/auth/users/create`,
  },
  EMAILS: {
    BASE: `${API_URL}/emails`,
    CREATE: `${API_URL}/emails/create`,
    ASSIGN: `${API_URL}/emails/assign`,
    BY_ID: (id: string) => `${API_URL}/emails/${id}`,
  },
  MESSAGES: {
    BASE: `${API_URL}/messages`,
    SEND: `${API_URL}/messages/send`,
    INBOX: `${API_URL}/messages/inbox`,
    SENT: `${API_URL}/messages/sent`,
    STREAM: `${API_URL}/messages/stream`,
    EXPORT: `${API_URL}/messages/export`,
    BULK: `${API_URL}/messages/bulk`,
    EMAIL_INBOX: (emailId: string) => `${API_URL}/messages/${emailId}/inbox`,
    BY_ID: (id: string) => `${API_URL}/messages/${id}`,
    MARK_READ: (id: string) => `${API_URL}/messages/${id}/read`,
    REPLY: (id: string) => `${API_URL}/messages/${id}/reply`,
  },
  REPLY_TEMPLATES: {
    BASE: `${API_URL}/reply-templates`,
    BY_ID: (id: string) => `${API_URL}/reply-templates/${id}`,
  },
  SES_CONFIG: {
    BASE: `${API_URL}/ses-config`,
    BY_ID: (id: string) => `${API_URL}/ses-config/${id}`,
    TEST: (id: string) => `${API_URL}/ses-config/${id}/test`,
    VERIFY_EMAIL: (id: string) => `${API_URL}/ses-config/${id}/verify-email`,
    VERIFY_DOMAIN: (id: string) => `${API_URL}/ses-config/${id}/verify-domain`,
    DOMAIN_STATUS: (id: string) => `${API_URL}/ses-config/${id}/domain-status`,
    EMAIL_STATUS: (id: string) => `${API_URL}/ses-config/${id}/email-status`,
    LINK_EMAIL: (id: string) => `${API_URL}/ses-config/${id}/link-email`,
  },
  ROLES: {
    BASE: `${API_URL}/roles`,
    BY_ID: (id: string) => `${API_URL}/roles/${id}`,
  },
  USERS: {
    UPDATE_ROLE: (uid: string) => `${API_URL}/auth/users/${uid}/role`,
  },
  ATTACHMENTS: {
    UPLOAD: `${API_URL}/attachments`,
    BY_ID: (id: string) => `${API_URL}/attachments/${id}`,
  },
};

export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data',
};

// SLA: 4-hour default for high/urgent, 24h for others (in ms)
export const SLA_MS: Record<string, number> = {
  urgent: 2 * 60 * 60 * 1000,
  high: 4 * 60 * 60 * 1000,
  medium: 12 * 60 * 60 * 1000,
  low: 24 * 60 * 60 * 1000,
};

