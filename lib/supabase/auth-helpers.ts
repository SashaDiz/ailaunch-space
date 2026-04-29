// Server-side auth helpers for Supabase
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { checkIsAdmin } from './auth';
import { getSupabasePublishableKey, getSupabaseUrl } from './env';

/**
 * Get the current user session from cookies (server-side)
 * Use this in Server Components and API routes.
 *
 * Uses an SSR client with cookie access and calls getUser() which
 * validates the JWT on the Supabase Auth server (not just reading cookies).
 */
export async function getServerSession() {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      getSupabaseUrl()!,
      getSupabasePublishableKey()!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    // getUser() validates the JWT server-side (unlike getSession which only reads cookies)
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
        image: user.user_metadata?.avatar_url,
        user_metadata: user.user_metadata,
      }
    };
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}

/**
 * Get the current user from the session (server-side)
 * Returns just the user object or null
 */
export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user || null;
}

/**
 * Require authentication - redirect to signin if not authenticated
 * Use this in Server Components that require auth
 */
export async function requireAuth() {
  const session = await getServerSession();
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      }
    };
  }
  
  return { session };
}

/**
 * Check if user is authenticated (returns boolean)
 */
export async function isAuthenticated() {
  const session = await getServerSession();
  return !!session;
}

/**
 * Check if user is admin (server-side).
 *
 * Delegates to checkIsAdmin in ./auth to keep a single source of truth.
 * Accepts either is_admin boolean or role === 'admin'.
 */
export async function isAdmin() {
  const user = await getCurrentUser();
  if (!user) return false;
  return checkIsAdmin(user.id);
}

