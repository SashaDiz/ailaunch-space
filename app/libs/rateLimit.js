// Rate limiting implementation using in-memory storage
// In production, you'd want to use Redis or similar for distributed rate limiting

class RateLimiter {
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

  // Voting endpoints
  voting: {
    maxRequests: 50,
    windowMs: 60 * 60 * 1000, // 1 hour
  },

  // Directory submission
  submission: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
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

// Get client identifier (IP + User Agent hash)
export function getClientIdentifier(request) {
  // Get client IP
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(/, /)[0] : 
              request.headers.get("x-real-ip") || 
              request.headers.get("cf-connecting-ip") ||
              "unknown";
  
  // Get user agent hash for additional identification
  const userAgent = request.headers.get("user-agent") || "";
  const uaHash = hashString(userAgent);
  
  return `${ip}:${uaHash}`;
}

// Simple hash function
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 8);
}

// Rate limit middleware function
export function rateLimit(limitType = 'general') {
  return async (request) => {
    const config = rateLimits[limitType];
    if (!config) {
      console.warn(`Unknown rate limit type: ${limitType}`);
      return { allowed: true };
    }

    const identifier = getClientIdentifier(request);
    const result = rateLimiter.check(identifier, config.maxRequests, config.windowMs);

    return {
      ...result,
      limitType,
      identifier: identifier.substring(0, 16) + '...' // Partial identifier for logging
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

  // Validate URL format
  isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Sanitize string input (basic XSS prevention)
  sanitizeString(str, maxLength = 1000) {
    if (typeof str !== 'string') return '';
    
    return str
      .trim()
      .substring(0, maxLength)
      .replace(/[<>]/g, ''); // Remove basic HTML tags
  },

  // Validate MongoDB ObjectId
  isValidObjectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
  },

  // Validate and sanitize directory submission data
  sanitizeDirectoryData(data) {
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
    const allowedOrigins = [
      'http://localhost:3000',
      'https://ailaunch.space',
      'https://www.ailaunch.space',
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