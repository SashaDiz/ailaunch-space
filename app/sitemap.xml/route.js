import { NextResponse } from "next/server";
import { db } from "../libs/database.js";
import { generateSitemapData, generateSitemapXML } from "../libs/seo.js";

export async function GET() {
  try {
    // Generate sitemap data
    const pages = await generateSitemapData(db);
    
    // Generate XML sitemap
    const sitemapXML = generateSitemapXML(pages);
    
    return new NextResponse(sitemapXML, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}