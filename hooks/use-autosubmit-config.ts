"use client";

import { useState, useEffect } from 'react';
import type { AutoSubmitBannerConfig } from '@/types/config';
import { DEFAULT_AUTOSUBMIT_CONFIG } from '@/config/autosubmit.config';

let cachedConfig: AutoSubmitBannerConfig | null = null;
let fetchPromise: Promise<AutoSubmitBannerConfig> | null = null;

async function fetchConfig(): Promise<AutoSubmitBannerConfig> {
  try {
    const res = await fetch('/api/settings/autosubmit-banner');
    if (!res.ok) return DEFAULT_AUTOSUBMIT_CONFIG;
    const data = await res.json();
    return { ...DEFAULT_AUTOSUBMIT_CONFIG, ...data };
  } catch {
    return DEFAULT_AUTOSUBMIT_CONFIG;
  }
}

export function useAutoSubmitConfig() {
  const [config, setConfig] = useState<AutoSubmitBannerConfig>(
    cachedConfig ?? DEFAULT_AUTOSUBMIT_CONFIG
  );
  const [loading, setLoading] = useState(!cachedConfig);

  useEffect(() => {
    if (cachedConfig) {
      setConfig(cachedConfig);
      setLoading(false);
      return;
    }
    if (!fetchPromise) {
      fetchPromise = fetchConfig();
    }
    fetchPromise.then((result) => {
      cachedConfig = result;
      setConfig(result);
      setLoading(false);
    });
  }, []);

  return { config, loading };
}

/** Invalidate the cache so next hook mount re-fetches */
export function invalidateAutoSubmitConfigCache() {
  cachedConfig = null;
  fetchPromise = null;
}
