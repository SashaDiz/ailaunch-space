import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "../../../libs/database.js";
import { verifyWebhookSignature } from "../../../libs/lemonsqueezy.js";
import { getSupabaseAdmin } from "../../../libs/supabase.js";

// POST /api/webhooks/lemonsqueezy
export async function POST(request) {
  try {
    // Check if webhook secret is configured first
    const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || process.env.LS_SIGNING_SECRET;
    if (!webhookSecret) {
      console.error("LemonSqueezy Webhook Secret not set in .env");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Get the raw body and signature
    const rawBody = await request.text();
    const headersList = await headers();
    const signature = headersList.get("X-Signature");

    console.log('Webhook request received:', {
      hasSignature: !!signature,
      bodyLength: rawBody.length,
      headers: Object.fromEntries(headersList.entries())
    });

    if (!signature) {
      console.error("Missing webhook signature");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    if (!rawBody || rawBody.length === 0) {
      console.error("Empty webhook body");
      return NextResponse.json(
        { error: "Empty body" },
        { status: 400 }
      );
    }

    // Verify webhook signature following official LemonSqueezy documentation
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
    
    if (!isValid) {
      console.error("Invalid webhook signature - possible causes:");
      console.error("  1. Incorrect webhook secret in .env.local");
      console.error("  2. Webhook secret in LemonSqueezy dashboard doesn't match");
      console.error("  3. Request body was modified before reaching this handler");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    console.log('✅ Webhook signature verified successfully');

    // Parse the webhook payload
    const event = JSON.parse(rawBody);
    
    console.log("Received LemonSqueezy webhook:", {
      eventName: event.meta?.event_name,
      eventId: event.data?.id,
      testMode: event.data?.attributes?.test_mode,
      customData: event.data?.attributes?.checkout_data?.custom
    });

    // Handle different webhook events
    const eventName = event.meta?.event_name;
    
    if (!eventName) {
      console.error("Missing event_name in webhook payload");
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    console.log(`Processing event: ${eventName}`);

    switch (eventName) {
      case "order_created":
        await handleOrderCreated(event);
        break;
      
      case "order_refunded":
        await handleOrderRefunded(event);
        break;
        
      case "subscription_payment_success":
        await handleSubscriptionPaymentSuccess(event);
        break;
        
      case "subscription_payment_failed":
        await handleSubscriptionPaymentFailed(event);
        break;
        
      default:
        console.log(`Unhandled LemonSqueezy event: ${eventName}`);
    }

    console.log(`✅ Successfully processed ${eventName} event`);
    return NextResponse.json({ 
      success: true, 
      eventName,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("LemonSqueezy webhook error:", {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
    
    // Return 200 to prevent LemonSqueezy from retrying if it's our fault
    // Return 500 only for temporary issues
    const statusCode = error.message?.includes('Database') ? 500 : 200;
    
    return NextResponse.json(
      { 
        error: "Webhook processing failed",
        message: error.message
      },
      { status: statusCode }
    );
  }
}

// Handle successful order creation/payment
async function handleOrderCreated(event) {
  try {
    console.log('\n🎯 Processing order_created event...');
    const order = event.data.attributes;
    
    console.log('Order details:', {
      orderId: event.data.id,
      identifier: order.identifier,
      status: order.status,
      total: order.total,
      currency: order.currency,
      userEmail: order.user_email,
      testMode: order.test_mode
    });
    
    // Try multiple possible locations for custom data in LemonSqueezy webhook
    let customData = {};
    
    // Check checkout_data.custom (where we send it)
    if (order.checkout_data?.custom) {
      customData = order.checkout_data.custom;
      console.log("✅ Found custom data in checkout_data.custom:", customData);
    }
    // Fallback: check first_order_item.meta.custom_data (legacy location)
    else if (order.first_order_item?.meta?.custom_data) {
      customData = order.first_order_item.meta.custom_data;
      console.log("✅ Found custom data in first_order_item.meta.custom_data:", customData);
    }
    // Fallback: check order items array
    else if (order.order_items && order.order_items[0]?.meta?.custom_data) {
      customData = order.order_items[0].meta.custom_data;
      console.log("✅ Found custom data in order_items[0].meta.custom_data:", customData);
    }
    
    if (!customData || Object.keys(customData).length === 0) {
      console.warn("⚠️  No custom data found in webhook. Will attempt to match by email and timestamp.", {
        hasCheckoutData: !!order.checkout_data,
        checkoutDataKeys: order.checkout_data ? Object.keys(order.checkout_data) : [],
        hasFirstOrderItem: !!order.first_order_item,
        hasOrderItems: !!order.order_items,
        userEmail: order.user_email
      });
    }
    
    // Extract custom data fields (may be empty if custom data not found)
    const {
      user_id: userId,
      directory_name: directoryName,
      directory_slug: directorySlug,
      plan_type: planType
    } = customData;

    let directory;
    
    // Strategy 1: If we have custom data with user_id, use it
    if (userId) {
      console.log(`Processing payment for user: ${userId}`);

      // Find the directory to update
      console.log('Searching for directory:', { directorySlug, directoryName, userId });
      
      if (directorySlug) {
        directory = await db.findOne("apps", { 
          slug: directorySlug,
          submitted_by: userId 
        });
        console.log(directory ? '✅ Directory found by slug' : '❌ Directory not found by slug');
      }
      
      if (!directory && directoryName) {
        directory = await db.findOne("apps", { 
          name: directoryName,
          submitted_by: userId 
        });
        console.log(directory ? '✅ Directory found by name' : '❌ Directory not found by name');
      }
    }
    
    // Strategy 2: If no custom data or directory not found, match by email + unpaid status + recent timestamp
    if (!directory) {
      console.log('🔍 Attempting to match directory by email and unpaid status...');
      
      // First, find user by email from auth.users using Supabase admin client
      const supabase = getSupabaseAdmin();
      
      // Query auth.users directly using RPC or by listing with filter
      // Note: Supabase doesn't have a direct getUserByEmail in admin API, so we use a SQL query
      const { data: users, error: authError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      // Fallback: Get user by querying all auth users (inefficient but works)
      let authUserId = null;
      
      // Try to get user through Supabase Auth API
      const { data: { users: authUsers } = {}, error: listError } = await supabase.auth.admin.listUsers();
      
      if (!listError && authUsers) {
        const authUser = authUsers.find(u => u.email === order.user_email);
        if (authUser) {
          authUserId = authUser.id;
          console.log(`✅ Found user by email in auth.users: ${authUserId}`);
        } else {
          console.error("❌ No user found with email in auth.users:", order.user_email);
        }
      } else if (listError) {
        console.error("❌ Error querying auth users:", listError);
      }
      
      // If we found a user, look for their unpaid directory
      if (authUserId) {
        // Find the most recent unpaid premium directory for this user
        const unpaidDirectories = await db.find("apps", {
          submitted_by: authUserId,
          plan: "premium",
          payment_status: false,
          is_draft: true
        }, {
          sort: { payment_initiated_at: -1 },
          limit: 1
        });
        
        if (unpaidDirectories && unpaidDirectories.length > 0) {
          directory = unpaidDirectories[0];
          console.log('✅ Found unpaid directory by email match:', {
            id: directory.id,
            name: directory.name,
            paymentInitiatedAt: directory.payment_initiated_at
          });
        } else {
          console.error("❌ No unpaid premium directories found for user:", {
            userId: authUserId,
            email: order.user_email
          });
        }
      }
    }

    // If still no directory found, we can't process the payment
    if (!directory) {
      console.error("❌ Directory not found for payment after all strategies", { 
        customDataUserId: userId,
        directoryName, 
        directorySlug,
        orderEmail: order.user_email,
        orderId: event.data.id
      });
      throw new Error('Directory not found - cannot process payment. Please contact support with order ID: ' + event.data.id);
    }

    console.log('✅ Found directory:', {
      id: directory.id,
      name: directory.name,
      slug: directory.slug,
      currentPlan: directory.plan || 'standard',
      launchWeek: directory.launch_week,
      scheduledLaunch: directory.scheduled_launch
    });

    // Update directory with payment information and schedule the launch
    console.log('Updating directory with payment info and scheduling launch...');
    
    const updateResult = await db.updateOne(
      "apps",
      { id: directory.id },
      {
        $set: {
          plan: planType || "premium",
          payment_status: true,
          payment_date: new Date(),
          order_id: event.data.id,
          scheduled_launch: true, // NOW schedule the launch after payment confirmation
          status: "pending", // Move from draft to pending status
          is_draft: false, // No longer a draft once paid
          // updated_at is handled by DB triggers
        },
      }
    );

    if (!updateResult) {
      throw new Error('Failed to update directory');
    }

    console.log('✅ Directory updated successfully and launch scheduled');
    
    // Increment competition counts now that payment is confirmed
    if (directory.weekly_competition_id) {
      console.log('Incrementing competition counts after payment confirmation...');
      
      // Find the competition by ID
      const competition = await db.findOne("competitions", { 
        id: directory.weekly_competition_id 
      });
      
      if (competition) {
        const competitionUpdateResult = await db.updateOne(
          "competitions",
          { id: directory.weekly_competition_id },
          {
            $inc: { 
              total_submissions: 1,
              premium_submissions: 1,
            },
            $set: { updated_at: new Date() },
          }
        );
        
        console.log('✅ Competition counts updated:', {
          competitionId: competition.competition_id,
          matchedCount: competitionUpdateResult.matchedCount,
          modifiedCount: competitionUpdateResult.modifiedCount
        });
      } else {
        console.warn('⚠️  Competition not found for directory:', directory.weekly_competition_id);
      }
    } else {
      console.warn('⚠️  No weekly_competition_id set for directory');
    }

    // Record payment in payments collection
    console.log('Recording payment in database...');
    
    const paymentRecord = await db.insertOne("payments", {
      user_id: userId || directory.submitted_by, // Use userId from custom data or directory's submitted_by
      app_id: directory.id,
      plan: planType || "premium",
      amount: order.total,
      currency: order.currency,
      payment_id: event.data.id,
      invoice_id: order.identifier,
      status: "completed",
      metadata: {
        provider: "lemonsqueezy",
        webhookEventId: event.meta?.event_name,
        customerEmail: order.user_email,
        customData,
        testMode: order.test_mode
      },
      paid_at: new Date(),
      // created_at is handled by DB defaults
    });

    console.log('✅ Payment recorded successfully:', {
      paymentId: paymentRecord?.id,
      amount: `${order.currency} ${order.total / 100}`
    });

    console.log(`\n🎉 LemonSqueezy payment processed successfully!`);
    console.log(`   Directory: ${directory.name} (${directory.id})`);
    console.log(`   Plan: ${planType || "premium"}`);
    console.log(`   Amount: ${order.currency} ${order.total / 100}`);
    console.log(`   Order ID: ${order.identifier}`);
    console.log(`   Test Mode: ${order.test_mode ? 'Yes' : 'No'}\n`);
    
    // TODO: Send confirmation email to user
    // TODO: Trigger any post-payment workflows (social promotion, etc.)

  } catch (error) {
    console.error("❌ Error handling order_created event:", {
      message: error.message,
      stack: error.stack
    });
    throw error; // Re-throw to be caught by main handler
  }
}

// Handle order refunds
async function handleOrderRefunded(event) {
  try {
    const order = event.data.attributes;
    const orderId = event.data.id;

    // Find the directory associated with this order
    const directory = await db.findOne("apps", { 
      order_id: orderId 
    });

    if (!directory) {
      console.error("Directory not found for refunded order", orderId);
      return;
    }

    // Revert directory back to standard plan
    await db.updateOne(
      "apps",
      { id: directory.id },
      {
        $set: {
          plan: "standard",
          payment_status: false,
          // updated_at is handled by DB triggers
        },
        $unset: {
          premium_badge: "",
          skip_queue: "",
        }
      }
    );

    // Update payment record
    await db.updateOne(
      "payments",
      { payment_id: orderId },
      {
        $set: {
          status: "refunded",
          refunded_at: new Date(),
          // updated_at is handled by DB triggers
        },
      }
    );

    console.log(`Lemonsqueezy order refunded for directory ${directory.id}`);
    
    // TODO: Send refund notification email
    // TODO: Remove any premium features

  } catch (error) {
    console.error("Error handling Lemonsqueezy refund:", error);
  }
}

// Handle subscription payment success (for future subscription features)
async function handleSubscriptionPaymentSuccess(event) {
  try {
    const subscription = event.data.attributes;
    console.log("Subscription payment successful:", subscription.subscription_id);
    
    // TODO: Handle subscription renewals when subscription features are added
    
  } catch (error) {
    console.error("Error handling subscription payment success:", error);
  }
}

// Handle subscription payment failures (for future subscription features)
async function handleSubscriptionPaymentFailed(event) {
  try {
    const subscription = event.data.attributes;
    console.log("Subscription payment failed:", subscription.subscription_id);
    
    // TODO: Handle subscription payment failures when subscription features are added
    
  } catch (error) {
    console.error("Error handling subscription payment failure:", error);
  }
}

// GET method for webhook verification/testing
export async function GET(request) {
  return NextResponse.json({
    message: "Lemonsqueezy webhook endpoint",
    timestamp: new Date().toISOString(),
    ready: true
  });
}