import { getEnv } from './env.js';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
}

/**
 * Verify a Cloudflare Turnstile token. Returns true on success.
 * If TURNSTILE_SECRET is missing or set to "skip-in-dev", returns true (with a console.warn).
 * Network errors return false.
 */
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = getEnv('TURNSTILE_SECRET', false);
  if (!secret || secret === 'skip-in-dev') {
    console.warn('[turnstile] TURNSTILE_SECRET missing or set to "skip-in-dev" — skipping verification');
    return true;
  }
  if (!token) return false;

  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);
  if (ip) body.set('remoteip', ip);

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) {
      console.warn(`[turnstile] verify failed with status ${res.status}`);
      return false;
    }
    const data = (await res.json()) as TurnstileResponse;
    if (!data.success) {
      console.warn('[turnstile] verify rejected', data['error-codes']);
    }
    return data.success === true;
  } catch (err) {
    console.warn('[turnstile] verify network error', err);
    return false;
  }
}
