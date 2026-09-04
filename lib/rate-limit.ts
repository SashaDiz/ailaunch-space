// Rate limiting implementation using in-memory storage.
// WARNING: This does NOT persist across server restarts or work across multiple
// instances/replicas. For production at scale, replace with Redis (e.g. @upstash/ratelimit)
// or another distributed rate limiter.

class RateLimiter {
  requests: Map<string, any>;
  cleanupInterval: number;

  constructor() {
    this.requests = new Map();
    this.cleanupInterval = 60000; // Clean up old entries every minute
    
    // Start cleanup interval
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      // Remove entries older than 1 hour
      if (now - data.firstRequest > 3600000) {
        this.requests.delete(key);
      }
    }
  }

  // Check if request is allowed
  check(identifier, maxRequests, windowMs) {
    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / windowMs)}`;
    
    const current = this.requests.get(key) || {
      count: 0,
      firstRequest: now,
      windowStart: Math.floor(now / windowMs) * windowMs
    };

    current.count += 1;
    this.requests.set(key, current);

    return {
      allowed: current.count <= maxRequests,
      count: current.count,
      remaining: Math.max(0, maxRequests - current.count),
      resetTime: current.windowStart + windowMs,
      retryAfter: current.count > maxRequests ? Math.ceil((current.windowStart + windowMs - now) / 1000) : null
    };
  }

  // Get current usage for an identifier
  getUsage(identifier, windowMs) {
    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / windowMs)}`;
    const current = this.requests.get(key);
    
    if (!current) {
      return { count: 0, remaining: null, resetTime: null };
    }

    return {
      count: current.count,
      resetTime: current.windowStart + windowMs,
    };
  }

  // Reset rate limit for an identifier (admin function)
  reset(identifier, windowMs) {
    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / windowMs)}`;
    this.requests.delete(key);
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

// Rate limiting configurations
export const rateLimits = {
  // General API calls
  general: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  
  // Authentication endpoints
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },

  // Project submission
  submission: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },

  // File uploads (logo + up to 5 screenshots per submission)
  upload: {
    maxRequests: 20,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },

  // Admin endpoints
  admin: {
    maxRequests: 200,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },

  // Analytics tracking
  analytics: {
    maxRequests: 1000,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
};

// Get client identifier.
//
// SECURITY — two rules this function exists to enforce:
//
//  1. The key must NOT contain anything the caller can freely rotate. The old
//     version hashed the User-Agent into the key, so changing one header gave
//     the caller a brand-new bucket and every limit in the app was one line of
//     curl away from being bypassed.
//  2. The IP must come from a hop the PLATFORM sets, not from a header the
//     client can prepend. `x-vercel-forwarded-for` is written by Vercel's proxy
//     and cannot be spoofed by the client; a raw `x-forwarded-for` can be, so we
//     take its RIGHT-most entry (the hop closest to us) rather than the left.
//
// Returns null when no trustworthy client identity is available, so callers can
// fail CLOSED instead of lumping every anonymous request into one shared bucket.
export function getClientIdentifier(request): string | null {
  // 1. Vercel's own header — trusted, set by the platform edge.
  const vercelIp = request.headers.get("x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.trim();

  // 2. Cloudflare's equivalent, when fronted by Cloudflare.
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  // 3. Right-most X-Forwarded-For hop: the value appended by the proxy directly
  //    in front of us. Anything further left was supplied by the client.
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((h) => h.trim()).filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }

  // 4. x-real-ip, when a known reverse proxy sets it.
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return null;
}

// Rate limit middleware function
export function rateLimit(limitType = 'general') {
  return async (request) => {
    const config = rateLimits[limitType];
    if (!config) {
      // Fail CLOSED on a typo'd bucket name rather than silently disabling the limit.
      console.error(`Unknown rate limit type: ${limitType} — refusing request`);
      return {
        allowed: false,
        count: 0,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 60,
        limitType,
        identifier: 'unknown-bucket',
      };
    }

    const identifier = getClientIdentifier(request);

    // No trustworthy client identity.
    //
    // In development there is no proxy in front of the app, so fall back to a
    // shared local bucket — failing closed here would make `pnpm dev` unusable.
    //
    // In production, every supported host (Vercel, Cloudflare, nginx) sets one
    // of the headers above. Reaching this branch in production means the proxy
    // is misconfigured, and we fail CLOSED rather than serve an unlimited
    // endpoint — silently unlimited is the failure mode this whole function
    // exists to prevent.
    let key = identifier;
    if (!key) {
      if (process.env.NODE_ENV === 'production') {
        console.error(
          `Rate limit: no trusted client IP header on a production request (${limitType}). ` +
          `Refusing. Ensure the reverse proxy sets x-forwarded-for / x-real-ip.`
        );
        return {
          allowed: false,
          count: config.maxRequests + 1,
          remaining: 0,
          resetTime: Date.now() + config.windowMs,
          retryAfter: Math.ceil(config.windowMs / 1000),
          limitType,
          identifier: 'unidentified',
        };
      }
      key = 'local-dev';
    }

    const result = rateLimiter.check(key, config.maxRequests, config.windowMs);

    return {
      ...result,
      limitType,
      identifier: key.substring(0, 16) + '...' // Partial identifier for logging
    };
  };
}

// Check rate limit and return appropriate response
export function checkRateLimit(request, limitType = 'general') {
  const limiter = rateLimit(limitType);
  return limiter(request);
}

// Create rate limit response
export function createRateLimitResponse(rateLimitResult) {
  const headers = {
    'X-RateLimit-Limit': rateLimitResult.allowed ? '200' : '0',
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString(),
  };

  if (rateLimitResult.retryAfter) {
    headers['Retry-After'] = rateLimitResult.retryAfter.toString();
  }

  return {
    status: 429,
    headers,
    body: JSON.stringify({
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
      details: {
        limit: rateLimitResult.limitType,
        retryAfter: rateLimitResult.retryAfter,
        resetTime: new Date(rateLimitResult.resetTime).toISOString(),
      }
    })
  };
}

// Security headers middleware
export function addSecurityHeaders(response) {
  // Add security headers to all responses
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Input validation helpers
export const validation = {
  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate URL format with security checks
  isValidURL(url) {
    if (!url || typeof url !== 'string') return false;
    
    try {
      const urlObj = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }
      
      // Block javascript: and data: URLs
      if (url.toLowerCase().startsWith('javascript:') || url.toLowerCase().startsWith('data:')) {
        return false;
      }
      
      // Validate hostname (basic check)
      if (!urlObj.hostname || urlObj.hostname.length > 253) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  },

  // Sanitize string input (enhanced XSS prevention)
  sanitizeString(str, maxLength = 1000) {
    if (typeof str !== 'string') return '';
    
    return str
      .trim()
      .substring(0, maxLength)
      // Remove HTML tags and dangerous characters
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .replace(/data:/gi, '')
      // Escape quotes to prevent injection
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },

  // Validate MongoDB ObjectId
  isValidObjectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
  },

  // Validate and sanitize project submission data
  sanitizeProjectData(data) {
    return {
      name: this.sanitizeString(data.name, 100),
      short_description: this.sanitizeString(data.short_description, 160),
      full_description: this.sanitizeString(data.full_description, 2000),
      website_url: this.isValidURL(data.website_url) ? data.website_url : '',
      // contact_email will be populated from user account
      // contact_email: this.isValidEmail(data.contact_email) ? data.contact_email : '',
      categories: Array.isArray(data.categories) ? data.categories.slice(0, 5) : [],
      tags: Array.isArray(data.tags) ? data.tags.slice(0, 10) : [],
      plan: ['standard', 'premium'].includes(data.plan) ? data.plan : 'standard',
    };
  },

  // Validate request origin (CORS protection)
  isValidOrigin(origin) {
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const allowedOrigins = [
      'http://localhost:3000',
      siteUrl,
      siteUrl.replace('https://', 'https://www.'),
    ];

    return allowedOrigins.includes(origin) ||
           origin?.startsWith('http://localhost:') ||
           process.env.NODE_ENV === 'development';
  }
};

// Suspicious activity detection
export const securityMonitor = {
  // Track suspicious patterns
  suspiciousPatterns: new Map(),

  // Check for suspicious activity
  checkSuspiciousActivity(identifier, endpoint, method) {
    const key = `${identifier}:suspicious`;
    const now = Date.now();
    const windowMs = 5 * 60 * 1000; // 5 minutes
    
    const current = this.suspiciousPatterns.get(key) || {
      events: [],
      firstSeen: now,
    };

    // Add current event
    current.events.push({ endpoint, method, timestamp: now });
    
    // Keep only events from the last window
    current.events = current.events.filter(event => 
      now - event.timestamp < windowMs
    );

    this.suspiciousPatterns.set(key, current);

    // Check for suspicious patterns
    const recentEvents = current.events;
    
    // Pattern 1: Too many different endpoints in short time
    const uniqueEndpoints = new Set(recentEvents.map(e => e.endpoint)).size;
    if (uniqueEndpoints > 10 && recentEvents.length > 20) {
      return { suspicious: true, reason: 'endpoint_scanning', severity: 'high' };
    }

    // Pattern 2: Repeated failed requests to sensitive endpoints
    const sensitiveEndpoints = recentEvents.filter(e => 
      e.endpoint.includes('/admin') || 
      e.endpoint.includes('/api/auth') ||
      e.endpoint.includes('/api/user')
    );
    if (sensitiveEndpoints.length > 5) {
      return { suspicious: true, reason: 'sensitive_endpoint_abuse', severity: 'medium' };
    }

    // Pattern 3: Very high frequency requests
    if (recentEvents.length > 50) {
      return { suspicious: true, reason: 'high_frequency', severity: 'low' };
    }

    return { suspicious: false };
  },

  // Log security event
  logSecurityEvent(identifier, event, severity = 'low') {
    console.warn('Security Event:', {
      severity: severity.toUpperCase(),
      identifier: identifier.substring(0, 16) + '...',
      event,
      timestamp: new Date().toISOString(),
    });
    
    // In production, you'd want to send this to a security monitoring service
  }
};

export default rateLimiter;