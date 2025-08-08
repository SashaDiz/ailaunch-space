// Consolidated apps API handler
import { AppService } from "../libs/models/services.js";

export default async function handler(req, res) {
  const { method, query } = req;
  const { slug, action } = query;

  // Add CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-clerk-user-id"
  );

  if (method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const userId = req.headers["x-clerk-user-id"];

    // Handle different app endpoints based on query params
    if (slug && !action && method === "GET") {
      // GET /api/apps?slug=something - App details
      const result = await AppService.getAppDetails(slug, userId);
      const status = result.success
        ? 200
        : result.error === "App not found"
        ? 404
        : 500;
      return res.status(status).json(result);
    }

    if (slug && action === "vote" && method === "POST") {
      // POST /api/apps?slug=something&action=vote - Vote for app
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const result = await AppService.voteForApp(slug, userId);
      return res.status(result.success ? 200 : 400).json(result);
    }

    if (slug && action === "edit" && method === "PUT") {
      // PUT /api/apps?slug=something&action=edit - Edit app
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const result = await AppService.updateApp(slug, req.body, userId);
      return res.status(result.success ? 200 : 400).json(result);
    }

    if (slug && action === "edit" && method === "DELETE") {
      // DELETE /api/apps?slug=something&action=edit - Delete app
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const result = await AppService.deleteApp(slug, userId);
      return res.status(result.success ? 200 : 400).json(result);
    }

    if (method === "GET" && !slug) {
      // GET /api/apps - List apps
      const { week, category, search, page = 1, limit = 20 } = query;
      const result = await AppService.getApps({
        week,
        category,
        search,
        page: parseInt(page),
        limit: parseInt(limit),
      });
      return res.status(result.success ? 200 : 500).json(result);
    }

    return res.status(404).json({ error: "Endpoint not found" });
  } catch (error) {
    console.error("Apps API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
