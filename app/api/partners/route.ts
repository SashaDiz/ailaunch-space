import { NextResponse } from "next/server";
import { createStripeSubscriptionCheckoutSession, isStripeConfigured } from '@/lib/payments/polar';
import { getSession } from '@/lib/supabase/auth';
import { db } from '@/lib/supabase/database';
import { z } from "zod";
import { featureGuard } from '@/lib/features';

// GET /api/partners - Get active partners for display
export async function GET() {
  const guard = featureGuard('partners');
  if (guard) return guard;

  try {
    // Fetch active partners ordered by position
    const partners = await db.find(
      "partners",
      { status: "active" },
      {
        sort: { position: 1, created_at: -1 },
        limit: 8,
      }
    );

    return NextResponse.json({
      success: true,
      data: partners.map(partner => ({
        id: partner.id,
        name: partner.name,
        description: partner.description,
        logo: partner.logo,
        website_url: partner.website_url,
      })),
    });
  } catch (error) {
    console.error("Partners API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch partners" },
      { status: 500 }
    );
  }
}

// Validation schema for partner (sponsor) submission: logo, short description, website only
const PartnerSubmissionSchema = z.object({
  name: z.string().max(100).optional(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(200, "Description must be 200 characters or less"),
  logo: z.string().url("Please enter a valid logo URL"),
  website_url: z.string().url("Please enter a valid website URL"),
});

// POST /api/partners - Create partner submission and Stripe checkout session
export async function POST(request) {
  const guard = featureGuard('partners');
  if (guard) return guard;

  try {
    // Check authentication
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          error: "Authentication required. Please sign in to become a partner.",
          code: "UNAUTHORIZED"
        },
        { status: 401 }
      );
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error: "Payment provider is not configured. Please contact support.",
          code: "PAYMENT_PROVIDER_NOT_CONFIGURED",
        },
        { status: 500 }
      );
    }

    // Get partner subscription product ID from environment
    const partnerPriceId = process.env.POLAR_PRODUCT_ID_PARTNER_SUBSCRIPTION;
    if (!partnerPriceId) {
      return NextResponse.json(
        { 
          error: "Partner subscription price is not configured.",
          code: "PRICE_NOT_CONFIGURED"
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = PartnerSubmissionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { name, description, logo, website_url } = validationResult.data;

    // Create partner record in database (pending status until payment)
    const partnerData = {
      name: name ?? "",
      description,
      logo,
      website_url,
      user_id: session.user.id,
      status: "pending",
      created_at: new Date(),
      updated_at: new Date(),
    };

    const partnerResult = await db.insertOne("partners", partnerData);
    const partnerId = partnerResult.insertedId;

    // Create success and cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl = `${baseUrl}/sponsor?success=true`;
    const cancelUrl = `${baseUrl}/sponsor?canceled=true`;

    // Create Stripe subscription checkout session
    const checkout = await createStripeSubscriptionCheckoutSession({
      priceId: partnerPriceId,
      customerEmail: session.user.email,
      partnerData: {
        name: name ?? "",
        logo,
        description,
      },
      successUrl,
      cancelUrl,
      userId: session.user.id,
    });

    // Update partner with checkout session ID
    await db.updateOne(
      "partners",
      { id: partnerId },
      {
        $set: {
          checkout_session_id: checkout.sessionId,
          updated_at: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: checkout.url,
        checkoutId: checkout.sessionId,
        partnerId: partnerId,
      },
    });

  } catch (error) {
    console.error("Partner API error:", {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { 
        error: "Failed to process partner submission",
        code: "INTERNAL_ERROR",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
