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

      try {
        let appData;
        const contentType = req.headers["content-type"];

        if (contentType && contentType.includes("application/json")) {
          // Handle JSON requests with base64 file data
          appData = req.body;

          // Process base64 files if present
          if (appData.logo_base64) {
            // For now, we'll store the base64 data directly
            // In a production app, you'd want to decode and save to file storage
            appData.logo_url = appData.logo_base64;
            delete appData.logo_base64;
            delete appData.logo_filename;
            delete appData.logo_type;
          }

          if (
            appData.screenshots_base64 &&
            Array.isArray(appData.screenshots_base64)
          ) {
            // Process screenshot base64 data
            appData.screenshots = appData.screenshots_base64.map(
              (screenshot) => ({
                url: screenshot.base64,
                filename: screenshot.filename,
              })
            );
            delete appData.screenshots_base64;
          }
        } else if (contentType && contentType.includes("multipart/form-data")) {
          // Handle FormData (legacy support)
          return res.status(400).json({
            success: false,
            error:
              "FormData uploads not supported. Please use JSON with base64 encoded files.",
          });
        } else {
          // Handle other content types
          appData = req.body;
        }

        const result = await AppService.submitApp(appData, userId);
        return res.status(result.success ? 201 : 400).json(result);
      } catch (error) {
        console.error("Submit directory error:", error);
        return res.status(500).json({
          success: false,
          error: "Internal server error",
        });
      }
    }

    // Default 404
    return res.status(404).json({ error: "Endpoint not found" });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
