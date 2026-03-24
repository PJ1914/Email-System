import { v4 as uuidv4 } from 'uuid';
import SESConfigModel from '../models/SESConfig';
import EmailModel from '../models/Email';
import sesService, { TenantSESCredentials } from './sesService';
import { SESConfig } from '../types';
import { AppError } from '../utils/errorHandler';
import logger from '../utils/logger';

/** Public-safe view of a SES config — secret key is masked. */
export type SESConfigPublic = Omit<SESConfig, 'secretAccessKey'> & {
  secretAccessKey: string; // always '••••••••' on the wire
};

function toPublic(config: SESConfig): SESConfigPublic {
  return { ...config, secretAccessKey: '••••••••' };
}

function toTenantCreds(config: SESConfig): TenantSESCredentials {
  return {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: config.region,
    fromEmail: config.fromEmail,
    fromName: config.fromName,
  };
}

export class SESConfigService {
  /**
   * Create a new tenant SES configuration.
   * Tests the connection before persisting so bad credentials are rejected early.
   */
  async create(
    createdBy: string,
    organizationName: string,
    accessKeyId: string,
    secretAccessKey: string,
    region: string,
    fromEmail: string,
    fromName: string,
    domain?: string
  ): Promise<SESConfigPublic> {
    const creds: TenantSESCredentials = { accessKeyId, secretAccessKey, region, fromEmail, fromName };

    const connected = await sesService.testConnection(creds);
    if (!connected) {
      throw new AppError('Could not connect to AWS SES with the provided credentials. Please check your Access Key ID, Secret, and Region.', 400);
    }

    const id = uuidv4();
    const config = await SESConfigModel.create({
      id,
      organizationName,
      createdBy,
      accessKeyId,
      secretAccessKey,
      region,
      fromEmail,
      fromName,
      domain,
      domainVerificationStatus: 'unverified',
      emailVerificationStatus: 'unverified',
      isActive: true,
    });

    logger.info('SES config created', { id, organizationName, createdBy });
    return toPublic(config);
  }

  /** Admins see all configs; regular admins see only their own. */
  async getAll(requesterUid: string, requesterIsAdmin: boolean): Promise<SESConfigPublic[]> {
    const configs =
      requesterIsAdmin
        ? await SESConfigModel.getAll()
        : await SESConfigModel.getByCreator(requesterUid);
    return configs.map(toPublic);
  }

  async getById(id: string): Promise<SESConfigPublic> {
    const config = await SESConfigModel.findById(id);
    if (!config) throw new AppError('SES configuration not found', 404);
    return toPublic(config);
  }

  async update(
    id: string,
    requesterUid: string,
    requesterIsAdmin: boolean,
    updates: {
      organizationName?: string;
      accessKeyId?: string;
      secretAccessKey?: string;
      region?: string;
      fromEmail?: string;
      fromName?: string;
      domain?: string;
      isActive?: boolean;
    }
  ): Promise<SESConfigPublic> {
    const existing = await SESConfigModel.findById(id);
    if (!existing) throw new AppError('SES configuration not found', 404);

    // Only the creator or a platform admin can update
    if (existing.createdBy !== requesterUid && !requesterIsAdmin) {
      throw new AppError('Forbidden', 403);
    }

    // If credentials changed, re-test the connection
    if (updates.accessKeyId || updates.secretAccessKey || updates.region) {
      const creds: TenantSESCredentials = {
        accessKeyId: updates.accessKeyId || existing.accessKeyId,
        secretAccessKey: updates.secretAccessKey || existing.secretAccessKey,
        region: updates.region || existing.region,
        fromEmail: updates.fromEmail || existing.fromEmail,
        fromName: updates.fromName || existing.fromName,
      };
      const connected = await sesService.testConnection(creds);
      if (!connected) {
        throw new AppError('Updated credentials could not connect to AWS SES.', 400);
      }
      // Reset verification statuses when credentials change
      (updates as any).emailVerificationStatus = 'unverified';
      (updates as any).domainVerificationStatus = 'unverified';
    }

    await SESConfigModel.update(id, updates);
    const updated = await SESConfigModel.findById(id);
    return toPublic(updated!);
  }

  async delete(id: string, requesterUid: string, requesterIsAdmin: boolean): Promise<void> {
    const existing = await SESConfigModel.findById(id);
    if (!existing) throw new AppError('SES configuration not found', 404);

    if (existing.createdBy !== requesterUid && !requesterIsAdmin) {
      throw new AppError('Forbidden', 403);
    }

    await SESConfigModel.delete(id);
    logger.info('SES config deleted', { id });
  }

  /**
   * Test AWS SES connectivity with the stored (or provided) credentials.
   * Does NOT send any email — uses a lightweight ListIdentities call.
   */
  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const config = await SESConfigModel.findById(id);
    if (!config) throw new AppError('SES configuration not found', 404);

    const success = await sesService.testConnection(toTenantCreds(config));
    return {
      success,
      message: success
        ? 'Successfully connected to AWS SES.'
        : 'Connection failed. Verify your credentials and region.',
    };
  }

  /**
   * Trigger SES email identity verification for the `fromEmail`.
   * SES sends a confirmation email to that address.
   */
  async verifyFromEmail(id: string): Promise<SESConfigPublic> {
    const config = await SESConfigModel.findById(id);
    if (!config) throw new AppError('SES configuration not found', 404);

    await sesService.verifyEmail(config.fromEmail, toTenantCreds(config));
    await SESConfigModel.update(id, { emailVerificationStatus: 'pending' });

    const updated = await SESConfigModel.findById(id);
    return toPublic(updated!);
  }

  /**
   * Initiate DKIM domain verification.
   * Returns the CNAME tokens the organisation must publish in their DNS.
   */
  async verifyDomain(
    id: string,
    domain: string
  ): Promise<{ dkimTokens: string[]; config: SESConfigPublic }> {
    const config = await SESConfigModel.findById(id);
    if (!config) throw new AppError('SES configuration not found', 404);

    const dkimTokens = await sesService.verifyDomain(domain, toTenantCreds(config));

    await SESConfigModel.update(id, {
      domain,
      domainVerificationStatus: 'pending',
      domainVerificationToken: dkimTokens.join(','),
    });

    const updated = await SESConfigModel.findById(id);
    return { dkimTokens, config: toPublic(updated!) };
  }

  /**
   * Poll SES to refresh the domain verification status.
   */
  async refreshDomainStatus(id: string): Promise<SESConfigPublic> {
    const config = await SESConfigModel.findById(id);
    if (!config) throw new AppError('SES configuration not found', 404);

    if (!config.domain) throw new AppError('No domain configured for this SES config', 400);

    const status = await sesService.getDomainVerificationStatus(
      config.domain,
      toTenantCreds(config)
    );
    await SESConfigModel.update(id, { domainVerificationStatus: status });

    const updated = await SESConfigModel.findById(id);
    return toPublic(updated!);
  }

  /**
   * Poll SES to refresh the email identity verification status.
   */
  async refreshEmailStatus(id: string): Promise<SESConfigPublic> {
    const config = await SESConfigModel.findById(id);
    if (!config) throw new AppError('SES configuration not found', 404);

    const status = await sesService.getEmailVerificationStatus(
      config.fromEmail,
      toTenantCreds(config)
    );
    await SESConfigModel.update(id, { emailVerificationStatus: status });

    const updated = await SESConfigModel.findById(id);
    return toPublic(updated!);
  }

  /**
   * Link an email account to a SES config.
   */
  async linkEmailAccount(sesConfigId: string, emailId: string): Promise<void> {
    const [sesConfig, email] = await Promise.all([
      SESConfigModel.findById(sesConfigId),
      EmailModel.findById(emailId),
    ]);
    if (!sesConfig) throw new AppError('SES configuration not found', 404);
    if (!email) throw new AppError('Email account not found', 404);

    await EmailModel.update(emailId, { sesConfigId });
    logger.info('Email linked to SES config', { emailId, sesConfigId });
  }

  /**
   * Resolve the TenantSESCredentials for a given email account.
   * Returns undefined if no tenant config is linked (fall back to global).
   */
  async resolveCredsForEmail(emailId: string): Promise<TenantSESCredentials | undefined> {
    const email = await EmailModel.findById(emailId);
    if (!email?.sesConfigId) return undefined;

    const config = await SESConfigModel.findById(email.sesConfigId);
    if (!config || !config.isActive) return undefined;

    return toTenantCreds(config);
  }
}

export default new SESConfigService();
