# Deployment Guide

This guide covers deploying DirectoryHunt to various platforms and environments.

## ⚠️ CRITICAL: Serverless Function Limits

**Before deploying**, ensure you're within Vercel's Hobby plan limits:

```bash
# Check function count (must be ≤ 12)
npm run check-functions
```

**Current: 4/12 functions** ✅

See [SERVERLESS_FUNCTIONS.md](./SERVERLESS_FUNCTIONS.md) for detailed guidelines.

## Pre-Deployment Checklist

### 1. Function Count Check ⚠️

```bash
npm run check-functions
# Expected: 4/12 functions
# ❌ If >12: Consolidate functions before deploying
```

### 2. Local Build Test

```bash
npm run build
npm run preview
```

### 3. API Endpoint Testing

Test all consolidated endpoints:

```bash
# Test core endpoints (api/index.js)
curl http://localhost:5173/api/dashboard
curl http://localhost:5173/api/categories

# Test apps endpoints (api/apps.js)
curl http://localhost:5173/api/apps
curl "http://localhost:5173/api/apps?slug=example"

# Test profile endpoints (api/profile.js)
curl http://localhost:5173/api/profile
```

## Overview

DirectoryHunt uses a **consolidated serverless function architecture**:

- **Frontend**: Static React application (SPA)
- **Backend**: 4 consolidated serverless API functions
- **Database**: MongoDB (self-hosted or cloud)
- **Authentication**: Clerk (SaaS)

## Recommended Platform: Vercel

Vercel is the recommended deployment platform due to its excellent support for React + Vite applications and serverless functions.

### Prerequisites

- Vercel account
- GitHub repository
- MongoDB database (Atlas recommended for production)
- Clerk application configured

### 1. Environment Variables

Set up the following environment variables in your Vercel dashboard:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/directoryhunt

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_publishable_key
CLERK_SECRET_KEY=sk_live_your_secret_key

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Email Service
RESEND_API_KEY=your_resend_api_key

# Application
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_random_secret_string
```

### 2. Vercel Configuration

The project includes a `vercel.json` configuration file:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "api/webhooks/clerk.js": {
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 3. Deployment Steps

#### Option A: GitHub Integration (Recommended)

1. **Connect Repository**

   ```bash
   # Push your code to GitHub
   git push origin main
   ```

2. **Import to Vercel**

   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure environment variables
   - Deploy

3. **Automatic Deployments**
   - Every push to `main` triggers a new deployment
   - Pull requests get preview deployments

#### Option B: Vercel CLI

1. **Install Vercel CLI**

   ```bash
   npm install -g vercel
   ```

2. **Login and Deploy**
   ```bash
   vercel login
   vercel --prod
   ```

### 4. Domain Configuration

1. **Custom Domain**

   - Go to Vercel dashboard → Project → Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed

2. **SSL Certificate**
   - Automatically provided by Vercel
   - No additional configuration needed

### 5. Post-Deployment Setup

1. **Initialize Database**

   ```bash
   # Run database initialization (one-time)
   curl -X POST https://your-domain.com/api/init-database
   ```

2. **Configure Clerk Webhooks**

   - In Clerk dashboard, add webhook endpoint:
   - URL: `https://your-domain.com/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`

3. **Test Application**
   - Visit your deployed application
   - Test user registration/login
   - Submit a test application
   - Verify all functionality

## Alternative Deployment: Netlify

### 1. Netlify Configuration

Create `netlify.toml`:

```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 2. Convert API Functions

Netlify functions require a different structure:

```javascript
// netlify/functions/apps.js
exports.handler = async (event, context) => {
  // Your API logic here

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ data: "response" }),
  };
};
```

### 3. Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

## Docker Deployment

For self-hosting or container-based deployments:

### 1. Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/api ./api
COPY --from=builder /app/libs ./libs
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000

CMD ["node", "server.js"]
```

### 2. Express Server

Create `server.js` for production:

```javascript
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, "dist")));

// API routes
app.use("/api", async (req, res, next) => {
  const apiPath = path.join(__dirname, "api", req.path + ".js");
  try {
    const handler = await import(apiPath);
    await handler.default(req, res);
  } catch (error) {
    next(error);
  }
});

// Serve React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 3. Docker Compose

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/directoryhunt
      - NODE_ENV=production
    depends_on:
      - mongo

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## Database Setup

### MongoDB Atlas (Recommended)

1. **Create Cluster**

   - Sign up at [mongodb.com](https://www.mongodb.com/atlas)
   - Create a new cluster
   - Configure network access (allow your deployment platform)

2. **Create Database User**

   - Add database user with read/write permissions
   - Note username and password for connection string

3. **Get Connection String**
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/directoryhunt
   ```

### Self-Hosted MongoDB

For VPS or dedicated server deployment:

```bash
# Install MongoDB
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Secure MongoDB
mongo
> use admin
> db.createUser({
    user: "admin",
    pwd: "your_password",
    roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
  })
```

## Environment-Specific Configurations

### Development

```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/directoryhunt_dev
VITE_CLERK_PUBLISHABLE_KEY=pk_test_development_key
```

### Staging

```env
NODE_ENV=staging
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/directoryhunt_staging
VITE_CLERK_PUBLISHABLE_KEY=pk_test_staging_key
```

### Production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/directoryhunt
VITE_CLERK_PUBLISHABLE_KEY=pk_live_production_key
```

## Monitoring and Analytics

### 1. Error Tracking (Sentry)

```bash
npm install @sentry/react @sentry/vite-plugin
```

```javascript
// src/main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.NODE_ENV,
});
```

### 2. Performance Monitoring

```javascript
// Add to API endpoints
import { performance } from "perf_hooks";

export default async function handler(req, res) {
  const start = performance.now();

  try {
    // Your API logic
    const result = await performOperation();

    const end = performance.now();
    console.log(`API call took ${end - start} milliseconds`);

    res.json(result);
  } catch (error) {
    // Error handling
  }
}
```

### 3. Analytics

```javascript
// Google Analytics
// Add to index.html or main.jsx
gtag("config", "GA_MEASUREMENT_ID");

// Custom events
gtag("event", "app_submission", {
  event_category: "engagement",
  event_label: "category_name",
});
```

## SSL/HTTPS Configuration

### Vercel/Netlify

- Automatic SSL certificates
- No configuration needed

### Self-Hosted with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
0 12 * * * /usr/bin/certbot renew --quiet
```

## Backup and Recovery

### Database Backups

```bash
# MongoDB Atlas
# Automatic backups available in dashboard

# Self-hosted backup
mongodump --uri="mongodb://localhost:27017/directoryhunt" --out=/backup/$(date +%Y%m%d)

# Restore
mongorestore --uri="mongodb://localhost:27017/directoryhunt" /backup/20240101/directoryhunt/
```

### File Backups

```bash
# Backup uploaded files
rsync -av /path/to/uploads/ backup@server:/backups/uploads/

# Restore
rsync -av backup@server:/backups/uploads/ /path/to/uploads/
```

## Performance Optimization

### 1. CDN Configuration

```javascript
// vercel.json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 2. Image Optimization

```javascript
// Use Vercel Image Optimization
import Image from "next/image";

<Image src="/logo.png" alt="Logo" width={200} height={100} priority />;
```

### 3. Database Indexing

```javascript
// Create performance indexes
await collection.createIndex({ launch_week: 1, status: 1 });
await collection.createIndex({ categories: 1 });
await collection.createIndex({ createdAt: -1 });
```

## Security Considerations

### 1. Environment Variables

- Never commit `.env` files
- Use secure random strings for secrets
- Rotate keys regularly

### 2. API Security

```javascript
// Rate limiting
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use("/api/", limiter);
```

### 3. Input Validation

```javascript
// Always validate input
const validatedData = AppSchema.parse(req.body);

// Sanitize HTML
import DOMPurify from "dompurify";
const cleanDescription = DOMPurify.sanitize(description);
```

## Troubleshooting

### Common Deployment Issues

1. **Build Failures**

   ```bash
   # Check build logs
   vercel logs

   # Local build test
   npm run build
   ```

2. **API Endpoint Issues**

   ```bash
   # Test API locally
   curl http://localhost:5173/api/apps

   # Check function logs
   vercel logs --function=api/apps
   ```

3. **Database Connection Issues**

   ```bash
   # Test connection
   node -e "
   import('mongodb').then(async ({ MongoClient }) => {
     const client = new MongoClient(process.env.MONGODB_URI);
     await client.connect();
     console.log('Connected successfully');
     await client.close();
   });
   "
   ```

4. **Authentication Issues**
   - Verify Clerk configuration
   - Check webhook endpoints
   - Validate JWT tokens

This deployment guide should help you get DirectoryHunt running in production. For specific platform issues, consult the respective platform documentation.
