"use client";

import { useState, useEffect } from 'react';
import type { PromoBlockConfig } from '@/types/config';
import { DEFAULT_PROMO_BLOCK_CONFIG } from '@/config/promo-block.config';

let cachedConfig: PromoBlockConfig | null = null;
let fetchPromise: Promise<PromoBlockConfig> | null = null;

async function fetchConfig(): Promise<PromoBlockConfig> {
  try {
    const res = await fetch('/api/settings/promo-block');
    if (!res.ok) return DEFAULT_PROMO_BLOCK_CONFIG;
    const data = await res.json();
    return { ...DEFAULT_PROMO_BLOCK_CONFIG, ...data };
  } catch {
    return DEFAULT_PROMO_BLOCK_CONFIG;
  }
}

export function usePromoBlockConfig() {
  const [config, setConfig] = useState<PromoBlockConfig>(
    cachedConfig ?? DEFAULT_PROMO_BLOCK_CONFIG
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
export function invalidatePromoBlockConfigCache() {
  cachedConfig = null;
  fetchPromise = null;
}
