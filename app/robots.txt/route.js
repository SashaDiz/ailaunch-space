import { NextResponse } from "next/server";
import { generateRobotsTxt } from "../libs/seo.js";

export async function GET() {
  try {
    const robotsTxt = generateRobotsTxt();
    
    return new NextResponse(robotsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, s-maxage=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Robots.txt generation error:", error);
    return new NextResponse("Error generating robots.txt", { status: 500 });
  }
}