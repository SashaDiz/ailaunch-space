/**
 * Advertising & Sponsorship Configuration
 *
 * Centralized settings for sponsors and paid promotion placements.
 * Polar product IDs must be created in the Polar Dashboard and set via env vars.
 */
export const advertisingConfig = {
  sponsors: {
    /** Maximum number of active sponsors displayed */
    maxSponsors: 8,
    /** Polar recurring product ID for sponsor subscription */
    priceId: process.env.POLAR_PRODUCT_ID_PARTNER_SUBSCRIPTION || null,
  },
  promotions: {
    /** Maximum characters for custom CTA button text */
    ctaMaxLength: 20,
    /** Default CTA text when none provided (use {name} as placeholder) */
    ctaDefault: 'Visit {name}',
    /** Discount when all three placements are selected (0.3 = 30%) */
    allThreeDiscountPercent: 0.3,
    /** Polar discount ID to apply when all three placements are selected */
    allThreeDiscountCouponId: process.env.POLAR_DISCOUNT_ID_PROMO_ALL_THREE || null,
    /** Minimum placement price (used for "starts at" on pricing page) */
    minPricePerMonth: 9,
    placements: {
      banner: {
        id: 'banner',
        name: 'Top Banner Ad',
        description: 'Horizontal banner below the site header on every page',
        pricePerMonth: 69,
        priceId: process.env.POLAR_PRODUCT_ID_PROMO_BANNER || null,
        maxActive: 1,
      },
      catalog: {
        id: 'catalog',
        name: 'Catalog Ad Card',
        description: 'Promoted card mixed into the project catalog grid',
        pricePerMonth: 39,
        priceId: process.env.POLAR_PRODUCT_ID_PROMO_CATALOG || null,
        maxActive: 2,
      },
      detailPage: {
        id: 'detail_page',
        name: 'Project Page Ad Card',
        description: 'Promoted card in the sidebar of project detail pages',
        pricePerMonth: 9,
        priceId: process.env.POLAR_PRODUCT_ID_PROMO_DETAIL || null,
        maxActive: 2,
      },
    },
  },
};
