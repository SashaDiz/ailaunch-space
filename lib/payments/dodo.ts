/**
 * Dodo Payments provider (Merchant of Record).
 *
 * Single payment provider for the platform. Handles:
 *   - one-time premium project submissions
 *   - recurring sponsor (partner) subscriptions
 *   - recurring promotion placement subscriptions
 *
 * Checkout is created via Dodo Checkout Sessions; entitlements are granted by
 * the webhook at `app/api/webhooks/dodo/route.ts`. Metadata set at checkout
 * (including the entity id) rides through to the payment/subscription webhook
 * so the handler can resolve what to activate.
 */
import DodoPayments from "dodopayments";

// Re-export so callers can import the plan map from the provider module.
import { paymentPlans } from "@/config/plans.config";
export { paymentPlans };

/** Thrown when an incoming webhook fails signature verification. */
export class DodoWebhookVerificationError extends Error {
  constructor(message = "Webhook signature verification failed") {
    super(message);
    this.name = "DodoWebhookVerificationError";
  }
}

// ─── Client ────────────────────────────────────────────────────────────────

let dodoClient: DodoPayments | null = null;

function getDodoClient(): DodoPayments {
  if (dodoClient) return dodoClient;

  const bearerToken = process.env.DODO_PAYMENTS_API_KEY;
  if (!bearerToken) {
    throw new Error("Dodo Payments is not configured. Missing DODO_PAYMENTS_API_KEY.");
  }

  // 'test_mode' for sandbox, 'live_mode' for production (default).
  const environment =
    (process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode") || "live_mode";

  dodoClient = new DodoPayments({
    bearerToken,
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,
    environment,
  });
  return dodoClient;
}

export function isDodoConfigured(): boolean {
  return Boolean(
    process.env.DODO_PAYMENTS_API_KEY &&
      process.env.DODO_PRODUCT_ID_PREMIUM &&
      process.env.DODO_PAYMENTS_WEBHOOK_KEY
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Dodo metadata must be `Record<string, string>` — coerce/skip non-strings. */
function toDodoMetadata(input: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === null || v === undefined) continue;
    out[k] = typeof v === "string" ? v : String(v);
  }
  return out;
}

// ─── Public API ──────────────────────────────────────────────────────────

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
  amount?: number;
  currency: string;
}

/**
 * Create a one-time checkout for a premium project submission.
 */
export async function createPremiumCheckoutSession(args: {
  planType: string;
  customerEmail: string;
  projectId: string;
  projectData?: { slug?: string; name?: string; description?: string; website_url?: string };
  successUrl: string;
  cancelUrl: string;
  userId?: string;
}): Promise<CheckoutSessionResult> {
  const client = getDodoClient();
  const plan = paymentPlans[args.planType];

  if (!plan || plan.price === 0) {
    throw new Error("Invalid plan or free plan selected");
  }
  if (!plan.priceId) {
    throw new Error(`Dodo product ID not configured for ${args.planType} plan`);
  }

  const metadata = toDodoMetadata({
    type: "premium_submission",
    projectId: args.projectId,
    planType: args.planType,
    userId: args.userId ?? "",
    ...(args.projectData?.slug && { projectSlug: args.projectData.slug }),
  });

  const session = await client.checkoutSessions.create({
    product_cart: [{ product_id: plan.priceId, quantity: 1 }],
    customer: { email: args.customerEmail },
    return_url: args.successUrl,
    metadata,
  });

  if (!session?.checkout_url) {
    throw new Error("No checkout URL returned from Dodo Payments");
  }

  return {
    sessionId: session.session_id,
    url: session.checkout_url,
    amount: plan.price,
    currency: "usd",
  };
}

/**
 * Create a subscription checkout for a sponsor (partner) placement.
 * The `partnerId` is carried in metadata so the subscription webhook can
 * resolve the partner row without relying on the checkout session id.
 */
export async function createPartnerCheckoutSession(args: {
  priceId: string;
  customerEmail: string;
  partnerData?: { id?: string; name?: string; logo?: string; description?: string };
  successUrl: string;
  cancelUrl: string;
  userId?: string;
}): Promise<CheckoutSessionResult> {
  const client = getDodoClient();

  if (!args.priceId) {
    throw new Error("Dodo product ID is required for the sponsor subscription");
  }

  const metadata = toDodoMetadata({
    type: "partner_subscription",
    userId: args.userId ?? "",
    partnerId: args.partnerData?.id ?? "",
    ...(args.partnerData?.name && { partnerName: args.partnerData.name }),
    ...(args.partnerData?.logo && { partnerLogo: args.partnerData.logo }),
  });

  const session = await client.checkoutSessions.create({
    product_cart: [{ product_id: args.priceId, quantity: 1 }],
    customer: { email: args.customerEmail },
    return_url: args.successUrl,
    metadata,
  });

  if (!session?.checkout_url) {
    throw new Error("No checkout URL returned from Dodo Payments");
  }

  return {
    sessionId: session.session_id,
    url: session.checkout_url,
    currency: "usd",
  };
}

/**
 * Create a subscription checkout for one or more promotion placements
 * (banner / catalog / detail). `lineItems` keeps the historical
 * `{ price, quantity? }[]` shape but maps to Dodo's product cart. When the
 * all-three bundle is selected, a `discount_code` is applied.
 */
export async function createPromotionCheckoutSession(args: {
  lineItems: Array<{ price: string; quantity?: number }>;
  customerEmail: string;
  promotionData?: {
    id?: string;
    name?: string;
    placementBanner?: boolean;
    placementCatalog?: boolean;
    placementDetailPage?: boolean;
  };
  successUrl: string;
  cancelUrl: string;
  userId?: string;
  /** Dodo discount code (optional) — applied to the checkout */
  couponId?: string | null;
}): Promise<CheckoutSessionResult> {
  const client = getDodoClient();

  if (!args.lineItems || args.lineItems.length === 0) {
    throw new Error("At least one placement type must be selected");
  }

  const productCart = args.lineItems.map((li) => ({
    product_id: li.price,
    quantity: li.quantity ?? 1,
  }));

  const metadata = toDodoMetadata({
    type: "promotion_subscription",
    userId: args.userId ?? "",
    promotionId: args.promotionData?.id ?? "",
    promotionName: args.promotionData?.name ?? "",
    placementBanner: args.promotionData?.placementBanner ? "true" : "false",
    placementCatalog: args.promotionData?.placementCatalog ? "true" : "false",
    placementDetailPage: args.promotionData?.placementDetailPage ? "true" : "false",
  });

  const session = await client.checkoutSessions.create({
    product_cart: productCart,
    customer: { email: args.customerEmail },
    return_url: args.successUrl,
    metadata,
    ...(args.couponId && { discount_code: args.couponId }),
  });

  if (!session?.checkout_url) {
    throw new Error("No checkout URL returned from Dodo Payments");
  }

  return {
    sessionId: session.session_id,
    url: session.checkout_url,
    currency: "usd",
  };
}

/**
 * Verify a checkout after redirect (best-effort reconciliation path).
 * The webhook is the primary confirmation mechanism; this is only used by the
 * admin recovery routine and the user self-heal fallback.
 */
export async function verifyDodoSession(sessionId: string) {
  const client = getDodoClient();
  const session = await client.checkoutSessions.retrieve(sessionId);

  // Dodo IntentStatus for the payment created by the checkout session.
  const success = session?.payment_status === "succeeded";

  return {
    success,
    // Normalized so callers can read amount/currency/customer/order id.
    session: {
      orderId: session?.payment_id ?? null,
      id: session?.id,
      customer: { email: session?.customer_email ?? undefined },
      // Amount/currency are not exposed on the session status; callers fall back.
      totalAmount: undefined as number | undefined,
      currency: undefined as string | undefined,
      status: session?.payment_status,
    },
    paymentIntent: null,
    metadata: {} as Record<string, string>,
  };
}

/**
 * Validate a Dodo webhook event (Standard Webhooks scheme).
 * Throws `DodoWebhookVerificationError` on signature mismatch.
 */
export function constructDodoEvent(
  rawBody: string | Buffer,
  headers: Record<string, string | string[] | undefined>
): { type: string; data: any } {
  if (!process.env.DODO_PAYMENTS_WEBHOOK_KEY) {
    throw new Error("Dodo webhook secret not configured");
  }
  const client = getDodoClient();
  const body = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");

  // Collapse header arrays to single strings for the verifier.
  const normalizedHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    normalizedHeaders[key] = Array.isArray(value) ? value.join(", ") : value;
  }

  try {
    return client.webhooks.unwrap(body, { headers: normalizedHeaders }) as {
      type: string;
      data: any;
    };
  } catch (err) {
    throw new DodoWebhookVerificationError(
      err instanceof Error ? err.message : undefined
    );
  }
}

/**
 * Fetch successful payments from Dodo for revenue reporting.
 * Returns an array with `amount` (cents) and `created` (unix seconds).
 */
export async function getDodoRevenue(startDate?: Date) {
  const client = getDodoClient();
  const payments: Array<{
    id: string;
    amount: number;
    created: number;
    paid: boolean;
    refunded: boolean;
  }> = [];

  try {
    for await (const payment of client.payments.list({})) {
      const createdMs = new Date(payment.created_at).getTime();
      if (startDate && createdMs < startDate.getTime()) continue;
      const refunded = payment.refund_status === "full" || payment.refund_status === "partial";
      payments.push({
        id: payment.payment_id,
        amount: payment.total_amount,
        created: Math.floor(createdMs / 1000),
        paid: payment.status === "succeeded" && !refunded,
        refunded,
      });
    }
  } catch (err) {
    console.warn("Failed to list Dodo payments for revenue stats:", err);
    return [];
  }

  return payments;
}

export const dodoUtils = {
  formatAmount: (amount: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount),
};

const dodoApi = {
  paymentPlans,
  createPremiumCheckoutSession,
  createPartnerCheckoutSession,
  createPromotionCheckoutSession,
  verifyDodoSession,
  constructDodoEvent,
  dodoUtils,
  isDodoConfigured,
  getDodoRevenue,
};

export default dodoApi;
