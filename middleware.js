import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: false, // Don't detect in middleware
        persistSession: true,
        autoRefreshToken: true,
      },
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          // Update both request and response cookies
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name, options) {
          // Remove from both request and response cookies
          request.cookies.delete(name);
          response.cookies.delete(name);
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  // This will automatically refresh the session if it's expired
  const { data: { session }, error } = await supabase.auth.getSession();
  
  // Log session status in middleware (only for debugging)
  if (request.nextUrl.pathname.startsWith('/api/directories') && request.method === 'POST') {
    console.log('Middleware - Session check for POST /api/directories:', {
      hasSession: !!session,
      userId: session?.user?.id,
      error: error?.message,
    });
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

