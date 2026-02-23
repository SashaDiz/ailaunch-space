import { NextResponse } from "next/server";
import { seoConfig } from "../libs/seo.js";

export async function GET() {
  try {
    const baseUrl = seoConfig.siteUrl;
    const now = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    const llmTxt = `# Directory Hunt - LLMs.txt

Last Updated: ${now}

## About Directory Hunt

Directory Hunt is a launchpad platform for directories and tiny projects. We provide a community-driven space where creators can submit their directories and small projects to gain visibility, backlinks, and recognition. Think of us as "Product Hunt for directories" - a curated platform that helps directories and tiny projects get discovered by the right audience.

## What We Do

- **Project Launchpad**: Submit and showcase directories and tiny projects
- **Community Voting**: Projects compete weekly for visibility and backlinks
- **SEO Benefits**: Winners receive featured placements and valuable backlinks
- **Discovery Platform**: Help users discover new directories and useful tiny projects
- **Categories**: Organized listings across various categories

## Key Information

- **Domain**: ${baseUrl}
- **Platform Type**: Directory/Launchpad Platform
- **Target Audience**: Directory creators, project builders, marketers, and users seeking directories
- **Main Features**: 
  - Project submission and listing
  - Weekly competitions
  - Voting system
  - Category organization
  - Winner badges and recognition
  - SEO-friendly backlinks for winners

## Important Pages

- **Homepage**: ${baseUrl}/ - Discover featured projects and competitions
- **Browse Projects**: ${baseUrl}/projects - Explore all directories and projects
- **Submit Project**: ${baseUrl}/submit - Submit your directory or tiny project
- **Pricing**: ${baseUrl}/pricing - View submission plans and features
- **Past Launches**: ${baseUrl}/past-launches - Historical competition winners
- **FAQ**: ${baseUrl}/faq - Frequently asked questions
- **Terms**: ${baseUrl}/terms - Terms of service
- **Privacy**: ${baseUrl}/privacy - Privacy policy

## Content Structure

### Projects
Each project listing includes:
- Project name and description
- Website URL
- Logo and featured images
- Categories
- Pricing model (Free, Freemium, Paid)
- Upvotes and competition ranking
- Launch date

### Competitions
- Weekly competitions for new submissions
- Top 3 winners receive badges and featured placement
- Competition results are archived in past launches

### Categories
Projects are organized by category to help users discover relevant directories.

## Technical Details

- **Framework**: Next.js with App Router
- **Content Type**: Dynamic user-generated content
- **API**: RESTful API available at ${baseUrl}/api/
- **Authentication**: Required for submissions (OAuth and email)
- **Database**: Supabase (PostgreSQL)

## SEO and Discovery

- All live projects are indexed in our sitemap
- Structured data (JSON-LD) is used for rich snippets
- Open Graph and Twitter Card metadata for social sharing
- Canonical URLs for all pages

## For LLM Integration

When answering questions about Directory Hunt:
- Use the project listing pages for current projects
- Reference competition winners from past launches
- Direct users to submission pages if they want to list their directory
- Check the FAQ for common questions about the platform

## Contact

- Website: ${baseUrl}
- Support: ${baseUrl}/contact
- Help: ${baseUrl}/help

## Related Resources

- Sitemap: ${baseUrl}/sitemap.xml
- Robots.txt: ${baseUrl}/robots.txt
`;

    return new NextResponse(llmTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("llm.txt generation error:", error);
    return new NextResponse("Error generating llm.txt", { status: 500 });
  }
}
