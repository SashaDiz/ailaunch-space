// Consolidated profile API handler
import { UserService } from "../libs/models/users.js";

export default async function handler(req, res) {
  const { method, query } = req;
  const { userId, action } = query;

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
    const currentUserId = req.headers["x-clerk-user-id"];

    // Handle different profile endpoints
    if (userId && method === "GET") {
      // GET /api/profile?userId=something - Get user profile
      const result = await UserService.getUserProfile(userId);
      return res.status(result.success ? 200 : 404).json(result);
    }

    if (action === "sync" && method === "POST") {
      // POST /api/profile?action=sync - Sync user data
      if (!currentUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const result = await UserService.syncUserData(currentUserId, req.body);
      return res.status(result.success ? 200 : 400).json(result);
    }

    if (method === "GET" && !userId) {
      // GET /api/profile - Get current user profile
      if (!currentUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const result = await UserService.getUserProfile(currentUserId);
      return res.status(result.success ? 200 : 404).json(result);
    }

    if (method === "PUT") {
      // PUT /api/profile - Update current user profile
      if (!currentUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const result = await UserService.updateUserProfile(
        currentUserId,
        req.body
      );
      return res.status(result.success ? 200 : 400).json(result);
    }

    return res.status(404).json({ error: "Endpoint not found" });
  } catch (error) {
    console.error("Profile API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
