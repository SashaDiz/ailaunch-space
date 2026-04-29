/**
 * Polar.sh payment provider.
 *
 * Replaces the previous Stripe integration. Public API surface is kept
 * compatible with the original `lib/payments/stripe.ts` module
 * (`createStripeCheckoutSession`, `createStripeSubscriptionCheckoutSession`,
 * `createPromotionCheckoutSession`, `verifyStripeSession`,
 * `constructStripeEvent`, `getStripeRevenue`, `isStripeConfigured`,
 * `paymentPlans`, `stripeUtils`) so existing callers don't need to change
 * shape — they just import the new symbols.
 */
import { Polar } from "@polar-sh/sdk";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";

// Re-export so callers that did `import { paymentPlans } from '...stripe'` still work.
import { paymentPlans } from "@/config/plans.config";
export { paymentPlans, WebhookVerificationError };

// ─── Client ────────────────────────────────────────────────────────────────

let polarClient: Polar | null = null;

function getPolarClient(): Polar {
  if (polarClient) return polarClient;

  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Polar is not configured. Missing POLAR_ACCESS_TOKEN.");
  }

  // POLAR_SERVER can be 'sandbox' for test mode (defaults to 'production').
  const server = (process.env.POLAR_SERVER as "production" | "sandbox") || "production";

  polarClient = new Polar({ accessToken, server });
  return polarClient;
}

export function isPolarConfigured(): boolean {
  return Boolean(
    process.env.POLAR_ACCESS_TOKEN &&
      process.env.POLAR_PRODUCT_ID_PREMIUM &&
      process.env.POLAR_WEBHOOK_SECRET
  );
}

/** Backwards-compat alias — callers still type `isStripeConfigured`. */
export const isStripeConfigured = isPolarConfigured;

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Polar metadata must be `Record<string, string>` — coerce/skip non-strings. */
function toPolarMetadata(input: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === null || v === undefined) continue;
    out[k] = typeof v === "string" ? v : String(v);
  }
  return out;
}

function appendCheckoutIdParam(url: string): string {
  // Polar substitutes {CHECKOUT_ID} on redirect.
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}checkout_id={CHECKOUT_ID}`;
}

// ─── Public API (Stripe-named for compat) ─────────────────────────────────

interface CheckoutSessionResult {
  sessionId: string;
  url: string;
  amount?: number;
  currency: string;
}

/**
 * Create a one-time checkout (e.g. premium project submission).
 * Mirrors the Stripe wrapper signature.
 */
export async function createStripeCheckoutSession(args: {
  planType: string;
  customerEmail: string;
  projectId: string;
  projectData?: { slug?: string; name?: string; description?: string; website_url?: string };
  successUrl: string;
  cancelUrl: string;
  userId?: string;
}): Promise<CheckoutSessionResult> {
  const polar = getPolarClient();
  const plan = paymentPlans[args.planType];

  if (!plan || plan.price === 0) {
    throw new Error("Invalid plan or free plan selected");
  }
  if (!plan.priceId) {
    throw new Error(`Polar product ID not configured for ${args.planType} plan`);
  }

  const metadata = toPolarMetadata({
    type: "premium_submission",
    projectId: args.projectId,
    planType: args.planType,
    userId: args.userId ?? "",
    ...(args.projectData?.slug && { projectSlug: args.projectData.slug }),
  });

  const checkout = await polar.checkouts.create({
    products: [plan.priceId],
    customerEmail: args.customerEmail,
    successUrl: appendCheckoutIdParam(args.successUrl),
    metadata,
  });

  if (!checkout?.url) {
    throw new Error("No checkout URL returned from Polar");
  }

  return {
    sessionId: checkout.id,
    url: checkout.url,
    amount: plan.price,
    currency: "usd",
  };
}

/**
 * Create a subscription checkout (e.g. partner monthly plan).
 * For Polar this is the same flow — recurring vs one-time is set by the product itself.
 */
export async function createStripeSubscriptionCheckoutSession(args: {
  priceId: string;
  customerEmail: string;
  partnerData?: { name?: string; logo?: string; description?: string };
  successUrl: string;
  cancelUrl: string;
  userId?: string;
}): Promise<CheckoutSessionResult> {
  const polar = getPolarClient();

  if (!args.priceId) {
    throw new Error("Polar product ID is required for subscription");
  }

  const metadata = toPolarMetadata({
    type: "partner_subscription",
    userId: args.userId ?? "",
    ...(args.partnerData?.name && { partnerName: args.partnerData.name }),
    ...(args.partnerData?.logo && { partnerLogo: args.partnerData.logo }),
  });

  const checkout = await polar.checkouts.create({
    products: [args.priceId],
    customerEmail: args.customerEmail,
    successUrl: appendCheckoutIdParam(args.successUrl),
    metadata,
  });

  if (!checkout?.url) {
    throw new Error("No checkout URL returned from Polar");
  }

  return {
    sessionId: checkout.id,
    url: checkout.url,
    currency: "usd",
  };
}

/**
 * Create a multi-product subscription checkout for paid promotion placements
 * (banner / catalog / detail).
 *
 * `lineItems` keeps the Stripe shape `{ price: string; quantity?: number }[]`
 * but we collapse it to Polar's `products: string[]`. Quantity is not a Polar
 * concept the same way — each placement is its own product.
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
  /** Polar discount ID (optional) — applied to the checkout */
  couponId?: string;
}): Promise<CheckoutSessionResult> {
  const polar = getPolarClient();

  if (!args.lineItems || args.lineItems.length === 0) {
    throw new Error("At least one placement type must be selected");
  }

  const products = args.lineItems.map((li) => li.price);

  const metadata = toPolarMetadata({
    type: "promotion_subscription",
    userId: args.userId ?? "",
    promotionId: args.promotionData?.id ?? "",
    promotionName: args.promotionData?.name ?? "",
    placementBanner: args.promotionData?.placementBanner ? "true" : "false",
    placementCatalog: args.promotionData?.placementCatalog ? "true" : "false",
    placementDetailPage: args.promotionData?.placementDetailPage ? "true" : "false",
  });

  const checkout = await polar.checkouts.create({
    products,
    customerEmail: args.customerEmail,
    successUrl: appendCheckoutIdParam(args.successUrl),
    metadata,
    ...(args.couponId && { discountId: args.couponId }),
  });

  if (!checkout?.url) {
    throw new Error("No checkout URL returned from Polar");
  }

  return {
    sessionId: checkout.id,
    url: checkout.url,
    currency: "usd",
  };
}

/**
 * Verify a checkout after redirect.
 * Returns `success: true` once the checkout has been confirmed (paid).
 */
export async function verifyStripeSession(checkoutId: string) {
  const polar = getPolarClient();
  const checkout = await polar.checkouts.get({ id: checkoutId });

  // Polar checkout statuses: 'open' | 'expired' | 'confirmed' | 'succeeded' | 'failed'
  const success =
    checkout.status === "succeeded" || checkout.status === "confirmed";

  return {
    success,
    session: checkout,
    paymentIntent: null, // Polar exposes orders separately; not needed for the verify flow.
    metadata: checkout.metadata ?? {},
  };
}

/**
 * Validate a Polar webhook event.
 * Throws `WebhookVerificationError` on signature mismatch.
 */
export function constructStripeEvent(rawBody: string | Buffer, headers: Record<string, string | string[] | undefined>) {
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("Polar webhook secret not configured");
  }
  const body = typeof rawBody === "string" ? Buffer.from(rawBody) : rawBody;
  // Polar's validateEvent expects Record<string, string>; collapse arrays.
  const normalizedHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    normalizedHeaders[key] = Array.isArray(value) ? value.join(", ") : value;
  }
  return validateEvent(body, normalizedHeaders, webhookSecret);
}

/**
 * Fetch successful orders from Polar for revenue reporting.
 * Returns an array of orders with `amount` (cents) and `createdAt` ISO string.
 */
export async function getStripeRevenue(startDate?: Date) {
  const polar = getPolarClient();
  const organizationId = process.env.POLAR_ORGANIZATION_ID;

  if (!organizationId) {
    console.warn("POLAR_ORGANIZATION_ID not set — revenue stats unavailable");
    return [] as Array<{ id: string; amount: number; created: number; paid: boolean; refunded: boolean }>;
  }

  const orders: Array<{ id: string; amount: number; created: number; paid: boolean; refunded: boolean }> = [];

  const result = await polar.orders.list({ organizationId });
  for await (const page of result) {
    for (const order of page.result.items) {
      const createdMs = new Date(order.createdAt).getTime();
      if (startDate && createdMs < startDate.getTime()) continue;
      const refunded = (order.refundedAmount ?? 0) > 0;
      orders.push({
        id: order.id,
        amount: order.totalAmount,
        created: Math.floor(createdMs / 1000),
        paid: !refunded,
        refunded,
      });
    }
  }

  return orders;
}

export const stripeUtils = {
  formatAmount: (amount: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount),
};

const polarApi = {
  paymentPlans,
  createStripeCheckoutSession,
  createStripeSubscriptionCheckoutSession,
  createPromotionCheckoutSession,
  verifyStripeSession,
  constructStripeEvent,
  stripeUtils,
  isStripeConfigured,
  getStripeRevenue,
};

export default polarApi;
