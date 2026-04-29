import type { PlansConfig } from '@/types/config';

/**
 * Pricing Plans
 *
 * Define your submission plans here. You can have any number of plans.
 * The `priceId` must match your payment provider's price/product ID.
 *
 * To add a new plan:
 * 1. Create a price in your Stripe/Lemon/Paddle dashboard
 * 2. Add the plan object below with the price ID
 * 3. The rest of the app auto-adapts (pricing page, submit flow, etc.)
 */
export const plansConfig: PlansConfig = {
  currency: 'USD',

  plans: [
    {
      id: 'standard',
      name: 'Standard',
      price: 0,
      type: 'free',
      description: 'Free listing with basic features',
      priceId: null,
      cta: 'Get Started Free',
      features: {
        homepage_duration: 30,
        guaranteed_backlinks: 0,
        premium_badge: false,
        skip_queue: false,
        social_promotion: false,
        priority_support: false,
      },
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 15,
      type: 'one-time',
      description: 'Premium listing with guaranteed backlinks and priority placement',
      priceId: process.env.POLAR_PRODUCT_ID_PREMIUM || null,
      cta: 'Go Premium',
      highlighted: true,
      features: {
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
  ],
};

// ─── Helper functions ────────────────────────────────────────────────────────

/** Get a plan by its ID */
export function getPlan(planId: string) {
  return plansConfig.plans.find((p) => p.id === planId);
}

/** Get the free plan (first plan with price 0) */
export function getFreePlan() {
  return plansConfig.plans.find((p) => p.price === 0);
}

/** Get all paid plans */
export function getPaidPlans() {
  return plansConfig.plans.filter((p) => p.price > 0);
}

/** Legacy compatibility: object-style access like the old paymentPlans */
export const paymentPlans = Object.fromEntries(
  plansConfig.plans.map((plan) => [
    plan.id,
    {
      name: plan.name,
      price: plan.price,
      priceId: plan.priceId,
      limits: plan.features,
    },
  ])
);
