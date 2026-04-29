import { NextResponse } from "next/server";
import {
  createStripeCheckoutSession,
  paymentPlans,
  isStripeConfigured,
} from '@/lib/payments/polar';
import { db } from '@/lib/supabase/database';
import { getSession } from '@/lib/supabase/auth';

// POST /api/payments - Create a Stripe checkout session
export async function POST(request) {
  try {
    // Check authentication
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          error: "Authentication required. Please sign in to proceed with payment.",
          code: "UNAUTHORIZED"
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planType, projectId, projectData, customerEmail } = body;

    // Validate required fields
    if (!planType || !projectId) {
      return NextResponse.json(
        { 
          error: "Missing required fields: planType and projectId are required",
          code: "MISSING_FIELDS"
        },
        { status: 400 }
      );
    }

    // Validate plan type
    if (planType !== "premium") {
      return NextResponse.json(
        { 
          error: "Only premium plan requires payment",
          code: "INVALID_PLAN"
        },
        { status: 400 }
      );
    }

    // Validate email
    const emailToUse = customerEmail || session.user.email;
    if (!emailToUse || !emailToUse.includes('@')) {
      console.error('Invalid email for checkout:', { customerEmail, userEmail: session.user.email });
      return NextResponse.json(
        { 
          error: "Valid email is required for payment processing",
          code: "INVALID_EMAIL"
        },
        { status: 400 }
      );
    }

    // Verify the project exists and belongs to the user
    const project = await db.findOne("apps", { 
      id: projectId 
    });

    if (!project) {
      return NextResponse.json(
        { 
          error: "Project not found",
          code: "PROJECT_NOT_FOUND"
        },
        { status: 404 }
      );
    }

    // Verify ownership
    if (project.submitted_by !== session.user.id) {
      return NextResponse.json(
        { 
          error: "You don't have permission to process payment for this project",
          code: "FORBIDDEN"
        },
        { status: 403 }
      );
    }

    // Ensure Polar is ready
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error: "Polar is not configured. Please set POLAR_ACCESS_TOKEN, POLAR_PRODUCT_ID_PREMIUM, and POLAR_WEBHOOK_SECRET.",
          code: "PAYMENT_PROVIDER_NOT_CONFIGURED",
        },
        { status: 500 }
      );
    }

    // Create success and cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_URL || `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`;
    const successUrl = `${baseUrl}/submit?payment=success&projectId=${projectId}`;
    const cancelUrl = `${baseUrl}/submit?payment=cancelled&step=1`;

    // Create Stripe checkout session
    try {
      const checkout = await createStripeCheckoutSession({
        planType,
        customerEmail: emailToUse,
        projectId,
        projectData: {
          slug: project.slug, // Include slug for webhook fallback lookup
        },
        successUrl,
        cancelUrl,
        userId: session.user.id
      });

      // Update project with checkout session info
      await db.updateOne(
        "apps",
        { id: projectId },
        {
          $set: {
            checkout_session_id: checkout.sessionId,
            payment_initiated_at: new Date(),
            updated_at: new Date()
          }
        }
      );

      return NextResponse.json({
        success: true,
        data: {
          checkoutUrl: checkout.url,
          checkoutId: checkout.sessionId,
          planType,
          amount: paymentPlans.premium.price,
          currency: 'USD'
        }
      });

    } catch (checkoutError) {
      console.error('Polar checkout creation failed:', {
        message: checkoutError.message,
        stack: checkoutError.stack,
      });

      return NextResponse.json(
        {
          error: "Failed to create checkout session",
          code: "CHECKOUT_CREATION_FAILED",
          details: checkoutError.message,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Payment API error:', {
      message: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      { 
        error: "Failed to process payment request",
        code: "INTERNAL_ERROR",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// GET /api/payments - Check payment status
export async function GET(request) {
  try {
    // Check authentication
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          error: "Authentication required",
          code: "UNAUTHORIZED"
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const projectId = searchParams.get("projectId");

    if (type === "status" && projectId) {
      // Check payment status for a project
      const project = await db.findOne("apps", { 
        id: projectId,
        submitted_by: session.user.id 
      });

      if (!project) {
        return NextResponse.json(
          { 
            error: "Project not found",
            code: "PROJECT_NOT_FOUND"
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        projectId,
        paymentStatus: project.payment_status || false,
        checkoutSessionId: project.checkout_session_id || null,
        paymentDate: project.payment_date || null,
        orderId: project.order_id || null
      });
    }

    // Get user's payment history
    const payments = await db.find(
      "payments",
      { user_id: session.user.id },
      { 
        sort: { created_at: -1 },
        limit: 50
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        payments: payments.map(payment => ({
          id: payment.id,
          appId: payment.app_id,
          plan: payment.plan,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          paidAt: payment.paid_at,
          createdAt: payment.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { 
        error: "Failed to retrieve payment information",
        code: "INTERNAL_ERROR"
      },
      { status: 500 }
    );
  }
}

