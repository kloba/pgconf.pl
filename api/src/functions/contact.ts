import { randomUUID } from 'node:crypto';
import { app, type HttpHandler, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { contactSubmission, type ContactSubmission } from '@pgconf/contracts/contact';
import { getClientIp } from '../lib/clientIp.js';
import { getEnv } from '../lib/env.js';
import { sendEmail } from '../lib/mailer.js';
import { bad, ok } from '../lib/respond.js';
import { getTable } from '../lib/tableStorage.js';
import { verifyTurnstile } from '../lib/turnstile.js';

const CONTACT_TABLE = 'ContactMessages';

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

const handler: HttpHandler = async (
  req: HttpRequest,
  ctx: InvocationContext,
): Promise<HttpResponseInit> => {
  try {
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return bad(400, 'invalid_json');
    }

    const parsed = contactSubmission.safeParse(json);
    if (!parsed.success) {
      return bad(400, 'validation');
    }
    const submission = parsed.data;

    const ip = getClientIp(req);
    const captchaOk = await verifyTurnstile(submission.turnstileToken, ip);
    if (!captchaOk) {
      return bad(403, 'captcha');
    }

    const id = randomUUID();
    const submittedAt = new Date().toISOString();

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

    const inbox = getEnv('CONTACT_INBOX', false) ?? 'hello@pgconf.pl';

    await sendEmail({
      to: inbox,
      subject: `[contact:${submission.category}] ${submission.subject}`,
      html: inboxHtml(submission, id),
      replyTo: submission.email,
    }).catch((err) => ctx.error('contact mail failed', err));

    return ok({});
  } catch (err) {
    ctx.error(err);
    return bad(500, 'internal');
  }
};

app.http('contact', {
  route: 'contact',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler,
});
