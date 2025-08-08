# API Reference Guide

## Overview

DirectoryHunt provides a RESTful API for managing products, users, and platform interactions. The API uses a **consolidated serverless function architecture** to stay within Vercel's Hobby plan limits (max 12 functions).

## Base URL

```
Development: http://localhost:5173/api
Production: https://your-domain.com/api
```

## ⚠️ Serverless Function Limits

**IMPORTANT**: Vercel Hobby plan allows maximum 12 serverless functions. This project uses a consolidated API structure:

### Current Function Count: 4/12

- `api/index.js` - Main endpoints (dashboard, categories, weeks, user/me, submit-directory)
- `api/apps.js` - All app-related operations
- `api/profile.js` - All profile-related operations
- `api/webhooks/clerk.js` - Clerk webhook handler

### Guidelines for Adding New Endpoints

1. **DO NOT create new .js files in /api/** - Add routes to existing consolidated handlers
2. **Use query parameters instead of path parameters** when possible
3. **Group related functionality** in the same handler
4. **Test function count** before deploying: `find api -name "*.js" -type f | wc -l`

## Authentication

### Clerk Integration

The API uses Clerk for authentication. Authenticated requests include:

```http
Headers:
x-clerk-user-id: user_123abc
Authorization: Bearer <clerk-jwt-token>
```

### Protected Routes

Routes requiring authentication:

- `/api/submit-directory` - Submit new applications
- `/api/dashboard` - User dashboard data
- `/api/profile/*` - Profile management
- `/api/apps/*/vote` - Voting on applications

## Endpoints Reference

### Core Endpoints (api/index.js)

#### GET /api/dashboard

Get user dashboard data (requires authentication).

**Response:**

```json
{
  "success": true,
  "data": {
    "totalApps": 5,
    "totalVotes": 23,
    "recentApps": [...],
    "stats": {...}
  }
}
```

#### GET /api/categories

Get all available categories.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "productivity",
      "name": "Productivity",
      "description": "Tools to boost productivity"
    }
  ]
}
```

#### GET /api/weeks

Get all launch weeks.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "2025-W32",
      "startDate": "2025-08-04",
      "endDate": "2025-08-10",
      "isActive": true
    }
  ]
}
```

#### GET /api/user/me

Get current user profile (requires authentication).

#### POST /api/submit-directory

Submit a new application (requires authentication).

### Apps Endpoints (api/apps.js)

#### GET /api/apps

List all approved applications with pagination and filtering.

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `category` (string): Filter by category
- `week` (string): Filter by launch week (format: YYYY-WXX)
- `featured` (boolean): Show only featured apps
- `search` (string): Search in name and description

#### GET /api/apps?slug={slug}

Get detailed information about a specific application.

#### POST /api/apps?slug={slug}&action=vote

Vote for an application (requires authentication).

#### PUT /api/apps?slug={slug}&action=edit

Update an application (requires authentication & ownership).

#### DELETE /api/apps?slug={slug}&action=edit

Delete an application (requires authentication & ownership).

### Profile Endpoints (api/profile.js)

#### GET /api/profile

Get current user's profile (requires authentication).

#### GET /api/profile?userId={userId}

Get any user's public profile.

#### PUT /api/profile

Update current user's profile (requires authentication).

#### POST /api/profile?action=sync

Sync user data with external services (requires authentication).

**Response:**

```json
{
  "apps": [
    {
      "_id": "app123",
      "name": "My App",
      "short_description": "Brief description",
      "website_url": "https://myapp.com",
      "logo_url": "https://cdn.com/logo.png",
      "categories": ["productivity"],
      "pricing": "Freemium",
      "upvotes": 25,
      "launch_week": "2024-W01",
      "status": "live",
      "featured": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### GET /api/apps/edit/[id]

Get detailed information about a specific application for editing (requires authentication).

**Response:**

```json
{
  "app": {
    "_id": "app123",
    "name": "My App",
    "slug": "my-app",
    "short_description": "Brief description",
    "full_description": "Detailed description...",
    "website_url": "https://myapp.com",
    "logo_url": "https://cdn.com/logo.png",
    "screenshots": ["https://cdn.com/screen1.png"],
    "video_url": "https://youtube.com/watch?v=...",
    "categories": ["productivity", "ai"],
    "pricing": "Freemium",
    "tags": ["automation", "workflow"],
    "launch_week": "2024-W01",
    "launch_date": "2024-01-01T00:00:00Z",
    "contact_email": "contact@myapp.com",
    "submitted_by": "user123",
    "plan": "premium",
    "status": "live",
    "featured": true,
    "views": 1250,
    "upvotes": 45,
    "downvotes": 2,
    "clicks": 89,
    "ranking_score": 87.5,
    "weekly_ranking": 3,
    "createdAt": "2024-01-01T00:00:00Z",
    "publishedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### POST /api/apps/[slug]/vote

Vote on an application using its slug (requires authentication).

**Request Body:**

```json
{
  "type": "upvote" // or "downvote"
}
```

**Response:**

```json
{
  "success": true,
  "vote": {
    "type": "upvote",
    "userId": "user123",
    "appId": "app123"
  },
  "newVoteCount": 46
}
```

### App Submission

#### POST /api/submit-directory

Submit a new application (requires authentication).

**Content-Type:** `multipart/form-data`

**Form Fields:**

```javascript
{
  // Required fields
  name: "My Awesome App",
  short_description: "Brief description (10-200 chars)",
  full_description: "Detailed description (50-3000 chars)",
  website_url: "https://myapp.com",
  categories: ["productivity", "ai"], // JSON array, 1-3 items
  pricing: "Free|Freemium|Paid",
  contact_email: "contact@myapp.com",
  plan: "standard|premium|support",

  // Optional fields
  video_url: "https://youtube.com/watch?v=...",
  tags: ["automation", "workflow"], // JSON array
  backlink_url: "https://myapp.com/backlink", // Required for support plan
  meta_title: "SEO title (max 60 chars)",
  meta_description: "SEO description (max 160 chars)",

  // File uploads
  logo: File, // Logo image
  screenshot_0: File, // Screenshot 1
  screenshot_1: File, // Screenshot 2
  // ... up to screenshot_4
}
```

**Response:**

```json
{
  "success": true,
  "app": {
    "_id": "app123",
    "slug": "my-awesome-app",
    "status": "pending"
  },
  "message": "Application submitted successfully"
}
```

### User Management

#### GET /api/user/me

Get current user's profile information (requires authentication).

**Response:**

```json
{
  "user": {
    "_id": "user123",
    "clerkId": "clerk_user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "imageUrl": "https://images.clerk.dev/...",
    "bio": "Product maker and entrepreneur",
    "website": "https://johndoe.com",
    "twitter": "johndoe",
    "github": "johndoe",
    "linkedin": "johndoe",
    "location": "San Francisco, CA",
    "totalSubmissions": 3,
    "subscription": "premium",
    "subscriptionExpiry": "2024-12-31T23:59:59Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /api/profile/[userId]

Get public profile information for any user.

**Response:**

```json
{
  "user": {
    "_id": "user123",
    "fullName": "John Doe",
    "imageUrl": "https://images.clerk.dev/...",
    "bio": "Product maker and entrepreneur",
    "website": "https://johndoe.com",
    "twitter": "johndoe",
    "github": "johndoe",
    "linkedin": "johndoe",
    "location": "San Francisco, CA",
    "totalSubmissions": 3,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "apps": [
    // User's submitted apps
  ]
}
```

#### PUT /api/profile/sync

Sync user profile with Clerk data (requires authentication).

**Request Body:**

```json
{
  "bio": "Updated bio",
  "website": "https://newwebsite.com",
  "twitter": "newhandle",
  "github": "newgithub",
  "linkedin": "newlinkedin",
  "location": "New City, State"
}
```

### Categories

#### GET /api/categories

Get all available categories.

**Response:**

```json
{
  "categories": [
    {
      "_id": "cat123",
      "name": "Productivity",
      "slug": "productivity",
      "description": "Tools to boost productivity",
      "color": "#3B82F6",
      "icon": "⚡",
      "appCount": 45,
      "featured": true
    }
  ]
}
```

### Launch Weeks

#### GET /api/weeks

Get launch weeks with app counts.

**Query Parameters:**

- `limit` (number): Number of weeks to return
- `upcoming` (boolean): Show only upcoming weeks

**Response:**

```json
{
  "weeks": [
    {
      "_id": "week123",
      "week": "2024-W01",
      "year": 2024,
      "weekNumber": 1,
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-01-07T23:59:59Z",
      "appCount": 12,
      "isActive": true,
      "isFeatured": false
    }
  ]
}
```

### Dashboard

#### GET /api/dashboard

Get user dashboard data (requires authentication).

**Response:**

```json
{
  "stats": {
    "totalApps": 3,
    "totalViews": 1250,
    "totalUpvotes": 89,
    "totalClicks": 45
  },
  "recentApps": [
    // User's recent app submissions
  ],
  "analytics": {
    "weeklyViews": [100, 150, 200, 180, 220],
    "weeklyUpvotes": [10, 15, 20, 18, 25]
  }
}
```

## Error Handling

### Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific field error"
  }
}
```

### Common Error Codes

- `400` - Bad Request (invalid data)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate data)
- `422` - Unprocessable Entity (validation failed)
- `500` - Internal Server Error

### Validation Errors

Form validation errors return detailed field-specific messages:

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "name": "App name is required",
    "short_description": "Description must be at least 10 characters",
    "categories": "At least one category is required"
  }
}
```

## Rate Limiting

- **General API**: 100 requests per minute per IP
- **Submission endpoint**: 5 submissions per hour per user
- **Voting endpoint**: 50 votes per minute per user

## Webhooks

### Clerk User Sync

**Endpoint:** `POST /api/webhooks/clerk`

Automatically syncs user data when users sign up or update their profiles in Clerk.

**Headers:**

```
svix-id: unique-message-id
svix-timestamp: timestamp
svix-signature: signature
```

## SDKs and Examples

### JavaScript/Node.js Example

```javascript
// Submit an app
const formData = new FormData();
formData.append("name", "My App");
formData.append("short_description", "Brief description");
formData.append("full_description", "Detailed description");
formData.append("website_url", "https://myapp.com");
formData.append("categories", JSON.stringify(["productivity"]));
formData.append("pricing", "Freemium");
formData.append("contact_email", "contact@myapp.com");
formData.append("plan", "standard");

const response = await fetch("/api/submit-directory", {
  method: "POST",
  headers: {
    "x-clerk-user-id": userId,
  },
  body: formData,
});

const result = await response.json();
```

### React Hook Example

```javascript
import { useAuth } from "@clerk/clerk-react";

function useApiClient() {
  const { getToken, userId } = useAuth();

  const apiCall = async (endpoint, options = {}) => {
    const token = await getToken();

    return fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "x-clerk-user-id": userId,
        ...options.headers,
      },
    });
  };

  return { apiCall };
}
```

## Testing

Use the `/webhook-test` page in development to test API endpoints interactively.

For automated testing:

```bash
# Run API tests
npm run test:api

# Test specific endpoint
curl -X GET "http://localhost:5173/api/apps" \
  -H "Content-Type: application/json"
```
