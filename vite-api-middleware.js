// Development middleware for handling API routes in Vite
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function apiMiddleware() {
  return {
    name: "api-middleware",
    configureServer(server) {
      server.middlewares.use("/api", async (req, res, next) => {
        try {
          // Parse the API route
          const apiPath = req.url.split("?")[0];
          const queryParams = new URLSearchParams(req.url.split("?")[1] || "");

          // Mock API responses for development
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS"
          );
          res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization, x-clerk-user-id"
          );

          if (req.method === "OPTIONS") {
            res.statusCode = 200;
            res.end();
            return;
          }

          // Handle different API endpoints with mock data
          if (apiPath === "/apps" && req.method === "GET") {
            const mockApps = {
              success: true,
              apps: [
                {
                  _id: "1",
                  name: "Directory Hunt",
                  slug: "directory-hunt",
                  short_description:
                    "Discover and launch your directory to the world",
                  full_description:
                    "Directory Hunt is the ultimate platform for launching your directory projects.",
                  website_url: "https://directoryhunt.com",
                  logo_url: "/api/placeholder/80/80?text=DH",
                  categories: [
                    "Directory of Directories",
                    "Developer Tools & Platforms",
                  ],
                  pricing: "Freemium",
                  upvotes: 42,
                  vote_count: 42,
                  views: 150,
                  launch_week: "2025-W32",
                  launch_date: new Date().toISOString(),
                  status: "live",
                  featured: true,
                  createdAt: new Date().toISOString(),
                },
                {
                  _id: "2",
                  name: "TravelMate AI",
                  slug: "travelmate-ai",
                  short_description:
                    "AI-powered travel planning with real-time insights",
                  full_description:
                    "Plan your perfect trip with AI assistance and local recommendations.",
                  website_url: "https://travelmate-ai.com",
                  logo_url: "/api/placeholder/80/80?text=TM",
                  categories: ["AI & LLM", "Travel & Lifestyle"],
                  pricing: "Free",
                  upvotes: 28,
                  vote_count: 28,
                  views: 89,
                  launch_week: "2025-W32",
                  launch_date: new Date(
                    Date.now() - 24 * 60 * 60 * 1000
                  ).toISOString(),
                  status: "live",
                  createdAt: new Date(
                    Date.now() - 24 * 60 * 60 * 1000
                  ).toISOString(),
                },
                {
                  _id: "3",
                  name: "DevTools Hub",
                  slug: "devtools-hub",
                  short_description:
                    "Curated collection of developer tools and resources",
                  full_description:
                    "Everything a developer needs in one place - from code editors to deployment tools.",
                  website_url: "https://devtools-hub.com",
                  logo_url: "/api/placeholder/80/80?text=DT",
                  categories: [
                    "Developer Tools & Platforms",
                    "Directory of Directories",
                  ],
                  pricing: "Paid",
                  upvotes: 67,
                  vote_count: 67,
                  views: 234,
                  launch_week: "2025-W32",
                  launch_date: new Date(
                    Date.now() - 2 * 24 * 60 * 60 * 1000
                  ).toISOString(),
                  status: "live",
                  featured: true,
                  createdAt: new Date(
                    Date.now() - 2 * 24 * 60 * 60 * 1000
                  ).toISOString(),
                },
              ],
              pagination: {
                page: 1,
                limit: 20,
                total: 3,
                pages: 1,
              },
            };

            res.statusCode = 200;
            res.end(JSON.stringify(mockApps));
            return;
          }

          if (apiPath === "/categories" && req.method === "GET") {
            const mockCategories = {
              success: true,
              categories: [
                "Directory of Directories",
                "AI & LLM",
                "Developer Tools & Platforms",
                "Travel & Lifestyle",
                "UI/UX",
                "Design",
                "APIs & Integrations",
                "SaaS Tools",
              ],
            };

            res.statusCode = 200;
            res.end(JSON.stringify(mockCategories));
            return;
          }

          if (apiPath === "/placeholder" && req.method === "GET") {
            const width = queryParams.get("width") || "400";
            const height = queryParams.get("height") || "300";
            const text = queryParams.get("text") || "Image";

            res.setHeader("Content-Type", "image/svg+xml");
            res.setHeader("Cache-Control", "public, max-age=3600");

            const svg = `
              <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f3f4f6"/>
                <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#6b7280" text-anchor="middle" dominant-baseline="middle">
                  ${decodeURIComponent(text)}
                </text>
              </svg>
            `;

            res.statusCode = 200;
            res.end(svg);
            return;
          }

          // Default response for unknown endpoints
          res.statusCode = 404;
          res.end(
            JSON.stringify({ success: false, error: "Endpoint not found" })
          );
        } catch (error) {
          console.error("API Middleware Error:", error);
          res.statusCode = 500;
          res.end(
            JSON.stringify({ success: false, error: "Internal server error" })
          );
        }
      });
    },
  };
}
