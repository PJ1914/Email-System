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
    EMAIL_INBOX: (emailId: string) => `${API_URL}/messages/${emailId}/inbox`,
    BY_ID: (id: string) => `${API_URL}/messages/${id}`,
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
};

export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data',
};
