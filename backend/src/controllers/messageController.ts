import { Response } from 'express';
import messageService from '../services/messageService';
import { asyncHandler } from '../utils/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/errorHandler';

export class MessageController {
  send = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { to, subject, body, emailId, inReplyTo, threadId } = req.body;

    const message = await messageService.sendMessage(
      emailId,
      to,
      subject,
      body,
      req.user!.uid,
      inReplyTo,
      threadId
    );

    res.status(201).json({
      status: 'success',
      data: { message },
    });
  });

  getInbox = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { emailId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const messages = await messageService.getInbox(emailId, limit);

    res.status(200).json({
      status: 'success',
      data: { messages },
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
      data: { message },
    });
  });

  /** Mark a single message as read */
  markRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    await messageService.markRead(id);
    res.status(200).json({ status: 'success', message: 'Marked as read' });
  });

  /** Bulk operations: delete or mark-read for multiple message IDs */
  bulkAction = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { ids, action } = req.body as { ids: string[]; action: 'delete' | 'mark_read' };

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('No message IDs provided', 400);
    }
    if (!['delete', 'mark_read'].includes(action)) {
      throw new AppError('Invalid action', 400);
    }

    await messageService.bulkAction(ids, action);
    res.status(200).json({ status: 'success', message: `Bulk ${action} complete` });
  });

  /** Reply to a specific message */
  reply = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { body } = req.body;

    const message = await messageService.replyToMessage(id, body, req.user!.uid);
    res.status(201).json({ status: 'success', data: { message } });
  });

  /** Export inbox as CSV */
  exportCsv = asyncHandler(async (req: AuthRequest, res: Response) => {
    const messages = await messageService.getUserInbox(req.user!.uid, 500, req.user!.isAdmin);

    const header = 'id,from,to,subject,priority,sentiment,receivedAt,processedAt,isRead\n';
    const rows = messages
      .map((m) =>
        [
          m.id,
          `"${m.from}"`,
          `"${m.to}"`,
          `"${m.subject?.replace(/"/g, '""')}"`,
          m.priority || '',
          (m as any).sentiment || '',
          m.receivedAt,
          m.processedAt || '',
          (m as any).isRead ? 'true' : 'false',
        ].join(',')
      )
      .join('\n');

    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="inbox.csv"');
    res.status(200).send(header + rows);
  });

  /** SSE stream for real-time inbox updates (polls Firestore every 10s) */
  stream = asyncHandler(async (req: AuthRequest, res: Response) => {
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.flushHeaders();

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    send('connected', { ok: true });

    const interval = setInterval(async () => {
      try {
        const messages = await messageService.getUserInbox(
          req.user!.uid,
          50,
          req.user!.isAdmin
        );
        send('messages', { messages });
      } catch {
        // swallow — keep connection alive
      }
    }, 10_000);

    req.on('close', () => clearInterval(interval));
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    await messageService.deleteMessage(id);
    res.status(200).json({ status: 'success', message: 'Message deleted successfully' });
  });
}

export default new MessageController();

