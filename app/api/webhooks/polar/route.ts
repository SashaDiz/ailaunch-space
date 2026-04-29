import { NextResponse } from "next/server";
import { db } from "@/lib/supabase/database";
import {
  constructStripeEvent,
  isStripeConfigured,
  WebhookVerificationError,
} from "@/lib/payments/polar";

/**
 * Polar webhook handler.
 *
 * Events we care about:
 *   order.created      — payment captured (one-time premium submission, or
 *                         first invoice of a subscription)
 *   order.refunded     — refund issued
 *   subscription.created  — partner / promotion subscription started
 *   subscription.updated  — status / period change
 *   subscription.canceled — subscription canceled
 *
 * Polar.sh docs: https://docs.polar.sh/api/webhooks
 */

// Polar deletes its checkout id on the order, but the metadata we set during
// checkout creation rides through. Use those fields to figure out what to do.
type PolarMetadata = Record<string, string>;

interface PolarOrder {
  id: string;
  amount: number;          // cents
  currency: string;
  status: string;
  customer?: { email?: string };
  metadata?: PolarMetadata;
  productId?: string;
  subscriptionId?: string | null;
  checkoutId?: string | null;
  createdAt?: string;
}

interface PolarSubscription {
  id: string;
  status: string;
  customerId?: string;
  metadata?: PolarMetadata;
  checkoutId?: string | null;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  canceledAt?: string | null;
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Polar is not configured on the server" },
      { status: 500 }
    );
  }

  const rawBody = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  let event: { type: string; data: unknown };
  try {
    event = constructStripeEvent(rawBody, headers) as { type: string; data: unknown };
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.error("Polar webhook signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
    console.error("Polar webhook parse error:", err);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "order.created":
      case "order.updated":
        await handleOrderCreated(event.data as PolarOrder);
        break;
      case "order.refunded":
        await handleOrderRefunded(event.data as PolarOrder);
        break;
      case "subscription.created":
      case "subscription.active":
        await handleSubscriptionStarted(event.data as PolarSubscription);
        break;
      case "subscription.updated":
        await handleSubscriptionUpdated(event.data as PolarSubscription);
        break;
      case "subscription.canceled":
      case "subscription.revoked":
        await handleSubscriptionCanceled(event.data as PolarSubscription);
        break;
      default:
        // Ignore unknown event types — Polar may add new ones over time.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Polar webhook processing error:", error);
    const message = error instanceof Error ? error.message : "unknown";
    return NextResponse.json(
      { error: "Webhook processing failed", message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Polar webhook endpoint",
    timestamp: new Date().toISOString(),
    ready: isStripeConfigured(),
  });
}

// ─── Handlers ────────────────────────────────────────────────────────────

async function handleOrderCreated(order: PolarOrder): Promise<void> {
  if (order.status && order.status !== "paid" && order.status !== "succeeded") {
    return;
  }

  const metadata = order.metadata ?? {};
  const orderType = metadata.type ?? "premium_submission";

  switch (orderType) {
    case "premium_submission":
      await processPremiumSubmissionOrder(order);
      break;
    case "partner_subscription":
      // Partner subscriptions are activated on subscription.created — order.created
      // for the first invoice arrives roughly the same time but doesn't need
      // separate processing.
      break;
    case "promotion_subscription":
      // Same as above.
      break;
    default:
      console.warn(`Unknown Polar order type: ${orderType}`, { orderId: order.id });
  }
}

async function processPremiumSubmissionOrder(order: PolarOrder): Promise<void> {
  const metadata = order.metadata ?? {};
  const projectId = metadata.projectId;
  const userId = metadata.userId || null;
  const planType = metadata.planType || "premium";

  if (!projectId) {
    console.error("Polar premium order missing projectId in metadata", { orderId: order.id });
    return;
  }

  const project = await db.findOne("apps", { id: projectId });
  if (!project) {
    console.error("Project not found for Polar order", { orderId: order.id, projectId });
    return;
  }

  // Idempotency: skip if already processed for this order.
  const existingPayment = await db.findOne("payments", {
    payment_id: order.id,
    status: "completed",
  });
  if (existingPayment) {
    return;
  }

  await db.updateOne(
    "apps",
    { id: project.id },
    {
      $set: {
        plan: planType,
        payment_status: true,
        payment_date: new Date(),
        order_id: order.id,
        is_draft: false,
        status: project.status === "live" ? "live" : "pending",
        upgrade_pending: false,
        updated_at: new Date(),
      },
    }
  );

  await db.insertOne("payments", {
    user_id: userId || project.submitted_by,
    app_id: project.id,
    plan: planType,
    amount: order.amount,
    currency: order.currency || "usd",
    payment_id: order.id,
    invoice_id: order.checkoutId || null,
    status: "completed",
    metadata: {
      provider: "polar",
      checkoutId: order.checkoutId,
      productId: order.productId,
      customerEmail: order.customer?.email,
      rawMetadata: metadata,
    },
    paid_at: order.createdAt ? new Date(order.createdAt) : new Date(),
  });
}

async function handleOrderRefunded(order: PolarOrder): Promise<void> {
  const project = await db.findOne("apps", { order_id: order.id });
  if (project) {
    await db.updateOne(
      "apps",
      { id: project.id },
      {
        $set: {
          plan: "standard",
          payment_status: false,
          updated_at: new Date(),
        },
      }
    );
  }

  await db.updateOne(
    "payments",
    { payment_id: order.id },
    {
      $set: {
        status: "refunded",
        refunded_at: new Date(),
      },
    }
  );
}

async function findSubscriptionEntity(subscription: PolarSubscription) {
  const checkoutId = subscription.checkoutId;
  if (checkoutId) {
    const partner = await db.findOne("partners", { checkout_session_id: checkoutId });
    if (partner) return { type: "partner" as const, entity: partner };
    const promotion = await db.findOne("promotions", { checkout_session_id: checkoutId });
    if (promotion) return { type: "promotion" as const, entity: promotion };
  }

  const partner = await db.findOne("partners", { stripe_subscription_id: subscription.id });
  if (partner) return { type: "partner" as const, entity: partner };
  const promotion = await db.findOne("promotions", { stripe_subscription_id: subscription.id });
  if (promotion) return { type: "promotion" as const, entity: promotion };

  return null;
}

async function handleSubscriptionStarted(subscription: PolarSubscription): Promise<void> {
  const found = await findSubscriptionEntity(subscription);
  if (!found) {
    console.warn("Polar subscription started but no partner/promotion entity found", { id: subscription.id });
    return;
  }
  const table = found.type === "partner" ? "partners" : "promotions";
  await db.updateOne(
    table,
    { id: found.entity.id },
    {
      $set: {
        status: "active",
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customerId,
        subscription_started_at: new Date(),
        ...(subscription.currentPeriodStart && { current_period_start: new Date(subscription.currentPeriodStart) }),
        ...(subscription.currentPeriodEnd && { current_period_end: new Date(subscription.currentPeriodEnd) }),
        updated_at: new Date(),
      },
    }
  );
}

async function handleSubscriptionUpdated(subscription: PolarSubscription): Promise<void> {
  const found = await findSubscriptionEntity(subscription);
  if (!found) return;
  const table = found.type === "partner" ? "partners" : "promotions";

  // Polar status values: 'incomplete' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing'
  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "active",
    past_due: "past_due",
    unpaid: "past_due",
    canceled: "cancelled",
    incomplete: "pending",
  };
  const newStatus = statusMap[subscription.status] || "pending";

  await db.updateOne(
    table,
    { id: found.entity.id },
    {
      $set: {
        status: newStatus,
        ...(subscription.currentPeriodStart && { current_period_start: new Date(subscription.currentPeriodStart) }),
        ...(subscription.currentPeriodEnd && { current_period_end: new Date(subscription.currentPeriodEnd) }),
        updated_at: new Date(),
      },
    }
  );
}

async function handleSubscriptionCanceled(subscription: PolarSubscription): Promise<void> {
  const found = await findSubscriptionEntity(subscription);
  if (!found) return;
  const table = found.type === "partner" ? "partners" : "promotions";
  await db.updateOne(
    table,
    { id: found.entity.id },
    {
      $set: {
        status: "cancelled",
        subscription_ends_at: subscription.canceledAt ? new Date(subscription.canceledAt) : new Date(),
        updated_at: new Date(),
      },
    }
  );
}
