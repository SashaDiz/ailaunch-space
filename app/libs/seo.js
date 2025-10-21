// SEO utilities and helpers for AI Launch Space

export const seoConfig = {
  siteName: "AI Launch Space",
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://ailaunch.space",
  defaultTitle: "AI Launch Space - Weekly Competition Platform for AI Projects",
  defaultDescription: "Submit your AI project to weekly competitions and get high authority backlinks. Join the community of successful AI builders and innovators.",
  defaultKeywords: ["AI", "artificial intelligence", "AI tools", "AI launch", "backlinks", "SEO", "AI projects", "product hunt for AI", "AI project", "machine learning"],
  twitterHandle: "@ailaunchspace",
  author: "AI Launch Space",
  language: "en",
  locale: "en_US",
  themeColor: "#ED0D79",
};

// Generate meta tags for pages
export function generateMetaTags({
  title,
  description,
  keywords = [],
  image,
  url,
  type = "website",
  publishedAt,
  modifiedAt,
  author,
  noIndex = false,
  canonical,
}) {
  const fullTitle = title ? `${title} | ${seoConfig.siteName}` : seoConfig.defaultTitle;
  const metaDescription = description || seoConfig.defaultDescription;
  const fullUrl = url ? `${seoConfig.siteUrl}${url}` : seoConfig.siteUrl;
  const imageUrl = image ? (image.startsWith('http') ? image : `${seoConfig.siteUrl}${image}`) : `${seoConfig.siteUrl}/og-image.png`;
  const allKeywords = [...seoConfig.defaultKeywords, ...keywords].join(", ");

  return {
    title: fullTitle,
    description: metaDescription,
    keywords: allKeywords,
    author: author || seoConfig.author,
    robots: noIndex ? "noindex,nofollow" : "index,follow",
    canonical: canonical || fullUrl,
    
    // Open Graph
    openGraph: {
      type,
      locale: seoConfig.locale,
      url: fullUrl,
      title: fullTitle,
      description: metaDescription,
      siteName: seoConfig.siteName,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title || seoConfig.defaultTitle,
        },
      ],
      ...(publishedAt && { publishedTime: publishedAt }),
      ...(modifiedAt && { modifiedTime: modifiedAt }),
    },

    // Twitter
    twitter: {
      card: "summary_large_image",
      site: seoConfig.twitterHandle,
      creator: seoConfig.twitterHandle,
      title: fullTitle,
      description: metaDescription,
      images: [imageUrl],
    },

    // Additional meta tags
    other: {
      "theme-color": seoConfig.themeColor,
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
      "format-detection": "telephone=no",
    },
  };
}

// Generate structured data (JSON-LD)
export function generateStructuredData(type, data) {
  const baseStructure = {
    "@context": "https://schema.org",
    "@type": type,
  };

  switch (type) {
    case "WebSite":
      return {
        ...baseStructure,
        name: seoConfig.siteName,
        url: seoConfig.siteUrl,
        description: seoConfig.defaultDescription,
        publisher: {
          "@type": "Organization",
          name: seoConfig.siteName,
          url: seoConfig.siteUrl,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${seoConfig.siteUrl}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      };

    case "Organization":
      return {
        ...baseStructure,
        name: seoConfig.siteName,
        url: seoConfig.siteUrl,
        logo: `${seoConfig.siteUrl}/logo.png`,
        description: seoConfig.defaultDescription,
        sameAs: [
          "https://twitter.com/ailaunchspace",
          "https://github.com/ailaunchspace",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          email: "hello@ailaunchspace.com",
          contactType: "customer support",
        },
      };

    case "SoftwareApplication":
      return {
        ...baseStructure,
        name: data.name,
        description: data.description,
        url: data.url,
        image: data.image,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        aggregateRating: data.votes > 0 ? {
          "@type": "AggregateRating",
          ratingValue: Math.min(5, Math.max(1, data.votes / 10)), // Simple rating calculation
          bestRating: "5",
          worstRating: "1",
          ratingCount: data.votes,
        } : undefined,
        author: {
          "@type": "Person",
          name: data.author || "AI Launch Space User",
        },
        datePublished: data.publishedAt,
        dateModified: data.updatedAt,
      };

    case "ItemList":
      return {
        ...baseStructure,
        name: data.name || "AI Project Listings",
        description: data.description || "List of AI tools and projects",
        numberOfItems: data.items.length,
        itemListElement: data.items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "SoftwareApplication",
            name: item.name,
            description: item.description,
            url: item.url,
            image: item.image,
          },
        })),
      };

    case "BreadcrumbList":
      return {
        ...baseStructure,
        itemListElement: data.items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      };

    case "FAQPage":
      return {
        ...baseStructure,
        mainEntity: data.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      };

    default:
      return baseStructure;
  }
}

// Generate sitemap data
export async function generateSitemapData(db) {
  const pages = [];
  const now = new Date().toISOString();

  // Static pages
  const staticPages = [
    { url: "/", priority: 1.0, changefreq: "daily" },
    { url: "/projects", priority: 0.9, changefreq: "daily" },
    { url: "/submit", priority: 0.8, changefreq: "weekly" },
    { url: "/pricing", priority: 0.7, changefreq: "monthly" },
    { url: "/past-launches", priority: 0.6, changefreq: "weekly" },
    { url: "/terms", priority: 0.3, changefreq: "yearly" },
    { url: "/privacy", priority: 0.3, changefreq: "yearly" },
  ];

  staticPages.forEach(page => {
    pages.push({
      url: `${seoConfig.siteUrl}${page.url}`,
      lastmod: now,
      changefreq: page.changefreq,
      priority: page.priority,
    });
  });

  // Dynamic pages - projects
  try {
    const projects = await db.find(
      "apps",
      { status: "live" },
      {
        projection: { slug: 1, updated_at: 1 },
        sort: { updated_at: -1 },
      }
    );

    projects.forEach(project => {
      // Handle both Date objects and string dates from database
      const lastmod = project.updated_at 
        ? (typeof project.updated_at === 'string' 
            ? project.updated_at 
            : project.updated_at.toISOString())
        : now;
      
      pages.push({
        url: `${seoConfig.siteUrl}/project/${project.slug}`,
        lastmod,
        changefreq: "weekly",
        priority: 0.8,
      });
    });
  } catch (error) {
    console.error("Error generating sitemap for projects:", error);
  }

  // Category pages
  try {
    const categories = await db.find(
      "categories",
      { featured: true },
      {
        projection: { slug: 1, updated_at: 1 },
      }
    );

    categories.forEach(category => {
      // Handle both Date objects and string dates from database
      const lastmod = category.updated_at 
        ? (typeof category.updated_at === 'string' 
            ? category.updated_at 
            : category.updated_at.toISOString())
        : now;
      
      pages.push({
        url: `${seoConfig.siteUrl}/projects?category=${category.slug}`,
        lastmod,
        changefreq: "weekly",
        priority: 0.7,
      });
    });
  } catch (error) {
    console.error("Error generating sitemap for categories:", error);
  }

  return pages;
}

// Generate XML sitemap
export function generateSitemapXML(pages) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return xml;
}

// Generate robots.txt
export function generateRobotsTxt() {
  return `User-agent: *
Allow: /

# Sitemap
Sitemap: ${seoConfig.siteUrl}/sitemap.xml

# Crawl delay
Crawl-delay: 1

# Disallow sensitive areas
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /_next/
Disallow: /auth/

# Allow important pages
Allow: /api/sitemap
Allow: /api/robots

# Block common bot spam
User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: SemrushBot
Disallow: /`;
}

// Extract keywords from content
export function extractKeywords(content, maxKeywords = 10) {
  if (!content || typeof content !== 'string') return [];

  // Common stop words to filter out
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'were', 'will', 'with', 'you', 'your', 'this', 'they',
    'them', 'their', 'we', 'our', 'us', 'can', 'could', 'would', 'should',
    'have', 'had', 'do', 'does', 'did', 'get', 'got', 'make', 'made',
    'also', 'like', 'just', 'one', 'two', 'three', 'first', 'last',
    'new', 'old', 'good', 'great', 'best', 'better', 'more', 'most',
    'many', 'much', 'some', 'any', 'all', 'each', 'every', 'very',
    'well', 'now', 'then', 'here', 'there', 'where', 'when', 'how',
    'what', 'who', 'which', 'why', 'may', 'might', 'must', 'shall',
    'about', 'after', 'before', 'during', 'through', 'over', 'under',
    'above', 'below', 'up', 'down', 'out', 'off', 'into', 'onto',
  ]);

  // Extract words and clean them
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .filter(word => !word.match(/^\d+$/)); // Remove pure numbers

  // Count word frequency
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  // Sort by frequency and return top keywords
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

// SEO-friendly URL slug generator
export function generateSlug(text, maxLength = 50) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, maxLength)
    .replace(/-+$/, ''); // Remove trailing hyphen if truncated
}

// Calculate reading time
export function calculateReadingTime(content) {
  if (!content) return 0;
  const wordsPerMinute = 200; // Average reading speed
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// Generate meta keywords from project data
export function generateProjectKeywords(project) {
  const keywords = new Set();
  
  // Add categories
  if (project.categories) {
    project.categories.forEach(cat => keywords.add(cat));
  }
  
  // Add tags
  if (project.tags) {
    project.tags.forEach(tag => keywords.add(tag));
  }
  
  // Extract from description
  const descriptionKeywords = extractKeywords(project.short_description, 5);
  descriptionKeywords.forEach(keyword => keywords.add(keyword));
  
  // Add common AI-related terms
  keywords.add('AI');
  keywords.add('artificial intelligence');
  keywords.add('tool');
  keywords.add('platform');
  
  return Array.from(keywords).slice(0, 15);
}