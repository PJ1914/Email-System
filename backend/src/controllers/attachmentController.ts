import { Response, NextFunction } from 'express';
import multer from 'multer';
import AttachmentModel from '../models/Attachment';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/errorHandler';

const MAX_SIZE = 500 * 1024; // 500 KB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    // Allow common document + image types
    const allowed = [
      'image/png', 'image/jpeg', 'image/gif', 'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new AppError('Unsupported file type', 415));
  },
});

export const uploadMiddleware = upload.single('file');

/** POST /api/attachments — upload a file, returns attachment metadata */
export const uploadAttachment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400);

    const { originalname, mimetype, size, buffer } = req.file;
    const data = buffer.toString('base64');

    const doc = await AttachmentModel.create({
      filename: originalname,
      contentType: mimetype,
      size,
      data,
      uploadedBy: req.user!.uid,
    });

    res.status(201).json({
      success: true,
      data: { id: doc.id, filename: doc.filename, contentType: doc.contentType, size: doc.size },
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/attachments/:id — download a file */
export const downloadAttachment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const doc = await AttachmentModel.findById(req.params.id);
    if (!doc) throw new AppError('Attachment not found', 404);

    const buffer = Buffer.from(doc.data, 'base64');
    res.set('Content-Type', doc.contentType);
    res.set('Content-Disposition', `attachment; filename="${doc.filename}"`);
    res.set('Content-Length', String(buffer.length));
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/attachments/:id */
export const deleteAttachment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const doc = await AttachmentModel.findById(req.params.id);
    if (!doc) throw new AppError('Attachment not found', 404);
    if (doc.uploadedBy !== req.user!.uid && !req.user!.isAdmin)
      throw new AppError('Forbidden', 403);

    await AttachmentModel.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
