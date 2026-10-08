import { NextResponse } from "next/server";
import { Webhook, WebhookVerificationError } from "standardwebhooks";
import { getSupabaseAdmin } from "@/lib/supabase/client";

/**
 * Resend webhook handler.
 *
 * Events we act on:
 *   email.bounced    — permanent bounces mark the newsletter subscriber as
 *                      'bounced' and the matching email_notifications row as
 *                      'bounced'. Temporary bounces are only acknowledged.
 *   email.complained — the recipient marked us as spam: unsubscribe them from
 *                      the newsletter.
 * Every other event is acknowledged with 200 so Resend doesn't retry it.
 *
 * Resend signs with Svix (svix-id / svix-timestamp / svix-signature). Svix is
 * the reference implementation of Standard Webhooks — same HMAC, same
 * `whsec_` secret — only the header names differ, so we map them and verify
 * with `standardwebhooks`.
 *
 * Updates are idempotent, so a 500 on a DB error is safe: Resend retries.
 *
 * Resend docs: https://resend.com/docs/webhooks/introduction
 */

interface ResendEmailEvent {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[];
    bounce?: { type?: string; subType?: string; message?: string };
  };
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Resend webhook: RESEND_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing signature headers" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: ResendEmailEvent;
  try {
    event = new Webhook(secret).verify(rawBody, {
      "webhook-id": svixId,
      "webhook-timestamp": svixTimestamp,
      "webhook-signature": svixSignature,
    }) as ResendEmailEvent;
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.error("Resend webhook signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    console.error("Resend webhook: failed to parse payload", err);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "email.bounced":
        await handleBounce(event);
        break;
      case "email.complained":
        await handleComplaint(event);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error("Resend webhook processing failed", { type: event.type, error });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function recipients(event: ResendEmailEvent): string[] {
  return (event.data?.to || [])
    .filter((email): email is string => typeof email === "string" && email.length > 0)
    .map((email) => email.trim().toLowerCase());
}

async function handleBounce(event: ResendEmailEvent) {
  const bounce = event.data?.bounce;
  // Temporary bounces (mailbox full, greylisting) resolve on their own;
  // only a permanent one means the address is dead.
  if (bounce?.type !== "Permanent") return;

  const supabase = getSupabaseAdmin();
  const emails = recipients(event);

  if (emails.length > 0) {
    const { error } = await supabase
      .from("newsletter")
      .update({ status: "bounced" })
      .in("email", emails)
      .neq("status", "bounced");
    if (error) throw new Error(`newsletter bounce update failed: ${error.message}`);
  }

  if (event.data?.email_id) {
    const { error } = await supabase
      .from("email_notifications")
      .update({
        status: "bounced",
        error_message: [bounce.subType, bounce.message].filter(Boolean).join(": ").slice(0, 1000) || null,
      })
      .eq("resend_email_id", event.data.email_id);
    if (error) throw new Error(`email_notifications bounce update failed: ${error.message}`);
  }
}

async function handleComplaint(event: ResendEmailEvent) {
  const emails = recipients(event);
  if (emails.length === 0) return;

  const { error } = await getSupabaseAdmin()
    .from("newsletter")
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .in("email", emails)
    .eq("status", "subscribed");
  if (error) throw new Error(`newsletter complaint update failed: ${error.message}`);
}
