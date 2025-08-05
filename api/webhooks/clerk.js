import { Webhook } from "svix";
import clientPromise from "../../libs/mongodb.js";

// Verify the webhook signature
function verifyWebhook(req) {
  if (!process.env.CLERK_WEBHOOK_SECRET) {
    throw new Error("CLERK_WEBHOOK_SECRET is required");
  }

  const svix_id = req.headers["svix-id"];
  const svix_timestamp = req.headers["svix-timestamp"];
  const svix_signature = req.headers["svix-signature"];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    throw new Error("Missing required Svix headers");
  }

  const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

  try {
    return webhook.verify(JSON.stringify(req.body), {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Webhook verification failed:", err);
    throw new Error("Webhook verification failed");
  }
}

// Handle user.created event
async function handleUserCreated(userData) {
  const client = await clientPromise;
  const db = client.db("directoryhunt");
  const users = db.collection("users");

  const user = {
    clerkId: userData.id,
    email: userData.email_addresses?.[0]?.email_address,
    firstName: userData.first_name,
    lastName: userData.last_name,
    fullName: `${userData.first_name || ""} ${userData.last_name || ""}`.trim(),
    imageUrl: userData.image_url,
    emailVerified:
      userData.email_addresses?.[0]?.verification?.status === "verified",
    createdAt: new Date(userData.created_at),
    updatedAt: new Date(),
    // Custom fields from public metadata
    bio: userData.public_metadata?.bio || "",
    website: userData.public_metadata?.website || "",
    twitter: userData.public_metadata?.twitter || "",
    github: userData.public_metadata?.github || "",
    linkedin: userData.public_metadata?.linkedin || "",
    location: userData.public_metadata?.location || "",
    // Default values
    totalSubmissions: 0,
    subscription: "free",
    isActive: true,
  };

  try {
    const result = await users.insertOne(user);
    console.log("User created in MongoDB:", result.insertedId);
    return result;
  } catch (error) {
    // Handle duplicate key error (user already exists)
    if (error.code === 11000) {
      console.log("User already exists in MongoDB");
      return await users.findOne({ clerkId: userData.id });
    }
    throw error;
  }
}

// Handle user.updated event
async function handleUserUpdated(userData) {
  const client = await clientPromise;
  const db = client.db("directoryhunt");
  const users = db.collection("users");

  const updateData = {
    email: userData.email_addresses?.[0]?.email_address,
    firstName: userData.first_name,
    lastName: userData.last_name,
    fullName: `${userData.first_name || ""} ${userData.last_name || ""}`.trim(),
    imageUrl: userData.image_url,
    emailVerified:
      userData.email_addresses?.[0]?.verification?.status === "verified",
    updatedAt: new Date(),
    // Update custom fields from public metadata
    bio: userData.public_metadata?.bio || "",
    website: userData.public_metadata?.website || "",
    twitter: userData.public_metadata?.twitter || "",
    github: userData.public_metadata?.github || "",
    linkedin: userData.public_metadata?.linkedin || "",
    location: userData.public_metadata?.location || "",
  };

  const result = await users.updateOne(
    { clerkId: userData.id },
    { $set: updateData }
  );

  console.log("User updated in MongoDB:", result.modifiedCount);
  return result;
}

// Handle user.deleted event
async function handleUserDeleted(userData) {
  const client = await clientPromise;
  const db = client.db("directoryhunt");
  const users = db.collection("users");

  // Soft delete - mark as inactive instead of deleting
  const result = await users.updateOne(
    { clerkId: userData.id },
    {
      $set: {
        isActive: false,
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  console.log("User soft deleted in MongoDB:", result.modifiedCount);
  return result;
}

// Main webhook handler
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify the webhook
    const payload = verifyWebhook(req);

    const { type, data } = payload;

    console.log("Received webhook:", type);

    switch (type) {
      case "user.created":
        await handleUserCreated(data);
        break;

      case "user.updated":
        await handleUserUpdated(data);
        break;

      case "user.deleted":
        await handleUserDeleted(data);
        break;

      default:
        console.log("Unhandled webhook type:", type);
    }

    return res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(400).json({
      error: "Webhook processing failed",
      message: error.message,
    });
  }
}
