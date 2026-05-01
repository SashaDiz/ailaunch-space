'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/components/shared/SupabaseProvider';

export function useUser() {
  const { supabase } = useSupabase();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncUser = (sessionUser) => {
    setUser((prev) => {
      const next = sessionUser ?? null;
      const prevId = prev?.id;
      const nextId = next?.id;
      const prevUpdated = prev?.updated_at;
      const nextUpdated = next?.updated_at;

      // Skip state updates when Supabase emits token refresh events for the same user.
      if (prevId === nextId && prevUpdated === nextUpdated) {
        return prev;
      }

      return next;
    });
    setLoading(false);
  };

  useEffect(() => {
    // Get initial session
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      syncUser(session?.user);
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session?.user);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return { user, loading };
}
