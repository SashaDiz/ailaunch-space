import { Webhook } from "svix";
import { upsertUser, deleteUserByClerkId } from "../../libs/models/users.js";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Extract the webhook data
  const { type, data: eventData } = req.body;

  // Only handle user events
  if (
    type === "user.created" ||
    type === "user.updated" ||
    type === "user.deleted"
  ) {
    try {
      const userId = eventData.id;

      if (!userId) {
        return res.status(400).json({ error: "Missing required user data" });
      }

      if (type === "user.deleted") {
        // Delete user from MongoDB
        await deleteUserByClerkId(userId);
      } else {
        // Handle user.created and user.updated
        let email = null;

        // Check if email_addresses exists and has data
        if (eventData.email_addresses && eventData.email_addresses.length > 0) {
          email = eventData.email_addresses[0].email_address;
        } else if (eventData.primary_email_address_id) {
          // For test webhooks, use a fallback
          email = `user_${userId}@placeholder.com`;
        }

        const firstName = eventData.first_name || "";
        const lastName = eventData.last_name || "";

        if (!email) {
          email = `user_${userId}@placeholder.com`;
        }

        // Upsert user in MongoDB
        await upsertUser({
          clerkId: userId,
          email,
          firstName,
          lastName,
        });
      }

      return res.status(200).json({
        success: true,
        message: `User ${type} processed successfully`,
      });
    } catch (error) {
      console.error("Database error:", error);
      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  return res.status(200).json({ message: "Event type not handled" });
}
