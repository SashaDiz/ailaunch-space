// SEO utilities and helpers
import { siteConfig } from '@/config/site.config';

export const seoConfig = {
  siteName: siteConfig.name,
  siteUrl: siteConfig.url,
  defaultTitle: `${siteConfig.name} - ${siteConfig.tagline}`,
  defaultDescription: siteConfig.description,
  defaultKeywords: siteConfig.keywords,
  twitterHandle: siteConfig.social.twitter || '',
  author: siteConfig.name,
  language: siteConfig.language,
  locale: siteConfig.locale,
  themeColor: siteConfig.themeColor,
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
        ...(siteConfig.social.twitter && {
          sameAs: [
            `https://twitter.com/${siteConfig.social.twitter.replace('@', '')}`,
          ],
        }),
        contactPoint: {
          "@type": "ContactPoint",
          email: siteConfig.contact.email,
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
          name: data.author || `${siteConfig.name} User`,
        },
        datePublished: data.publishedAt,
        dateModified: data.updatedAt,
      };

    case "ItemList":
      return {
        ...baseStructure,
        name: data.name || "Project Listings",
        description: data.description || "List of projects and tools",
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

  // Static pages - comprehensive list
  const staticPages = [
    { url: "/", priority: 1.0, changefreq: "daily" },
    { url: "/submit", priority: 0.8, changefreq: "weekly" },
    { url: "/pricing", priority: 0.7, changefreq: "monthly" },
    { url: "/blog", priority: 0.7, changefreq: "weekly" },
    { url: "/faq", priority: 0.6, changefreq: "monthly" },
    { url: "/help", priority: 0.6, changefreq: "monthly" },
    { url: "/contact", priority: 0.5, changefreq: "yearly" },
    { url: "/terms", priority: 0.3, changefreq: "yearly" },
    { url: "/privacy", priority: 0.3, changefreq: "yearly" },
    { url: "/cookies", priority: 0.3, changefreq: "yearly" },
  ];

  staticPages.forEach(page => {
    pages.push({
      url: `${seoConfig.siteUrl}${page.url}`,
      lastmod: now,
      changefreq: page.changefreq,
      priority: page.priority,
    });
  });

  // Dynamic pages - projects with images
  try {
    const projects = await db.find(
      "apps",
      { status: "live" },
      {
        projection: { slug: 1, updated_at: 1, logo_url: 1, screenshots: 1 },
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
      
      // Collect images for the project
      const images = [];
      if (project.logo_url) {
        images.push(project.logo_url.startsWith('http') 
          ? project.logo_url 
          : `${seoConfig.siteUrl}${project.logo_url}`);
      }
      if (project.screenshots?.length) {
        const screenshot = project.screenshots[0];
        images.push(screenshot.startsWith('http')
          ? screenshot
          : `${seoConfig.siteUrl}${screenshot}`);
      }
      
      pages.push({
        url: `${seoConfig.siteUrl}/project/${project.slug}`,
        lastmod,
        changefreq: "weekly",
        priority: 0.8,
        images: images.length > 0 ? images : undefined,
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
        url: `${seoConfig.siteUrl}/`,
        lastmod,
        changefreq: "weekly",
        priority: 0.7,
      });
    });
  } catch (error) {
    console.error("Error generating sitemap for categories:", error);
  }

  // User profile pages (optional - only if you want to index user profiles)
  // Uncomment if you want user profiles in sitemap
  /*
  try {
    const users = await db.find(
      "users",
      { public_profile: true },
      {
        projection: { id: 1, updated_at: 1 },
        limit: 1000, // Limit to prevent too many URLs
      }
    );

    users.forEach(user => {
      const lastmod = user.updated_at 
        ? (typeof user.updated_at === 'string' 
            ? user.updated_at 
            : user.updated_at.toISOString())
        : now;
      
      pages.push({
        url: `${seoConfig.siteUrl}/user/${user.id}`,
        lastmod,
        changefreq: "monthly",
        priority: 0.5,
      });
    });
  } catch (error) {
    console.error("Error generating sitemap for users:", error);
  }
  */

  return pages;
}

// Generate XML sitemap with image support
export function generateSitemapXML(pages) {
  // Check if any page has images
  const hasImages = pages.some(page => page.images && page.images.length > 0);
  
  // Add image namespace if needed
  const namespace = hasImages 
    ? 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'
    : 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset ${namespace}>
${pages
  .map(
    page => {
      let urlEntry = `  <url>
    <loc>${escapeXml(page.url)}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>`;
      
      // Add images if they exist
      if (page.images && page.images.length > 0) {
        page.images.forEach(imageUrl => {
          urlEntry += `\n    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
    </image:image>`;
        });
      }
      
      urlEntry += `\n  </url>`;
      return urlEntry;
    }
  )
  .join("\n")}
</urlset>`;

  return xml;
}

// Escape XML special characters
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// Generate robots.txt
export function generateRobotsTxt() {
  const baseUrl = seoConfig.siteUrl;
  
  return `# robots.txt for ${baseUrl}
# Updated: ${new Date().toISOString()}

# Allow all search engines
User-agent: *
Allow: /

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay (be respectful to server resources)
Crawl-delay: 1

# Disallow sensitive/admin areas
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /_next/
Disallow: /auth/
Disallow: /settings/
Disallow: /edit/
Disallow: /profile/

# Allow public API endpoints that should be indexed
Allow: /api/projects
Allow: /api/categories

# Specific rules for major search engines
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Googlebot-Image
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 1

# Block aggressive/scraping bots (optional - uncomment if needed)
# User-agent: AhrefsBot
# Disallow: /

# User-agent: MJ12bot
# Disallow: /

# User-agent: SemrushBot
# Disallow: /

# User-agent: DotBot
# Disallow: /

# User-agent: BLEXBot
# Disallow: /`;
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
    .sort(([,a], [,b]) => (b as number) - (a as number))
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