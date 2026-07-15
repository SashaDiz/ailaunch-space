import type { PromoBlockConfig } from '@/types/config';

/**
 * Promo Block — a configurable advertising banner + popup shown on the homepage,
 * dashboard and project pages.
 *
 * There is intentionally NO hardcoded content here. The block is disabled by
 * default and every field is empty; an admin fills it in from the Admin →
 * Advertising → Promo Block editor, and the values are stored in the
 * `site_settings` table (key `promo_block`). Until it is enabled and given
 * content, nothing renders on the site.
 */
export const DEFAULT_PROMO_BLOCK_CONFIG: PromoBlockConfig = {
  enabled: false,
  title: '',
  imageUrl: '',
  description: '',
  benefits: [],
  ctaText: '',
  ctaUrl: '',
  price: '',
  learnMoreUrl: '',
  learnMoreText: '',
  dismissText: '',
  triggerButtonText: '',
  triggerButtonIcon: 'none',
  ctaButtonIcon: 'none',
  dashboardCtaText: '',
  projectDetailHeading: '',
  projectDetailDescription: '',
  projectDetailCtaText: '',
  projectDetailDismissText: '',
};
