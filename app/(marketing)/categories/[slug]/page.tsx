import { db } from "@/lib/supabase/database";
import { siteConfig } from "@/config/site.config";
import { notFound } from "next/navigation";
import { CategoryDetailClient } from "./CategoryDetailClient";

export const revalidate = 1800; // ISR: revalidate every 30 minutes

export async function generateStaticParams() {
  const categories = await db.find("categories", {}, { projection: { slug: 1 } });
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await db.findOne("categories", { slug });

  if (!category) {
    return { title: `Category Not Found - ${siteConfig.name}` };
  }

  const title = `${category.name} - ${siteConfig.name}`;
  const description =
    category.description ||
    `Browse ${category.name} projects on ${siteConfig.name}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = await db.findOne("categories", { slug });

  if (!category) notFound();

  return (
    <CategoryDetailClient
      slug={slug}
      category={{
        name: category.name,
        description: category.description,
        sphere: category.sphere,
        color: category.color,
      }}
    />
  );
}
