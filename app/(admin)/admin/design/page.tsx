import { db } from "@/lib/supabase/database";
import { DesignTabs } from "@/components/admin/DesignTabs";

// Pull a real live project so the card preview shows an actual logo + cover
// image from the database instead of a placeholder. Falls back to the editor's
// built-in sample when the catalog is empty.
async function getSampleProject() {
  try {
    const candidates = await db.find(
      "apps",
      { status: "live" },
      { sort: { premium_badge: -1, created_at: -1 }, limit: 50 }
    );
    const pick =
      candidates.find(
        (p: any) => p.logo_url && Array.isArray(p.screenshots) && p.screenshots[0]
      ) ||
      candidates.find((p: any) => p.logo_url) ||
      candidates[0] ||
      null;
    if (!pick) return null;
    return {
      id: pick.id,
      name: pick.name,
      slug: pick.slug,
      website_url: pick.website_url || "",
      logo_url: pick.logo_url || "",
      short_description: pick.short_description || "",
      full_description: "",
      categories: Array.isArray(pick.categories) ? pick.categories : [],
      pricing: pick.pricing || "",
      plan: pick.plan || "standard",
      views: pick.views ?? 0,
      screenshots: Array.isArray(pick.screenshots) ? pick.screenshots : [],
      link_type: pick.link_type || "nofollow",
      average_rating: pick.average_rating ?? 0,
      ratings_count: pick.ratings_count ?? 0,
    };
  } catch {
    return null;
  }
}

export default async function AdminDesignPage() {
  const sampleProject = await getSampleProject();
  return <DesignTabs sampleProject={sampleProject} />;
}
