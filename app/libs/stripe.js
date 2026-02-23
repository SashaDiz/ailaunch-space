import Stripe from "stripe";

// Lazily initialized Stripe client so build-time env gaps don't crash
let stripeClient = null;

function getStripeClient() {
  if (stripeClient) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Stripe is not configured. Missing STRIPE_SECRET_KEY.");
  }

  // Use default API version from the account to avoid invalid version errors
  stripeClient = new Stripe(secretKey);

  return stripeClient;
}

export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_ID_PREMIUM &&
      process.env.STRIPE_WEBHOOK_SECRET
  );
}

export const paymentPlans = {
  standard: {
    name: "Standard",
    price: 0,
    priceId: null,
    limits: {
      homepage_duration: 30,
      guaranteed_backlinks: 0,
      premium_badge: false,
      skip_queue: false,
      social_promotion: false,
      priority_support: false,
    },
  },
  premium: {
    name: "Premium",
    price: 15,
    priceId: process.env.STRIPE_PRICE_ID_PREMIUM,
    limits: {
      homepage_duration: 7,
      guaranteed_backlinks: 3,
      premium_badge: true,
      skip_queue: true,
      social_promotion: true,
      priority_support: true,
      detailed_analytics: true,
      founder_outreach: true,
    },
  },
};

export async function createStripeCheckoutSession({
  planType,
  customerEmail,
  projectId,
  projectData,
  successUrl,
  cancelUrl,
  userId,
}) {
  const stripe = getStripeClient();
  const plan = paymentPlans[planType];

  if (!plan || plan.price === 0) {
    throw new Error("Invalid plan or free plan selected");
  }

  if (!plan.priceId) {
    throw new Error(`Stripe price ID not configured for ${planType} plan`);
  }

  // Include essential metadata for webhook processing
  const metadata = {
    projectId: projectId,
    planType: planType,
    userId: userId || "", // Required for webhook fallback lookup
  };

  // Add projectSlug if available for additional fallback lookup
  if (projectData?.slug) {
    metadata.projectSlug = projectData.slug;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: plan.priceId, quantity: 1 }],
    customer_email: customerEmail,
    success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    metadata,
    payment_intent_data: { metadata },
  });

  if (!session?.url) {
    throw new Error("No checkout URL returned from Stripe");
  }

  return {
    sessionId: session.id,
    url: session.url,
    amount: plan.price,
    currency: session.currency || "usd",
  };
}

export async function verifyStripeSession(sessionId) {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });

  return {
    success: session.payment_status === "paid",
    session,
    paymentIntent: session.payment_intent,
    metadata: session.metadata || {},
  };
}

export function constructStripeEvent(rawBody, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("Stripe webhook secret not configured");
  }

  const stripe = getStripeClient();

  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}

export const stripeUtils = {
  formatAmount: (amount, currency = "USD") =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount),
};

/**
 * Creates a Stripe coupon and promotion code for streak discount rewards
 * @param {number} percentOff - Percentage discount (e.g., 25 for 25% off)
 * @param {string} userId - User ID for metadata
 * @param {number} rewardTier - Reward tier number (e.g., 25 for 25-day streak)
 * @returns {Promise<{couponId: string, promotionCodeId: string, code: string}>}
 */
export async function createStreakDiscountCode(percentOff, userId, rewardTier) {
  const stripe = getStripeClient();
  
  // Generate a unique code
  const code = `STREAK${rewardTier}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  // Create coupon
  const coupon = await stripe.coupons.create({
    percent_off: percentOff,
    duration: 'once',
    name: `${percentOff}% Off Premium - ${rewardTier} Day Streak`,
    metadata: {
      userId: userId || '',
      rewardTier: rewardTier.toString(),
      rewardType: 'streak_discount',
      source: 'streak_system',
    },
  });
  
  // Create promotion code
  const promotionCode = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: code,
    active: true,
    metadata: {
      userId: userId || '',
      rewardTier: rewardTier.toString(),
      rewardType: 'streak_discount',
      source: 'streak_system',
    },
  });
  
  return {
    couponId: coupon.id,
    promotionCodeId: promotionCode.id,
    code: code,
  };
}

/**
 * Creates a 100% off coupon for free Premium submissions
 * @param {string} userId - User ID for metadata
 * @param {number} rewardTier - Reward tier number
 * @returns {Promise<{couponId: string, promotionCodeId: string, code: string}>}
 */
export async function createFreePremiumCoupon(userId, rewardTier) {
  const stripe = getStripeClient();
  
  // Generate a unique code
  const code = `FREEPREMIUM${rewardTier}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  // Get the premium plan price ID to calculate 100% off amount
  const premiumPriceId = process.env.STRIPE_PRICE_ID_PREMIUM;
  if (!premiumPriceId) {
    throw new Error("STRIPE_PRICE_ID_PREMIUM not configured");
  }
  
  // Fetch the price to get the amount
  const price = await stripe.prices.retrieve(premiumPriceId);
  
  // Create 100% off coupon using amount_off for precision
  const coupon = await stripe.coupons.create({
    amount_off: price.unit_amount,
    currency: price.currency,
    duration: 'once',
    name: `Free Premium - ${rewardTier} Day Streak`,
    metadata: {
      userId: userId || '',
      rewardTier: rewardTier.toString(),
      rewardType: 'free_premium',
      source: 'streak_system',
    },
  });
  
  // Create promotion code
  const promotionCode = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: code,
    active: true,
    metadata: {
      userId: userId || '',
      rewardTier: rewardTier.toString(),
      rewardType: 'free_premium',
      source: 'streak_system',
    },
  });
  
  return {
    couponId: coupon.id,
    promotionCodeId: promotionCode.id,
    code: code,
  };
}

export default {
  paymentPlans,
  createStripeCheckoutSession,
  verifyStripeSession,
  constructStripeEvent,
  stripeUtils,
  isStripeConfigured,
  createStreakDiscountCode,
  createFreePremiumCoupon,
};
