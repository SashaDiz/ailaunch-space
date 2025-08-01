import clientPromise from "./mongodb.js";

// Database utilities for your application
export class DatabaseManager {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    if (!this.client) {
      this.client = await clientPromise;
      this.db = this.client.db(); // Uses database from connection string
    }
    return this.db;
  }

  // Collection getters
  async getCollection(name) {
    const db = await this.connect();
    return db.collection(name);
  }

  // Common operations
  async insertOne(collectionName, document) {
    const collection = await this.getCollection(collectionName);
    return await collection.insertOne({
      ...document,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async insertMany(collectionName, documents) {
    const collection = await this.getCollection(collectionName);
    const timestamp = new Date();
    const documentsWithTimestamps = documents.map((doc) => ({
      ...doc,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));
    return await collection.insertMany(documentsWithTimestamps);
  }

  async findOne(collectionName, query, options = {}) {
    const collection = await this.getCollection(collectionName);
    return await collection.findOne(query, options);
  }

  async find(collectionName, query = {}, options = {}) {
    const collection = await this.getCollection(collectionName);
    return await collection.find(query, options).toArray();
  }

  async updateOne(collectionName, filter, update, options = {}) {
    const collection = await this.getCollection(collectionName);
    const updateDoc = {
      ...update,
      $set: {
        ...update.$set,
        updatedAt: new Date(),
      },
    };
    return await collection.updateOne(filter, updateDoc, options);
  }

  async updateMany(collectionName, filter, update, options = {}) {
    const collection = await this.getCollection(collectionName);
    const updateDoc = {
      ...update,
      $set: {
        ...update.$set,
        updatedAt: new Date(),
      },
    };
    return await collection.updateMany(filter, updateDoc, options);
  }

  async deleteOne(collectionName, filter) {
    const collection = await this.getCollection(collectionName);
    return await collection.deleteOne(filter);
  }

  async deleteMany(collectionName, filter) {
    const collection = await this.getCollection(collectionName);
    return await collection.deleteMany(filter);
  }

  async count(collectionName, query = {}) {
    const collection = await this.getCollection(collectionName);
    return await collection.countDocuments(query);
  }

  // Utility methods
  async createIndex(collectionName, indexSpec, options = {}) {
    const collection = await this.getCollection(collectionName);
    return await collection.createIndex(indexSpec, options);
  }

  async getCollectionNames() {
    const db = await this.connect();
    const collections = await db.listCollections().toArray();
    return collections.map((col) => col.name);
  }
}

// Export a singleton instance
export const db = new DatabaseManager();
