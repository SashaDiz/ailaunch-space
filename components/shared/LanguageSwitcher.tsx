"use client";

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { i18nConfig, type Locale } from '@/config/i18n.config';
import { isEnabled } from '@/lib/features';

const localeNames: Record<string, string> = {
  en: 'English',
  es: 'Espanol',
  fr: 'Francais',
  de: 'Deutsch',
  pt: 'Portugues',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
};

function getLocaleFromCookie(): string {
  if (typeof document === 'undefined') return i18nConfig.defaultLocale;
  const match = document.cookie.match(new RegExp(`(?:^|; )${i18nConfig.localeCookie}=([^;]*)`));
  return match?.[1] || i18nConfig.defaultLocale;
}

export function LanguageSwitcher() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [locale, setLocale] = useState<string>(i18nConfig.defaultLocale);

  useEffect(() => {
    setLocale(getLocaleFromCookie());
  }, []);

  // Don't render when i18n feature flag is disabled, when i18n config is off,
  // or when there is only one locale configured
  if (!isEnabled('i18n') || !i18nConfig.enabled || i18nConfig.locales.length <= 1) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value as Locale;
    // Persist the new locale to the cookie
    document.cookie = `${i18nConfig.localeCookie}=${newLocale};path=/;max-age=31536000;samesite=lax`;
    setLocale(newLocale);
    // Use router.refresh() to trigger a server-side re-render with the new
    // locale cookie, avoiding a full browser reload
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <select
      value={locale}
      onChange={handleChange}
      disabled={isPending}
      className="h-9 rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      aria-label="Select language"
    >
      {i18nConfig.locales.map((loc) => (
        <option key={loc} value={loc}>
          {localeNames[loc] || loc.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
