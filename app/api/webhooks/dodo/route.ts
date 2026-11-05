import { NextResponse } from "next/server";
import { db } from "@/lib/supabase/database";
import { advertisingConfig } from "@/config/advertising.config";
import {
  constructDodoEvent,
  isDodoConfigured,
  DodoWebhookVerificationError,
} from "@/lib/payments/dodo";

/**
 * Dodo Payments webhook handler.
 *
 * Events we care about:
 *   payment.succeeded     — premium submission or ad placement paid
 *   refund.succeeded      — refund issued
 *
 * Ads are one-time now. The subscription events below only serve customers
 * who subscribed before that change, until their subscriptions end:
 *   subscription.active   — subscription started
 *   subscription.renewed  — recurring renewal (keep active, extend period)
 *   subscription.on_hold  — payment issue (mark past_due)
 *   subscription.cancelled / subscription.expired / subscription.failed
 *
 * Signature is verified via Standard Webhooks (webhook-id / webhook-signature /
 * webhook-timestamp headers). Metadata set at checkout rides through on
 * `data.metadata`.
 *
 * Dodo docs: https://docs.dodopayments.com/developer-resources/webhooks
 */

type DodoMetadata = Record<string, string>;

interface DodoCustomer {
  customer_id?: string;
  email?: string;
  name?: string;
}

interface DodoPaymentData {
  payload_type?: string;
  payment_id: string;
  subscription_id?: string | null;
  total_amount?: number; // cents
  currency?: string;
  status?: string;
  customer?: DodoCustomer;
  product_id?: string;
  metadata?: DodoMetadata;
  created_at?: string;
}

interface DodoSubscriptionData {
  payload_type?: string;
  subscription_id: string;
  status?: string;
  customer?: DodoCustomer;
  product_id?: string;
  metadata?: DodoMetadata;
  previous_billing_date?: string | null;
  next_billing_date?: string | null;
  cancelled_at?: string | null;
  created_at?: string;
}

export async function POST(request: Request) {
  if (!isDodoConfigured()) {
    return NextResponse.json(
      { error: "Dodo Payments is not configured on the server" },
      { status: 500 }
    );
  }

  const rawBody = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  let event: { type: string; data: any };
  try {
    event = constructDodoEvent(rawBody, headers);
  } catch (err) {
    if (err instanceof DodoWebhookVerificationError) {
      console.error("Dodo webhook signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
    console.error("Dodo webhook parse error:", err);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment.succeeded":
        await handlePaymentSucceeded(event.data as DodoPaymentData);
        break;
      case "refund.succeeded":
        await handleRefundSucceeded(event.data as DodoPaymentData);
        break;
      case "subscription.active":
      case "subscription.renewed":
        await handleSubscriptionStarted(event.data as DodoSubscriptionData);
        break;
      case "subscription.on_hold":
        await handleSubscriptionUpdated(event.data as DodoSubscriptionData, "past_due");
        break;
      case "subscription.cancelled":
      case "subscription.expired":
      case "subscription.failed":
        await handleSubscriptionCanceled(event.data as DodoSubscriptionData);
        break;
      default:
        // Ignore unknown event types — Dodo may add new ones over time.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Dodo webhook processing error:", error);
    const message = error instanceof Error ? error.message : "unknown";
    return NextResponse.json(
      { error: "Webhook processing failed", message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Dodo Payments webhook endpoint",
    timestamp: new Date().toISOString(),
    ready: isDodoConfigured(),
  });
}

// ─── Handlers ────────────────────────────────────────────────────────────

async function handlePaymentSucceeded(data: DodoPaymentData): Promise<void> {
  const metadata = data.metadata ?? {};
  const orderType = metadata.type ?? "premium_submission";

  if (orderType === "ad_placement") {
    await processAdPlacementOrder(data);
    return;
  }

  // Legacy subscription invoices are handled by the subscription events.
  if (orderType !== "premium_submission") {
    return;
  }

  await processPremiumSubmissionOrder(data);
}

async function processAdPlacementOrder(data: DodoPaymentData): Promise<void> {
  const promotionId = data.metadata?.promotionId;
  const promotion = promotionId
    ? await db.findOne("promotions", { id: promotionId })
    : null;

  if (!promotion) {
    // Money was taken for an ad we can't find: fail so Dodo retries and it shows up in logs.
    throw new Error(`Ad placement payment ${data.payment_id} has no promotion ${promotionId}`);
  }

  // Retried delivery of the same payment.
  if (promotion.payment_id === data.payment_id) {
    return;
  }

  // The hold may have lapsed before the customer paid. They still get what
  // they paid for, so activate anyway: being one over capacity beats that.
  const startsAt = new Date();
  const endsAt = new Date(
    startsAt.getTime() + advertisingConfig.promotions.durationDays * 86_400_000
  );

  await db.updateOne(
    "promotions",
    { id: promotion.id },
    {
      $set: {
        status: "active",
        is_house: false,
        payment_id: data.payment_id,
        amount_paid: data.total_amount ?? 0,
        customer_id: data.customer?.customer_id,
        starts_at: startsAt,
        ends_at: endsAt,
        reminder_sent_at: null,
      },
    }
  );
}

async function processPremiumSubmissionOrder(data: DodoPaymentData): Promise<void> {
  const metadata = data.metadata ?? {};
  const projectId = metadata.projectId;
  const userId = metadata.userId || null;
  const planType = metadata.planType || "premium";

  if (!projectId) {
    console.error("Dodo premium payment missing projectId in metadata", {
      paymentId: data.payment_id,
    });
    return;
  }

  const project = await db.findOne("apps", { id: projectId });
  if (!project) {
    console.error("Project not found for Dodo payment", {
      paymentId: data.payment_id,
      projectId,
    });
    return;
  }

  // Idempotency: skip if already processed for this payment.
  const existingPayment = await db.findOne("payments", {
    payment_id: data.payment_id,
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
        order_id: data.payment_id,
        is_draft: false,
        status: project.status === "live" ? "live" : "pending",
        upgrade_pending: false,
        ...(planType === "premium" ? {
          link_type: "dofollow",
          dofollow_status: true,
          dofollow_reason: "premium_plan",
          dofollow_awarded_at: new Date(),
          premium_badge: true,
          backlink_warning_sent_at: null,
        } : {}),
        updated_at: new Date(),
      },
    }
  );

  await db.insertOne("payments", {
    user_id: userId || project.submitted_by,
    app_id: project.id,
    plan: planType,
    amount: data.total_amount ?? 0,
    currency: (data.currency || "usd").toLowerCase(),
    payment_id: data.payment_id,
    invoice_id: data.subscription_id || null,
    status: "completed",
    metadata: {
      provider: "dodo",
      paymentId: data.payment_id,
      productId: data.product_id,
      customerEmail: data.customer?.email,
      rawMetadata: metadata,
    },
    paid_at: data.created_at ? new Date(data.created_at) : new Date(),
  });
}

async function handleRefundSucceeded(data: DodoPaymentData): Promise<void> {
  const promotion = await db.findOne("promotions", { payment_id: data.payment_id });
  if (promotion) {
    await db.updateOne(
      "promotions",
      { id: promotion.id },
      { $set: { status: "cancelled", ends_at: new Date() } }
    );
    return;
  }

  const project = await db.findOne("apps", { order_id: data.payment_id });
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
    { payment_id: data.payment_id },
    {
      $set: {
        status: "refunded",
        refunded_at: new Date(),
      },
    }
  );
}

/** The promotion behind a legacy subscription, including migrated sponsors. */
async function findSubscribedPromotion(data: DodoSubscriptionData) {
  const metadata = data.metadata ?? {};

  if (metadata.promotionId) {
    const promotion = await db.findOne("promotions", { id: metadata.promotionId });
    if (promotion) return promotion;
  }
  if (metadata.partnerId) {
    const promotion = await db.findOne("promotions", { legacy_partner_id: metadata.partnerId });
    if (promotion) return promotion;
  }
  return db.findOne("promotions", { subscription_id: data.subscription_id });
}

async function handleSubscriptionStarted(data: DodoSubscriptionData): Promise<void> {
  const promotion = await findSubscribedPromotion(data);
  if (!promotion) {
    console.warn("Dodo subscription active but no promotion found", {
      id: data.subscription_id,
    });
    return;
  }
  await db.updateOne(
    "promotions",
    { id: promotion.id },
    {
      $set: {
        status: "active",
        subscription_id: data.subscription_id,
        customer_id: data.customer?.customer_id,
        subscription_started_at: new Date(),
        ...(data.previous_billing_date && {
          current_period_start: new Date(data.previous_billing_date),
        }),
        ...(data.next_billing_date && {
          current_period_end: new Date(data.next_billing_date),
        }),
        updated_at: new Date(),
      },
    }
  );
}

async function handleSubscriptionUpdated(
  data: DodoSubscriptionData,
  status: string
): Promise<void> {
  const promotion = await findSubscribedPromotion(data);
  if (!promotion) return;

  await db.updateOne(
    "promotions",
    { id: promotion.id },
    {
      $set: {
        status,
        ...(data.next_billing_date && {
          current_period_end: new Date(data.next_billing_date),
        }),
        updated_at: new Date(),
      },
    }
  );
}

async function handleSubscriptionCanceled(data: DodoSubscriptionData): Promise<void> {
  const promotion = await findSubscribedPromotion(data);
  if (!promotion) return;
  await db.updateOne(
    "promotions",
    { id: promotion.id },
    {
      $set: {
        status: "cancelled",
        subscription_ends_at: data.cancelled_at ? new Date(data.cancelled_at) : new Date(),
        updated_at: new Date(),
      },
    }
  );
}
