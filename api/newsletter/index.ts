import { newsletterSubscription } from '../lib/contracts/newsletter';
import { getClientIp } from '../lib/clientIp';
import { getEnv } from '../lib/env';
import { type FuncResponse, bad, ok } from '../lib/respond';
import { getTable } from '../lib/tableStorage';
import { verifyTurnstile } from '../lib/turnstile';

interface FuncContext {
  log: {
    error: (msg: unknown, ...args: unknown[]) => void;
    warn: (msg: unknown, ...args: unknown[]) => void;
  };
  res?: FuncResponse;
}
interface FuncRequest {
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

const TABLE = 'NewsletterOptins';

async function tryProvider(
  email: string,
  listId: string,
  apiKey: string,
  ctx: FuncContext,
): Promise<void> {
  try {
    const res = await fetch(
      `https://api.resend.com/audiences/${encodeURIComponent(listId)}/contacts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, unsubscribed: false }),
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      ctx.log.warn(`newsletter provider call failed (${res.status}): ${text}`);
    }
  } catch (err) {
    ctx.log.warn('newsletter provider network error', err);
  }
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

    const parsed = newsletterSubscription.safeParse(json);
    if (!parsed.success) {
      context.res = bad(400, 'validation');
      return;
    }
    const submission = parsed.data;
    const email = submission.email.trim().toLowerCase();
    const ip = getClientIp(req);

    const captchaOk = await verifyTurnstile(submission.turnstileToken, ip);
    if (!captchaOk) {
      context.res = bad(403, 'captcha');
      return;
    }

    try {
      const table = await getTable(TABLE);
      await table.upsertEntity(
        {
          partitionKey: 'subscribers',
          rowKey: email,
          email,
          ip,
          subscribedAt: new Date().toISOString(),
        },
        'Merge',
      );
    } catch (err) {
      context.log.error('newsletter table write failed', err);
    }

    const apiKey = getEnv('MAILER_API_KEY', false);
    const listId = getEnv('NEWSLETTER_LIST_ID', false);
    if (apiKey && listId) {
      await tryProvider(email, listId, apiKey, context);
    }

    context.res = ok({});
  } catch (err) {
    context.log.error(err);
    context.res = bad(500, 'internal');
  }
}
