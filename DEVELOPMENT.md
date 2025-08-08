# Development Quick Reference

## 🚀 Getting Started

### First Time Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file
cp .env.example .env.local

# 3. Add your credentials to .env.local
# - Get Clerk keys from https://clerk.com
# - Set up MongoDB (local or Atlas)

# 4. Initialize database
pnpm run db:init

# 5. Start development server
pnpm dev
```

### Add Sample Data

```bash
# Add test directories to see the app in action
curl -X POST http://localhost:5173/api/seed-data
```

## 🔧 Common Tasks

### Database Operations

```bash
# Initialize/reset database
pnpm run db:init

# Check database collections
pnpm run db:setup
```

### Testing API Endpoints

```bash
# Get all apps
curl http://localhost:5173/api/apps

# Get categories
curl http://localhost:5173/api/categories

# Test user endpoint (requires auth)
curl -H "x-clerk-user-id: user_test" http://localhost:5173/api/user/me
```

### Development Tools

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint code
pnpm lint
```

## 📁 Key Files

### Frontend Entry Points

- `src/main.jsx` - React app entry point
- `src/App.jsx` - Main app component with routing
- `src/pages/HomePage.jsx` - Main landing page
- `src/pages/SubmitAppPage.jsx` - Directory submission form

### API Endpoints

- `api/index.js` - Main API router (handles most endpoints)
- `api/apps.js` - App-specific operations
- `api/profile.js` - User profile management
- `api/webhooks/clerk.js` - Clerk user sync

### Database Models

- `libs/models/schemas.js` - Zod validation schemas
- `libs/models/repositories.js` - Database operations
- `libs/models/services.js` - Business logic
- `libs/database.js` - MongoDB connection

## 🎨 UI Components

All components are in `src/components/ui/` and built with Radix UI + TailwindCSS:

```jsx
// Import any component
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Use in your components
<Button variant="default" size="lg">Submit Directory</Button>
<Badge variant="secondary">Premium</Badge>
```

## 🔐 Authentication

Using Clerk for authentication:

```jsx
// Check if user is signed in
import { useAuth, useUser } from "@clerk/clerk-react";

function MyComponent() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  if (!isSignedIn) return <div>Please sign in</div>;

  return <div>Hello {user.firstName}!</div>;
}
```

## 🌐 API Usage

Custom hook for API calls:

```jsx
import { useApi, useApiMutation } from "@/hooks/useApi";

function MyComponent() {
  // GET request
  const { data, loading, error } = useApi("/apps");

  // POST request
  const { mutate, loading: submitting } = useApiMutation();

  const handleSubmit = async (formData) => {
    try {
      await mutate("/submit-directory", {
        method: "POST",
        body: JSON.stringify(formData),
      });
    } catch (error) {
      console.error("Submit failed:", error);
    }
  };
}
```

## 🐛 Troubleshooting

### Common Issues

1. **API not working**: Check if development server is running on port 5173
2. **Database errors**: Ensure MongoDB is running and connection string is correct
3. **Auth issues**: Verify Clerk keys are set in environment variables
4. **Build errors**: Run `pnpm lint` to check for code issues

### Environment Variables

Make sure these are set in `.env.local`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
MONGODB_URI=mongodb://...
VITE_APP_URL=http://localhost:5173
```

### Database Connection

Test MongoDB connection:

```bash
# If using local MongoDB
mongosh directoryhunt

# Check collections
db.apps.find().limit(3)
db.users.find().limit(3)
```

## 📝 Adding New Features

### 1. Add New API Endpoint

Edit `api/index.js` to add new routes:

```javascript
// Add to existing handler
if (path === "/my-new-endpoint" && method === "GET") {
  const result = await MyService.getData();
  return res.status(200).json(result);
}
```

### 2. Create New Page

```bash
# Create new page component
touch src/pages/MyNewPage.jsx

# Add route to App.jsx
<Route path="/my-page" element={<MyNewPage />} />
```

### 3. Add Database Model

Add schema to `libs/models/schemas.js`:

```javascript
export const MySchema = z.object({
  name: z.string(),
  // ... other fields
});
```

## 🚀 Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Environment Variables for Production

Set these in Vercel dashboard:

- `VITE_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `MONGODB_URI`
- `VITE_APP_URL`
- `CLERK_WEBHOOK_SECRET`

---

**Need help?** Check the main README.md or create an issue!
