import type { MarketingConfig } from '@/types/config';

/**
 * Marketing Configuration
 *
 * Ad banners, promo blocks, and other marketing components.
 * Set adBanner.enabled to false to hide the banner entirely.
 */
export const marketingConfig: MarketingConfig = {
  /** Top ad banner below header (horizontal, configurable) */
  adBanner: {
    enabled: false,
    /** Main descriptive text */
    text: 'Promote your AI tool to thousands of indie founders and builders.',
    /** CTA button text */
    buttonText: 'Become a sponsor',
    /** CTA button URL (internal links don't get rel="noopener noreferrer") */
    buttonLink: '/sponsor',
    /** Brand icon path */
    iconSrc: '/assets/logo.svg',
    /** Alt text for the icon */
    iconAlt: 'AI Launch Space',
  },
};
