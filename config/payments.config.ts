import type { PaymentsConfig } from '@/types/config';

/**
 * Payment Provider Configuration
 *
 * Active provider: Dodo Payments (Merchant of Record).
 * Required env vars:
 *   DODO_PAYMENTS_API_KEY, DODO_PAYMENTS_WEBHOOK_KEY, DODO_PRODUCT_ID_PREMIUM
 * Optional:
 *   DODO_PAYMENTS_ENVIRONMENT  — 'test_mode' for sandbox (default 'live_mode')
 *   DODO_PRODUCT_ID_PARTNER_SUBSCRIPTION
 *   DODO_PRODUCT_ID_PROMO_BANNER / _CATALOG / _DETAIL
 *   DODO_DISCOUNT_CODE_PROMO_ALL_THREE
 */
export const paymentsConfig: PaymentsConfig = {
  provider: 'dodo',
  testMode: false,
};
