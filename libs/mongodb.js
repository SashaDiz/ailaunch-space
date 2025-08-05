import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Load environment variables if not already loaded
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: ".env" });
}

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env");
}

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable to preserve the connection
  if (!global._mongoClientPromise) {
    client = new MongoClient(process.env.MONGODB_URI);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, create a new client for each connection
  client = new MongoClient(process.env.MONGODB_URI);
  clientPromise = client.connect();
}

export default clientPromise;
