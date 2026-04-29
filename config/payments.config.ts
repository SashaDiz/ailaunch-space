import type { PaymentsConfig } from '@/types/config';

/**
 * Payment Provider Configuration
 *
 * Active provider: Polar.sh (Merchant of Record).
 * Required env vars:
 *   POLAR_ACCESS_TOKEN, POLAR_WEBHOOK_SECRET, POLAR_PRODUCT_ID_PREMIUM
 * Optional:
 *   POLAR_ORGANIZATION_ID    — needed for revenue stats in admin
 *   POLAR_SERVER             — 'sandbox' for test mode (default 'production')
 *   POLAR_PRODUCT_ID_PARTNER_SUBSCRIPTION
 *   POLAR_PRODUCT_ID_PROMO_BANNER / _CATALOG / _DETAIL
 *   POLAR_DISCOUNT_ID_PROMO_ALL_THREE
 */
export const paymentsConfig: PaymentsConfig = {
  provider: 'polar',
  testMode: false,
};
