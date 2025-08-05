import { getUserByClerkId } from "../../libs/models/users.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get the Clerk user ID from the request headers or auth token
    const clerkUserId = req.headers["x-clerk-user-id"];

    if (!clerkUserId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No user ID provided" });
    }

    const user = await getUserByClerkId(clerkUserId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Remove sensitive fields before sending
    const { _id, ...publicUser } = user;

    return res.status(200).json({ user: publicUser });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
