import { AppService } from "../../libs/models/services.js";

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check authentication - get user ID from headers set by Clerk
    const userId = req.headers["x-clerk-user-id"];

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const result = await AppService.getUserDashboard(userId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in GET /api/dashboard:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
