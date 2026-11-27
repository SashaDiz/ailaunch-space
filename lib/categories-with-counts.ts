import { unstable_cache } from "next/cache";
import { db } from "@/lib/supabase/database";

/**
 * Category list with live app-counts, grouped by sphere.
 * Independent of the catalog filter/page state, so it is cached once (per
 * revalidate window) instead of recomputing N `db.count` calls per request.
 */
export const getCategoriesWithCounts = unstable_cache(
  async () => {
    const allCategories = await db.find(
      "categories",
      {},
      { sort: { sort_order: 1, name: 1 } }
    );

    return Promise.all(
      allCategories.map(async (cat) => {
        const identifiers = [cat.name, cat.slug].filter(Boolean);
        const count = await db.count("apps", {
          status: "live",
          categories: { $overlaps: identifiers },
        });
        return {
          slug: cat.slug,
          name: cat.name,
          app_count: count,
          sphere: cat.sphere,
        };
      })
    );
  },
  ["catalog-categories-with-counts"],
  { revalidate: 300, tags: ["categories"] }
);
