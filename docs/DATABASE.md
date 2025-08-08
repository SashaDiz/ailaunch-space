# Database Schema Documentation

## Overview

DirectoryHunt uses MongoDB as its primary database. This document outlines the database schema, collections, indexes, and relationships.

## Collections

### users

Stores user profile information synchronized with Clerk authentication.

```javascript
{
  _id: ObjectId,                    // MongoDB document ID
  clerkId: String,                  // Clerk user ID (unique)
  email: String,                    // User email address
  firstName: String,                // User's first name
  lastName: String,                 // User's last name
  fullName: String,                 // Full display name
  imageUrl: String,                 // Profile image URL
  emailVerified: Boolean,           // Email verification status

  // Profile information
  bio: String,                      // User bio (max 500 chars)
  website: String,                  // Personal website URL
  twitter: String,                  // Twitter handle
  github: String,                   // GitHub username
  linkedin: String,                 // LinkedIn profile
  location: String,                 // User location

  // App-specific fields
  totalSubmissions: Number,         // Number of apps submitted
  subscription: String,             // "free", "premium", "lifetime"
  subscriptionExpiry: Date,         // Subscription expiration date
  isActive: Boolean,                // Account status
  deletedAt: Date,                  // Soft delete timestamp

  // Timestamps
  createdAt: Date,                  // Account creation date
  updatedAt: Date                   // Last update timestamp
}
```

**Indexes:**

- `clerkId` (unique)
- `email` (unique)
- `createdAt`
- `subscription`

### apps

Stores product/application submissions and their metadata.

```javascript
{
  _id: ObjectId,                    // MongoDB document ID

  // Basic Information
  name: String,                     // App name (1-100 chars)
  slug: String,                     // URL-friendly slug (unique)
  short_description: String,        // Brief description (10-200 chars)
  full_description: String,         // Detailed description (50-3000 chars)

  // URLs and Media
  website_url: String,              // Main app website
  logo_url: String,                 // Logo image URL
  screenshots: [String],            // Array of screenshot URLs (max 5)
  video_url: String,                // Demo video URL (optional)

  // Categorization
  categories: [String],             // Category IDs (1-3 categories)
  pricing: String,                  // "Free", "Freemium", "Paid"
  tags: [String],                   // Search tags

  // Launch Information
  launch_week: String,              // Format: "YYYY-WXX" (e.g., "2024-W01")
  launch_date: Date,                // Specific launch date

  // Contact and Ownership
  contact_email: String,            // Contact email for the app
  submitted_by: String,             // User ID who submitted

  // Plan and Features
  plan: String,                     // "standard", "premium", "support"
  backlink_url: String,             // Required for support plan

  // Status and Moderation
  status: String,                   // "pending", "approved", "rejected", "live", "archived"
  rejection_reason: String,         // Reason for rejection (if applicable)
  featured: Boolean,                // Featured app status

  // Engagement Metrics
  views: Number,                    // Total page views
  upvotes: Number,                  // Total upvotes
  downvotes: Number,                // Total downvotes
  clicks: Number,                   // External link clicks

  // Ranking
  ranking_score: Number,            // Calculated ranking score
  weekly_ranking: Number,           // Position in launch week

  // SEO
  meta_title: String,               // SEO title (max 60 chars)
  meta_description: String,         // SEO description (max 160 chars)

  // Timestamps
  createdAt: Date,                  // Submission date
  updatedAt: Date,                  // Last modification
  publishedAt: Date                 // Publication date
}
```

**Indexes:**

- `slug` (unique)
- `launch_week`
- `status`
- `submitted_by`
- `categories`
- `featured`
- `ranking_score` (descending)
- `createdAt` (descending)
- `{ launch_week: 1, status: 1, ranking_score: -1 }` (compound)

### categories

Defines available app categories.

```javascript
{
  _id: ObjectId,                    // MongoDB document ID
  name: String,                     // Category name
  slug: String,                     // URL-friendly slug (unique)
  description: String,              // Category description
  color: String,                    // Hex color code for UI
  icon: String,                     // Icon identifier or emoji
  appCount: Number,                 // Number of apps in category
  featured: Boolean,                // Featured category status
  sortOrder: Number,                // Display order
  isActive: Boolean,                // Category status

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `slug` (unique)
- `featured`
- `sortOrder`
- `isActive`

### launch_weeks

Manages launch week scheduling and organization.

```javascript
{
  _id: ObjectId,                    // MongoDB document ID
  week: String,                     // Week identifier "YYYY-WXX"
  year: Number,                     // Launch year
  weekNumber: Number,               // Week number (1-53)
  startDate: Date,                  // Week start date (Monday)
  endDate: Date,                    // Week end date (Sunday)
  appCount: Number,                 // Number of apps launched this week
  isActive: Boolean,                // Current active week
  isFeatured: Boolean,              // Featured week status

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `week` (unique)
- `year`
- `startDate`
- `isActive`

### votes

Tracks user voting on applications.

```javascript
{
  _id: ObjectId,                    // MongoDB document ID
  userId: String,                   // User ID (Clerk ID)
  appId: ObjectId,                  // App document ID
  type: String,                     // "upvote" or "downvote"
  ipAddress: String,                // IP address for duplicate prevention
  userAgent: String,                // Browser user agent

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- `{ userId: 1, appId: 1 }` (unique compound)
- `appId`
- `userId`
- `createdAt`

### analytics

Stores detailed analytics data.

```javascript
{
  _id: ObjectId,                    // MongoDB document ID
  type: String,                     // "page_view", "click", "vote", "submission"
  appId: ObjectId,                  // Related app (if applicable)
  userId: String,                   // User ID (if authenticated)
  sessionId: String,                // Session identifier

  // Event data
  data: {
    page: String,                   // Page URL
    referrer: String,               // Referrer URL
    device: String,                 // Device type
    browser: String,                // Browser name
    os: String,                     // Operating system
    country: String,                // User country
    city: String                    // User city
  },

  // Timestamps
  timestamp: Date,                  // Event timestamp
  createdAt: Date
}
```

**Indexes:**

- `type`
- `appId`
- `userId`
- `timestamp`
- `{ appId: 1, type: 1, timestamp: -1 }` (compound)

## Relationships

### User → Apps (One-to-Many)

- A user can submit multiple apps
- Relationship via `apps.submitted_by = users.clerkId`

### Apps → Categories (Many-to-Many)

- An app can belong to multiple categories
- Relationship via `apps.categories` array containing category slugs

### Users → Votes → Apps (Many-to-Many through Votes)

- Users can vote on multiple apps
- Apps can receive votes from multiple users
- Relationship via `votes` collection

### Launch Weeks → Apps (One-to-Many)

- A launch week contains multiple apps
- Relationship via `apps.launch_week = launch_weeks.week`

## Data Validation

### Zod Schemas

All data validation is handled using Zod schemas defined in `libs/models/schemas.js`:

```javascript
// User validation
export const UserSchema = z.object({
  clerkId: z.string(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  bio: z.string().max(500).optional(),
  // ... other fields
});

// App validation
export const AppSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  short_description: z.string().min(10).max(200),
  // ... other fields
});
```

## Database Operations

### Connection Management

```javascript
// libs/mongodb.js
import { MongoClient } from "mongodb";

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(process.env.MONGODB_URI);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(process.env.MONGODB_URI);
  clientPromise = client.connect();
}

export default clientPromise;
```

### Service Layer

Database operations are abstracted through service classes:

```javascript
// libs/models/services.js
export class AppService {
  static async create(appData) {
    const db = await getDatabase();
    const collection = db.collection("apps");

    const app = {
      ...appData,
      _id: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.insertOne(app);
    return app;
  }

  static async findById(id) {
    const db = await getDatabase();
    const collection = db.collection("apps");
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  static async findByLaunchWeek(week, options = {}) {
    const db = await getDatabase();
    const collection = db.collection("apps");

    const query = {
      launch_week: week,
      status: "live",
    };

    return await collection
      .find(query)
      .sort({ ranking_score: -1 })
      .limit(options.limit || 50)
      .toArray();
  }
}
```

## Database Initialization

### Setup Script

The database is initialized using the setup script:

```javascript
// scripts/init-database.js
async function initializeDatabase() {
  const client = await clientPromise;
  const db = client.db("directoryhunt");

  // Create indexes
  await createIndexes(db);

  // Seed initial data
  await seedCategories(db);
  await seedLaunchWeeks(db);

  console.log("Database initialization completed");
}
```

### Index Creation

```javascript
async function createIndexes(db) {
  // Users collection
  await db.collection("users").createIndex({ clerkId: 1 }, { unique: true });
  await db.collection("users").createIndex({ email: 1 }, { unique: true });

  // Apps collection
  await db.collection("apps").createIndex({ slug: 1 }, { unique: true });
  await db
    .collection("apps")
    .createIndex({ launch_week: 1, status: 1, ranking_score: -1 });
  await db.collection("apps").createIndex({ categories: 1 });
  await db.collection("apps").createIndex({ submitted_by: 1 });

  // Categories collection
  await db.collection("categories").createIndex({ slug: 1 }, { unique: true });

  // Launch weeks collection
  await db
    .collection("launch_weeks")
    .createIndex({ week: 1 }, { unique: true });

  // Votes collection
  await db
    .collection("votes")
    .createIndex({ userId: 1, appId: 1 }, { unique: true });

  // Analytics collection
  await db
    .collection("analytics")
    .createIndex({ appId: 1, type: 1, timestamp: -1 });
}
```

## Data Migration

### Migration Scripts

For schema changes, create migration scripts:

```javascript
// scripts/migrations/001_add_meta_fields.js
export async function up(db) {
  await db.collection("apps").updateMany(
    { meta_title: { $exists: false } },
    {
      $set: {
        meta_title: null,
        meta_description: null,
      },
    }
  );
}

export async function down(db) {
  await db.collection("apps").updateMany(
    {},
    {
      $unset: {
        meta_title: "",
        meta_description: "",
      },
    }
  );
}
```

## Performance Considerations

### Query Optimization

```javascript
// Good: Use indexes for filtering and sorting
const apps = await collection
  .find({ launch_week: "2024-W01", status: "live" })
  .sort({ ranking_score: -1 })
  .limit(20)
  .toArray();

// Good: Use projection to limit fields
const apps = await collection
  .find(query)
  .project({
    name: 1,
    short_description: 1,
    logo_url: 1,
    upvotes: 1,
  })
  .toArray();

// Good: Use aggregation for complex queries
const stats = await collection
  .aggregate([
    { $match: { launch_week: "2024-W01" } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgVotes: { $avg: "$upvotes" },
      },
    },
  ])
  .toArray();
```

### Pagination

```javascript
// Cursor-based pagination for better performance
async function getApps(lastId = null, limit = 20) {
  const query = lastId ? { _id: { $lt: new ObjectId(lastId) } } : {};

  return await collection.find(query).sort({ _id: -1 }).limit(limit).toArray();
}
```

## Security Considerations

### Data Sanitization

```javascript
// Always validate and sanitize input
const sanitizedApp = AppSchema.parse(rawAppData);

// Escape HTML content
import DOMPurify from "dompurify";
const cleanDescription = DOMPurify.sanitize(description);
```

### Access Control

```javascript
// Check user permissions before operations
async function updateApp(appId, userId, updateData) {
  const app = await AppService.findById(appId);

  if (app.submitted_by !== userId) {
    throw new Error("Unauthorized: Cannot edit app");
  }

  return await AppService.update(appId, updateData);
}
```

## Backup and Recovery

### Backup Strategy

```bash
# Daily backup script
mongodump --uri="$MONGODB_URI" --out="/backup/$(date +%Y%m%d)"

# Backup specific collections
mongodump --uri="$MONGODB_URI" --collection=apps --out="/backup/apps_$(date +%Y%m%d)"
```

### Restore Process

```bash
# Restore entire database
mongorestore --uri="$MONGODB_URI" /backup/20240101/

# Restore specific collection
mongorestore --uri="$MONGODB_URI" --collection=apps /backup/apps_20240101/directoryhunt/apps.bson
```

This schema documentation provides a comprehensive overview of the DirectoryHunt database structure and operations.
