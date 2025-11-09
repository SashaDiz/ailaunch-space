import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "../../libs/database.js";
import { getSupabaseAdmin } from "../../libs/supabase.js";
import { webhookEvents } from "../../libs/webhooks.js";

// POST /api/webhooks?type=external|internal
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "external";

    switch (type) {
      case "external":
        return await handleExternalWebhook(request);
      case "internal":
        return await handleInternalWebhook(request);
      default:
        return NextResponse.json(
          { error: "Invalid type parameter. Use: external, internal" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Webhooks API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/webhooks?type=logs
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    switch (type) {
      case "logs":
        return await getWebhookLogs(searchParams);
      default:
        return NextResponse.json(
          { error: "Invalid type parameter. Use: logs" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Webhooks API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions
async function handleExternalWebhook(request) {
  try {
    const rawBody = await request.text();
    let parsedBody = {};

    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch (parseError) {
        console.error("Failed to parse webhook payload:", parseError);
        return NextResponse.json(
          { error: "Invalid JSON payload" },
          { status: 400 }
        );
      }
    }

    const headers = Object.fromEntries(request.headers.entries());
    const signature =
      headers["x-webhook-signature"] || headers["svix-signature"] || null;

    const explicitSource = headers["x-webhook-source"];
    let source =
      explicitSource || (headers["svix-signature"] ? "resend" : "unknown");

    if (source === "resend") {
      const verificationResult = await verifyResendWebhook(rawBody, headers);
      if (!verificationResult.valid) {
        console.error("Resend webhook verification failed:", verificationResult.error);
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 400 }
        );
      }
      parsedBody = verificationResult.payload;
    }

    // Log the webhook
    const webhookLog = {
      source,
      signature,
      body: parsedBody,
      raw_body: rawBody,
      headers,
      timestamp: new Date(),
      processed: false,
    };

    await db.insertOne("webhook_logs", webhookLog);

    // Process based on source
    let result = { success: true, message: "Webhook received" };

    switch (source) {
      case "resend":
        result = await processResendWebhook(parsedBody);
        break;
      case "github":
        result = await processGitHubWebhook(parsedBody, signature);
        break;
      default:
        console.log(`Unknown webhook source: ${source}`);
    }

    // Update webhook log with processing result
    await db.updateOne(
      "webhook_logs",
      { id: webhookLog.id },
      {
        $set: {
          processed: true,
          result,
          processedAt: new Date(),
        },
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("External webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 }
    );
  }
}

async function handleInternalWebhook(request) {
  try {
    const body = await request.json();
    const { event, data, timestamp } = body;

    // Trigger internal webhook events
    if (webhookEvents[event]) {
      await Promise.all(
        webhookEvents[event].map(async (handler) => {
          try {
            await handler(data);
          } catch (error) {
            console.error('Webhook handler error:', { event, error });
          }
        })
      );
    } else {
      console.log(`No webhooks registered for event: ${event}`);
    }

    return NextResponse.json({
      success: true,
      event,
      handlersTriggered: webhookEvents[event]?.length || 0,
    });

  } catch (error) {
    console.error("Internal webhook error:", error);
    return NextResponse.json(
      { error: "Internal webhook processing failed" },
      { status: 500 }
    );
  }
}

async function getWebhookLogs(searchParams) {
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const source = searchParams.get("source");
  
  const filter = {};
  if (source) {
    filter.source = source;
  }

  const skip = (page - 1) * limit;
  
  const [logs, total] = await Promise.all([
    db.find("webhook_logs", filter, {
      skip,
      limit,
      sort: { timestamp: -1 },
    }),
    db.count("webhook_logs", filter),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
}

// Webhook processors
async function processResendWebhook(body) {
  const { type, data } = body;

  switch (type) {
    case "contact.created":
      await syncResendContact(data, { event: type });
      return { success: true, message: "Contact created synced" };
    case "contact.updated":
      await syncResendContact(data, { event: type });
      return { success: true, message: "Contact updated synced" };
    case "contact.deleted":
      await syncResendContact(
        { ...data, unsubscribed: true },
        { event: type, reason: "deleted" }
      );
      return { success: true, message: "Contact deleted processed" };
    case "email.bounced":
    case "email.failed":
      await syncEmailStatuses(data, "bounced", { event: type });
      return { success: true, message: "Email bounce processed" };
    case "email.complained":
      await syncEmailStatuses(data, "unsubscribed", { event: type });
      return { success: true, message: "Complaint processed" };
    case "email.delivered":
    case "email.sent":
    case "email.delivery_delayed":
    case "email.opened":
    case "email.clicked":
    case "email.received":
      return { success: true, message: `Resend event ${type} acknowledged` };
    default:
      return { success: true, message: `Resend event ${type} acknowledged` };
  }
}

const newsletterStates = new Set(["subscribed", "unsubscribed", "bounced"]);

let cachedSupabaseAdmin = undefined;
function getSupabaseAdminClient() {
  if (cachedSupabaseAdmin !== undefined) {
    return cachedSupabaseAdmin || null;
  }

  try {
    cachedSupabaseAdmin = getSupabaseAdmin();
  } catch (error) {
    console.error("Supabase admin client unavailable:", error.message);
    cachedSupabaseAdmin = false;
  }

  return cachedSupabaseAdmin || null;
}

async function syncResendContact(contactData, context = {}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  const email = contactData?.email?.trim().toLowerCase();
  if (!email) {
    console.warn("Resend contact event missing email");
    return;
  }

  const status = contactData.unsubscribed ? "unsubscribed" : "subscribed";
  await upsertNewsletterStatus(supabase, email, status, {
    allowInsert: true,
    ...context,
  });
}

async function syncEmailStatuses(emailData, status, context = {}) {
  if (!newsletterStates.has(status)) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  const recipients = Array.isArray(emailData?.to) ? emailData.to : [];
  if (recipients.length === 0 && emailData?.recipient) {
    recipients.push(emailData.recipient);
  }

  await Promise.all(
    recipients.map(async (recipient) => {
      const normalizedEmail =
        typeof recipient === "string"
          ? recipient.trim().toLowerCase()
          : recipient?.email?.trim().toLowerCase();

      if (!normalizedEmail) {
        return;
      }

      await upsertNewsletterStatus(supabase, normalizedEmail, status, {
        allowInsert: false,
        ...context,
      });
    })
  );
}

async function upsertNewsletterStatus(supabase, email, status, context = {}) {
  try {
    const now = new Date().toISOString();
    const updateData = {
      status,
      updated_at: now,
    };

    if (status === "subscribed") {
      updateData.subscribed_at = now;
      updateData.unsubscribed_at = null;
    } else if (status === "unsubscribed") {
      updateData.unsubscribed_at = now;
    } else if (status === "bounced") {
      updateData.unsubscribed_at = now;
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from("newsletter")
      .update(updateData)
      .eq("email", email)
      .select("id");

    if (updateError) {
      console.error("Failed to update newsletter status:", {
        email,
        status,
        error: updateError.message,
      });
      return;
    }

    const allowInsert = context?.allowInsert ?? true;

    if (allowInsert && (!updatedRows || updatedRows.length === 0)) {
      const insertPayload = {
        email,
        status,
        source: context?.event || "resend_webhook",
        subscribed_at: status === "subscribed" ? now : null,
        unsubscribed_at:
          status === "unsubscribed" || status === "bounced" ? now : null,
        created_at: now,
        updated_at: now,
      };

      const { error: insertError } = await supabase
        .from("newsletter")
        .insert(insertPayload);

      if (insertError) {
        console.error("Failed to insert newsletter status:", {
          email,
          status,
          error: insertError.message,
        });
      }
    }
  } catch (error) {
    console.error("Newsletter status sync error:", { email, status, error });
  }
}

async function verifyResendWebhook(payload, headers) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return {
      valid: false,
      error: new Error("RESEND_WEBHOOK_SECRET is not configured"),
    };
  }

  const svixHeaders = {
    "svix-id": headers["svix-id"],
    "svix-timestamp": headers["svix-timestamp"],
    "svix-signature": headers["svix-signature"],
  };

  if (
    !svixHeaders["svix-id"] ||
    !svixHeaders["svix-timestamp"] ||
    !svixHeaders["svix-signature"]
  ) {
    return {
      valid: false,
      error: new Error("Missing Svix headers for webhook verification"),
    };
  }

  try {
    const wh = new Webhook(webhookSecret);
    const verifiedPayload = wh.verify(payload, svixHeaders);
    return { valid: true, payload: verifiedPayload };
  } catch (error) {
    return { valid: false, error };
  }
}

async function processGitHubWebhook(body, signature) {
  // Process GitHub webhooks (push, PR, etc.)
  const { action, repository } = body;
  
  // Example: trigger deployment on push to main
  if (action === "push" && body.ref === "refs/heads/main") {
    // Trigger deployment logic here
    return { success: true, message: "Deployment triggered" };
  }
  
  return { success: true, message: "GitHub webhook acknowledged" };
}