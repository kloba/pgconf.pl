import { getEnv } from './env.js';

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface MailerProvider {
  send(input: SendEmailInput): Promise<void>;
}

class ResendProvider implements MailerProvider {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send({ to, subject, html, text, replyTo }: SendEmailInput): Promise<void> {
    const payload: Record<string, unknown> = {
      from: this.from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    };
    if (text) payload.text = text;
    if (replyTo) payload.reply_to = replyTo;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Mailer send failed (${res.status}): ${body}`);
    }
  }
}

class ConsoleProvider implements MailerProvider {
  async send({ to, subject, replyTo }: SendEmailInput): Promise<void> {
    console.log(
      `[mailer:console] would send -> to=${JSON.stringify(to)} subject="${subject}" replyTo=${replyTo ?? '-'}`,
    );
  }
}

let cachedProvider: MailerProvider | null = null;

function getProvider(): MailerProvider {
  if (cachedProvider) return cachedProvider;
  const apiKey = getEnv('MAILER_API_KEY', false);
  const from = getEnv('MAILER_FROM', false) ?? 'hello@pgconf.pl';
  if (apiKey) {
    cachedProvider = new ResendProvider(apiKey, from);
  } else {
    console.warn('[mailer] MAILER_API_KEY not set — using console provider');
    cachedProvider = new ConsoleProvider();
  }
  return cachedProvider;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const provider = getProvider();
  await provider.send(input);
}
