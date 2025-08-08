// Main API router to consolidate multiple endpoints
import { AppService } from "../libs/models/services.js";
import { UserService } from "../libs/models/users.js";

export default async function handler(req, res) {
  const { method, url } = req;
  const path = url.replace("/api", "");

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
    // Dashboard endpoint
    if (path === "/dashboard" && method === "GET") {
      const userId = req.headers["x-clerk-user-id"];
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const result = await AppService.getUserDashboard(userId);
      return res.status(result.success ? 200 : 500).json(result);
    }

    // Categories endpoint
    if (path === "/categories" && method === "GET") {
      const result = await AppService.getCategories();
      return res.status(result.success ? 200 : 500).json(result);
    }

    // Weeks endpoint
    if (path === "/weeks" && method === "GET") {
      const result = await AppService.getWeeks();
      return res.status(result.success ? 200 : 500).json(result);
    }

    // User me endpoint
    if (path === "/user/me" && method === "GET") {
      const userId = req.headers["x-clerk-user-id"];
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const result = await UserService.getUser(userId);
      return res.status(result.success ? 200 : 500).json(result);
    }

    // Apps list endpoint
    if (path === "/apps" && method === "GET") {
      const { week, category, search, page = 1, limit = 20 } = req.query;
      const result = await AppService.getApps({
        week,
        category,
        search,
        page: parseInt(page),
        limit: parseInt(limit),
      });
      return res.status(result.success ? 200 : 500).json(result);
    }

    // Submit directory endpoint
    if (path === "/submit-directory" && method === "POST") {
      const userId = req.headers["x-clerk-user-id"];
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const result = await AppService.submitApp(req.body, userId);
      return res.status(result.success ? 201 : 400).json(result);
    }

    // Default 404
    return res.status(404).json({ error: "Endpoint not found" });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
