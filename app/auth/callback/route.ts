import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/env';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');
  const nextParam = requestUrl.searchParams.get('next') || '/';
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/';

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description);
    return NextResponse.redirect(new URL(`/auth/signin?error=OAuthCallback&details=${encodeURIComponent(error_description || error)}`, requestUrl.origin));
  }

  if (code) {
    try {
      const cookieStore = await cookies();
      
      // Create a Supabase SSR client with proper cookie handling using getAll/setAll
      const supabase = createServerClient(
        getSupabaseUrl(),
        getSupabasePublishableKey(),
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) => {
                  cookieStore.set(name, value, options);
                });
              } catch (error) {
                // Handle cookie setting errors
                console.error('Error setting cookies:', error);
              }
            },
          },
        }
      );

      // Exchange code for session - this must happen ASAP
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError);
        return NextResponse.redirect(new URL(`/auth/signin?error=AuthCallback&details=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin));
      }

      if (!data?.session) {
        console.error('No session returned after code exchange');
        return NextResponse.redirect(new URL('/auth/signin?error=NoSession', requestUrl.origin));
      }

      // Note: User creation in public.users is now handled automatically by
      // the database trigger (on_auth_user_created). No need to manually sync here.
      
      // Redirect immediately after session is established
      const response = NextResponse.redirect(new URL(next, requestUrl.origin));
      
      return response;
    } catch (error) {
      console.error('Error in auth callback:', error);
      return NextResponse.redirect(new URL(`/auth/signin?error=AuthCallback&details=${encodeURIComponent(error.message)}`, requestUrl.origin));
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
