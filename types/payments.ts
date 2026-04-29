// ─── Payment Adapter Types ───────────────────────────────────────────────────
// These types define the interface for payment providers (Stripe, Lemon, Paddle).
// Each provider implements the PaymentAdapter interface.

/** Parameters for creating a checkout session */
export interface CheckoutParams {
  /** Plan ID from plans.config.ts */
  planId: string;
  /** Customer email address */
  customerEmail: string;
  /** Project being purchased (if applicable) */
  projectId?: string;
  /** User ID for metadata */
  userId: string;
  /** Redirect URL after successful payment */
  successUrl: string;
  /** Redirect URL on cancellation */
  cancelUrl: string;
  /** Additional metadata to attach to the payment */
  metadata?: Record<string, string>;
}

/** Result from creating a checkout session */
export interface CheckoutResult {
  /** Redirect URL for the checkout page */
  url: string;
  /** Provider-specific session ID */
  sessionId: string;
  /** Payment amount */
  amount?: number;
  /** Currency code */
  currency?: string;
}

/** Parsed webhook event from payment provider */
export interface WebhookEvent {
  /** Event type (e.g. "payment.completed", "subscription.created") */
  type: string;
  /** Provider-specific event data */
  data: Record<string, unknown>;
}

/** Payment status check result */
export interface PaymentStatusResult {
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  amount: number;
  currency: string;
}

/** Coupon/discount creation parameters */
export interface CreateCouponParams {
  /** Percentage discount (1-100) */
  percentOff: number;
  /** User ID for tracking */
  userId: string;
  /** Additional metadata */
  metadata?: Record<string, string>;
}

/** Created coupon result */
export interface CouponResult {
  /** Coupon/promotion code */
  code: string;
  /** Provider-specific coupon ID */
  couponId: string;
}

/**
 * Payment provider adapter interface.
 * Implement this interface for each payment provider (Stripe, LemonSqueezy, Paddle).
 */
export interface PaymentAdapter {
  /** Create a checkout session and return the redirect URL */
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;

  /** Verify and parse an incoming webhook request */
  verifyWebhook(request: Request): Promise<WebhookEvent>;

  /** Check the status of a payment by session ID */
  getPaymentStatus(sessionId: string): Promise<PaymentStatusResult>;

  /** Create a discount coupon/promotion code */
  createCoupon?(params: CreateCouponParams): Promise<CouponResult>;
}
