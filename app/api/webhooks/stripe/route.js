import { NextResponse } from "next/server";
import { db } from "../../../libs/database.js";
import { constructStripeEvent, isStripeConfigured } from "../../../libs/stripe.js";

// Discord webhook URL for premium listing notifications
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "https://discord.com/api/webhooks/1460260030413803520/NpWY9Q6qL5W9Swv_lrGIaBHdzOGMdc7sd5EHT5TdA9olqPn_qrPs5HTUSQYW9HTfdOQ5";

/**
 * Sends a Discord webhook notification for premium listing purchases
 * @param {Object} params - Notification parameters
 * @param {string} params.toolName - Name of the tool/project
 * @param {string} params.email - Customer email
 * @param {number} params.amount - Payment amount in cents
 * @param {string} params.currency - Payment currency (e.g., 'usd')
 */
async function sendDiscordNotification({ toolName, email, amount, currency = "usd" }) {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn("Discord webhook URL not configured, skipping notification");
    return;
  }

  try {
    // Convert amount from cents to dollars
    const amountInDollars = (amount / 100).toFixed(0);
    const currencyUpper = currency.toUpperCase();

    // Format message according to the reference image
    const content = `Tool name: ${toolName}, Email: ${email}, Enter your payment details: You paid ${amountInDollars} ${currencyUpper}`;

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: content,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord webhook failed: ${response.status} ${errorText}`);
    }

    console.log("Discord notification sent successfully for premium listing:", toolName);
  } catch (error) {
    // Log error but don't throw - we don't want to fail payment processing if Discord is down
    console.error("Failed to send Discord notification:", error.message);
  }
}

// POST /api/webhooks/stripe
export async function POST(request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured on the server" },
        { status: 500 }
      );
    }

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const rawBody = await request.text();
    let event;

    try {
      event = constructStripeEvent(rawBody, signature);
    } catch (err) {
      console.error("Stripe webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    switch (event.type) {
      // Primary event for checkout sessions
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      // Async payment events (for bank transfers, etc.)
      case "checkout.session.async_payment_succeeded":
        // Async payment succeeded - process like regular checkout.session.completed
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case "checkout.session.async_payment_failed":
        // Async payment failed - log and notify
        await handleCheckoutSessionAsyncPaymentFailed(event.data.object);
        break;
      
      // Payment Intent events (backup/verification)
      case "payment_intent.succeeded":
        // Payment intent succeeded - verify and process if not already processed
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      
      case "payment_intent.payment_failed":
        // Payment failed - log and handle
        await handlePaymentIntentFailed(event.data.object);
        break;
      
      // Charge events
      case "charge.refunded":
        await handleChargeRefunded(event.data.object);
        break;
      
      case "charge.dispute.created":
        // Chargeback/dispute created - log and notify admin
        await handleChargeDisputeCreated(event.data.object);
        break;
      
      default:
        console.log(`ℹ️ [WEBHOOK] Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed", message: error.message },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session) {
  console.log("🔔 [WEBHOOK] Processing Stripe checkout.session.completed:", {
    sessionId: session.id,
    paymentStatus: session.payment_status,
    amount: session.amount_total,
    currency: session.currency,
    metadata: session.metadata,
    paymentIntent: session.payment_intent,
    customerEmail: session.customer_details?.email,
    timestamp: new Date().toISOString(),
  });

  // CRITICAL: Only process paid sessions
  if (session.payment_status !== "paid") {
    console.warn("⚠️ [WEBHOOK] Stripe session not paid, skipping:", {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      possibleStatuses: ["paid", "unpaid", "no_payment_required"],
    });
    return;
  }

  console.log("✅ [WEBHOOK] Payment confirmed as paid, proceeding with processing");

  const metadata = session.metadata || {};
  const userId = metadata.userId;
  const projectId = metadata.projectId;
  const projectSlug = metadata.projectSlug;
  const planType = metadata.planType || "premium";
  const paymentIntentId = session.payment_intent || session.id;

  let project = null;

  if (projectId) {
    project = await db.findOne("apps", { id: projectId });
  }

  if (!project && projectSlug && userId) {
    project = await db.findOne("apps", {
      slug: projectSlug,
      submitted_by: userId,
    });
  }

  // CRITICAL: Try to find project by checkout_session_id
  // This handles cases where project was created with checkout_session_id but webhook runs before project is fully saved
  // Also handles cases where project was created AFTER payment (webhook runs first)
  if (!project && session.id) {
    // First try with userId for security
    if (userId) {
      project = await db.findOne("apps", {
        checkout_session_id: session.id,
        submitted_by: userId,
      });
    }
    
    // If not found with userId, try without userId (for cases where metadata.userId might be missing)
    // This is safe because we're matching by exact checkout_session_id
    if (!project) {
      project = await db.findOne("apps", {
        checkout_session_id: session.id,
      });
    }
    
    if (project) {
      console.log("✅ [WEBHOOK] Found project by checkout_session_id:", {
        projectId: project.id,
        projectName: project.name,
        checkoutSessionId: session.id,
        foundWithUserId: !!userId && project.submitted_by === userId,
      });
    }
  }

  if (!project && userId) {
    // Try to find unpaid premium drafts first (most recent first)
    const unpaidProjects = await db.find(
      "apps",
      {
        submitted_by: userId,
        plan: "premium",
        payment_status: false,
        is_draft: true,
      },
      {
        sort: { payment_initiated_at: -1, created_at: -1 },
        limit: 1,
      }
    );
    project = unpaidProjects?.[0];
    
    // If still not found, try finding any premium project by this user without payment
    // This handles cases where project was created after payment
    if (!project) {
      const anyPremiumProject = await db.findOne(
        "apps",
        {
          submitted_by: userId,
          plan: "premium",
          payment_status: false,
        },
        {
          sort: { created_at: -1 },
        }
      );
      project = anyPremiumProject;
    }
    
    // If still not found, check if there's a payment initiated around the same time
    // This handles edge cases where project creation and payment timing don't align
    if (!project && paymentIntentId) {
      // Look for projects created within 24 hours of payment, or with matching checkout_session_id
      const recentProjects = await db.find(
        "apps",
        {
          submitted_by: userId,
          plan: "premium",
          payment_status: false,
        },
        {
          sort: { created_at: -1 },
          limit: 5,
        }
      );
      
        // Try to match by checkout_session_id if available
        if (recentProjects.length > 0) {
          // First priority: exact checkout_session_id match
          const exactMatch = recentProjects.find(p => 
            p.checkout_session_id === session.id
          );
          
          if (exactMatch) {
            project = exactMatch;
            console.log("Found project by exact checkout_session_id match:", {
              projectId: project.id,
              projectName: project.name,
              checkoutSessionId: session.id,
            });
          } else {
            // Second priority: payment_intent match
            const paymentIntentMatch = recentProjects.find(p => 
              p.checkout_session_id === session.payment_intent
            );
            
            if (paymentIntentMatch) {
              project = paymentIntentMatch;
              console.log("Found project by payment_intent match:", {
                projectId: project.id,
                projectName: project.name,
                paymentIntent: session.payment_intent,
              });
            } else {
              // Last resort: use the most recent one (likely the one user just created)
              project = recentProjects[0];
              console.log("Using most recent premium project as fallback:", {
                projectId: project.id,
                projectName: project.name,
                paymentIntentId,
                reason: "No exact match found, using most recent unpaid premium project"
              });
            }
          }
        }
    }
  }

  if (!project) {
    console.error("Project not found for Stripe payment:", {
      projectId,
      projectSlug,
      userId,
      metadata,
      sessionId: session.id,
      paymentIntentId,
    });
    // Don't throw - log and continue to create payment record anyway
    // The payment record can be linked later via the user API fix
    console.warn("Creating payment record without project link - will be fixed on next dashboard load");
  } else {
    console.log("Found project for payment:", {
      projectId: project.id,
      projectName: project.name,
      foundBy: projectId ? "metadata.projectId" : 
               (projectSlug ? "metadata.projectSlug" : 
               (project.checkout_session_id ? "checkout_session_id" : "fallback - most recent premium")),
      paymentIntentId,
    });
  }

  const isPremiumPlan = planType === "premium";

  // CRITICAL: Check for duplicate payment processing (idempotency)
  // First, check if payment record already exists
  const existingPayment = await db.findOne("payments", {
    payment_id: paymentIntentId,
    status: "completed",
  });

  if (existingPayment) {
    console.log("Payment already processed (idempotency check):", {
      paymentId: existingPayment.id,
      paymentIntentId,
      appId: existingPayment.app_id,
    });

    // If payment exists and is linked to a project, verify project is fully processed
    if (existingPayment.app_id && project) {
      const isFullyProcessed = 
        project.payment_status === true &&
        project.is_draft === false &&
        (!isPremiumPlan || (project.link_type === "dofollow" && project.dofollow_status === true));

      if (isFullyProcessed && project.order_id === paymentIntentId) {
        console.log("Stripe payment already fully processed for project:", {
          projectId: project.id,
          orderId: project.order_id,
        });
        return;
      }
    } else if (existingPayment.app_id) {
      // Payment exists and is linked, but project wasn't found in our search
      // Try to find the project one more time
      project = await db.findOne("apps", { id: existingPayment.app_id });
      if (project) {
        console.log("Found project linked to existing payment:", {
          projectId: project.id,
          projectName: project.name,
        });
      }
    }
  }

  // Check if project is fully processed (only if project exists)
  if (project) {
    const isFullyProcessed = 
      project.payment_status === true &&
      project.is_draft === false &&
      (!isPremiumPlan || (project.link_type === "dofollow" && project.dofollow_status === true));

    if (isFullyProcessed && project.order_id === paymentIntentId) {
      console.log("Stripe payment already fully processed for project:", {
        projectId: project.id,
        orderId: project.order_id,
      });
      return;
    }

    // If payment_status is true but project isn't fully processed (e.g., is_draft still true),
    // we need to fix it. This handles cases where webhook partially succeeded or there was a bug.
    if (project.payment_status === true && !isFullyProcessed) {
      console.log("Fixing partially processed project:", {
        projectId: project.id,
        is_draft: project.is_draft,
        link_type: project.link_type,
        dofollow_status: project.dofollow_status,
      });
      // Force re-processing to ensure all premium perks are applied
      // This will continue to the update logic below
    }
  }
  
  // CRITICAL: If project wasn't found initially but we have projectId in metadata,
  // try one more time after a short delay (handles race conditions where project is created after payment)
  if (!project && projectId) {
    // Wait a bit and try again (project might be created right after payment)
    await new Promise(resolve => setTimeout(resolve, 1000));
    project = await db.findOne("apps", { id: projectId });
    if (project) {
      console.log("Found project on retry after delay:", {
        projectId: project.id,
        projectName: project.name,
      });
    }
  }

  // CRITICAL: Only process if we have a project
  if (!project) {
    console.error("Cannot process payment - project not found. Payment record will be created but project won't be updated.", {
      projectId,
      projectSlug,
      userId,
      sessionId: session.id,
      paymentIntentId,
    });
    
    // If payment already exists (checked above), we've already tried to find project
    // If it still doesn't exist, create payment record for later linking
    if (!existingPayment) {
      // Create payment record for later linking
      await db.insertOne("payments", {
        user_id: userId,
        app_id: null, // Will be linked later
        plan: planType,
        amount: session.amount_total,
        currency: session.currency,
        payment_id: paymentIntentId,
        invoice_id: session.id,
        status: "completed",
        metadata: {
          provider: "stripe",
          checkoutSessionId: session.id,
          paymentIntentId,
          customerEmail: session.customer_details?.email,
          rawMetadata: metadata,
          liveMode: session.livemode,
          projectId: projectId || null,
          projectSlug: projectSlug || null,
        },
        paid_at: new Date(),
      });
      console.warn("Payment record created without project link. Will be automatically linked when project is found.");
      
      // Wait a bit and try to find project one more time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (projectId) {
        project = await db.findOne("apps", { id: projectId });
      }
      if (!project && session.id && userId) {
        project = await db.findOne("apps", {
          checkout_session_id: session.id,
          submitted_by: userId,
        });
      }
      
      if (!project) {
        console.warn("Project still not found after creating payment record. Will be linked on dashboard load.");
        return; // Exit early - can't process without project
      } else {
        console.log("Found project after creating payment record:", {
          projectId: project.id,
          projectName: project.name,
        });
      }
    }
  }

  // If this is an upgrade (has pending launch info), apply it after payment succeeds
  const isUpgrade = !!project.pending_launch_week;
  const setData = {
    plan: planType,
    payment_status: true,
    order_id: paymentIntentId,
    scheduled_launch: true,
    status: "pending",
    is_draft: false,
  };

  // Only update payment_date if it wasn't already set (to preserve original payment date)
  if (!project.payment_date) {
    setData.payment_date = new Date();
  }

  // If upgrading, apply pending launch info to actual launch fields
  if (isUpgrade && project.pending_launch_week) {
    setData.launch_week = project.pending_launch_week;
    setData.launch_date = project.pending_launch_date;
    setData.weekly_competition_id = project.pending_weekly_competition_id;
    setData.launch_month = project.pending_launch_month;
  }

  // CRITICAL: Ensure premium perks are ALWAYS applied when upgrading/creating premium
  // This must run even if project already has payment_status = true to fix any missing perks
  if (isPremiumPlan) {
    // Always set premium perks, even if they were partially set before
    Object.assign(setData, {
      premium_badge: true,
      skip_queue: true,
      social_promotion: true,
      guaranteed_backlinks:
        typeof project.guaranteed_backlinks === "number"
          ? project.guaranteed_backlinks
          : 3,
      // Premium plans ALWAYS get dofollow backlinks - this is critical
      link_type: "dofollow",
      dofollow_status: true,
      dofollow_reason: "premium_plan",
      // Only set dofollow_awarded_at if it wasn't already set (preserve original date)
      dofollow_awarded_at: project.dofollow_awarded_at || new Date(),
    });
    
    console.log("Applying premium perks (including dofollow) for premium plan:", {
      projectId: project.id,
      currentLinkType: project.link_type,
      currentDofollowStatus: project.dofollow_status,
      willSetLinkType: "dofollow",
      willSetDofollowStatus: true,
    });
  }

  // Build update operation with $set and optional $unset
  const updateOperation = { $set: setData };
  
  // Clear pending and original fields after applying (only for upgrades)
  if (isUpgrade) {
    updateOperation.$unset = {
      pending_launch_week: "",
      pending_launch_date: "",
      pending_weekly_competition_id: "",
      pending_launch_month: "",
      original_launch_week: "",
      original_launch_date: "",
      original_weekly_competition_id: "",
      original_launch_month: "",
    };
  }

  console.log("🔄 [WEBHOOK] Updating project after payment:", {
    projectId: project.id,
    projectName: project.name,
    isPremiumPlan,
    isUpgrade,
    setDataKeys: Object.keys(setData),
    hasDofollow: setData.link_type === "dofollow",
    isDraftRemoved: setData.is_draft === false,
    paymentIntentId,
    scheduledLaunch: setData.scheduled_launch,
  });

  await db.updateOne(
    "apps",
    { id: project.id },
    updateOperation
  );

  // Refresh project with latest values
  const updatedProject = await db.findOne("apps", { id: project.id });

  console.log("✅ [WEBHOOK] Project updated successfully:", {
    projectId: updatedProject.id,
    projectName: updatedProject.name,
    payment_status: updatedProject.payment_status,
    is_draft: updatedProject.is_draft,
    scheduled_launch: updatedProject.scheduled_launch,
    status: updatedProject.status,
    link_type: updatedProject.link_type,
    dofollow_status: updatedProject.dofollow_status,
    premium_badge: updatedProject.premium_badge,
    order_id: updatedProject.order_id,
  });

  // CRITICAL: Verify that premium perks were applied correctly
  // If not, fix them immediately (handles edge cases where update might have failed)
  if (isPremiumPlan) {
    const needsFix = 
      updatedProject.link_type !== "dofollow" ||
      updatedProject.dofollow_status !== true ||
      !updatedProject.premium_badge ||
      updatedProject.dofollow_reason !== "premium_plan";

    if (needsFix) {
      console.warn("Premium perks not fully applied, fixing immediately:", {
        projectId: updatedProject.id,
        link_type: updatedProject.link_type,
        dofollow_status: updatedProject.dofollow_status,
        premium_badge: updatedProject.premium_badge,
        dofollow_reason: updatedProject.dofollow_reason,
      });

      // Force fix premium perks
      await db.updateOne(
        "apps",
        { id: project.id },
        {
          $set: {
            premium_badge: true,
            link_type: "dofollow",
            dofollow_status: true,
            dofollow_reason: "premium_plan",
            dofollow_awarded_at: updatedProject.dofollow_awarded_at || new Date(),
          },
        }
      );

      console.log("Fixed premium perks for project:", project.id);
    }
  }

  // For premium plans, increment competition submission counters AFTER payment
  if (isPremiumPlan && updatedProject.weekly_competition_id) {
    try {
      await db.updateOne(
        "competitions",
        { id: updatedProject.weekly_competition_id },
        {
          $inc: {
            total_submissions: 1,
            premium_submissions: 1,
          },
          $set: { updated_at: new Date() },
        }
      );
    } catch (compError) {
      console.error("Failed to update competition counts for premium payment:", {
        competitionId: updatedProject.weekly_competition_id,
        error: compError,
      });
    }
  }

  // Create payment record - only if it doesn't already exist (idempotency)
  // Always include app_id if project was found
  if (!existingPayment) {
    await db.insertOne("payments", {
      user_id: userId || project?.submitted_by,
      app_id: project?.id || null, // Link to project if found, null otherwise (will be fixed later)
      plan: planType,
      amount: session.amount_total,
      currency: session.currency,
      payment_id: paymentIntentId,
      invoice_id: session.id,
      status: "completed",
      metadata: {
        provider: "stripe",
        checkoutSessionId: session.id,
        paymentIntentId,
        customerEmail: session.customer_details?.email,
        rawMetadata: metadata,
        liveMode: session.livemode,
        // Store project identifiers in metadata for later linking
        projectId: projectId || project?.id,
        projectSlug: projectSlug || project?.slug,
      },
      paid_at: new Date(),
    });
    console.log("Payment record created:", {
      paymentIntentId,
      appId: project?.id || null,
      userId: userId || project?.submitted_by,
    });
  } else {
    console.log("Payment record already exists, skipping creation:", {
      paymentId: existingPayment.id,
      paymentIntentId,
    });
    
    // If payment exists but wasn't linked to project, try to link it now
    if (project && !existingPayment.app_id) {
      await db.updateOne("payments", { id: existingPayment.id }, {
        $set: { app_id: project.id }
      });
      console.log("Linked existing payment to project:", {
        paymentId: existingPayment.id,
        projectId: project.id,
      });
    }
  }
  
  // If project wasn't found, try to link payment to project using metadata
  if (!project && projectId) {
    const foundProject = await db.findOne("apps", { id: projectId });
    if (foundProject) {
      await db.updateOne("payments", { payment_id: paymentIntentId }, {
        $set: { app_id: foundProject.id }
      });
      // Process the project now that we found it
      project = foundProject;
      // Re-run the update logic (but skip payment record creation)
      const setData = {
        plan: planType,
        payment_status: true,
        order_id: paymentIntentId,
        scheduled_launch: true,
        status: "pending",
        is_draft: false,
        payment_date: new Date(),
      };
      
      if (isPremiumPlan) {
        Object.assign(setData, {
          premium_badge: true,
          skip_queue: true,
          social_promotion: true,
          guaranteed_backlinks: typeof project.guaranteed_backlinks === "number" ? project.guaranteed_backlinks : 3,
          // CRITICAL: Always set dofollow for premium plans
          link_type: "dofollow",
          dofollow_status: true,
          dofollow_reason: "premium_plan",
          dofollow_awarded_at: project.dofollow_awarded_at || new Date(),
        });
      }
      
      await db.updateOne("apps", { id: project.id }, { $set: setData });
      
      // Verify dofollow was applied
      const verifiedProject = await db.findOne("apps", { id: project.id });
      if (isPremiumPlan && (verifiedProject.link_type !== "dofollow" || verifiedProject.dofollow_status !== true)) {
        console.warn("Dofollow not applied correctly, fixing:", {
          projectId: project.id,
          link_type: verifiedProject.link_type,
          dofollow_status: verifiedProject.dofollow_status,
        });
        await db.updateOne("apps", { id: project.id }, {
          $set: {
            link_type: "dofollow",
            dofollow_status: true,
            dofollow_reason: "premium_plan",
            dofollow_awarded_at: verifiedProject.dofollow_awarded_at || new Date(),
          },
        });
      }
      
      console.log("Linked and processed project after payment record creation:", project.id);
    }
  }

  // Send Discord notification for premium listing purchases
  if (isPremiumPlan) {
    const customerEmail = session.customer_details?.email || updatedProject.contact_email || "N/A";
    await sendDiscordNotification({
      toolName: updatedProject.name || "Unknown",
      email: customerEmail,
      amount: session.amount_total,
      currency: session.currency,
    });
  }

  console.log("🎉 [WEBHOOK] Stripe payment processed successfully for project:", {
    projectId: project.id,
    projectName: project.name,
    paymentIntentId,
    sessionId: session.id,
    isPremiumPlan,
    hasDofollow: updatedProject.link_type === "dofollow",
    timestamp: new Date().toISOString(),
  });
}

async function handleChargeRefunded(charge) {
  const paymentIntentId = charge.payment_intent;

  const project =
    (paymentIntentId &&
      (await db.findOne("apps", { order_id: paymentIntentId }))) ||
    (await db.findOne("apps", { order_id: charge.id }));

  if (!project) {
    console.warn("Refund received but project not found", {
      chargeId: charge.id,
      paymentIntentId,
    });
    return;
  }

  await db.updateOne(
    "apps",
    { id: project.id },
    {
      $set: {
        plan: "standard",
        payment_status: false,
      },
      $unset: {
        premium_badge: "",
        skip_queue: "",
      },
    }
  );

  await db.updateOne(
    "payments",
    { payment_id: paymentIntentId || charge.id },
    {
      $set: {
        status: "refunded",
        refunded_at: new Date(),
      },
    }
  );

  console.log("🔄 [WEBHOOK] Stripe payment refunded for project:", {
    projectId: project.id,
    projectName: project.name,
    chargeId: charge.id,
    paymentIntentId,
  });
}

// Handle async payment failed
async function handleCheckoutSessionAsyncPaymentFailed(session) {
  console.warn("⚠️ [WEBHOOK] Async payment failed for checkout session:", {
    sessionId: session.id,
    paymentStatus: session.payment_status,
    customerEmail: session.customer_details?.email,
  });

  // Find project by checkout_session_id
  const project = await db.findOne("apps", {
    checkout_session_id: session.id,
  });

  if (project) {
    // Keep project as draft, don't activate premium features
    console.log("Async payment failed - keeping project as draft:", {
      projectId: project.id,
      projectName: project.name,
    });

    // Optionally notify user about payment failure
    // (You can add email notification here if needed)
  }
}

// Handle payment intent succeeded (backup verification)
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log("✅ [WEBHOOK] Payment intent succeeded:", {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    metadata: paymentIntent.metadata,
  });

  // Check if this payment was already processed via checkout.session.completed
  const existingPayment = await db.findOne("payments", {
    payment_id: paymentIntent.id,
    status: "completed",
  });

  if (existingPayment) {
    console.log("Payment already processed via checkout.session.completed:", {
      paymentIntentId: paymentIntent.id,
      paymentId: existingPayment.id,
    });
    return;
  }

  // If not processed, try to find and process the project
  // This is a backup in case checkout.session.completed didn't fire
  const metadata = paymentIntent.metadata || {};
  const projectId = metadata.projectId;
  
  if (projectId) {
    const project = await db.findOne("apps", { id: projectId });
    if (project && project.plan === "premium" && !project.payment_status) {
      console.log("Processing payment via payment_intent.succeeded backup:", {
        projectId: project.id,
        projectName: project.name,
      });
      
      // Process payment similar to handleCheckoutSessionCompleted
      // But use paymentIntent data instead of session data
      const updateData = {
        payment_status: true,
        is_draft: false,
        scheduled_launch: true,
        status: "pending",
        premium_badge: true,
        skip_queue: true,
        social_promotion: true,
        guaranteed_backlinks: typeof project.guaranteed_backlinks === "number" ? project.guaranteed_backlinks : 3,
        link_type: "dofollow",
        dofollow_status: true,
        dofollow_reason: "premium_plan",
        dofollow_awarded_at: new Date(),
        order_id: paymentIntent.id,
        payment_date: new Date(paymentIntent.created * 1000),
      };

      await db.updateOne("apps", { id: project.id }, { $set: updateData });

      // Create payment record
      await db.insertOne("payments", {
        user_id: project.submitted_by,
        app_id: project.id,
        plan: "premium",
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        payment_id: paymentIntent.id,
        invoice_id: null, // No checkout session for payment_intent events
        status: "completed",
        metadata: {
          provider: "stripe",
          paymentIntentId: paymentIntent.id,
          customerEmail: paymentIntent.receipt_email,
          rawMetadata: metadata,
          liveMode: paymentIntent.livemode,
          processedBy: "payment_intent.succeeded",
        },
        paid_at: new Date(paymentIntent.created * 1000),
      });

      console.log("✅ [WEBHOOK] Payment processed via payment_intent.succeeded:", {
        projectId: project.id,
        paymentIntentId: paymentIntent.id,
      });
    }
  }
}

// Handle payment intent failed
async function handlePaymentIntentFailed(paymentIntent) {
  console.warn("❌ [WEBHOOK] Payment intent failed:", {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    lastPaymentError: paymentIntent.last_payment_error,
    metadata: paymentIntent.metadata,
  });

  // Find project by payment intent ID
  const project = await db.findOne("apps", {
    order_id: paymentIntent.id,
  });

  if (project) {
    // Keep project as draft, don't activate premium features
    console.log("Payment failed - keeping project as draft:", {
      projectId: project.id,
      projectName: project.name,
      error: paymentIntent.last_payment_error?.message,
    });

    // Optionally update project with payment failure info
    await db.updateOne("apps", { id: project.id }, {
      $set: {
        payment_status: false,
        is_draft: true,
        scheduled_launch: false,
        payment_failed_at: new Date(),
        payment_failure_reason: paymentIntent.last_payment_error?.message || "Payment failed",
      },
    });
  }
}

// Handle charge dispute created (chargeback)
async function handleChargeDisputeCreated(dispute) {
  console.warn("⚠️ [WEBHOOK] Charge dispute (chargeback) created:", {
    disputeId: dispute.id,
    chargeId: dispute.charge,
    amount: dispute.amount,
    currency: dispute.currency,
    reason: dispute.reason,
    status: dispute.status,
  });

  // Find project by charge ID
  const chargeId = dispute.charge;
  const payment = await db.findOne("payments", {
    payment_id: chargeId,
    status: "completed",
  });

  if (payment && payment.app_id) {
    const project = await db.findOne("apps", { id: payment.app_id });
    
    if (project) {
      console.warn("Chargeback for premium project - revoking premium features:", {
        projectId: project.id,
        projectName: project.name,
        disputeId: dispute.id,
        reason: dispute.reason,
      });

      // Revoke premium features due to chargeback
      await db.updateOne("apps", { id: project.id }, {
        $set: {
          plan: "standard",
          payment_status: false,
          is_draft: true,
          scheduled_launch: false,
          link_type: "nofollow",
          dofollow_status: false,
          chargeback_dispute_id: dispute.id,
          chargeback_reason: dispute.reason,
          chargeback_created_at: new Date(),
        },
        $unset: {
          premium_badge: "",
          skip_queue: "",
          social_promotion: "",
          dofollow_reason: "",
          dofollow_awarded_at: "",
        },
      });

      // Update payment record
      await db.updateOne("payments", { id: payment.id }, {
        $set: {
          status: "disputed",
          disputed_at: new Date(),
          dispute_id: dispute.id,
        },
      });

      // TODO: Notify admin about chargeback
      // You can add email notification or Discord notification here
    }
  }
}

// GET method for verification/testing
export async function GET() {
  return NextResponse.json({
    message: "Stripe webhook endpoint",
    timestamp: new Date().toISOString(),
    ready: isStripeConfigured(),
  });
}
