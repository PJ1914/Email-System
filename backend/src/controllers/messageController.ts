import { Response } from 'express';
import messageService from '../services/messageService';
import { asyncHandler } from '../utils/errorHandler';
import { AuthRequest } from '../middleware/auth';

export class MessageController {
  send = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { to, subject, body, emailId } = req.body;

    const message = await messageService.sendMessage(
      emailId,
      to,
      subject,
      body,
      req.user!.uid
    );

    res.status(201).json({
      status: 'success',
      data: {
        message,
      },
    });
  });

  getInbox = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { emailId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const messages = await messageService.getInbox(emailId, limit);

    res.status(200).json({
      status: 'success',
      data: {
        messages,
      },
    });
  });

  getUserInbox = asyncHandler(async (req: AuthRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;

    const messages = await messageService.getUserInbox(req.user!.uid, limit, req.user!.isAdmin);

    res.status(200).json({
      status: 'success',
      data: { messages },
    });
  });

  getSent = asyncHandler(async (req: AuthRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;

    const messages = await messageService.getSent(req.user!.uid, limit);

    res.status(200).json({
      status: 'success',
      data: { messages },
    });
  });

  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const message = await messageService.getMessageById(id);

    res.status(200).json({
      status: 'success',
      data: {
        message,
      },
    });
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    await messageService.deleteMessage(id);

    res.status(200).json({
      status: 'success',
      message: 'Message deleted successfully',
    });
  });
}

export default new MessageController();
