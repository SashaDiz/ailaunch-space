import { NextResponse } from "next/server";
import { createCheckoutSession } from "../../libs/lemonsqueezy.js";
import { db } from "../../libs/database.js";
import { getSession } from "../../libs/auth-supabase.js";

// POST /api/payments - Create a Lemon Squeezy checkout session
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
    const { planType, directoryId, directoryData, customerEmail } = body;

    console.log('Payment API - Creating checkout session:', {
      planType,
      directoryId,
      userId: session.user.id,
      userEmail: session.user.email,
      customerEmailFromForm: customerEmail,
      finalEmail: customerEmail || session.user.email
    });

    // Validate required fields
    if (!planType || !directoryId) {
      return NextResponse.json(
        { 
          error: "Missing required fields: planType and directoryId are required",
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

    // Verify the directory exists and belongs to the user
    const directory = await db.findOne("apps", { 
      id: directoryId 
    });

    if (!directory) {
      return NextResponse.json(
        { 
          error: "Directory not found",
          code: "DIRECTORY_NOT_FOUND"
        },
        { status: 404 }
      );
    }

    // Verify ownership
    if (directory.submitted_by !== session.user.id) {
      return NextResponse.json(
        { 
          error: "You don't have permission to process payment for this directory",
          code: "FORBIDDEN"
        },
        { status: 403 }
      );
    }

    // Create success and cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_URL || `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`;
    const successUrl = `${baseUrl}/submit?payment=success&directoryId=${directoryId}`;
    const cancelUrl = `${baseUrl}/submit?payment=cancelled&step=1`;

    console.log('Payment URLs configured:', {
      baseUrl,
      successUrl,
      cancelUrl
    });

    // Create Lemon Squeezy checkout session
    try {
      console.log('Creating checkout session with validated email:', emailToUse);
      
      const checkout = await createCheckoutSession({
        planType,
        customerEmail: emailToUse, // Use the validated email
        directoryData: {
          name: directoryData?.name || directory.name,
          slug: directoryData?.slug || directory.slug,
          description: directoryData?.description || directory.short_description,
          website_url: directoryData?.website_url || directory.website_url,
        },
        successUrl,
        cancelUrl,
        userId: session.user.id
      });

      console.log('✅ Checkout session created successfully:', {
        checkoutId: checkout.checkoutId,
        hasUrl: !!checkout.url
      });

      // Update directory with checkout session info
      await db.updateOne(
        "apps",
        { id: directoryId },
        {
          $set: {
            checkout_session_id: checkout.checkoutId,
            payment_initiated_at: new Date(),
            updated_at: new Date()
          }
        }
      );

      return NextResponse.json({
        success: true,
        data: {
          checkoutUrl: checkout.url,
          checkoutId: checkout.checkoutId,
          planType,
          amount: 15, // Premium plan price
          currency: 'USD'
        }
      });

    } catch (checkoutError) {
      console.error('❌ Lemon Squeezy checkout creation failed:', {
        message: checkoutError.message,
        stack: checkoutError.stack
      });

      return NextResponse.json(
        { 
          error: "Failed to create payment checkout session",
          code: "CHECKOUT_CREATION_FAILED",
          details: checkoutError.message
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
    const directoryId = searchParams.get("directoryId");

    if (type === "status" && directoryId) {
      // Check payment status for a directory
      const directory = await db.findOne("apps", { 
        id: directoryId,
        submitted_by: session.user.id 
      });

      if (!directory) {
        return NextResponse.json(
          { 
            error: "Directory not found",
            code: "DIRECTORY_NOT_FOUND"
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        directoryId,
        paymentStatus: directory.payment_status || false,
        checkoutSessionId: directory.checkout_session_id || null,
        paymentDate: directory.payment_date || null,
        orderId: directory.order_id || null
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

