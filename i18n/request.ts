import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { i18nConfig } from '@/config/i18n.config';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Resolve locale from cookie when using "without [locale] segment" approach
  if (!locale) {
    try {
      const cookieStore = await cookies();
      locale = cookieStore.get(i18nConfig.localeCookie)?.value;
    } catch {
      // cookies() may not be available in all contexts
    }
  }

  // Validate locale against configured list, fallback to default
  if (!locale || !i18nConfig.locales.includes(locale as any)) {
    locale = i18nConfig.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
