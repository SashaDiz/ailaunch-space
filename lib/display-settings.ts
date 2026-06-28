/**
 * Site-wide display/layout settings — which visual elements (logo, image) appear
 * on directory cards and the item detail page. Configured by the admin in the
 * "Design" panel and persisted in `site_settings` under the key `"layout"`.
 *
 * Mirrors the theme settings architecture (public GET, admin PUT, server-seeded
 * provider). The card cover image reuses `screenshots[0]` — there is no separate
 * media column.
 */

export type ElementToggles = {
  /** Show the project logo. */
  showLogo: boolean;
  /** Show the cover image (first screenshot). */
  showImage: boolean;
};

export type DisplaySettings = {
  /** Directory cards in the catalog (home, categories, listings). */
  card: ElementToggles;
  /** The project/item detail page. */
  detail: ElementToggles;
};

/** Defaults preserve the current look: logo on, image off. */
export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  card: { showLogo: true, showImage: false },
  detail: { showLogo: true, showImage: false },
};

/** The `site_settings` key under which display settings are stored. */
export const DISPLAY_SETTINGS_KEY = "layout";

/** Window event dispatched after an admin saves, so providers re-apply live. */
export const DISPLAY_SETTINGS_EVENT = "display-settings-updated";

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/** Fill any missing/invalid fields from an untrusted source with defaults. */
export function normalizeDisplaySettings(raw: unknown): DisplaySettings {
  const v = (raw ?? {}) as Partial<{
    card: Partial<ElementToggles>;
    detail: Partial<ElementToggles>;
  }>;
  return {
    card: {
      showLogo: asBool(v.card?.showLogo, DEFAULT_DISPLAY_SETTINGS.card.showLogo),
      showImage: asBool(v.card?.showImage, DEFAULT_DISPLAY_SETTINGS.card.showImage),
    },
    detail: {
      showLogo: asBool(v.detail?.showLogo, DEFAULT_DISPLAY_SETTINGS.detail.showLogo),
      showImage: asBool(v.detail?.showImage, DEFAULT_DISPLAY_SETTINGS.detail.showImage),
    },
  };
}

/** Whether the submission form needs to collect a logo. */
export function isLogoUsed(s: DisplaySettings): boolean {
  return s.card.showLogo || s.detail.showLogo;
}

/** Whether the submission form needs to collect an image (screenshot). */
export function isImageUsed(s: DisplaySettings): boolean {
  return s.card.showImage || s.detail.showImage;
}
