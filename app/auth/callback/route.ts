import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { safeRedirectPath } from '@/lib/safe-redirect';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');
  // Same-origin, path-relative targets only. The inline check this replaces
  // missed the backslash form ("/\\evil.example", which some browsers read as
  // "//") and control characters.
  const next = safeRedirectPath(requestUrl.searchParams.get('next'), '/');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description);
    return NextResponse.redirect(new URL(`/auth/signin?error=OAuthCallback&details=${encodeURIComponent(error_description || error)}`, requestUrl.origin));
  }

  if (code) {
    try {
      const supabase = await createSupabaseServerClient();

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
