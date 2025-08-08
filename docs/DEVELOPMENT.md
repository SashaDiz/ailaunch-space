# Development Guide

## Getting Started

This guide will help you set up and contribute to the DirectoryHunt project.

## Development Environment Setup

### 1. Prerequisites

- **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
- **pnpm**: Install with `npm install -g pnpm`
- **MongoDB**: Local installation or MongoDB Atlas account
- **Git**: Version control
- **VS Code**: Recommended editor with extensions

### 2. Recommended VS Code Extensions

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

### 3. Project Setup

```bash
# Clone the repository
git clone <repository-url>
cd directoryhunt

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Edit environment variables
code .env

# Initialize database
npm run db:init

# Start development server
npm run dev
```

## Project Architecture

### Frontend Architecture

```
src/
├── components/
│   ├── ui/           # Base UI components (Radix + Tailwind)
│   ├── auth/         # Authentication components
│   └── *.jsx         # Feature components
├── pages/            # Route components
├── hooks/            # Custom React hooks
├── lib/              # Utilities and helpers
└── contexts/         # React contexts
```

### Backend Architecture

```
api/
├── apps/             # App-related endpoints
├── categories/       # Category management
├── dashboard/        # Dashboard data
├── profile/          # User profiles
├── submit-directory/ # App submission
├── user/            # User management
├── webhooks/        # External webhooks
└── weeks/           # Launch weeks
```

### Database Schema

```
MongoDB Collections:
├── users            # User profiles (synced with Clerk)
├── apps            # Product submissions
├── categories      # Product categories
├── launch_weeks    # Launch scheduling
├── votes          # User voting data
└── analytics      # Usage analytics
```

## Coding Standards

### JavaScript/React Guidelines

```javascript
// Use functional components with hooks
function MyComponent({ prop1, prop2 }) {
  const [state, setState] = useState(initialValue);

  // Custom hooks for reusable logic
  const { data, loading } = useApiData();

  // Event handlers with descriptive names
  const handleSubmit = async (event) => {
    event.preventDefault();
    // Handle submission
  };

  return <div className="component-styles">{/* JSX content */}</div>;
}

// Export at bottom
export default MyComponent;
```

### CSS/Tailwind Guidelines

```jsx
// Use semantic class names
<div className="card bg-white shadow-md rounded-lg p-6">
  <h2 className="heading-lg text-gray-900 mb-4">Title</h2>
  <p className="body-text text-gray-600">Content</p>
</div>

// Responsive design mobile-first
<div className="w-full md:w-1/2 lg:w-1/3">
  <img className="w-full h-48 object-cover rounded" />
</div>

// Use CSS variables for theme consistency
<button className="btn btn-primary hover:btn-primary-dark">
  Click me
</button>
```

### API Endpoint Guidelines

```javascript
// Standard API response structure
export default async function handler(req, res) {
  try {
    // Validate method
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Authenticate user
    const userId = req.headers["x-clerk-user-id"];
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Validate input
    const validatedData = SomeSchema.parse(req.body);

    // Business logic
    const result = await performOperation(validatedData);

    // Success response
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("API Error:", error);

    if (error instanceof z.ZodError) {
      return res.status(422).json({
        error: "Validation failed",
        details: error.flatten().fieldErrors,
      });
    }

    res.status(500).json({
      error: "Internal server error",
    });
  }
}
```

## Component Development

### Creating New Components

1. **Base UI Components** (`src/components/ui/`)
   - Built with Radix UI primitives
   - Styled with Tailwind CSS
   - Include variant support with CVA

```jsx
// Example: Button component
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export function Button({ className, variant, size, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

2. **Feature Components** (`src/components/`)
   - Business logic components
   - Compose base UI components
   - Handle state and side effects

```jsx
// Example: App submission form
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AppSubmissionForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await submitApp(data);
      // Handle success
    } catch (error) {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        {...register("name", { required: "App name is required" })}
        placeholder="App name"
        error={errors.name?.message}
      />

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit App"}
      </Button>
    </form>
  );
}
```

### State Management

Use React hooks and context for state management:

```jsx
// Context for global state
const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [apps, setApps] = useState([]);

  const value = {
    user,
    setUser,
    apps,
    setApps,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Custom hook for context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
```

## Database Development

### Schema Design

Use Zod for schema validation:

```javascript
// Define schemas in libs/models/schemas.js
export const AppSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(10).max(500),
  website_url: z.string().url(),
  categories: z.array(z.string()).min(1).max(3),
  // ... other fields
});

// Use in API endpoints
const validatedData = AppSchema.parse(req.body);
```

### Database Operations

Create service functions for database operations:

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

  // ... other methods
}
```

## Testing

### Unit Testing

```javascript
// tests/components/Button.test.jsx
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders with correct text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("applies variant classes correctly", () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-destructive");
  });
});
```

### API Testing

```javascript
// tests/api/apps.test.js
import { createMocks } from "node-mocks-http";
import handler from "@/api/apps/route.js";

describe("/api/apps", () => {
  it("returns apps list", async () => {
    const { req, res } = createMocks({
      method: "GET",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty("apps");
  });
});
```

### Manual Testing

Use the webhook test page for manual API testing:

1. Navigate to `/webhook-test`
2. Test various API endpoints
3. Verify responses and error handling

## Debugging

### Frontend Debugging

```javascript
// Use React Developer Tools
// Add debug logs
console.log("Component state:", { user, apps });

// Debug API calls
const debugFetch = async (url, options) => {
  console.log("API Call:", url, options);
  const response = await fetch(url, options);
  console.log("API Response:", response.status, await response.clone().text());
  return response;
};
```

### Backend Debugging

```javascript
// Add logging to API endpoints
console.log("Request received:", {
  method: req.method,
  url: req.url,
  headers: req.headers,
  body: req.body,
});

// Use try-catch for error handling
try {
  const result = await performOperation();
  console.log("Operation successful:", result);
} catch (error) {
  console.error("Operation failed:", error);
  // Handle error appropriately
}
```

## Performance Optimization

### Frontend Performance

```jsx
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Expensive rendering */}</div>;
});

// Lazy load components
const LazyPage = lazy(() => import("./LazyPage"));

// Optimize images
<img
  src="image.jpg"
  alt="Description"
  loading="lazy"
  width={400}
  height={300}
/>;
```

### Backend Performance

```javascript
// Database indexing
await collection.createIndex({ launch_week: 1, status: 1 });

// Pagination for large datasets
const apps = await collection
  .find(query)
  .skip((page - 1) * limit)
  .limit(limit)
  .toArray();

// Caching frequently accessed data
const cache = new Map();
const getCachedData = (key) => {
  if (cache.has(key)) return cache.get(key);

  const data = fetchFromDatabase(key);
  cache.set(key, data);
  return data;
};
```

## Deployment

### Environment Setup

```bash
# Production environment variables
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/prod
NODE_ENV=production
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_key
CLERK_SECRET_KEY=sk_live_your_key
```

### Build Process

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Vercel
vercel --prod
```

### Monitoring

- Set up error tracking (Sentry)
- Monitor performance metrics
- Set up health checks
- Configure alerts for critical issues

## Contributing Workflow

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make Changes**

   - Follow coding standards
   - Add tests for new functionality
   - Update documentation

3. **Test Changes**

   ```bash
   npm run lint
   npm run test
   npm run build
   ```

4. **Submit Pull Request**

   - Clear description of changes
   - Include screenshots for UI changes
   - Reference related issues

5. **Code Review**
   - Address feedback
   - Update code as needed
   - Ensure CI passes

## Common Issues and Solutions

### Development Issues

**Port already in use:**

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

**Database connection issues:**

```bash
# Check MongoDB status
brew services list | grep mongodb
# Restart MongoDB
brew services restart mongodb-community
```

**Dependency conflicts:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Production Issues

**Build failures:**

- Check environment variables
- Verify API endpoints are accessible
- Review error logs in Vercel dashboard

**Performance issues:**

- Monitor bundle size
- Optimize images and assets
- Review database queries

This guide should help you get started with development. For specific questions, check the existing codebase or create an issue in the repository.
