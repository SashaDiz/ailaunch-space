import { NextResponse } from "next/server";
import { createPromotionCheckoutSession, isDodoConfigured } from '@/lib/payments/dodo';
import { getSession } from '@/lib/supabase/auth';
import { db } from '@/lib/supabase/database';
import { z } from "zod";
import { featureGuard } from '@/lib/features';
import { advertisingConfig, placementKeys, type PlacementKey } from '@/config/advertising.config';
import {
  adsForPlacement,
  availability,
  holdsWithinCapacity,
  type SlotRow,
} from '@/lib/ad-slots';

const { placements, checkoutHoldMinutes } = advertisingConfig.promotions;
const HOLD_MS = checkoutHoldMinutes * 60_000;

/** `catalog` is the rails' old name: pages open during a deploy still ask for it. */
const PLACEMENT_BY_TYPE: Record<string, PlacementKey> = {
  banner: 'banner',
  rail: 'rail',
  catalog: 'rail',
  logo: 'logo',
  detail: 'detailPage',
};

/** Every row that can hold a spot or show on the site. */
function loadSlotRows(): Promise<SlotRow[]> {
  return db.find(
    'promotions',
    { status: { $in: ['active', 'pending'] } },
    { limit: 200 }
  ) as Promise<SlotRow[]>;
}

function placementAvailability(rows: SlotRow[], key: PlacementKey, now: number) {
  const { column, maxActive } = placements[key];
  return availability(rows, column, maxActive, HOLD_MS, now);
}

// GET /api/promotions - Ads to show, optionally filtered by placement
export async function GET(request: Request) {
  const guard = featureGuard('promotions');
  if (guard) return guard;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const rows = await loadSlotRows();
    const now = Date.now();

    if (type === 'availability') {
      return NextResponse.json({
        success: true,
        data: Object.fromEntries(
          placementKeys.map((key) => [key, placementAvailability(rows, key, now)])
        ),
      });
    }

    const key = type ? PLACEMENT_BY_TYPE[type] : undefined;
    const ads = key
      ? adsForPlacement(rows, placements[key].column, placements[key].maxActive, now)
      : rows.filter((row) => row.status === 'active');

    return NextResponse.json({
      success: true,
      // Lets a placement advertise an open spot only while one can be bought.
      available: key ? placementAvailability(rows, key, now).available : undefined,
      data: ads.map((p: any) => ({
        id: p.id,
        name: p.name,
        short_description: p.short_description,
        logo_url: p.logo_url,
        wordmark_url: p.wordmark_url,
        website_url: p.website_url,
        cta_text: p.cta_text,
        banner_text: p.banner_text,
        catalog_detail_text: p.catalog_detail_text,
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

const httpUrl = (message: string) =>
  z.string().url(message).refine((value) => /^https?:\/\//i.test(value), message);

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
  logo_url: httpUrl("Please enter a valid logo URL"),
  wordmark_url: httpUrl("Please enter a valid logo URL").optional().nullable(),
  website_url: httpUrl("Please enter a valid website URL"),
  cta_text: z
    .string()
    .max(advertisingConfig.promotions.ctaMaxLength, "CTA text is too long")
    .optional()
    .nullable(),
  banner_text: z
    .string()
    .max(50, "Top banner text must be 50 characters or less")
    .optional()
    .nullable(),
  catalog_detail_text: z
    .string()
    .max(100, "Card text must be 100 characters or less")
    .optional()
    .nullable(),
  app_id: z.string().uuid().optional().nullable(),
  placement_banner: z.boolean().default(false),
  placement_catalog: z.boolean().default(false),
  placement_logo: z.boolean().default(false),
  placement_detail_page: z.boolean().default(false),
});

function soldOut(key: PlacementKey) {
  return NextResponse.json(
    { error: `${placements[key].name} is currently sold out.`, code: "PLACEMENT_SOLD_OUT" },
    { status: 409 }
  );
}

// POST /api/promotions - Hold a spot and create a one-time checkout for it
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

    if (!isDodoConfigured()) {
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
    const selected = placementKeys.filter((key) => data[placements[key].column]);

    if (selected.length === 0) {
      return NextResponse.json(
        { error: "At least one placement type must be selected.", code: "NO_PLACEMENT" },
        { status: 400 }
      );
    }

    const unpriced = selected.find((key) => !placements[key].priceId);
    if (unpriced) {
      return NextResponse.json(
        { error: `${placements[unpriced].name} price is not configured.`, code: "PRICE_NOT_CONFIGURED" },
        { status: 500 }
      );
    }

    const rows = await loadSlotRows();
    const now = Date.now();
    const full = selected.find((key) => !placementAvailability(rows, key, now).available);
    if (full) return soldOut(full);

    const promotionResult = await db.insertOne("promotions", {
      user_id: session.user.id,
      app_id: data.app_id || null,
      name: data.name,
      short_description: data.short_description,
      logo_url: data.logo_url,
      wordmark_url: data.wordmark_url || null,
      website_url: data.website_url,
      cta_text: data.cta_text || null,
      banner_text: data.banner_text || null,
      catalog_detail_text: data.catalog_detail_text || null,
      placement_banner: data.placement_banner,
      placement_catalog: data.placement_catalog,
      placement_logo: data.placement_logo,
      placement_detail_page: data.placement_detail_page,
      status: "pending",
    });
    const promotionId = String(promotionResult.insertedId);

    try {
      // The check above can't see a checkout that started at the same moment.
      const held = await loadSlotRows();
      const lost = selected.find(
        (key) =>
          !holdsWithinCapacity(
            held,
            placements[key].column,
            placements[key].maxActive,
            HOLD_MS,
            promotionId,
            Date.now()
          )
      );
      if (lost) {
        await db.deleteOne("promotions", { id: promotionId });
        return soldOut(lost);
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const allPlacements = selected.length === placementKeys.length;

      const checkout = await createPromotionCheckoutSession({
        lineItems: selected.map((key) => ({ price: placements[key].priceId, quantity: 1 })),
        customerEmail: session.user.email,
        promotionData: {
          id: promotionId,
          name: data.name,
          placements: selected,
        },
        successUrl: `${baseUrl}/promote?success=true`,
        cancelUrl: `${baseUrl}/promote?canceled=true`,
        userId: session.user.id,
        couponId: allPlacements ? advertisingConfig.promotions.bundleDiscountCode : null,
      });

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
    } catch (error) {
      // No checkout means no customer: don't keep their spot from anyone else.
      await db.deleteOne("promotions", { id: promotionId }).catch(() => undefined);
      throw error;
    }
  } catch (error: any) {
    console.error("Promotion submission error:", {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        error: "Failed to process promotion submission",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
