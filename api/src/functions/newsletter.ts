import { app, type HttpHandler, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { newsletterSubscription } from '@pgconf/contracts/newsletter';
import { getClientIp } from '../lib/clientIp.js';
import { getEnv } from '../lib/env.js';
import { bad, ok } from '../lib/respond.js';
import { getTable } from '../lib/tableStorage.js';
import { verifyTurnstile } from '../lib/turnstile.js';

const NEWSLETTER_TABLE = 'NewsletterOptins';
const PARTITION = 'subscribers';

async function callProvider(email: string, listId: string, apiKey: string, ctx: InvocationContext): Promise<void> {
  // Best-effort generic call. Individual provider (MailerLite / Listmonk / Resend Audiences)
  // can be swapped here without changing the handler shape.
  try {
    const res = await fetch('https://api.resend.com/audiences/' + encodeURIComponent(listId) + '/contacts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      ctx.warn(`newsletter provider call failed (${res.status}): ${text}`);
    }
  } catch (err) {
    ctx.warn('newsletter provider network error', err);
  }
}

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

    const parsed = newsletterSubscription.safeParse(json);
    if (!parsed.success) {
      return bad(400, 'validation');
    }
    const submission = parsed.data;

    const ip = getClientIp(req);
    const captchaOk = await verifyTurnstile(submission.turnstileToken, ip);
    if (!captchaOk) {
      return bad(403, 'captcha');
    }

    const email = submission.email.toLowerCase();
    const submittedAt = new Date().toISOString();

    const table = await getTable(NEWSLETTER_TABLE);
    await table.upsertEntity(
      {
        partitionKey: PARTITION,
        rowKey: email,
        email,
        consent: submission.consent,
        submittedAt,
        ip,
      },
      'Merge',
    );

    const apiKey = getEnv('MAILER_API_KEY', false);
    const listId = getEnv('NEWSLETTER_LIST_ID', false);
    if (apiKey && listId) {
      await callProvider(email, listId, apiKey, ctx);
    } else {
      ctx.log(`[newsletter] would subscribe ${email} (no provider configured)`);
    }

    return ok({});
  } catch (err) {
    ctx.error(err);
    return bad(500, 'internal');
  }
};

app.http('newsletter', {
  route: 'newsletter',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler,
});
