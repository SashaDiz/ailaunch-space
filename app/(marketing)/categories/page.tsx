import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";
import { siteConfig } from "@/config/site.config";
import { db } from "@/lib/supabase/database";

export const revalidate = 3600; // ISR: revalidate every hour

export async function generateMetadata() {
  return {
    title: `Categories - ${siteConfig.name}`,
    description: `Browse all project categories on ${siteConfig.name}. Find tools organized by type and industry.`,
    openGraph: {
      title: `Categories - ${siteConfig.name}`,
      description: `Browse all project categories on ${siteConfig.name}. Find tools organized by type and industry.`,
      type: "website",
    },
  };
}

async function getGroupedCategories() {
  const categories = await db.find("categories", {}, {
    sort: { sort_order: 1, name: 1 },
  });

  // Get app counts for each category
  const categoriesWithCount = await Promise.all(
    categories.map(async (category) => {
      const identifiers = [category.name, category.slug].filter(Boolean);
      const appCount = await db.count("apps", {
        status: "live",
        categories: { $overlaps: identifiers },
      });
      return { ...category, app_count: appCount };
    })
  );

  // Filter: only categories with at least one live app
  const categoriesWithItems = categoriesWithCount.filter((cat) => (cat.app_count ?? 0) > 0);

  // Group by sphere
  const grouped = categoriesWithItems.reduce((acc, cat) => {
    const sphere = cat.sphere || "Other";
    if (!acc[sphere]) acc[sphere] = [];
    acc[sphere].push(cat);
    return acc;
  }, {} as Record<string, typeof categoriesWithCount>);

  // Sort categories within each sphere alphabetically
  for (const sphere of Object.keys(grouped)) {
    grouped[sphere].sort((a, b) => a.name.localeCompare(b.name));
  }

  return grouped;
}

export default async function CategoriesPage() {
  const groupedCategories = await getGroupedCategories();
  const sphereNames = Object.keys(groupedCategories);

  // Sort spheres: "Other" always last, rest alphabetically
  sphereNames.sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  const totalCategories = (Object.values(groupedCategories) as any[][]).reduce(
    (sum, cats) => sum + cats.length,
    0
  );

  return (
    <main className="min-h-screen bg-transparent">
      <div className="container-classic py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground transition-colors">
            <Home className="w-4 h-4" />
          </Link>
          <span>/</span>
          <span className="text-foreground">Categories</span>
        </nav>

        {/* Hero */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Categories</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Browse {totalCategories} categories to find the best projects for your needs.
          </p>
        </div>

        {/* Categories grouped by sphere */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-x-12">
          {sphereNames.map((sphere) => (
            <div key={sphere} className="break-inside-avoid mb-10">
              <h2 className="text-xl font-bold mb-4 text-foreground">
                {sphere}
              </h2>
              <div className="space-y-1">
                {groupedCategories[sphere].map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className="group flex items-center gap-3 py-2 text-foreground/80 hover:text-foreground transition-colors"
                  >
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                    <span className="text-sm">{category.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      ({category.app_count ?? 0})
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
