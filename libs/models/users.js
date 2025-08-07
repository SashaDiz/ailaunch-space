import clientPromise from "../mongodb.js";

/**
 * Get user by Clerk ID
 */
export async function getUserByClerkId(clerkId) {
  const client = await clientPromise;
  const db = client.db("directoryhunt");
  const users = db.collection("users");

  return await users.findOne({ clerkId, isActive: true });
}

/**
 * Get user by email
 */
export async function getUserByEmail(email) {
  const client = await clientPromise;
  const db = client.db("directoryhunt");
  const users = db.collection("users");

  return await users.findOne({ email, isActive: true });
}

/**
 * Update user profile data
 */
export async function updateUserProfile(clerkId, profileData) {
  const client = await clientPromise;
  const db = client.db("directoryhunt");
  const users = db.collection("users");

  const updateData = {
    ...profileData,
    updatedAt: new Date(),
  };

  return await users.updateOne(
    { clerkId, isActive: true },
    { $set: updateData }
  );
}

/**
 * Increment user's submission count
 */
export async function incrementUserSubmissions(clerkId) {
  const client = await clientPromise;
  const db = client.db("directoryhunt");
  const users = db.collection("users");

  return await users.updateOne(
    { clerkId, isActive: true },
    {
      $inc: { totalSubmissions: 1 },
      $set: { updatedAt: new Date() },
    }
  );
}

/**
 * Get all users (for admin purposes)
 */
export async function getAllUsers(limit = 50, skip = 0) {
  const client = await clientPromise;
  const db = client.db("directoryhunt");
  const users = db.collection("users");

  return await users
    .find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .toArray();
}

/**
 * Create database indexes for better performance
 */
export async function createUserIndexes() {
  const client = await clientPromise;
  const db = client.db("directoryhunt");
  const users = db.collection("users");

  // Create indexes
  await users.createIndex({ clerkId: 1 }, { unique: true });
  await users.createIndex({ email: 1 });
  await users.createIndex({ isActive: 1 });
  await users.createIndex({ createdAt: -1 });

  console.log("User indexes created");
}

/**
 * Create or update user (upsert)
 */
export async function upsertUser(userData) {
  const client = await clientPromise;
  const db = client.db("directoryhunt");
  const users = db.collection("users");

  const { clerkId, email, firstName, lastName } = userData;

  const upsertData = {
    clerkId,
    email,
    firstName: firstName || "",
    lastName: lastName || "",
    isActive: true,
    updatedAt: new Date(),
  };

  // Add createdAt only if it's a new document
  const result = await users.updateOne(
    { clerkId },
    {
      $set: upsertData,
      $setOnInsert: { createdAt: new Date(), totalSubmissions: 0 },
    },
    { upsert: true }
  );

  return result;
}

/**
 * Delete user by Clerk ID
 */
export async function deleteUserByClerkId(clerkId) {
  const client = await clientPromise;
  const db = client.db("directoryhunt");
  const users = db.collection("users");

  // Soft delete by setting isActive to false
  return await users.updateOne(
    { clerkId },
    {
      $set: {
        isActive: false,
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );
}
