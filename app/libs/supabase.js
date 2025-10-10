import { createBrowserClient } from '@supabase/ssr';

// Create a single supabase client for interacting with your database
let supabase = null;

// Client-side Supabase client (uses anon key, respects RLS)
// Uses cookies for PKCE flow to work with SSR
export function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
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
    // Import createClient from supabase-js for admin client
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase service role environment variables');
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseAdmin;
}

export default getSupabaseClient;

