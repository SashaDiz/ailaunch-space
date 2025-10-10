import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');
  const next = requestUrl.searchParams.get('next') || '/';

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description);
    return NextResponse.redirect(new URL(`/auth/signin?error=OAuthCallback&details=${encodeURIComponent(error_description || error)}`, requestUrl.origin));
  }

  if (code) {
    try {
      const cookieStore = await cookies();
      
      // Create a Supabase SSR client with proper cookie handling and extended timeout
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          auth: {
            flowType: 'pkce',
            detectSessionInUrl: true,
            persistSession: true,
            autoRefreshToken: true,
          },
          cookies: {
            get(name) {
              return cookieStore.get(name)?.value;
            },
            set(name, value, options) {
              try {
                cookieStore.set({ name, value, ...options });
              } catch (error) {
                // Handle cookie setting errors
                console.error('Error setting cookie:', error);
              }
            },
            remove(name, options) {
              try {
                cookieStore.set({ name, value: '', ...options });
              } catch (error) {
                // Handle cookie removal errors
                console.error('Error removing cookie:', error);
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

      console.log('Successfully authenticated user:', data.user?.email);
      
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

