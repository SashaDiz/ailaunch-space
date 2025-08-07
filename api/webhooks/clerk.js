import { Webhook } from "svix";
import { upsertUser, deleteUserByClerkId } from "../../libs/models/users.js";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("=== WEBHOOK DEBUG START ===");
  console.log("Full webhook payload:", JSON.stringify(req.body, null, 2));

  // Extract the webhook data - Clerk sends the actual event data in req.body
  const { type, data: eventData } = req.body;

  console.log("Event type:", type);
  console.log("Event data:", eventData);

  // Only handle user events
  if (
    type === "user.created" ||
    type === "user.updated" ||
    type === "user.deleted"
  ) {
    try {
      const userId = eventData.id;

      if (!userId) {
        console.log("❌ Missing userId in event data");
        return res.status(400).json({ error: "Missing required user data" });
      }

      if (type === "user.deleted") {
        // Delete user from MongoDB
        await deleteUserByClerkId(userId);
        console.log(`✅ User deleted: ${userId}`);
      } else {
        // Handle user.created and user.updated

        // The email might be in email_addresses array or we need to fetch it separately
        let email = null;

        // Check if email_addresses exists and has data
        if (eventData.email_addresses && eventData.email_addresses.length > 0) {
          email = eventData.email_addresses[0].email_address;
        } else if (eventData.primary_email_address_id) {
          // For test webhooks, we might need to use a fallback
          email = `user_${userId}@placeholder.com`;
        }

        const firstName = eventData.first_name || "";
        const lastName = eventData.last_name || "";

        console.log("Processing user:", {
          userId,
          email,
          firstName,
          lastName,
          emailAddressesLength: eventData.email_addresses?.length || 0,
          primaryEmailId: eventData.primary_email_address_id,
        });

        if (!email) {
          console.log("⚠️ No email found, using placeholder");
          email = `user_${userId}@placeholder.com`;
        }

        // Upsert user in MongoDB
        await upsertUser({
          clerkId: userId,
          email,
          firstName,
          lastName,
        });

        console.log(`✅ User ${type}: ${userId} with email: ${email}`);
      }

      console.log("=== WEBHOOK DEBUG END ===");
      return res.status(200).json({
        success: true,
        message: `User ${type} processed successfully`,
        userId,
      });
    } catch (error) {
      console.log("❌ Database error:", error);
      console.log("Error stack:", error.stack);
      return res.status(500).json({
        error: "Database error: " + error.message,
        stack: error.stack,
      });
    }
  }

  console.log("Event type not handled:", type);
  console.log("=== WEBHOOK DEBUG END ===");
  return res.status(200).json({ message: "Event type not handled" });
}
