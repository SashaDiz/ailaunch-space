import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from './supabase.js';

// Get Supabase session on the server
// Uses getUser() instead of getSession() for security
export async function getSession() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Use getUser() instead of getSession() for security
  // This verifies the session with the Supabase server
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Return a session-like object for compatibility
  return {
    user,
    access_token: null, // Not available from getUser()
    refresh_token: null, // Not available from getUser()
  };
}

// Get current authenticated user
export async function getUser() {
  const session = await getSession();
  
  if (!session?.user) {
    return null;
  }

  // Get additional user data from public.users table
  const supabaseAdmin = getSupabaseAdmin();
  const { data: userData, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('Error fetching user data:', error);
    return {
      id: session.user.id,
      email: session.user.email,
      role: 'user',
    };
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: userData.full_name || session.user.user_metadata?.name,
    image: session.user.user_metadata?.avatar_url,
    role: userData.role || 'user',
    ...userData,
  };
}

// Auth function compatible with NextAuth-style auth()
export async function auth() {
  const user = await getUser();
  
  if (!user) {
    return null;
  }

  return {
    user,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  };
}

// Sign in with email and password
export async function signInWithEmail(email, password) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

// Sign up with email and password
export async function signUpWithEmail(email, password, metadata = {}) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) {
    throw error;
  }

  // Create user profile in public.users
  if (data.user) {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.from('users').insert({
      id: data.user.id,
      full_name: metadata.name,
      role: 'user',
      is_active: true,
      total_submissions: 0,
      total_votes: 0,
      reputation: 0,
    });
  }

  return data;
}

// Sign out
export async function signOut() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  await supabase.auth.signOut();
}

// Sign in with OAuth provider
export async function signInWithOAuth(provider) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Get the redirect URL with proper fallback chain
  const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                     'http://localhost:3000');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${redirectUrl}/auth/callback`,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

// Export for backward compatibility
export { auth as default };

