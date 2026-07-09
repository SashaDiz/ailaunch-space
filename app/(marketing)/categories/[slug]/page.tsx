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

  const title = `${category.name} - ${siteConfig.name}`;
  const description =
    category.description ||
    `Browse ${category.name} projects on ${siteConfig.name}.`;

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
    />
  );
}
