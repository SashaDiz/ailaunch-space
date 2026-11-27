import { db } from "@/lib/supabase/database";
import { siteConfig } from "@/config/site.config";
import { notFound } from "next/navigation";
import {
  parseCatalogParams,
  catalogCanonical,
  catalogRobots,
} from "@/lib/catalog-url";
import { getCatalogProjects } from "@/lib/projects-query";
import { CategoryDetailClient } from "./CategoryDetailClient";
import { categoryFacts, categoryFaq, categorySummary, categoryTitle } from "@/lib/category-seo";
import { getPlan } from "@/config/plans.config";

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

/** Every live listing in the category, ignoring the visitor's filters: the SEO copy describes the whole category. */
async function categoryListings(slug: string) {
  const { projects } = await getCatalogProjects({ categories: [slug], status: "live", all: true });
  return projects;
}

export const revalidate = 1800; // ISR: revalidate every 30 minutes

export async function generateStaticParams() {
  const categories = await db.find("categories", {}, { projection: { slug: 1 } });
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const category = await db.findOne("categories", { slug });

  if (!category) {
    return { title: `Category Not Found - ${siteConfig.name}` };
  }

  const state = parseCatalogParams(await searchParams);
  const basePath = `/categories/${slug}`;

  const year = new Date().getUTCFullYear();
  const facts = categoryFacts(await categoryListings(slug));
  const title = `${categoryTitle(category.name, year)} (${facts.total}) - ${siteConfig.name}`;
  const free = facts.free + facts.freemium;
  const description = facts.total
    ? `Compare ${facts.total} ${category.name} AI tools${free ? `, ${free} of them free or freemium` : ""}${facts.top.length ? `: ${facts.top.map((t) => t.name).join(", ")} and more` : ""}. ${category.description || `Updated as new tools launch on ${siteConfig.name}.`}`.slice(0, 300)
    : category.description || `Browse ${category.name} AI tools on ${siteConfig.name}.`;

  return {
    title,
    description,
    alternates: {
      canonical: catalogCanonical(state, basePath),
    },
    robots: catalogRobots(state, basePath),
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const category = await db.findOne("categories", { slug });

  if (!category) notFound();

  const state = parseCatalogParams(await searchParams);

  // A category is a single-facet view → always render all matching items on one
  // page (no pagination). sort/search still apply within the category.
  const result = await getCatalogProjects({
    categories: [slug],
    pricing: state.pricing,
    sort: state.sort,
    q: state.q,
    status: "live",
    all: true,
  });

  const { projects, totalCount } = result;
  const serializedProjects = JSON.parse(JSON.stringify(projects));

  const filtered = Boolean((state.pricing && state.pricing !== "all") || state.q);
  const facts = categoryFacts(filtered ? await categoryListings(slug) : projects);
  const year = new Date().getUTCFullYear();
  const seo = {
    title: categoryTitle(category.name, year),
    summary: facts.total ? categorySummary(facts, dateLabel) : "",
    faq: categoryFaq(category.name, facts, {
      siteName: siteConfig.name,
      year,
      premiumPrice: getPlan("premium")?.price ?? 4.99,
      dateLabel,
    }),
    itemList: (filtered ? [] : projects).slice(0, 20).map((p: any) => ({ name: p.name, slug: p.slug })),
  };

  return (
    <CategoryDetailClient
      slug={slug}
      category={{
        name: category.name,
        description: category.description,
        sphere: category.sphere,
        color: category.color,
      }}
      initialProjects={serializedProjects}
      initialTotalCount={totalCount}
      initialState={state}
      seo={seo}
    />
  );
}
