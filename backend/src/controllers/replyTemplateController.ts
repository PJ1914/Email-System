import { Response } from 'express';
import ReplyTemplateModel, { ReplyTemplate } from '../models/ReplyTemplate';
import { asyncHandler } from '../utils/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/errorHandler';

export class ReplyTemplateController {
  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const templates = await ReplyTemplateModel.findAll(req.user!.uid);
    res.status(200).json({ status: 'success', data: { templates } });
  });

  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, subject, body, category, isGlobal } = req.body;
    if (!name || !body) throw new AppError('name and body are required', 400);

    const template = await ReplyTemplateModel.create({
      name,
      subject,
      body,
      category,
      createdBy: req.user!.uid,
      isGlobal: req.user!.isAdmin ? !!isGlobal : false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({ status: 'success', data: { template } });
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const template = await ReplyTemplateModel.findById(id);
    if (!template) throw new AppError('Template not found', 404);
    if (template.createdBy !== req.user!.uid && !req.user!.isAdmin) {
      throw new AppError('Forbidden', 403);
    }

    await ReplyTemplateModel.update(id, req.body as Partial<ReplyTemplate>);
    res.status(200).json({ status: 'success', message: 'Template updated' });
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const template = await ReplyTemplateModel.findById(id);
    if (!template) throw new AppError('Template not found', 404);
    if (template.createdBy !== req.user!.uid && !req.user!.isAdmin) {
      throw new AppError('Forbidden', 403);
    }

    await ReplyTemplateModel.delete(id);
    res.status(200).json({ status: 'success', message: 'Template deleted' });
  });
}

export default new ReplyTemplateController();
