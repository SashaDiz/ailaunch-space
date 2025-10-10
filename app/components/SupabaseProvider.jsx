'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseClient } from '../libs/supabase.js';
import { useRouter, usePathname } from 'next/navigation';

const SupabaseContext = createContext(undefined);

export function SupabaseProvider({ children }) {
  const [supabase] = useState(() => getSupabaseClient());
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Refresh the page to sync server and client
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase, pathname]);

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within SupabaseProvider');
  }
  return context;
};

