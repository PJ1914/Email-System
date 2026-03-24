import AWS from 'aws-sdk';
import { ses } from '../config/aws';
import { config } from '../config';
import logger from '../utils/logger';
import { AppError } from '../utils/errorHandler';

export interface EmailParams {
  to: string | string[];
  subject: string;
  body: string;
  from?: string;
  isHtml?: boolean;
}

export interface TenantSESCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  fromEmail: string;
  fromName?: string;
}

/**
 * Build a per-tenant SES client from the supplied credentials.
 * Falls back to the globally configured SES client when no credentials
 * are provided (backwards-compatible with the single-tenant setup).
 */
function buildSESClient(creds?: TenantSESCredentials): AWS.SES {
  if (!creds) return ses;
  return new AWS.SES({
    apiVersion: '2010-12-01',
    region: creds.region,
    accessKeyId: creds.accessKeyId,
    secretAccessKey: creds.secretAccessKey,
  });
}

export class SESService {
  private fromEmail: string;

  constructor() {
    this.fromEmail = config.aws.sesFromEmail;
  }

  async sendEmail(params: EmailParams, tenantCreds?: TenantSESCredentials): Promise<string> {
    try {
      const client = buildSESClient(tenantCreds);
      // When tenant creds are present, the actual sending address comes from params.from
      // (the linked Email Account address, e.g. hr@codetapasya.com).
      // tenantCreds.fromEmail is only a fallback; fromName is always applied if set.
      const sendingAddress = params.from || (tenantCreds ? tenantCreds.fromEmail : this.fromEmail);
      const fromName = tenantCreds?.fromName;
      const fromAddress = fromName ? `${fromName} <${sendingAddress}>` : sendingAddress;

      const recipients = Array.isArray(params.to) ? params.to : [params.to];

      // Strip HTML tags to generate a plain-text fallback (improves deliverability)
      const plainText = params.body.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

      const emailParams = {
        Source: fromAddress,
        Destination: { ToAddresses: recipients },
        Message: {
          Subject: { Data: params.subject, Charset: 'UTF-8' },
          Body: params.isHtml
            ? {
                Html: { Data: params.body, Charset: 'UTF-8' },
                Text: { Data: plainText, Charset: 'UTF-8' },
              }
            : { Text: { Data: params.body, Charset: 'UTF-8' } },
        },
      };

      const result = await client.sendEmail(emailParams).promise();

      logger.info('Email sent successfully', {
        messageId: result.MessageId,
        to: recipients,
        subject: params.subject,
      });

      return result.MessageId;
    } catch (error: any) {
      logger.error('Failed to send email', {
        error: error.message,
        to: params.to,
        subject: params.subject,
      });
      throw new AppError('Failed to send email', 500);
    }
  }

  async sendBulkEmail(emails: EmailParams[], tenantCreds?: TenantSESCredentials): Promise<string[]> {
    const messageIds: string[] = [];

    for (const email of emails) {
      try {
        const messageId = await this.sendEmail(email, tenantCreds);
        messageIds.push(messageId);
      } catch (error) {
        logger.error('Failed to send bulk email', { email });
      }
    }

    return messageIds;
  }

  async verifyEmail(email: string, tenantCreds?: TenantSESCredentials): Promise<void> {
    try {
      const client = buildSESClient(tenantCreds);
      await client.verifyEmailIdentity({ EmailAddress: email }).promise();
      logger.info('Email verification initiated', { email });
    } catch (error: any) {
      logger.error('Failed to verify email', { error: error.message, email });
      throw new AppError('Failed to verify email', 500);
    }
  }

  /**
   * Initiate domain DKIM verification via SES.
   * Returns the three DKIM CNAME tokens the org must publish in DNS.
   */
  async verifyDomain(domain: string, tenantCreds: TenantSESCredentials): Promise<string[]> {
    try {
      const client = buildSESClient(tenantCreds);
      const result = await client.verifyDomainDkim({ Domain: domain }).promise();
      logger.info('Domain DKIM verification initiated', { domain });
      return result.DkimTokens;
    } catch (error: any) {
      logger.error('Failed to initiate domain verification', { error: error.message, domain });
      throw new AppError('Failed to initiate domain verification', 500);
    }
  }

  /**
   * Check whether a domain identity is verified in SES.
   */
  async getDomainVerificationStatus(
    domain: string,
    tenantCreds: TenantSESCredentials
  ): Promise<'pending' | 'verified' | 'failed'> {
    try {
      const client = buildSESClient(tenantCreds);
      const result = await client
        .getIdentityVerificationAttributes({ Identities: [domain] })
        .promise();
      const attr = result.VerificationAttributes[domain];
      if (!attr) return 'pending';
      if (attr.VerificationStatus === 'Success') return 'verified';
      if (attr.VerificationStatus === 'Failed') return 'failed';
      return 'pending';
    } catch (error: any) {
      logger.error('Failed to get domain verification status', { error: error.message, domain });
      return 'failed';
    }
  }

  /**
   * Check whether an email identity is verified in SES.
   */
  async getEmailVerificationStatus(
    email: string,
    tenantCreds: TenantSESCredentials
  ): Promise<'pending' | 'verified' | 'failed'> {
    try {
      const client = buildSESClient(tenantCreds);
      const result = await client
        .getIdentityVerificationAttributes({ Identities: [email] })
        .promise();
      const attr = result.VerificationAttributes[email];
      if (!attr) return 'pending';
      if (attr.VerificationStatus === 'Success') return 'verified';
      if (attr.VerificationStatus === 'Failed') return 'failed';
      return 'pending';
    } catch (error: any) {
      logger.error('Failed to get email verification status', { error: error.message, email });
      return 'failed';
    }
  }

  /**
   * Test whether the supplied credentials can connect to SES.
   * Uses a lightweight ListIdentities call — no email is actually sent.
   */
  async testConnection(tenantCreds: TenantSESCredentials): Promise<boolean> {
    try {
      const client = buildSESClient(tenantCreds);
      await client.listIdentities({ MaxItems: 1 }).promise();
      return true;
    } catch {
      return false;
    }
  }
}

export default new SESService();

