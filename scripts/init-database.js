import { createUserIndexes } from "../libs/models/users.js";
import clientPromise from "../libs/mongodb.js";

async function initializeDatabase() {
  try {
    console.log("Initializing database...");

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("directoryhunt");

    console.log("Connected to MongoDB");

    // Create user indexes
    await createUserIndexes();

    // Create other collections if they don't exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    if (!collectionNames.includes("users")) {
      await db.createCollection("users");
      console.log("Users collection created");
    }

    if (!collectionNames.includes("apps")) {
      await db.createCollection("apps");
      console.log("Apps collection created");
    }

    console.log("Database initialization complete!");
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}

export default initializeDatabase;
