# Code Examples and Snippets

This document provides practical code examples for common DirectoryHunt development tasks.

## Table of Contents

- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Database Operations](#database-operations)
- [React Components](#react-components)
- [Form Handling](#form-handling)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Deployment](#deployment)

## Authentication

### Protected API Endpoint

```javascript
// api/protected-endpoint.js
import { auth } from "@clerk/nextjs";

export default async function handler(req, res) {
  try {
    // Get user from Clerk
    const { userId } = auth();

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
        code: "UNAUTHORIZED",
      });
    }

    // Your protected logic here
    const result = await performProtectedOperation(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
}
```

### Client-Side Authentication Check

```jsx
// components/auth/ProtectedRoute.jsx
import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children }) {
  const { isLoaded, userId } = useAuth();

  // Show loading spinner while checking auth
  if (!isLoaded) {
    return <div className="spinner">Loading...</div>;
  }

  // Redirect to sign-in if not authenticated
  if (!userId) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
}

// Usage in App.jsx
<Route
  path="/submit"
  element={
    <ProtectedRoute>
      <SubmitAppPage />
    </ProtectedRoute>
  }
/>;
```

### Getting User Info in Components

```jsx
// components/UserProfile.jsx
import { useUser } from "@clerk/clerk-react";

export function UserProfile() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="user-profile">
      <img
        src={user?.imageUrl}
        alt={user?.fullName}
        className="w-12 h-12 rounded-full"
      />
      <div>
        <h3 className="font-semibold">{user?.fullName}</h3>
        <p className="text-gray-500">
          {user?.primaryEmailAddress?.emailAddress}
        </p>
      </div>
    </div>
  );
}
```

## API Endpoints

### CRUD Operations

```javascript
// api/apps/[id].js - Single app operations
import { AppService } from "../../libs/models/services.js";
import { AppSchema } from "../../libs/models/schemas.js";

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    switch (req.method) {
      case "GET":
        const app = await AppService.findById(id);
        if (!app) {
          return res.status(404).json({ error: "App not found" });
        }
        res.json({ app });
        break;

      case "PUT":
        const userId = req.headers["x-clerk-user-id"];
        if (!userId) {
          return res.status(401).json({ error: "Authentication required" });
        }

        const updateData = AppSchema.partial().parse(req.body);
        const updatedApp = await AppService.update(id, userId, updateData);
        res.json({ app: updatedApp });
        break;

      case "DELETE":
        const deleteUserId = req.headers["x-clerk-user-id"];
        await AppService.delete(id, deleteUserId);
        res.json({ success: true });
        break;

      default:
        res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
```

### Pagination Example

```javascript
// api/apps/route.js - List apps with pagination
export default async function handler(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      week,
      search,
      featured,
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      week,
      search,
      featured: featured === "true",
    };

    const result = await AppService.findAll(options);

    res.json({
      apps: result.apps,
      pagination: {
        page: options.page,
        limit: options.limit,
        total: result.total,
        pages: Math.ceil(result.total / options.limit),
      },
    });
  } catch (error) {
    console.error("Error fetching apps:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
```

### File Upload Handler

```javascript
// api/upload.js - Handle file uploads
import formidable from "formidable";
import path from "path";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({
    uploadDir: "./public/uploads",
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
  });

  try {
    const [fields, files] = await form.parse(req);

    const file = files.file[0];
    const newPath = path.join(
      "./public/uploads",
      `${Date.now()}-${file.originalFilename}`
    );

    fs.renameSync(file.filepath, newPath);

    const fileUrl = `/uploads/${path.basename(newPath)}`;

    res.json({
      success: true,
      fileUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
}
```

## Database Operations

### Service Class Implementation

```javascript
// libs/models/services.js
import { ObjectId } from "mongodb";
import clientPromise from "../mongodb.js";
import { AppSchema } from "./schemas.js";

export class AppService {
  static async getCollection() {
    const client = await clientPromise;
    return client.db("directoryhunt").collection("apps");
  }

  static async create(appData) {
    const validatedData = AppSchema.parse(appData);
    const collection = await this.getCollection();

    const app = {
      ...validatedData,
      _id: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      upvotes: 0,
      downvotes: 0,
      clicks: 0,
      status: "pending",
    };

    await collection.insertOne(app);
    return app;
  }

  static async findById(id) {
    const collection = await this.getCollection();
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  static async findAll(options = {}) {
    const collection = await this.getCollection();
    const { page = 1, limit = 20, category, week, search, featured } = options;

    // Build query
    let query = { status: "live" };

    if (category) {
      query.categories = category;
    }

    if (week) {
      query.launch_week = week;
    }

    if (featured) {
      query.featured = true;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { short_description: { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;

    const [apps, total] = await Promise.all([
      collection
        .find(query)
        .sort({ ranking_score: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query),
    ]);

    return { apps, total };
  }

  static async update(id, userId, updateData) {
    const collection = await this.getCollection();

    // Verify ownership
    const app = await this.findById(id);
    if (!app || app.submitted_by !== userId) {
      throw new Error("Unauthorized");
    }

    const validatedData = AppSchema.partial().parse(updateData);

    await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...validatedData,
          updatedAt: new Date(),
        },
      }
    );

    return await this.findById(id);
  }

  static async incrementViews(id) {
    const collection = await this.getCollection();
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $inc: { views: 1 } }
    );
  }
}
```

### Aggregation Pipeline Example

```javascript
// Get app statistics by category
static async getStatsByCategory() {
  const collection = await this.getCollection();

  return await collection.aggregate([
    { $match: { status: 'live' } },
    { $unwind: '$categories' },
    {
      $group: {
        _id: '$categories',
        count: { $sum: 1 },
        totalUpvotes: { $sum: '$upvotes' },
        avgRanking: { $avg: '$ranking_score' }
      }
    },
    { $sort: { count: -1 } }
  ]).toArray();
}
```

## React Components

### Custom Hook for API Calls

```jsx
// hooks/useApi.js
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";

export function useApi(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getToken, userId } = useAuth();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();

        const response = await fetch(`/api${endpoint}`, {
          ...options,
          headers: {
            Authorization: `Bearer ${token}`,
            "x-clerk-user-id": userId,
            "Content-Type": "application/json",
            ...options.headers,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [endpoint, userId]);

  return { data, loading, error };
}

// Usage
function AppList() {
  const { data, loading, error } = useApi("/apps");

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data?.apps?.map((app) => (
        <AppCard key={app._id} app={app} />
      ))}
    </div>
  );
}
```

### Reusable App Card Component

```jsx
// components/AppCard.jsx
import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AppCard({ app }) {
  const [votes, setVotes] = useState(app.upvotes);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const { userId, getToken } = useAuth();

  const handleVote = async (type) => {
    if (!userId || isVoting) return;

    setIsVoting(true);
    try {
      const token = await getToken();

      const response = await fetch(`/api/apps/${app._id}/vote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-clerk-user-id": userId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        const result = await response.json();
        setVotes(result.newVoteCount);
        setHasVoted(true);
      }
    } catch (error) {
      console.error("Vote failed:", error);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* App Logo */}
      <div className="aspect-video bg-gray-100 flex items-center justify-center p-4">
        <img
          src={app.logo_url}
          alt={app.name}
          className="max-h-full max-w-full object-contain"
        />
      </div>

      {/* App Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2">{app.name}</h3>
        <p className="text-gray-600 text-sm mb-3">{app.short_description}</p>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-3">
          {app.categories.map((category) => (
            <Badge key={category} variant="secondary">
              {category}
            </Badge>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVote("upvote")}
            disabled={!userId || isVoting || hasVoted}
            className="flex items-center gap-2"
          >
            <span>👍</span>
            <span>{votes}</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => window.open(app.website_url, "_blank")}
          >
            Visit App
          </Button>
        </div>
      </div>
    </div>
  );
}
```

## Form Handling

### App Submission Form

```jsx
// components/AppSubmissionForm.jsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

const submissionSchema = z.object({
  name: z.string().min(1, "App name is required").max(100),
  short_description: z.string().min(10).max(200),
  full_description: z.string().min(50).max(3000),
  website_url: z.string().url("Invalid URL"),
  categories: z.array(z.string()).min(1).max(3),
  pricing: z.enum(["Free", "Freemium", "Paid"]),
  contact_email: z.string().email(),
  plan: z.enum(["standard", "premium", "support"]),
});

export function AppSubmissionForm({ onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedLogo, setUploadedLogo] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      categories: [],
      pricing: "Free",
      plan: "standard",
    },
  });

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setUploadedLogo(result.fileUrl);
        setValue("logo_url", result.fileUrl);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Add form fields
      Object.keys(data).forEach((key) => {
        if (Array.isArray(data[key])) {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      });

      // Add logo if uploaded
      if (uploadedLogo) {
        formData.append("logo_url", uploadedLogo);
      }

      const response = await fetch("/api/submit-directory", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        onSuccess(result);
      } else {
        throw new Error("Submission failed");
      }
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* App Name */}
      <div>
        <label className="block text-sm font-medium mb-2">App Name *</label>
        <Input
          {...register("name")}
          placeholder="Enter your app name"
          error={errors.name?.message}
        />
      </div>

      {/* Short Description */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Short Description *
        </label>
        <Textarea
          {...register("short_description")}
          placeholder="Brief description (10-200 characters)"
          maxLength={200}
          error={errors.short_description?.message}
        />
      </div>

      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium mb-2">Logo</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {uploadedLogo && (
          <img
            src={uploadedLogo}
            alt="Uploaded logo"
            className="mt-2 w-20 h-20 object-contain border rounded"
          />
        )}
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Categories * (1-3)
        </label>
        <Select
          multiple
          value={watch("categories")}
          onValueChange={(value) => setValue("categories", value)}
          error={errors.categories?.message}
        >
          <option value="productivity">Productivity</option>
          <option value="ai">AI & Machine Learning</option>
          <option value="design">Design</option>
          <option value="marketing">Marketing</option>
          <option value="developer-tools">Developer Tools</option>
        </Select>
      </div>

      {/* Submit Button */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Submitting..." : "Submit App"}
      </Button>
    </form>
  );
}
```

## Error Handling

### Global Error Boundary

```jsx
// components/ErrorBoundary.jsx
import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);

    // Log to error tracking service
    if (process.env.NODE_ENV === "production") {
      // Sentry.captureException(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              We're sorry, but something unexpected happened. Please try
              refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### API Error Handler

```javascript
// utils/apiErrorHandler.js
export function handleApiError(error, res) {
  console.error("API Error:", error);

  // Zod validation errors
  if (error.name === "ZodError") {
    return res.status(422).json({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: error.flatten().fieldErrors,
    });
  }

  // MongoDB errors
  if (error.name === "MongoError") {
    if (error.code === 11000) {
      return res.status(409).json({
        error: "Resource already exists",
        code: "DUPLICATE_ERROR",
      });
    }
  }

  // Custom app errors
  if (error.message === "Unauthorized") {
    return res.status(403).json({
      error: "Insufficient permissions",
      code: "FORBIDDEN",
    });
  }

  if (error.message === "Not found") {
    return res.status(404).json({
      error: "Resource not found",
      code: "NOT_FOUND",
    });
  }

  // Generic server error
  return res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
}
```

## Testing

### Component Test Example

```javascript
// __tests__/components/AppCard.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import { ClerkProvider } from "@clerk/clerk-react";
import { AppCard } from "@/components/AppCard";

const mockApp = {
  _id: "123",
  name: "Test App",
  short_description: "A test application",
  categories: ["productivity"],
  upvotes: 10,
  website_url: "https://test.com",
  logo_url: "https://test.com/logo.png",
};

const TestWrapper = ({ children }) => (
  <ClerkProvider publishableKey="test_key">{children}</ClerkProvider>
);

describe("AppCard", () => {
  it("renders app information correctly", () => {
    render(<AppCard app={mockApp} />, { wrapper: TestWrapper });

    expect(screen.getByText("Test App")).toBeInTheDocument();
    expect(screen.getByText("A test application")).toBeInTheDocument();
    expect(screen.getByText("productivity")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("opens app website when visit button is clicked", () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation();

    render(<AppCard app={mockApp} />, { wrapper: TestWrapper });

    fireEvent.click(screen.getByText("Visit App"));

    expect(openSpy).toHaveBeenCalledWith("https://test.com", "_blank");
  });
});
```

### API Test Example

```javascript
// __tests__/api/apps.test.js
import { createMocks } from "node-mocks-http";
import handler from "@/api/apps";

// Mock database
jest.mock("@/libs/mongodb", () => ({
  default: Promise.resolve({
    db: () => ({
      collection: () => ({
        find: () => ({
          sort: () => ({
            skip: () => ({
              limit: () => ({
                toArray: () => Promise.resolve([]),
              }),
            }),
          }),
        }),
        countDocuments: () => Promise.resolve(0),
      }),
    }),
  }),
}));

describe("/api/apps", () => {
  it("returns apps list successfully", async () => {
    const { req, res } = createMocks({
      method: "GET",
      query: {},
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);

    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty("apps");
    expect(data).toHaveProperty("pagination");
  });

  it("returns 405 for unsupported methods", async () => {
    const { req, res } = createMocks({
      method: "DELETE",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });
});
```

This examples file provides practical, copy-paste code snippets for common DirectoryHunt development tasks. Each example follows the established patterns and includes proper error handling, authentication, and validation.
