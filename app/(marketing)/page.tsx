import { db } from "@/lib/supabase/database";
import { siteConfig } from "@/config/site.config";
import { directoryConfig } from "@/config/directory.config";
import HomePageClient from "./HomePageClient";

export const revalidate = 300; // ISR: revalidate every 5 minutes

export async function generateMetadata() {
  return {
    title: `${siteConfig.name} - ${siteConfig.tagline}`,
    description: siteConfig.description,
    alternates: {
      canonical: siteConfig.url,
    },
    openGraph: {
      title: `${siteConfig.name} - ${siteConfig.tagline}`,
      description: siteConfig.description,
      type: "website",
      url: siteConfig.url,
    },
  };
}

export default async function HomePage() {
  const PAGE_SIZE = directoryConfig.pageSize;

  // Fetch initial data in parallel
  const [projects, totalCount, allCategories] = await Promise.all([
    db.find("apps", { status: "live" }, { sort: { created_at: -1 }, limit: PAGE_SIZE }),
    db.count("apps", { status: "live" }),
    db.find("categories", {}, { sort: { sort_order: 1, name: 1 } }),
  ]);

  // Build categories with live app counts
  const categoriesWithCount = await Promise.all(
    allCategories.map(async (cat) => {
      const identifiers = [cat.name, cat.slug].filter(Boolean);
      const count = await db.count("apps", {
        status: "live",
        categories: { $overlaps: identifiers },
      });
      return { slug: cat.slug, name: cat.name, app_count: count, sphere: cat.sphere };
    })
  );

  const activeCategories = categoriesWithCount.filter((c) => (c.app_count ?? 0) > 0);

  // Group by sphere
  const grouped: Record<string, typeof activeCategories> = {};
  for (const cat of activeCategories) {
    const sphere = cat.sphere || "Other";
    if (!grouped[sphere]) grouped[sphere] = [];
    grouped[sphere].push(cat);
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Serialize to ensure plain objects (no Date instances, etc.)
  const serializedProjects = JSON.parse(JSON.stringify(projects));

  return (
    <>
      <HomePageClient
        initialProjects={serializedProjects}
        initialCategories={activeCategories}
        initialGroupedCategories={grouped}
        initialPagination={{ page: 1, totalPages, totalCount }}
      />
    </>
  );
}
