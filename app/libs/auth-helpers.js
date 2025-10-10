// Server-side auth helpers for Supabase
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from './supabase.js';

/**
 * Get the current user session from cookies (server-side)
 * Use this in Server Components and API routes
 */
export async function getServerSession() {
  try {
    const supabase = getSupabaseAdmin();
    const cookieStore = await cookies();
    
    // Get the session token from cookies
    const accessToken = cookieStore.get('sb-access-token');
    const refreshToken = cookieStore.get('sb-refresh-token');
    
    if (!accessToken && !refreshToken) {
      return null;
    }

    // Get the user from the session
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
 * Check if user is admin (server-side)
 */
export async function isAdmin() {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }

    return data?.is_admin === true;
  } catch (error) {
    console.error('Error in isAdmin:', error);
    return false;
  }
}

