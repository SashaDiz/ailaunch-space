#!/usr/bin/env node

import { initializeDatabase } from "../libs/models/seeders.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
  try {
    console.log("🚀 Starting database initialization...");

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is required");
    }

    await initializeDatabase();

    console.log("✅ Database initialization completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

main();
