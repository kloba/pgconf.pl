/**
 * Verify a Cloudflare Turnstile token against the siteverify endpoint.
 * If TURNSTILE_SECRET is missing or "skip-in-dev", returns true (with a warn).
 * Network or non-2xx responses → returns false.
 */
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret || secret === 'skip-in-dev') {
    console.warn('TURNSTILE_SECRET not configured; bypassing CAPTCHA');
    return true;
  }
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}
