import { syncClerkUserData } from "../../libs/models/users.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = req.query;
    const clerkUserData = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    console.log("Syncing Clerk data for user:", userId);
    await syncClerkUserData(userId, clerkUserData);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Sync error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
