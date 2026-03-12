import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "../../libs/database.js";
import {
  generateMetaTags,
  generateProjectKeywords,
  generateStructuredData,
  seoConfig,
} from "../../libs/seo.js";
import ProjectDetailClient from "./ProjectDetailClient";

// Generate website link with ref parameter and proper rel attribute
function getWebsiteLink(project) {
  if (!project?.website_url)
    return { url: "#", rel: "nofollow noopener noreferrer" };

  try {
    const url = new URL(project.website_url);
    url.searchParams.set("ref", "ailaunchspace");

    const isDofollow = project.link_type === "dofollow";

    return {
      url: url.toString(),
      rel: isDofollow ? "noopener noreferrer" : "nofollow noopener noreferrer",
    };
  } catch (error) {
    return { url: project.website_url, rel: "nofollow noopener noreferrer" };
  }
}

// Fetch project data (shared between generateMetadata and page)
async function getProjectData(slug) {
  let project = await db.findOne("apps", { slug });

  if (!project) {
    project = await db.findOne("apps", { id: slug });
  }

  return project;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = await getProjectData(slug);

  if (!project) {
    return { title: "Project Not Found" };
  }

  return generateMetaTags({
    title: project.name,
    description: project.short_description,
    keywords: generateProjectKeywords(project),
    image: project.logo_url,
    url: `/project/${project.slug}`,
    type: "article",
    publishedAt: project.created_at,
    modifiedAt: project.updated_at,
  });
}

export default async function ProjectDetailPage({ params }) {
  const { slug } = await params;
  const project = await getProjectData(slug);

  if (!project) {
    notFound();
  }

  // For non-live projects, only owners can see (but we can't check auth in server component easily)
  // So we show live projects server-side and let client handle edge cases
  if (project.status !== "live") {
    // Still render for client-side auth check, but don't expose SEO content
    return <ProjectDetailClient initialProject={null} slug={slug} />;
  }

  // Check if competition has started
  let competitionStarted = true;
  let statusBadge = "live";
  let canVote = false;
  let competitions = [];

  if (project.weekly_competition_id) {
    competitions = await db.find("competitions", {
      id: project.weekly_competition_id,
    });

    if (competitions.length > 0) {
      const competition = competitions[0];
      const now = new Date();
      const startDate = new Date(competition.start_date);
      const endDate = new Date(competition.end_date);

      if (now < startDate) {
        competitionStarted = false;
        statusBadge = "scheduled";
        canVote = false;
      } else if (now >= startDate && now <= endDate) {
        statusBadge = "live";
        canVote = true;
      } else {
        statusBadge = "past";
        canVote = false;
      }
    }
  }

  // If competition hasn't started, don't expose SEO content
  if (!competitionStarted) {
    return <ProjectDetailClient initialProject={null} slug={slug} />;
  }

  // Get related projects
  let relatedProjects = [];

  if (project.categories && project.categories.length > 0) {
    relatedProjects = await db.find(
      "apps",
      {
        categories: { $overlaps: project.categories },
        id: { $ne: project.id },
        status: { $in: ["live", "past"] },
      },
      {
        sort: { upvotes: -1, premium_badge: -1, created_at: -1 },
        limit: 6,
      }
    );
  }

  if (relatedProjects.length < 6) {
    const excludeIds = relatedProjects.map((p) => p.id);
    excludeIds.push(project.id);

    const additionalProjects = await db.find(
      "apps",
      {
        id: { $nin: excludeIds },
        status: { $in: ["live", "past"] },
      },
      {
        sort: { upvotes: -1, premium_badge: -1, created_at: -1 },
        limit: 6 - relatedProjects.length,
      }
    );

    relatedProjects = [...relatedProjects, ...additionalProjects];
  }

  relatedProjects = relatedProjects.slice(0, 6);

  // Get user info
  let userInfo = null;
  if (project.submitted_by) {
    try {
      const user = await db.findOne("users", { id: project.submitted_by });
      if (user) {
        userInfo = {
          id: user.id,
          name: user.full_name || user.name || "Anonymous",
          avatar: user.avatar_url,
          bio: user.bio,
          twitter: user.twitter,
          website: user.website,
        };
      }
    } catch (error) {
      // silently fail
    }
  }

  // Build the full project data for the client component
  const projectData = {
    ...project,
    userVoted: false, // Will be updated client-side
    relatedProjects,
    competitions,
    statusBadge,
    canVote,
    competitionStatus: statusBadge === "live" ? "active" : statusBadge === "past" ? "completed" : "upcoming",
    user: userInfo,
  };

  // Generate website link for SSR
  const websiteLink = getWebsiteLink(project);

  // Generate JSON-LD structured data
  const structuredData = generateStructuredData("SoftwareApplication", {
    name: project.name,
    description: project.short_description || project.full_description,
    url: `${seoConfig.siteUrl}/project/${project.slug}`,
    image: project.logo_url,
    votes: project.upvotes || 0,
    author: userInfo?.name,
    publishedAt: project.created_at,
    updatedAt: project.updated_at,
  });

  const breadcrumbData = generateStructuredData("BreadcrumbList", {
    items: [
      { name: "Home", url: seoConfig.siteUrl },
      {
        name: project.name,
        url: `${seoConfig.siteUrl}/project/${project.slug}`,
      },
    ],
  });

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />

      {/* SEO-critical content rendered server-side for crawlers */}
      <div className="sr-only" aria-hidden="false">
        <h1>{project.name}</h1>
        <p>{project.short_description}</p>
        {project.full_description && <p>{project.full_description}</p>}
        {project.website_url && (
          <a
            href={websiteLink.url}
            target="_blank"
            rel={websiteLink.rel}
          >
            Visit {project.name}
          </a>
        )}
        {project.categories?.map((category) => (
          <span key={category}>{category}</span>
        ))}
        {relatedProjects.map((related) => (
          <Link key={related.id} href={`/project/${related.slug}`}>
            {related.name}
          </Link>
        ))}
      </div>

      {/* Full interactive client component */}
      <ProjectDetailClient initialProject={projectData} slug={slug} />
    </>
  );
}
