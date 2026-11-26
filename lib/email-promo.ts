/**
 * Sponsors and featured projects for the bottom of every email. Server-only.
 *
 * Sponsors follow the same rules as the side-rail ad spots on the site (paid
 * ads first, house ads fill the rest), so an email never shows an ad that is
 * not running. Featured projects are the newest live Premium listings.
 * Cached for 10 minutes; any failure just leaves the block empty.
 */
import { db } from '@/lib/supabase/database';
import { advertisingConfig } from '@/config/advertising.config';
import { adsForPlacement, type SlotRow } from '@/lib/ad-slots';
import type { EmailPromo } from '@/lib/email-templates';

const TTL_MS = 10 * 60 * 1000;
let cache: { at: number; promo: EmailPromo } | null = null;

export async function getEmailPromo(): Promise<EmailPromo> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.promo;
  const promo: EmailPromo = { sponsors: [], featured: [] };

  try {
    const rows = (await db.find('promotions', { status: 'active' }, { limit: 200 })) as SlotRow[];
    const { column } = advertisingConfig.promotions.placements.rail;
    const seen = new Set<string>();
    for (const ad of adsForPlacement(rows, column, 8, Date.now()) as any[]) {
      // House ads can repeat a brand across placements: one card per site.
      const key = String(ad.website_url || ad.name).toLowerCase();
      if (seen.has(key) || !ad.website_url) continue;
      seen.add(key);
      promo.sponsors.push({
        name: ad.name,
        description: ad.short_description || ad.catalog_detail_text || null,
        logoUrl: ad.logo_url || null,
        url: ad.website_url,
        cta: ad.cta_text || null,
      });
      if (promo.sponsors.length === 2) break;
    }
  } catch (error) {
    console.error('Email sponsors unavailable:', error);
  }

  try {
    const projects = await db.find(
      'apps',
      { status: 'live', plan: 'premium', payment_status: true },
      { sort: { published_at: -1 }, limit: 3, projection: { name: 1, slug: 1, logo_url: 1, short_description: 1 } },
    );
    promo.featured = projects.map((p: any) => ({
      name: p.name,
      slug: p.slug,
      logoUrl: p.logo_url || null,
      tagline: p.short_description || null,
    }));
  } catch (error) {
    console.error('Email featured projects unavailable:', error);
  }

  cache = { at: Date.now(), promo };
  return promo;
}
