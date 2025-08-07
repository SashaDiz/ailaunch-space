import { getUserByClerkId } from "../../libs/models/users.js";

export default async function handler(req, res) {
  try {
    const { userId } = req.query;

    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Get public profile for any user
    const user = await getUserByClerkId(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return public profile data (no private info like email)
    const profileData = {
      id: user.clerkId,
      name:
        user.fullName || `${user.firstName} ${user.lastName}`.trim() || "User",
      image: user.imageUrl,
      bio: user.bio || "",
      location: user.location || "",
      website: user.website || "",
      twitter: user.twitter || "",
      github: user.github || "",
      linkedin: user.linkedin || "",
      joinedAt: user.createdAt,
      stats: {
        projectsLaunched: user.totalSubmissions || 0,
        totalViews: 0,
        followers: 0,
      },
    };

    return res.status(200).json(profileData);
  } catch (error) {
    console.error("Profile API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
