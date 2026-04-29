import type { AutoSubmitBannerConfig } from '@/types/config';
import { siteConfig } from '@/config/site.config';

export const DEFAULT_AUTOSUBMIT_CONFIG: AutoSubmitBannerConfig = {
  enabled: true,
  title: 'Submit your product to 100+ directories with ListingBott',
  description:
    'Boost your Domain Rating for 15+ and get more mentions and long-term SEO gains.',
  benefits: [
    'Save 60+ hours of manual work',
    'Boost Domain Rating (DR +15 guaranteed)',
    'Get up to 20% of traffic from directories',
    'Manual, human-paced submissions (99.9% safe)',
    'Backlinks from a 10,000+ directory database',
    'Detailed report with full listing ownership',
    'Delivered in 1 month with weekly updates',
    'Long-term SEO gains and higher rankings',
  ],
  ctaText: 'Submit with ListingBott ($499)',
  checkoutUrl: 'https://buy.stripe.com/5kA8zCfZc9SeafC7ss',
  price: '$499',
  learnMoreUrl: `https://listingbott.com/?ref=${siteConfig.refParameter}`,
  learnMoreText: 'Learn more about ListingBott',
  dismissText: "No, I'll do it myself.",
  dashboardCtaText: 'Submit to 100+ directories',
  projectDetailHeading: 'Max out your visibility with Auto-Submit',
  projectDetailDescription:
    'Submit your project to 100+ hand-picked directories in one click and boost your Domain Rating with ListingBott.',
  projectDetailCtaText: 'Auto-submit to 100+ directories',
  projectDetailDismissText: 'No thanks',
};
