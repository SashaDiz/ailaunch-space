# Troubleshooting Guide

This guide helps you diagnose and fix common issues when developing or deploying DirectoryHunt.

## Table of Contents

- [Development Issues](#development-issues)
- [Authentication Problems](#authentication-problems)
- [Database Issues](#database-issues)
- [API Errors](#api-errors)
- [Build and Deployment](#build-and-deployment)
- [Performance Issues](#performance-issues)
- [Browser Compatibility](#browser-compatibility)

## Development Issues

### Server Won't Start

**Error**: `Error: Cannot find module 'vite'`

**Solution**:

```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Or try npm if pnpm fails
npm install
```

**Error**: `Port 5173 is already in use`

**Solution**:

```bash
# Find and kill process using port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
npx vite --port 3000
```

**Error**: `ENOTFOUND localhost`

**Solution**:

1. Check your hosts file: `/etc/hosts`
2. Ensure it contains: `127.0.0.1 localhost`
3. Try using `127.0.0.1:5173` instead of `localhost:5173`

### Environment Variables Not Loading

**Symptoms**:

- API calls fail with 500 errors
- Database connection errors
- Authentication doesn't work

**Solution**:

```bash
# Check if .env file exists
ls -la .env

# Verify environment variables are loaded
node -e "console.log(process.env.MONGODB_URI)"

# Common fixes:
# 1. Restart development server after .env changes
# 2. Check for syntax errors in .env (no spaces around =)
# 3. Ensure variables start with VITE_ for client-side access
```

### Hot Reload Not Working

**Solution**:

```bash
# Clear cache and restart
rm -rf .vite node_modules/.cache
npm run dev

# If still not working, check file permissions
chmod -R 755 src/
```

## Authentication Problems

### Clerk Authentication Fails

**Error**: `Invalid publishable key`

**Check**:

1. Environment variable is set correctly:
   ```bash
   echo $VITE_CLERK_PUBLISHABLE_KEY
   ```
2. Key starts with `pk_test_` (development) or `pk_live_` (production)
3. Restart development server after changing keys

**Error**: `ClerkJS: Authentication required`

**Debug Steps**:

```javascript
// Add to your component for debugging
import { useAuth } from "@clerk/clerk-react";

function DebugAuth() {
  const { isLoaded, userId, isSignedIn } = useAuth();

  console.log("Auth Debug:", { isLoaded, userId, isSignedIn });

  return null;
}
```

### OAuth Providers Not Working

**Google OAuth Issues**:

1. Check Google Cloud Console configuration
2. Verify redirect URIs include your domain
3. Ensure OAuth consent screen is configured

**GitHub OAuth Issues**:

1. Check GitHub Developer Settings
2. Verify Authorization callback URL
3. Ensure app is not suspended

### Session Issues

**Problem**: User gets logged out randomly

**Solutions**:

1. Check session timeout settings in Clerk
2. Verify JWT token expiration
3. Check browser security settings
4. Clear cookies and localStorage

```javascript
// Debug session state
localStorage.clear();
sessionStorage.clear();
// Then refresh page
```

## Database Issues

### MongoDB Connection Fails

**Error**: `MongoNetworkError: failed to connect to server`

**Debug Steps**:

```bash
# Test connection string
node -e "
const { MongoClient } = require('mongodb');
const client = new MongoClient('your-connection-string');
client.connect().then(() => {
  console.log('Connected successfully');
  client.close();
}).catch(err => console.error('Connection failed:', err));
"
```

**Common Solutions**:

1. **Network Access**: Check MongoDB Atlas network access list
2. **Credentials**: Verify username/password in connection string
3. **Database Name**: Ensure database name is correct
4. **Firewall**: Check local firewall settings

### Database Operations Fail

**Error**: `Collection doesn't exist`

**Solution**:

```bash
# Reinitialize database
npm run db:init

# Or manually create collections
node -e "
const clientPromise = require('./libs/mongodb.js').default;
clientPromise.then(client => {
  const db = client.db('directoryhunt');
  return Promise.all([
    db.createCollection('users'),
    db.createCollection('apps'),
    db.createCollection('categories')
  ]);
}).then(() => console.log('Collections created'));
"
```

**Error**: `Index already exists`

**Solution**:

```javascript
// Drop existing indexes first
await collection.dropIndexes();
await createIndexes();
```

### Data Validation Errors

**Error**: `ZodError: Invalid input`

**Debug**:

```javascript
// Add detailed error logging
try {
  const validatedData = AppSchema.parse(data);
} catch (error) {
  console.log("Validation error details:", error.flatten());
  throw error;
}
```

## API Errors

### 404 - API Route Not Found

**Check**:

1. File structure matches URL pattern
2. File exports default function
3. Vercel functions configuration

```javascript
// Verify API route structure
// api/apps/route.js should export:
export default async function handler(req, res) {
  // Your code here
}
```

### 500 - Internal Server Error

**Debug Steps**:

1. Check server logs in Vercel dashboard
2. Add console.log statements
3. Verify environment variables in production

```javascript
// Add error logging to API routes
export default async function handler(req, res) {
  try {
    // Your code
  } catch (error) {
    console.error("API Error Details:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      headers: req.headers,
    });

    res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
```

### CORS Issues

**Error**: `Access to fetch blocked by CORS policy`

**Solution**:

```javascript
// Add CORS headers to API routes
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Your API logic
}
```

### Authentication Headers Missing

**Error**: `Authentication required`

**Check**:

```javascript
// Verify headers are being sent
const response = await fetch("/api/protected", {
  headers: {
    Authorization: `Bearer ${token}`,
    "x-clerk-user-id": userId,
    "Content-Type": "application/json",
  },
});
```

## Build and Deployment

### Build Failures

**Error**: `Module not found`

**Solutions**:

1. Check import paths are correct
2. Verify case sensitivity
3. Check for circular dependencies

```bash
# Check for circular dependencies
npm install -g madge
madge --circular src/
```

**Error**: `Out of memory during build`

**Solution**:

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Vercel Deployment Issues

**Error**: `Two or more files have conflicting paths or names`

**Example**: `The path "api/apps/[slug]/vote/route.js" has conflicts with "api/apps/[id].js"`

**Solution**:

This occurs when Vercel cannot distinguish between dynamic route segments. The fix is to reorganize API routes to avoid conflicts:

```bash
# Instead of:
api/apps/[id].js          # Conflicts with [slug]
api/apps/[slug]/route.js

# Use:
api/apps/edit/[id].js     # Clearly separated editing routes
api/apps/[slug]/route.js  # Public viewing routes
```

**Error**: `Function execution timed out`

**Solutions**:

1. Optimize database queries
2. Add pagination to large datasets
3. Use background processing for heavy tasks

```javascript
// Optimize database queries
const apps = await collection
  .find(query)
  .project({ name: 1, description: 1, logo_url: 1 }) // Only needed fields
  .limit(20) // Add pagination
  .toArray();
```

**Error**: `Serverless function size limit exceeded`

**Solutions**:

1. Split large API files into smaller functions
2. Remove unused dependencies
3. Use dynamic imports for heavy libraries

```javascript
// Use dynamic imports
const { heavyLibrary } = await import("heavy-library");
```

### Environment Variables in Production

**Issue**: Variables work locally but not in production

**Check**:

1. Variables are set in Vercel dashboard
2. Variable names match exactly
3. No trailing spaces in values
4. Redeploy after changing variables

## Performance Issues

### Slow Page Load

**Debug**:

```bash
# Check bundle size
npm run build
npx vite-bundle-analyzer dist/

# Identify large dependencies
npm install -g webpack-bundle-analyzer
```

**Solutions**:

1. **Code Splitting**:

   ```javascript
   // Lazy load components
   const LazyComponent = lazy(() => import("./LazyComponent"));
   ```

2. **Image Optimization**:

   ```jsx
   // Use proper image formats and sizes
   <img
     src="image.webp"
     alt="Description"
     loading="lazy"
     width={400}
     height={300}
   />
   ```

3. **Database Query Optimization**:

   ```javascript
   // Add indexes for frequently queried fields
   await collection.createIndex({ categories: 1, status: 1 });

   // Use projection to limit fields
   const apps = await collection
     .find(query)
     .project({ name: 1, description: 1, logo_url: 1 })
     .toArray();
   ```

### Memory Leaks

**Debug**:

```javascript
// Check for memory leaks in React components
useEffect(() => {
  const cleanup = setupEventListener();

  return () => {
    cleanup(); // Always cleanup!
  };
}, []);
```

**Common Causes**:

1. Event listeners not removed
2. Intervals not cleared
3. Large objects in state
4. Circular references

## Browser Compatibility

### Safari Issues

**Problem**: Authentication doesn't work in Safari

**Solution**:

```javascript
// Check third-party cookie settings
// Add SameSite attribute to cookies
res.setHeader("Set-Cookie", ["token=value; SameSite=None; Secure; HttpOnly"]);
```

### Mobile Browser Issues

**Problem**: Layout breaks on mobile

**Debug**:

```css
/* Add viewport meta tag */
<meta name="viewport" content="width=device-width, initial-scale=1.0">

/* Check responsive breakpoints */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
}
```

### JavaScript Compatibility

**Problem**: App doesn't work in older browsers

**Solution**:

```javascript
// Check browser support for features
if ("IntersectionObserver" in window) {
  // Use modern API
} else {
  // Fallback for older browsers
}
```

## Getting Help

### Debugging Checklist

Before asking for help, check:

- [ ] Error messages in browser console
- [ ] Network tab for failed requests
- [ ] Environment variables are set
- [ ] Database connection works
- [ ] Latest code is deployed
- [ ] Cache cleared (Ctrl+F5)

### Useful Debug Commands

```bash
# Check environment
node --version
npm --version
pnpm --version

# Test API endpoints
curl -X GET "http://localhost:5173/api/apps"

# Check database connection
npm run db:test

# Verify build
npm run build && npm run preview
```

### Log Collection

When reporting issues, include:

1. **Error messages** (full stack trace)
2. **Browser/OS version**
3. **Steps to reproduce**
4. **Expected vs actual behavior**
5. **Relevant code snippets**

### Support Channels

- **GitHub Issues**: For bugs and feature requests
- **Discord**: For real-time help
- **Email**: support@directoryhunt.com

Remember: The more specific information you provide, the faster we can help solve your issue!
