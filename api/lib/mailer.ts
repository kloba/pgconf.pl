interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

interface MailerProvider {
  send(args: SendArgs): Promise<void>;
}

class ConsoleProvider implements MailerProvider {
  async send(args: SendArgs): Promise<void> {
    console.log('[mailer:console]', JSON.stringify({ to: args.to, subject: args.subject }));
  }
}

class ResendProvider implements MailerProvider {
  constructor(
    private apiKey: string,
    private from: string,
  ) {}
  async send(args: SendArgs): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
        reply_to: args.replyTo,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Resend send failed (${res.status}): ${text}`);
    }
  }
}

let cached: MailerProvider | undefined;
function provider(): MailerProvider {
  if (cached) return cached;
  const apiKey = process.env.MAILER_API_KEY;
  const from = process.env.MAILER_FROM ?? 'hello@pgconf.pl';
  cached = apiKey ? new ResendProvider(apiKey, from) : new ConsoleProvider();
  return cached;
}

export async function sendEmail(args: SendArgs): Promise<void> {
  await provider().send(args);
}
