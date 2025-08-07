import { getAuth } from "@clerk/nextjs/server";
import {
  getUserByClerkId,
  updateUserProfile,
} from "../../libs/models/users.js";

export default async function handler(req, res) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "GET") {
      // Get user profile
      const user = await getUserByClerkId(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return profile data
      const profileData = {
        id: user.clerkId,
        name:
          user.fullName ||
          `${user.firstName} ${user.lastName}`.trim() ||
          "User",
        email: user.email,
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
          totalViews: 0, // This would come from your analytics
          followers: 0, // This would come from a followers system
        },
      };

      return res.status(200).json(profileData);
    }

    if (req.method === "PUT") {
      // Update user profile
      const { bio, location, website, twitter, github, linkedin } = req.body;

      const updateData = {
        bio,
        location,
        website,
        twitter,
        github,
        linkedin,
      };

      // Remove empty fields
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === "") {
          updateData[key] = null;
        }
      });

      await updateUserProfile(userId, updateData);

      // Return updated profile
      const updatedUser = await getUserByClerkId(userId);
      const profileData = {
        id: updatedUser.clerkId,
        name:
          updatedUser.fullName ||
          `${updatedUser.firstName} ${updatedUser.lastName}`.trim() ||
          "User",
        email: updatedUser.email,
        image: updatedUser.imageUrl,
        bio: updatedUser.bio || "",
        location: updatedUser.location || "",
        website: updatedUser.website || "",
        twitter: updatedUser.twitter || "",
        github: updatedUser.github || "",
        linkedin: updatedUser.linkedin || "",
        joinedAt: updatedUser.createdAt,
        stats: {
          projectsLaunched: updatedUser.totalSubmissions || 0,
          totalViews: 0,
          followers: 0,
        },
      };

      return res.status(200).json(profileData);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Profile API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
