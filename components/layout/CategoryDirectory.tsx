import Link from "next/link";
import { getCategoriesWithCounts } from "@/lib/categories-with-counts";

const numberFormat = new Intl.NumberFormat("en-US");

/**
 * Every category with its live project count, above the footer on every page.
 * Three columns read top-to-bottom, biggest first; a dotted leader ties each
 * name to its count, like a table of contents.
 */
export async function CategoryDirectory() {
  const categories = await getCategoriesWithCounts().catch(() => []);
  const sorted = [...categories]
    .filter((c) => c.app_count > 0)
    .sort((a, b) => b.app_count - a.app_count || a.name.localeCompare(b.name));
  if (!sorted.length) return null;

  return (
    <nav aria-labelledby="browse-by-category" className="container-classic py-10">
      <div className="flex items-center gap-4">
        <h2 id="browse-by-category" className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Browse by category
        </h2>
        <span aria-hidden className="h-px flex-1 bg-border" />
        <Link href="/categories" className="shrink-0 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
          {categories.length} categories
        </Link>
      </div>

      <ul className="mt-4 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-4">
        {sorted.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/categories/${category.slug}`}
              className="group flex items-baseline gap-2 py-1 text-[13px]"
            >
              <span className="min-w-0 truncate text-foreground/80 transition-colors group-hover:text-primary">{category.name}</span>
              <span aria-hidden className="mb-[3px] min-w-3 flex-1 border-b border-dotted border-muted-foreground/30" />
              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                {numberFormat.format(category.app_count)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
