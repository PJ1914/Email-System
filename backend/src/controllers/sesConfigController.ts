import { Response } from 'express';
import sesConfigService from '../services/sesConfigService';
import { asyncHandler } from '../utils/errorHandler';
import { AuthRequest } from '../middleware/auth';

export class SESConfigController {
  /** POST /api/ses-config */
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { organizationName, accessKeyId, secretAccessKey, region, fromEmail, fromName, domain } =
      req.body;

    const config = await sesConfigService.create(
      req.user!.uid,
      organizationName,
      accessKeyId,
      secretAccessKey,
      region,
      fromEmail,
      fromName,
      domain
    );

    res.status(201).json({ status: 'success', data: { config } });
  });

  /** GET /api/ses-config */
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const configs = await sesConfigService.getAll(req.user!.uid, req.user!.isAdmin);
    res.status(200).json({ status: 'success', data: { configs } });
  });

  /** GET /api/ses-config/:id */
  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const config = await sesConfigService.getById(req.params.id);
    res.status(200).json({ status: 'success', data: { config } });
  });

  /** PUT /api/ses-config/:id */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const config = await sesConfigService.update(
      req.params.id,
      req.user!.uid,
      req.user!.isAdmin,
      req.body
    );
    res.status(200).json({ status: 'success', data: { config } });
  });

  /** DELETE /api/ses-config/:id */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    await sesConfigService.delete(req.params.id, req.user!.uid, req.user!.isAdmin);
    res.status(200).json({ status: 'success', message: 'SES configuration deleted' });
  });

  /** POST /api/ses-config/:id/test */
  testConnection = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await sesConfigService.testConnection(req.params.id);
    res.status(200).json({ status: 'success', data: result });
  });

  /** POST /api/ses-config/:id/verify-email */
  verifyFromEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
    const config = await sesConfigService.verifyFromEmail(req.params.id);
    res.status(200).json({
      status: 'success',
      message: `Verification email sent to ${config.fromEmail}. Check your inbox and click the link.`,
      data: { config },
    });
  });

  /** POST /api/ses-config/:id/verify-domain */
  verifyDomain = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { domain } = req.body;
    const { dkimTokens, config } = await sesConfigService.verifyDomain(req.params.id, domain);

    res.status(200).json({
      status: 'success',
      message: 'Domain verification initiated. Publish the DNS records below.',
      data: { dkimTokens, config },
    });
  });

  /** POST /api/ses-config/:id/email-status */
  refreshEmailStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const config = await sesConfigService.refreshEmailStatus(req.params.id);
    res.status(200).json({ status: 'success', data: { config } });
  });

  /** POST /api/ses-config/:id/domain-status */
  refreshDomainStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const config = await sesConfigService.refreshDomainStatus(req.params.id);
    res.status(200).json({ status: 'success', data: { config } });
  });

  /** POST /api/ses-config/:id/link-email */
  linkEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { emailId } = req.body;
    await sesConfigService.linkEmailAccount(req.params.id, emailId);
    res.status(200).json({ status: 'success', message: 'Email account linked to SES configuration' });
  });
}

export default new SESConfigController();
