/**
 * Advertising Configuration
 *
 * One product: pay once, hold a fixed spot for `durationDays`, no renewal.
 * Each placement is a one-time product in the Dodo Payments dashboard; a
 * subscription product here would charge the customer but never activate
 * the ad, because activation listens for `payment.succeeded`.
 */
export const advertisingConfig = {
  promotions: {
    /** Days a paid spot stays live */
    durationDays: 30,
    /** Days before the end to send the "your spot is ending" email */
    reminderDaysBefore: 3,
    /** Minutes an unpaid checkout holds its spot */
    checkoutHoldMinutes: 30,
    /** Maximum characters for custom CTA button text */
    ctaMaxLength: 20,
    /** Default CTA text when none provided (use {name} as placeholder) */
    ctaDefault: 'Visit {name}',
    /** Discount when every placement is selected (0.3 = 30%) */
    bundleDiscountPercent: 0.3,
    /** Dodo discount code applied when every placement is selected */
    bundleDiscountCode: process.env.DODO_DISCOUNT_CODE_AD_BUNDLE || null,
    placements: {
      banner: {
        id: 'banner',
        /** `promotions` column that marks this placement */
        column: 'placement_banner',
        name: 'Top Banner',
        description: 'Full-width banner below the site header on every page',
        price: 69,
        priceId: process.env.DODO_PRODUCT_ID_AD_BANNER || null,
        maxActive: 1,
      },
      rail: {
        id: 'rail',
        // The column predates the rails: these ads used to sit in the catalog grid.
        column: 'placement_catalog',
        name: 'Side Rail Card',
        description: 'Card in the side columns on desktop, scrolling bar on mobile',
        price: 39,
        priceId: process.env.DODO_PRODUCT_ID_AD_RAIL || null,
        maxActive: 6,
      },
      logo: {
        id: 'logo',
        column: 'placement_logo',
        name: 'Homepage Logo',
        description: 'Your logo in the sponsors row on the homepage',
        price: 29,
        priceId: process.env.DODO_PRODUCT_ID_AD_LOGO || null,
        maxActive: 8,
      },
      detailPage: {
        id: 'detail_page',
        column: 'placement_detail_page',
        name: 'Project Page Card',
        description: 'Card in the sidebar of project pages',
        price: 9,
        priceId: process.env.DODO_PRODUCT_ID_AD_DETAIL || null,
        maxActive: 2,
      },
    },
  },
};

export type PlacementKey = keyof typeof advertisingConfig.promotions.placements;

export const placementKeys = Object.keys(
  advertisingConfig.promotions.placements
) as PlacementKey[];

/** Cheapest placement, for "from $X" labels. */
export const minPlacementPrice = Math.min(
  ...placementKeys.map((key) => advertisingConfig.promotions.placements[key].price)
);
