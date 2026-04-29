'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/components/shared/SupabaseProvider';
import { isDemoMode, DEMO_AUTH_USER } from '@/lib/demo';

const _demoMode = isDemoMode();

export function useUser() {
  const { supabase } = useSupabase();
  const [user, setUser] = useState(() => (_demoMode ? DEMO_AUTH_USER : null));
  const [loading, setLoading] = useState(() => (_demoMode ? false : true));

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
    // In demo mode, skip Supabase auth entirely
    if (_demoMode) return;

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

