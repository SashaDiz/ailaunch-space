import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { i18nConfig } from '@/config/i18n.config';
import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/env';

export async function middleware(request) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  // This will automatically refresh the session using getUser() for security
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // i18n locale detection — set cookie from Accept-Language if not already set
  if (i18nConfig.enabled && i18nConfig.localeDetection) {
    const localeCookie = request.cookies.get(i18nConfig.localeCookie)?.value;
    if (!localeCookie) {
      const acceptLang = request.headers.get('accept-language') || '';
      const detected = i18nConfig.locales.find((l) =>
        acceptLang.toLowerCase().includes(l)
      );
      const locale = detected || i18nConfig.defaultLocale;
      response.cookies.set(i18nConfig.localeCookie, locale, {
        path: '/',
        maxAge: 31536000,
        sameSite: 'lax',
      });
    }
  }

  return response;
}

// Ensure the middleware is only called for relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/webhooks (webhooks should not require auth middleware)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/webhooks).*)',
  ],
};

