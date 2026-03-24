import { Response } from 'express';
import emailService from '../services/emailService';
import { asyncHandler } from '../utils/errorHandler';
import { AuthRequest } from '../middleware/auth';

export class EmailController {
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { address, provider, isActive } = req.body;

    const email = await emailService.createEmail(
      address,
      provider,
      req.user!.uid,
      isActive
    );

    res.status(201).json({
      status: 'success',
      data: {
        email,
      },
    });
  });

  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const emails = await emailService.getEmailsByUser(req.user!.uid, req.user!.isAdmin);

    res.status(200).json({
      status: 'success',
      data: {
        emails,
      },
    });
  });

  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const email = await emailService.getEmailById(id);

    res.status(200).json({
      status: 'success',
      data: {
        email,
      },
    });
  });

  assign = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { emailId, userIds } = req.body;

    await emailService.assignEmail(emailId, userIds);

    res.status(200).json({
      status: 'success',
      message: 'Email assigned successfully',
    });
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    await emailService.updateEmail(id, updateData);

    res.status(200).json({
      status: 'success',
      message: 'Email updated successfully',
    });
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    await emailService.deleteEmail(id);

    res.status(200).json({
      status: 'success',
      message: 'Email deleted successfully',
    });
  });
}

export default new EmailController();
