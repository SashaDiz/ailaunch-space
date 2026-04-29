import { NextResponse } from "next/server";
import { generateRobotsTxt } from '@/lib/seo';

export async function GET() {
  try {
    const robotsTxt = generateRobotsTxt();
    
    return new NextResponse(robotsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Robots.txt generation error:", error);
    return new NextResponse("Error generating robots.txt", { status: 500 });
  }
}