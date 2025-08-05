# MongoDB Database Setup Guide

Your project is now fully connected to MongoDB Atlas with a complete database schema and API structure! 🎉

## ✅ What's Been Set Up

### 1. **Database Connection**

- Fixed MongoDB connection in `libs/mongodb.js`
- Added MongoDB adapter for NextAuth authentication
- Environment variables properly configured

### 2. **Complete Database Schema**

Located in `libs/models/schemas.js`:

- **Users**: Authentication + profile data
- **Apps**: Product submissions with categories, voting, etc.
- **Votes**: User voting system
- **Launch Weeks**: Weekly app launches
- **Categories**: App categorization (30 predefined categories)
- **Analytics**: View/click tracking
- **Payments**: Premium plan tracking
- **Newsletter**: Email subscriptions

### 3. **Database Operations**

Located in `libs/models/repositories.js`:

- **UserRepository**: User management
- **AppRepository**: App CRUD operations
- **VoteRepository**: Voting system
- **LaunchWeekRepository**: Weekly launches
- **CategoryRepository**: Category management

### 4. **Business Logic Services**

Located in `libs/models/services.js`:

- **AppService**: Complete app management (submit, vote, search, etc.)
- **WeekService**: Launch week management
- **StatsService**: Platform statistics

### 5. **API Routes**

- `GET/POST /api/apps` - List and submit apps
- `GET /api/apps/[slug]` - Get app details
- `POST /api/apps/[slug]/vote` - Vote for an app
- `GET /api/categories` - Get all categories
- `GET /api/dashboard` - User dashboard data
- `GET /api/weeks` - Available launch weeks

### 6. **Database Initialization**

- Pre-seeded with 30 categories from your SubmitAppPage
- Created 12 launch weeks (4 past, current, 7 future)
- All necessary indexes for optimal performance

## 🚀 How to Use

### Submit an App

```javascript
const response = await fetch("/api/apps", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "My Awesome App",
    short_description: "Brief description",
    full_description: "Detailed description",
    website_url: "https://myapp.com",
    logo_url: "https://myapp.com/logo.png",
    categories: ["AI & LLM", "Developer Tools & Platforms"],
    pricing: "Freemium",
    contact_email: "user@example.com",
    plan: "standard", // or "premium", "support"
  }),
});
```

### Vote for an App

```javascript
const response = await fetch("/api/apps/app-slug/vote", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ vote_type: "upvote" }), // or "downvote"
});
```

### Get Apps with Filters

```javascript
// Get featured apps
const featured = await fetch("/api/apps?featured=true");

// Get apps by category
const aiApps = await fetch("/api/apps?category=AI%20%26%20LLM");

// Search apps
const searchResults = await fetch("/api/apps?search=productivity");

// Get current week's apps
const thisWeek = await fetch("/api/apps?week=2024-W32");
```

### User Dashboard

```javascript
const dashboard = await fetch("/api/dashboard");
// Returns: user's apps, stats (views, upvotes, etc.)
```

## 🛠 Database Operations Examples

### Direct Database Access (Server-side)

```javascript
import { AppRepository, UserRepository } from "@/libs/models/repositories";

// Create an app
const app = await AppRepository.createApp({
  name: "My App",
  // ... other fields
});

// Get user stats
const stats = await UserRepository.getUserStats(userId);

// Get trending apps
const trending = await AppRepository.getTrendingApps(10);
```

### Using Services (Recommended)

```javascript
import { AppService } from "@/libs/models/services";

// Submit app with validation
const result = await AppService.submitApp(appData, userId);

// Get app details with user vote
const app = await AppService.getAppDetails(slug, userId);

// Vote for app
const vote = await AppService.voteForApp(userId, appId, "upvote");
```

## 📊 Available Collections

1. **users** - User accounts (managed by NextAuth)
2. **apps** - Submitted applications/products
3. **votes** - User votes for apps
4. **launch_weeks** - Weekly launch periods
5. **categories** - App categories (30 pre-seeded)
6. **analytics** - View/click tracking data
7. **payments** - Payment records
8. **newsletters** - Email subscriptions

## 🔧 Environment Variables

Make sure these are set in your `.env`:

```
MONGODB_URI=mongodb+srv://... (✅ Already configured)
NEXTAUTH_SECRET=... (✅ Already configured)
NEXTAUTH_URL=http://localhost:5173 (✅ Already configured)
```

## 🎯 Next Steps

1. **Update your components** to use the new API endpoints
2. **Implement file upload** for logos/screenshots (consider Cloudinary or AWS S3)
3. **Add payment integration** (Stripe) for premium plans
4. **Set up email notifications** using Resend
5. **Add admin panel** for app moderation

## 🔍 Testing the Database

You can test the database connection by visiting these endpoints:

- `/api/categories` - Should return 30 categories
- `/api/weeks` - Should return available launch weeks
- `/api/apps` - Should return empty array (no apps yet)

## 📝 Database Scripts

```bash
npm run db:init    # Initialize database with categories and weeks
npm run db:seed    # Same as above (alias)
```

Your MongoDB database is now fully set up and ready to use! The schema handles everything from user authentication to app submissions, voting, weekly launches, and analytics. All API routes are protected with proper authentication where needed.
