import { NextResponse } from "next/server";
import { createPromotionCheckoutSession, isStripeConfigured } from '@/lib/payments/polar';
import { getSession } from '@/lib/supabase/auth';
import { db } from '@/lib/supabase/database';
import { z } from "zod";
import { featureGuard } from '@/lib/features';
import { advertisingConfig } from '@/config/advertising.config';

// GET /api/promotions - Get active promotions, optionally filtered by placement type
export async function GET(request: Request) {
  const guard = featureGuard('promotions');
  if (guard) return guard;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Return placement availability (active count vs maxActive)
    if (type === 'availability') {
      const { placements } = advertisingConfig.promotions;
      const [bannerCount, catalogCount, detailCount] = await Promise.all([
        db.count('promotions', { status: 'active', placement_banner: true }),
        db.count('promotions', { status: 'active', placement_catalog: true }),
        db.count('promotions', { status: 'active', placement_detail_page: true }),
      ]);
      return NextResponse.json({
        success: true,
        data: {
          banner: { active: bannerCount, max: placements.banner.maxActive, available: bannerCount < placements.banner.maxActive },
          catalog: { active: catalogCount, max: placements.catalog.maxActive, available: catalogCount < placements.catalog.maxActive },
          detailPage: { active: detailCount, max: placements.detailPage.maxActive, available: detailCount < placements.detailPage.maxActive },
        },
      });
    }

    const filter: Record<string, any> = { status: 'active' };
    if (type === 'banner') filter.placement_banner = true;
    if (type === 'catalog') filter.placement_catalog = true;
    if (type === 'detail') filter.placement_detail_page = true;

    const promotions = await db.find('promotions', filter, {
      sort: { position: 1, created_at: -1 },
      limit: 10,
    });

    return NextResponse.json({
      success: true,
      data: promotions.map((p: any) => ({
        id: p.id,
        name: p.name,
        short_description: p.short_description,
        logo_url: p.logo_url,
        website_url: p.website_url,
        cta_text: p.cta_text,
        placement_banner: p.placement_banner,
        placement_catalog: p.placement_catalog,
        placement_detail_page: p.placement_detail_page,
      })),
    });
  } catch (error: any) {
    console.error("Promotions API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch promotions" },
      { status: 500 }
    );
  }
}

// Validation schema
const PromotionSubmissionSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be 100 characters or less"),
  short_description: z
    .string()
    .min(1, "Description is required")
    .max(200, "Description must be 200 characters or less"),
  logo_url: z.string().url("Please enter a valid logo URL"),
  website_url: z.string().url("Please enter a valid website URL"),
  cta_text: z
    .string()
    .max(20, "CTA text must be 20 characters or less")
    .optional()
    .nullable(),
  app_id: z.string().uuid().optional().nullable(),
  placement_banner: z.boolean().default(false),
  placement_catalog: z.boolean().default(false),
  placement_detail_page: z.boolean().default(false),
});

// POST /api/promotions - Create promotion and Stripe checkout session
export async function POST(request: Request) {
  const guard = featureGuard('promotions');
  if (guard) return guard;

  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Payment provider is not configured.", code: "PAYMENT_PROVIDER_NOT_CONFIGURED" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const validationResult = PromotionSubmissionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // At least one placement must be selected
    if (!data.placement_banner && !data.placement_catalog && !data.placement_detail_page) {
      return NextResponse.json(
        { error: "At least one placement type must be selected.", code: "NO_PLACEMENT" },
        { status: 400 }
      );
    }

    // Enforce maxActive limits — reject if placement is sold out
    const { placements } = advertisingConfig.promotions;
    if (data.placement_banner) {
      const count = await db.count('promotions', { status: 'active', placement_banner: true });
      if (count >= placements.banner.maxActive) {
        return NextResponse.json(
          { error: "Banner placement is currently sold out.", code: "PLACEMENT_SOLD_OUT" },
          { status: 409 }
        );
      }
    }
    if (data.placement_catalog) {
      const count = await db.count('promotions', { status: 'active', placement_catalog: true });
      if (count >= placements.catalog.maxActive) {
        return NextResponse.json(
          { error: "Catalog placement is currently sold out.", code: "PLACEMENT_SOLD_OUT" },
          { status: 409 }
        );
      }
    }
    if (data.placement_detail_page) {
      const count = await db.count('promotions', { status: 'active', placement_detail_page: true });
      if (count >= placements.detailPage.maxActive) {
        return NextResponse.json(
          { error: "Detail page placement is currently sold out.", code: "PLACEMENT_SOLD_OUT" },
          { status: 409 }
        );
      }
    }

    // Build Stripe line items based on selected placements
    const lineItems: { price: string; quantity: number }[] = [];

    if (data.placement_banner) {
      if (!placements.banner.priceId) {
        return NextResponse.json(
          { error: "Banner placement price is not configured.", code: "PRICE_NOT_CONFIGURED" },
          { status: 500 }
        );
      }
      lineItems.push({ price: placements.banner.priceId, quantity: 1 });
    }
    if (data.placement_catalog) {
      if (!placements.catalog.priceId) {
        return NextResponse.json(
          { error: "Catalog placement price is not configured.", code: "PRICE_NOT_CONFIGURED" },
          { status: 500 }
        );
      }
      lineItems.push({ price: placements.catalog.priceId, quantity: 1 });
    }
    if (data.placement_detail_page) {
      if (!placements.detailPage.priceId) {
        return NextResponse.json(
          { error: "Detail page placement price is not configured.", code: "PRICE_NOT_CONFIGURED" },
          { status: 500 }
        );
      }
      lineItems.push({ price: placements.detailPage.priceId, quantity: 1 });
    }

    // Create promotion record
    const promotionResult = await db.insertOne("promotions", {
      user_id: session.user.id,
      app_id: data.app_id || null,
      name: data.name,
      short_description: data.short_description,
      logo_url: data.logo_url,
      website_url: data.website_url,
      cta_text: data.cta_text || null,
      placement_banner: data.placement_banner,
      placement_catalog: data.placement_catalog,
      placement_detail_page: data.placement_detail_page,
      monthly_price: 0, // Will be set from Stripe session
      status: "pending",
    });

    const promotionId = promotionResult.insertedId;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl = `${baseUrl}/promote?success=true`;
    const cancelUrl = `${baseUrl}/promote?canceled=true`;

    // Apply bundle discount coupon when all 3 placements are selected
    const allThreeSelected = data.placement_banner && data.placement_catalog && data.placement_detail_page;
    const couponId = allThreeSelected ? advertisingConfig.promotions.allThreeDiscountCouponId : null;

    const checkout = await createPromotionCheckoutSession({
      lineItems,
      customerEmail: session.user.email,
      promotionData: {
        id: promotionId,
        name: data.name,
        placementBanner: data.placement_banner,
        placementCatalog: data.placement_catalog,
        placementDetailPage: data.placement_detail_page,
      },
      successUrl,
      cancelUrl,
      userId: session.user.id,
      couponId,
    });

    // Update promotion with checkout session ID
    await db.updateOne(
      "promotions",
      { id: promotionId },
      { $set: { checkout_session_id: checkout.sessionId } }
    );

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: checkout.url,
        checkoutId: checkout.sessionId,
        promotionId,
      },
    });
  } catch (error: any) {
    console.error("Promotion submission error:", {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        error: "Failed to process promotion submission",
        code: "INTERNAL_ERROR",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
