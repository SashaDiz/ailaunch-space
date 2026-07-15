import { NextResponse } from "next/server";
import { db } from "@/lib/supabase/database";
import {
  constructDodoEvent,
  isDodoConfigured,
  DodoWebhookVerificationError,
} from "@/lib/payments/dodo";

/**
 * Dodo Payments webhook handler.
 *
 * Events we care about:
 *   payment.succeeded     — one-time premium submission captured
 *   refund.succeeded      — refund issued
 *   subscription.active   — partner / promotion subscription started
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

  // Subscription payments (partner/promotion) are handled by subscription
  // events; the first invoice's payment.succeeded needs no separate work.
  if (orderType !== "premium_submission") {
    return;
  }

  await processPremiumSubmissionOrder(data);
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

async function findSubscriptionEntity(data: DodoSubscriptionData) {
  const metadata = data.metadata ?? {};

  // Prefer the entity id carried in checkout metadata.
  if (metadata.partnerId) {
    const partner = await db.findOne("partners", { id: metadata.partnerId });
    if (partner) return { type: "partner" as const, entity: partner };
  }
  if (metadata.promotionId) {
    const promotion = await db.findOne("promotions", { id: metadata.promotionId });
    if (promotion) return { type: "promotion" as const, entity: promotion };
  }

  // Fallback: resolve by the subscription id we may have already stored.
  const partner = await db.findOne("partners", { subscription_id: data.subscription_id });
  if (partner) return { type: "partner" as const, entity: partner };
  const promotion = await db.findOne("promotions", { subscription_id: data.subscription_id });
  if (promotion) return { type: "promotion" as const, entity: promotion };

  return null;
}

async function handleSubscriptionStarted(data: DodoSubscriptionData): Promise<void> {
  const found = await findSubscriptionEntity(data);
  if (!found) {
    console.warn("Dodo subscription active but no partner/promotion entity found", {
      id: data.subscription_id,
    });
    return;
  }
  const table = found.type === "partner" ? "partners" : "promotions";
  await db.updateOne(
    table,
    { id: found.entity.id },
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
  const found = await findSubscriptionEntity(data);
  if (!found) return;
  const table = found.type === "partner" ? "partners" : "promotions";

  await db.updateOne(
    table,
    { id: found.entity.id },
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
  const found = await findSubscriptionEntity(data);
  if (!found) return;
  const table = found.type === "partner" ? "partners" : "promotions";
  await db.updateOne(
    table,
    { id: found.entity.id },
    {
      $set: {
        status: "cancelled",
        subscription_ends_at: data.cancelled_at ? new Date(data.cancelled_at) : new Date(),
        updated_at: new Date(),
      },
    }
  );
}
