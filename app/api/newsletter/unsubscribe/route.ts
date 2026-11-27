import { getSupabaseAdmin } from '@/lib/supabase/client';
import { checkRateLimit } from '@/lib/rate-limit';
import { siteConfig } from '@/config/site.config';
import { isValidUnsubscribeToken, unsubscribeSecret } from '@/lib/unsubscribe-token';

const page = (title: string, text: string, status = 200) => new Response(
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head>
  <body style="margin:0;background:#07090b;color:#d9f7ea;font-family:'JetBrains Mono',Menlo,monospace;display:flex;min-height:100vh;align-items:center;justify-content:center">
  <main style="max-width:460px;padding:32px;border:1px solid #22302b;background:#101418">
  <p style="color:#ff7a1a;font-size:11px;letter-spacing:.18em;text-transform:uppercase;margin:0 0 12px">[ newsletter ]</p>
  <h1 style="font-size:22px;margin:0 0 12px">${title}</h1><p style="color:#9fbcb0;line-height:1.7">${text}</p>
  <p><a href="${siteConfig.url}" style="color:#3dffb0">Back to ${siteConfig.name}</a></p></main></body></html>`,
  { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
);

/** GET /api/newsletter/unsubscribe?email=&token= — one-click link from emails. */
export async function GET(request: Request) {
  const limit = await checkRateLimit(request, 'general');
  if (!limit.allowed) return page('Too many requests', 'Please try again in a minute.', 429);

  const { searchParams } = new URL(request.url);
  const email = (searchParams.get('email') || '').trim().toLowerCase();
  const token = searchParams.get('token') || '';
  const secret = unsubscribeSecret();
  if (!secret || !isValidUnsubscribeToken(email, token, secret)) {
    return page('Link not valid', 'This unsubscribe link is invalid or incomplete. Reply to any of our emails and we will remove you by hand.', 400);
  }

  const now = new Date().toISOString();
  const { error } = await getSupabaseAdmin()
    .from('newsletter')
    .update({ status: 'unsubscribed', unsubscribed_at: now, updated_at: now })
    .eq('email', email);
  if (error) {
    console.error('Newsletter unsubscribe failed:', error);
    return page('Something went wrong', 'We could not update your subscription. Please try again later.', 500);
  }
  return page('You are unsubscribed', `${email.replace(/[<>"'&]/g, "")} will no longer receive the ${siteConfig.name} newsletter.`);
}
