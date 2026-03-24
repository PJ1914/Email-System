import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errorHandler';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { allowUnknown: false, stripUnknown: true });
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    next();
  };
};

export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    displayName: Joi.string().required(),
  }),

  createUserWithRole: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    displayName: Joi.string().required(),
    role: Joi.string().required(), // dynamic - validated against roles collection at service layer
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  createEmail: Joi.object({
    address: Joi.string().email().required(),
    provider: Joi.string().required(),
    isActive: Joi.boolean().default(true),
  }),

  assignEmail: Joi.object({
    emailId: Joi.string().required(),
    userIds: Joi.array().items(Joi.string()).min(1).required(),
  }),

  sendMessage: Joi.object({
    emailId: Joi.string().required(),
    to: Joi.string().email().required(),
    subject: Joi.string().required(),
    body: Joi.string().required(),
    cc: Joi.string().email({ multiple: true, separator: ',' }).allow('').optional(),
    bcc: Joi.string().email({ multiple: true, separator: ',' }).allow('').optional(),
    priority: Joi.string().valid('low', 'normal', 'high').optional(),
    scheduledAt: Joi.string().isoDate().optional(),
  }),

  updateAutoMode: Joi.object({
    autoMode: Joi.boolean().required(),
  }),

  createSESConfig: Joi.object({
    organizationName: Joi.string().min(2).max(120).required(),
    accessKeyId: Joi.string().min(16).max(128).required(),
    secretAccessKey: Joi.string().min(16).max(256).required(),
    region: Joi.string().required(),
    fromEmail: Joi.string().email().required(),
    fromName: Joi.string().max(100).default(''),
    domain: Joi.string().hostname().optional(),
  }),

  updateSESConfig: Joi.object({
    organizationName: Joi.string().min(2).max(120),
    accessKeyId: Joi.string().min(16).max(128),
    secretAccessKey: Joi.string().min(16).max(256),
    region: Joi.string(),
    fromEmail: Joi.string().email(),
    fromName: Joi.string().max(100),
    domain: Joi.string().hostname().allow('', null),
    isActive: Joi.boolean(),
  }),

  verifyDomain: Joi.object({
    domain: Joi.string().hostname().required(),
  }),

  linkEmail: Joi.object({
    emailId: Joi.string().required(),
  }),
};
