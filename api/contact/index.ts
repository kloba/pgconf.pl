import { randomUUID } from 'node:crypto';
import { type ContactSubmission, contactSubmission } from '../lib/contracts/contact';
import { getClientIp } from '../lib/clientIp';
import { getEnv } from '../lib/env';
import { sendEmail } from '../lib/mailer';
import { type FuncResponse, bad, ok } from '../lib/respond';
import { getTable } from '../lib/tableStorage';
import { verifyTurnstile } from '../lib/turnstile';

interface FuncContext {
  log: { error: (msg: unknown, ...args: unknown[]) => void };
  res?: FuncResponse;
}

interface FuncRequest {
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  rawBody?: string;
}

const CONTACT_TABLE = 'ContactMessages';

const escapeHtml = (input: string): string =>
  input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function inboxHtml(submission: ContactSubmission, id: string): string {
  const rows: Array<[string, string]> = [
    ['ID', id],
    ['From', `${submission.name} <${submission.email}>`],
    ['Organisation', submission.organisation ?? '-'],
    ['Category', submission.category],
    ['Subject', submission.subject],
    ['Message', submission.message],
  ];
  const body = rows
    .map(
      ([k, v]) =>
        `<tr><th align="left" valign="top" style="padding:4px 12px 4px 0;">${escapeHtml(k)}</th><td style="white-space:pre-wrap;">${escapeHtml(v)}</td></tr>`,
    )
    .join('');
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#111;">
<h2>New contact message</h2>
<table cellpadding="0" cellspacing="0">${body}</table>
</body></html>`;
}

const partitionForCategory = (category: string): string => `category:${category}`;

export default async function (context: FuncContext, req: FuncRequest): Promise<void> {
  try {
    let json: unknown = req.body;
    if (typeof json === 'string') {
      try {
        json = JSON.parse(json);
      } catch {
        context.res = bad(400, 'invalid_json');
        return;
      }
    }

    const parsed = contactSubmission.safeParse(json);
    if (!parsed.success) {
      context.res = bad(400, 'validation');
      return;
    }
    const submission = parsed.data;

    const ip = getClientIp(req);
    const captchaOk = await verifyTurnstile(submission.turnstileToken, ip);
    if (!captchaOk) {
      context.res = bad(403, 'captcha');
      return;
    }

    const id = randomUUID();
    const submittedAt = new Date().toISOString();

    try {
      const table = await getTable(CONTACT_TABLE);
      await table.createEntity({
        partitionKey: partitionForCategory(submission.category),
        rowKey: id,
        name: submission.name,
        email: submission.email,
        organisation: submission.organisation ?? '',
        category: submission.category,
        subject: submission.subject,
        message: submission.message,
        submittedAt,
        ip,
      });
    } catch (err) {
      context.log.error('contact table write failed', err);
    }

    const inbox = getEnv('CONTACT_INBOX', false) ?? 'hello@pgconf.pl';

    await sendEmail({
      to: inbox,
      subject: `[contact:${submission.category}] ${submission.subject}`,
      html: inboxHtml(submission, id),
      replyTo: submission.email,
    }).catch((err) => context.log.error('contact mail failed', err));

    context.res = ok({});
  } catch (err) {
    context.log.error(err);
    context.res = bad(500, 'internal');
  }
}
