import { NextResponse } from "next/server";
import { db } from "../../libs/database.js";
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
    const body = await request.json();
    const signature = request.headers.get("x-webhook-signature");
    const source = request.headers.get("x-webhook-source") || "unknown";

    // Log the webhook
    const webhookLog = {
      source,
      signature,
      body,
      headers: Object.fromEntries(request.headers.entries()),
      timestamp: new Date(),
      processed: false,
    };

    await db.insertOne("webhook_logs", webhookLog);

    // Process based on source
    let result = { success: true, message: "Webhook received" };
    
    switch (source) {
      case "resend":
        result = await processResendWebhook(body);
        break;
      case "github":
        result = await processGitHubWebhook(body, signature);
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
  // Process Resend email webhooks (delivery, bounce, etc.)
  const { type, data } = body;
  
  switch (type) {
    case "email.delivered":
      // Update email delivery status
      return { success: true, message: "Email delivery confirmed" };
    case "email.bounced":
      // Handle bounced email
      return { success: true, message: "Email bounce processed" };
    default:
      return { success: true, message: `Resend event ${type} acknowledged` };
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