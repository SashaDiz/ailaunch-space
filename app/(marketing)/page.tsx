import { db } from "@/lib/supabase/database";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site.config";
import { directoryConfig } from "@/config/directory.config";
import {
  parseCatalogParams,
  catalogCanonical,
  catalogRobots,
  hasActiveFilter,
} from "@/lib/catalog-url";
import { getCatalogProjects } from "@/lib/projects-query";
import HomePageClient from "./HomePageClient";

export const revalidate = 300; // ISR: revalidate every 5 minutes

/**
 * Category list with live app-counts, grouped by sphere.
 * Independent of the catalog filter/page state, so it is cached once (per
 * revalidate window) instead of recomputing N `db.count` calls per request.
 */
const getCategoriesWithCounts = unstable_cache(
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

export async function generateMetadata({ searchParams }) {
  const state = parseCatalogParams(await searchParams);

  return {
    title: `${siteConfig.name} - ${siteConfig.tagline}`,
    description: siteConfig.description,
    alternates: {
      canonical: catalogCanonical(state, "/"),
    },
    robots: catalogRobots(state, "/"),
    openGraph: {
      title: `${siteConfig.name} - ${siteConfig.tagline}`,
      description: siteConfig.description,
      type: "website",
      url: siteConfig.url,
    },
  };
}

export default async function HomePage({ searchParams }) {
  const state = parseCatalogParams(await searchParams);

  // Invalid page param (NaN / < 1) → 404 on the requested URL.
  if (state.pageInvalid) notFound();

  const PAGE_SIZE = directoryConfig.pageSize;

  // Filters and pagination are mutually exclusive: any active filter shows all
  // matching items on one page; only the unfiltered listing is paginated.
  const showAll = hasActiveFilter(state);

  // Fetch the requested page server-side (grid is in the server HTML) and the
  // cached category list in parallel.
  const [result, categoriesWithCount] = await Promise.all([
    getCatalogProjects({
      categories: state.categories,
      pricing: state.pricing,
      sort: state.sort,
      q: state.q,
      page: state.page,
      limit: PAGE_SIZE,
      status: "live",
      all: showAll,
    }),
    getCategoriesWithCounts(),
  ]);

  const { projects, totalCount, totalPages, page } = result;

  // Pagination beyond the last page → 404 (only meaningful for the paginated,
  // unfiltered listing; filtered views always render a single page).
  if (!showAll && totalPages > 0 && page > totalPages) notFound();

  const activeCategories = categoriesWithCount.filter(
    (c) => (c.app_count ?? 0) > 0
  );

  // Group by sphere
  const grouped: Record<string, typeof activeCategories> = {};
  for (const cat of activeCategories) {
    const sphere = cat.sphere || "Other";
    if (!grouped[sphere]) grouped[sphere] = [];
    grouped[sphere].push(cat);
  }

  // Serialize to ensure plain objects (no Date instances, etc.)
  const serializedProjects = JSON.parse(JSON.stringify(projects));

  return (
    <HomePageClient
      initialProjects={serializedProjects}
      initialCategories={activeCategories}
      initialGroupedCategories={grouped}
      initialPagination={{ page, totalPages, totalCount }}
      initialState={state}
    />
  );
}
