/**
 * Internationalization Configuration
 *
 * Active. Default and currently the only shipped locale is `en`. The
 * next-intl + middleware plumbing is live so adding a new locale is a
 * three-step task:
 *   1. Add the code to `locales` (e.g. 'ru').
 *   2. Copy `messages/en.json` → `messages/ru.json` and translate it.
 *   3. (Optional) Add a language switcher in the header — see
 *      `components/shared/LanguageSwitcher.tsx`.
 */
export const i18nConfig = {
  /** Master switch — controls cookie persistence + locale detection */
  enabled: true,

  /** Default locale used as fallback */
  defaultLocale: 'en' as const,

  /** Supported locales — add codes as you create translation files */
  locales: ['en'] as const,

  /** Cookie name for persisting user's locale preference */
  localeCookie: 'NEXT_LOCALE',

  /** Auto-detect locale from Accept-Language header */
  localeDetection: true,
};

export type Locale = (typeof i18nConfig.locales)[number];
