import { randomUUID } from 'node:crypto';
import { type CfpSubmission, cfpSubmission } from '@pgconf/contracts/cfp';
import { getClientIp } from '../lib/clientIp.js';
import { getEnv } from '../lib/env.js';
import { sendEmail } from '../lib/mailer.js';
import { type FuncResponse, bad, ok } from '../lib/respond.js';
import { getTable } from '../lib/tableStorage.js';
import { verifyTurnstile } from '../lib/turnstile.js';

interface FuncContext {
  log: { error: (msg: unknown, ...args: unknown[]) => void };
  res?: FuncResponse;
}
interface FuncRequest {
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

const CFP_TABLE = 'CfpSubmissions';
const CFP_YEAR = '2026';

const escapeHtml = (input: string): string =>
  input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function committeeHtml(submission: CfpSubmission, id: string): string {
  const rows: Array<[string, string]> = [
    ['ID', id],
    ['Speaker', `${submission.speakerName} <${submission.speakerEmail}>`],
    ['Country', submission.speakerCountry],
    ['Company', submission.speakerCompany ?? '-'],
    ['Pronouns', submission.speakerPronouns ?? '-'],
    ['Bio', submission.speakerBio],
    ['Title', submission.talkTitle],
    ['Format', submission.talkFormat],
    ['Level', submission.talkLevel],
    ['Topics', submission.talkTopics.join(', ')],
    ['Travel support', submission.needsTravelSupport ? 'yes' : 'no'],
    ['Notes', submission.notes ?? '-'],
    ['Abstract', submission.talkAbstract],
  ];
  const body = rows
    .map(
      ([k, v]) =>
        `<tr><th align="left" valign="top" style="padding:4px 12px 4px 0;">${escapeHtml(k)}</th><td style="white-space:pre-wrap;">${escapeHtml(v)}</td></tr>`,
    )
    .join('');
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#111;">
<h2>New CFP submission</h2>
<table cellpadding="0" cellspacing="0">${body}</table>
</body></html>`;
}

function speakerConfirmationHtml(submission: CfpSubmission): string {
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#111;line-height:1.5;">
<p>Hi ${escapeHtml(submission.speakerName)},</p>
<p>Thank you for submitting <strong>${escapeHtml(submission.talkTitle)}</strong> to PGConf Poland 2026.</p>
<p>The programme committee has received your proposal and will be in touch with the review outcome ahead of the published notification date.</p>
<p>If you need to amend the submission, simply reply to this email.</p>
<p>— The PGConf Poland 2026 programme committee</p>
</body></html>`;
}

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

    const parsed = cfpSubmission.safeParse(json);
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
      const table = await getTable(CFP_TABLE);
      await table.createEntity({
        partitionKey: CFP_YEAR,
        rowKey: id,
        speakerName: submission.speakerName,
        speakerEmail: submission.speakerEmail,
        speakerBio: submission.speakerBio,
        speakerCompany: submission.speakerCompany ?? '',
        speakerCountry: submission.speakerCountry,
        speakerPronouns: submission.speakerPronouns ?? '',
        talkTitle: submission.talkTitle,
        talkAbstract: submission.talkAbstract,
        talkFormat: submission.talkFormat,
        talkLevel: submission.talkLevel,
        talkTopics: submission.talkTopics.join(','),
        needsTravelSupport: submission.needsTravelSupport,
        notes: submission.notes ?? '',
        submittedAt,
        ip,
      });
    } catch (err) {
      context.log.error('cfp table write failed', err);
    }

    const committeeEmail = getEnv('PROGRAM_COMMITTEE_EMAIL', false) ?? 'programme@pgconf.pl';

    await Promise.all([
      sendEmail({
        to: committeeEmail,
        subject: `[CFP ${CFP_YEAR}] ${submission.talkTitle} — ${submission.speakerName}`,
        html: committeeHtml(submission, id),
        replyTo: submission.speakerEmail,
      }).catch((err) => context.log.error('cfp committee mail failed', err)),
      sendEmail({
        to: submission.speakerEmail,
        subject: `Your PGConf Poland 2026 CFP submission — ${submission.talkTitle}`,
        html: speakerConfirmationHtml(submission),
      }).catch((err) => context.log.error('cfp speaker mail failed', err)),
    ]);

    context.res = ok({ id });
  } catch (err) {
    context.log.error(err);
    context.res = bad(500, 'internal');
  }
}
