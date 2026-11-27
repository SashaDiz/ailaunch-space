import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * One-click newsletter unsubscribe links. The token is an HMAC of the email,
 * so a link only works for the address it was sent to and cannot be forged
 * to unsubscribe someone else.
 */
export function unsubscribeToken(email: string, secret: string): string {
  return createHmac('sha256', secret).update(email.trim().toLowerCase()).digest('hex').slice(0, 32);
}

export function isValidUnsubscribeToken(email: string, token: string, secret: string): boolean {
  if (!email || !token || !secret) return false;
  const expected = Buffer.from(unsubscribeToken(email, secret));
  const given = Buffer.from(String(token));
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function unsubscribeSecret(): string | null {
  return process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || null;
}

export function unsubscribeUrl(siteUrl: string, email: string): string | undefined {
  const secret = unsubscribeSecret();
  if (!secret) return undefined;
  const url = new URL('/api/newsletter/unsubscribe', siteUrl);
  url.searchParams.set('email', email.trim().toLowerCase());
  url.searchParams.set('token', unsubscribeToken(email, secret));
  return url.href;
}
