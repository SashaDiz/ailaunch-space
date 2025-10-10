import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
let supabase = null;

// Client-side Supabase client (uses anon key, respects RLS)
// Uses cookies for PKCE flow to work with SSR
export function getSupabaseClient() {
  // During build time, environment variables might not be available
  // Return null gracefully to prevent build errors
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase environment variables not available during build time');
      return null;
    }
  }

  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.');
    }

    supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return supabase;
}

// Server-side Supabase client (uses service role key, bypasses RLS)
// Use this ONLY in server-side code (API routes)
let supabaseAdmin = null;

export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase Environment Variables:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        nodeEnv: process.env.NODE_ENV,
      });
      throw new Error('Missing Supabase service role environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.');
    }

    try {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      console.log('Supabase admin client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Supabase admin client:', error);
      throw error;
    }
  }

  return supabaseAdmin;
}

export default getSupabaseClient;

