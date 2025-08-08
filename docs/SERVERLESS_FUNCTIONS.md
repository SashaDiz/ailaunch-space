# Serverless Function Management Guide

## Overview

This guide helps maintain the project within Vercel's Hobby plan limits (max 12 serverless functions) and provides guidelines for future development.

## Current Architecture

### Function Count: 4/12 ✅

1. **api/index.js** - Core endpoints
2. **api/apps.js** - App-related operations
3. **api/profile.js** - Profile operations
4. **api/webhooks/clerk.js** - Webhook handling

## Consolidated API Structure

### api/index.js - Core Endpoints

Handles basic platform operations:

- `GET /api/dashboard` - User dashboard
- `GET /api/categories` - Available categories
- `GET /api/weeks` - Launch weeks
- `GET /api/user/me` - Current user info
- `POST /api/submit-directory` - Submit new app

### api/apps.js - App Operations

Handles all app-related functionality using query parameters:

- `GET /api/apps` - List apps
- `GET /api/apps?slug={slug}` - App details
- `POST /api/apps?slug={slug}&action=vote` - Vote for app
- `PUT /api/apps?slug={slug}&action=edit` - Edit app
- `DELETE /api/apps?slug={slug}&action=edit` - Delete app

### api/profile.js - Profile Operations

Handles user profile management:

- `GET /api/profile` - Current user profile
- `GET /api/profile?userId={userId}` - User's public profile
- `PUT /api/profile` - Update profile
- `POST /api/profile?action=sync` - Sync user data

### api/webhooks/clerk.js - Webhook Handler

Handles external webhooks from Clerk authentication.

## Development Guidelines

### ✅ DO

1. **Add new endpoints to existing handlers**

   ```javascript
   // In api/apps.js
   if (action === "share" && method === "POST") {
     // Handle app sharing
   }
   ```

2. **Use query parameters for routing**

   ```javascript
   // Good: /api/apps?slug=example&action=analytics
   // Not: /api/apps/example/analytics (creates new function)
   ```

3. **Group related functionality**

   ```javascript
   // All user-related operations in api/profile.js
   // All app-related operations in api/apps.js
   ```

4. **Test function count before deployment**
   ```bash
   # Count current serverless functions
   find api -name "*.js" -type f | wc -l
   ```

### ❌ DON'T

1. **Create new .js files in /api directory**

   ```bash
   # This creates a new serverless function:
   touch api/analytics.js  # ❌ DON'T DO THIS
   ```

2. **Use dynamic file-based routing**

   ```bash
   # These create separate functions:
   mkdir -p api/apps/[slug]     # ❌ Avoid
   touch api/apps/[slug]/vote.js # ❌ Avoid
   ```

3. **Create nested directory structures**
   ```bash
   # Each .js file = 1 function:
   api/
     users/
       profile.js    # Function 1
       settings.js   # Function 2
       billing.js    # Function 3
   ```

## Adding New Features

### Example: Adding App Analytics

Instead of creating `api/analytics.js`, add to existing handler:

```javascript
// In api/apps.js
export default async function handler(req, res) {
  const { slug, action } = req.query;

  // Existing code...

  // Add new analytics endpoint
  if (slug && action === "analytics" && method === "GET") {
    const result = await AppService.getAnalytics(slug, userId);
    return res.status(result.success ? 200 : 400).json(result);
  }
}
```

### Example: Adding Admin Features

Add admin routes to `api/index.js`:

```javascript
// In api/index.js
if (path === "/admin/stats" && method === "GET") {
  // Check admin permissions
  const result = await AdminService.getStats();
  return res.status(result.success ? 200 : 500).json(result);
}
```

## Monitoring Function Count

### Automated Check

Add this script to package.json:

```json
{
  "scripts": {
    "check-functions": "echo 'Serverless Functions:' && find api -name '*.js' -type f | wc -l && echo '/12 (Hobby limit)'"
  }
}
```

### Pre-deployment Checklist

1. Run function count check: `npm run check-functions`
2. Ensure count ≤ 12
3. Test all consolidated endpoints
4. Update this documentation if adding new routes

## Vercel Configuration

The `vercel.json` file uses rewrites to route requests to consolidated handlers:

```json
{
  "rewrites": [
    {
      "source": "/api/dashboard",
      "destination": "/api/index"
    },
    {
      "source": "/api/apps/(.*)",
      "destination": "/api/apps?slug=$1"
    }
  ]
}
```

## Future Scaling Options

If you need more than 12 functions:

1. **Upgrade to Pro Plan** ($20/month for 100 functions)
2. **Further consolidation** (single mega-handler)
3. **Move to different platform** (AWS Lambda, etc.)
4. **Use edge functions** for simple operations

## Troubleshooting

### "Too many serverless functions" Error

1. Check function count: `find api -name "*.js" -type f`
2. Identify unnecessary functions
3. Consolidate or remove excess functions
4. Update vercel.json rewrites
5. Redeploy

### Common Mistakes

- Creating `/api/utils.js` (counts as function even if unused)
- Nested directories with multiple .js files
- Duplicate endpoints (old + new structure)
- Test files in production deployment

## Best Practices Summary

1. **One domain = One handler** (apps → apps.js, profiles → profile.js)
2. **Query parameters over path parameters** for routing
3. **Consolidate before you create** new functions
4. **Monitor function count** regularly
5. **Document new routes** in this guide
