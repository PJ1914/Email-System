import { Request, Response } from 'express';
import axios from 'axios';
import { simpleParser } from 'mailparser';
import EmailModel from '../models/Email';
import MessageModel from '../models/Message';
import automationService from '../services/automationService';
import logger from '../utils/logger';
import { asyncHandler } from '../utils/errorHandler';

/**
 * Handles AWS SES inbound email via SNS notification.
 *
 * Flow:
 *   codetapasya.com MX → AWS SES Email Receiving
 *   → SES Receipt Rule → SNS action
 *   → SNS HTTP subscription → POST /api/webhooks/ses-inbound
 *   → Parse email → save to Firestore messages collection
 *   → Appears in user's Inbox automatically
 */
export const sesInbound = asyncHandler(async (req: Request, res: Response) => {
  // SNS sends either 'application/json' or 'text/plain; charset=UTF-8'
  // express.text() middleware handles raw text body, parsed to req.body string
  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  let snsMessage: any;

  try {
    snsMessage = JSON.parse(raw);
  } catch {
    logger.warn('Webhook: invalid JSON body');
    return res.status(400).json({ error: 'Invalid body' });
  }

  // ── 1. SNS Subscription Confirmation ────────────────────────────────────
  if (snsMessage.Type === 'SubscriptionConfirmation') {
    logger.info('Webhook: SNS subscription confirmation — auto-confirming');
    try {
      await axios.get(snsMessage.SubscribeURL);
      logger.info('Webhook: SNS subscription confirmed');
    } catch (err) {
      logger.error('Webhook: failed to confirm SNS subscription', { err });
    }
    return res.status(200).json({ ok: true });
  }

  // ── 2. SNS Notification ─────────────────────────────────────────────────
  if (snsMessage.Type === 'Notification') {
    let payload: any;
    try {
      payload = JSON.parse(snsMessage.Message);
    } catch {
      logger.warn('Webhook: could not parse SNS Message field');
      return res.status(200).json({ ok: true });
    }

    if (payload.notificationType === 'Received') {
      await processInboundEmail(payload);
    }

    return res.status(200).json({ ok: true });
  }

  // Unknown type — return 200 so SNS doesn't retry
  return res.status(200).json({ ok: true });
});

// ── Core inbound email processing ──────────────────────────────────────────
async function processInboundEmail(payload: any) {
  const { mail, content } = payload;

  if (!mail) {
    logger.warn('Webhook: SES notification missing mail field');
    return;
  }

  const recipients: string[] = mail.destination || [];
  const senderAddress: string = mail.source || '';
  const timestamp: string = mail.timestamp || new Date().toISOString();

  logger.info('Webhook: inbound email received', {
    from: senderAddress,
    to: recipients,
  });

  // Parse the raw MIME email (content field from SNS action on SES receipt rule)
  let subject = mail.commonHeaders?.subject || '(no subject)';
  let bodyText = '';
  let bodyHtml = '';

  if (content) {
    try {
      const parsed = await simpleParser(content);
      subject = parsed.subject || subject;
      bodyText = parsed.text || '';
      bodyHtml = parsed.html || '';
    } catch (err) {
      logger.error('Webhook: mailparser error', { err });
    }
  }

  const body = bodyText || bodyHtml || '';

  // For each recipient, find matching email account and create message
  for (const recipient of recipients) {
    const normalised = recipient.toLowerCase().trim();

    const emailAccount = await EmailModel.findByAddress(normalised);
    if (!emailAccount) {
      // Try case-insensitive fallback (Firestore is case-sensitive)
      logger.warn('Webhook: no email account for recipient', { recipient: normalised });
      continue;
    }

    if (!emailAccount.isActive) {
      logger.info('Webhook: email account inactive, skipping', { recipient: normalised });
      continue;
    }

    // Compute a threadId from the normalized subject (strip Re:/Fwd: prefixes)
    const normalizedSubject = subject
      .replace(/^(re|fwd|fw|aw):\s*/gi, '')
      .trim()
      .toLowerCase();
    const threadId = `${emailAccount.id}:${normalizedSubject}`;

    const savedMessage = await MessageModel.create({
      emailId: emailAccount.id,
      from: senderAddress,
      to: normalised,
      subject,
      body,
      isAutoReplied: false,
      isSent: false,
      isRead: false,
      threadId,
      receivedAt: new Date(timestamp),
    });

    logger.info('Webhook: message saved to Firestore', {
      emailAccountId: emailAccount.id,
      from: senderAddress,
      subject,
    });

    // Trigger AI processing pipeline asynchronously (non-blocking)
    automationService.processIncomingMessage(savedMessage).catch((err) =>
      logger.error('Webhook: async AI processing failed', {
        messageId: savedMessage.id,
        error: err.message,
      })
    );
  }
}
