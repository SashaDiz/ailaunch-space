import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/supabase/database";
import { siteConfig } from "@/config/site.config";
import { generateStructuredData, generateProjectKeywords } from "@/lib/seo";
import { ProjectDetailClient } from "./ProjectDetailClient";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = await db.findOne("apps", { slug });

  if (!project || (project.status !== "live" && project.status !== "past")) {
    return { title: `Not Found - ${siteConfig.name}` };
  }

  const title = `${project.name} - ${siteConfig.name}`;
  const description =
    project.short_description ||
    (project.full_description
      ? project.full_description.substring(0, 160)
      : `${project.name} on ${siteConfig.name}`);
  const keywords = generateProjectKeywords(project);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `${siteConfig.url}/project/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${siteConfig.url}/project/${slug}`,
      images: project.logo_url
        ? [
            {
              url: project.logo_url,
              width: 128,
              height: 128,
              alt: project.name,
            },
          ]
        : [],
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary",
      title,
      description,
      ...(project.logo_url && { images: [project.logo_url] }),
    },
  };
}

export default async function ProjectDetailPage({ params }) {
  const { slug } = await params;
  const project = await db.findOne("apps", { slug });

  if (!project) {
    notFound();
  }

  // Get user info for display
  let userInfo = null;
  if (project.submitted_by) {
    try {
      const submitter = await db.findOne("users", { id: project.submitted_by });
      if (submitter) {
        userInfo = {
          id: submitter.id,
          name: submitter.full_name || submitter.name || "Anonymous",
          avatar: submitter.avatar_url,
        };
      }
    } catch {}
  }

  // Build pricing offer for structured data
  const pricingMap: Record<string, string> = {
    free: "0",
    freemium: "0",
    paid: "1",
  };
  const offerPrice = pricingMap[project.pricing] ?? "0";

  // SoftwareApplication JSON-LD
  const structuredData: any = generateStructuredData("SoftwareApplication", {
    name: project.name,
    description: project.short_description || project.full_description,
    url: `${siteConfig.url}/project/${slug}`,
    image: project.logo_url,
    votes: project.ratings_count || project.upvotes || 0,
    author: userInfo?.name,
    publishedAt: project.created_at,
    updatedAt: project.updated_at,
  });

  // Use actual average_rating if available
  if (project.average_rating && project.ratings_count > 0) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: project.average_rating,
      bestRating: "5",
      worstRating: "1",
      ratingCount: project.ratings_count,
    };
  }

  // Set actual pricing
  structuredData.offers = {
    "@type": "Offer",
    price: offerPrice,
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  };

  // BreadcrumbList JSON-LD
  const breadcrumbData = generateStructuredData("BreadcrumbList", {
    items: [
      { name: "Home", url: siteConfig.url },
      { name: project.name, url: `${siteConfig.url}/project/${slug}` },
    ],
  });

  // Prepare initial project data for the client component
  const initialProject = {
    ...project,
    user: userInfo,
    statusBadge: "live",
    userVoted: false,
    userBookmarked: false,
    userRating: null,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData),
        }}
      />
      <Suspense
        fallback={
          <div className="min-h-screen bg-transparent">
            <LoadingSpinner fullScreen={true} message="Loading project..." />
          </div>
        }
      >
        <ProjectDetailClient initialProject={initialProject} />
      </Suspense>
    </>
  );
}
