import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import {
  MISSING_PUBLISHABLE_KEY_MESSAGE,
  MISSING_SECRET_KEY_MESSAGE,
  getSupabasePublishableKey,
  getSupabaseSecretKey,
  getSupabaseUrl,
} from '@/lib/supabase/env';

let supabase = null;

// Browser client — publishable key (legacy anon key still accepted), respects RLS
export function getSupabaseClient() {
  // During build time, environment variables might not be available.
  // Return null gracefully to prevent build errors.
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    if (!getSupabaseUrl() || !getSupabasePublishableKey()) {
      console.warn('Supabase environment variables not available during build time');
      return null;
    }
  }

  if (!supabase) {
    const supabaseUrl = getSupabaseUrl();
    const supabasePublishableKey = getSupabasePublishableKey();

    if (!supabaseUrl || !supabasePublishableKey) {
      throw new Error(MISSING_PUBLISHABLE_KEY_MESSAGE);
    }

    supabase = createBrowserClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return supabase;
}

// Server client — secret key (legacy service_role key still accepted), bypasses RLS
let supabaseAdmin = null;

export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = getSupabaseUrl();
    const supabaseSecretKey = getSupabaseSecretKey();

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error(MISSING_SECRET_KEY_MESSAGE);
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'User-Agent': 'AILaunchSpace/1.0'
        }
      }
    });
  }

  return supabaseAdmin;
}

export default getSupabaseClient;
