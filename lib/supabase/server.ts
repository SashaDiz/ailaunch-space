import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

import { getSupabasePublishableKey, getSupabaseUrl } from './env';

/**
 * The request-scoped Supabase client for Server Components, Route Handlers and
 * Server Actions. Respects RLS — it authenticates as the signed-in user, not as
 * the service role (that is `getSupabaseAdmin()` in ./client).
 *
 * This exists because the cookie adapter has exactly one supported shape and it
 * was written out by hand at ~30 call sites, most of them in the shape
 * `@supabase/ssr` dropped in 0.4.0:
 *
 *     cookies: { get(name) { return cookieStore.get(name)?.value } }   // ❌
 *
 * A `get`-only adapter can read the access token but has nowhere to put a
 * refreshed one, so every rotation performed inside a route handler is thrown
 * away. Sessions survive today only because `middleware.ts` refreshes them on
 * the way in — which is a load-bearing accident, not a design. Supabase's own
 * documentation marks that shape as unsupported and `getAll`/`setAll` as the
 * only correct one.
 *
 * https://github.com/supabase/supabase/blob/master/examples/prompts/nextjs-supabase-auth.md
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl()!, getSupabasePublishableKey()!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // `cookies()` is read-only inside a Server Component. Safe to ignore:
          // the middleware refreshes the session on the next request. In a
          // Route Handler the write goes through, which is the point.
        }
      },
    },
  });
}

/**
 * The signed-in user, or null.
 *
 * Always `getUser()`, never `getSession()` — the latter reads the cookie and
 * believes it, while this validates the JWT against the auth server.
 */
export async function getRouteUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}
