import { AppService } from "../../libs/models/services.js";
import formidable from "formidable";

export default async function handler(req, res) {
  try {
    // Check authentication - get user ID from headers set by Clerk
    const userId = req.headers["x-clerk-user-id"];

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Get app ID from query
    const { id: appId } = req.query;
    if (!appId) {
      return res.status(400).json({ error: "App ID is required" });
    }

    if (req.method === "GET") {
      // Get app for editing
      const result = await AppService.getUserApp(appId, userId);

      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      return res.status(200).json({ success: true, data: result.data });
    } else if (req.method === "PUT") {
      // Update app
      const form = formidable({ multiples: true });
      const [fields, files] = await form.parse(req);

      // Extract and flatten form fields
      const updateData = {};
      Object.keys(fields).forEach((key) => {
        const value = Array.isArray(fields[key]) ? fields[key][0] : fields[key];

        if (key === "categories") {
          try {
            updateData[key] = JSON.parse(value);
          } catch {
            updateData[key] = [value];
          }
        } else {
          updateData[key] = value;
        }
      });

      const result = await AppService.updateUserApp(appId, userId, updateData);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res
        .status(200)
        .json({ success: true, message: "App updated successfully" });
    } else if (req.method === "DELETE") {
      // Delete app
      const result = await AppService.deleteUserApp(appId, userId);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res
        .status(200)
        .json({ success: true, message: "App deleted successfully" });
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in /api/apps/[id]:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
