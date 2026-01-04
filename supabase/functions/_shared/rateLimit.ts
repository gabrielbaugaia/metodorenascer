// Rate limiting helper for Edge Functions
// Uses in-memory cache with IP/user-based tracking

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (resets on cold start, but sufficient for basic protection)
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
}

// Default config: 60 requests per minute
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 60,
};

// Stricter config for sensitive endpoints
export const STRICT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 10,
};

// Very strict for auth-related endpoints
export const AUTH_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 5,
};

export function getClientIdentifier(req: Request, userId?: string): string {
  // Prefer user ID if available, otherwise use IP
  if (userId) {
    return `user:${userId}`;
  }
  
  // Try to get client IP from headers
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfIp = req.headers.get("cf-connecting-ip");
  
  const ip = cfIp || realIp || (forwarded ? forwarded.split(",")[0].trim() : "unknown");
  return `ip:${ip}`;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  
  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }
  
  if (!entry || now > entry.resetAt) {
    // First request or window expired - start fresh
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(identifier, newEntry);
    return { 
      allowed: true, 
      remaining: config.maxRequests - 1, 
      resetAt: newEntry.resetAt 
    };
  }
  
  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return { 
      allowed: false, 
      remaining: 0, 
      resetAt: entry.resetAt 
    };
  }
  
  // Increment counter
  entry.count++;
  rateLimitStore.set(identifier, entry);
  
  return { 
    allowed: true, 
    remaining: config.maxRequests - entry.count, 
    resetAt: entry.resetAt 
  };
}

export function createRateLimitResponse(resetAt: number): Response {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  
  return new Response(
    JSON.stringify({ 
      error: "Muitas requisições. Aguarde alguns segundos.",
      retry_after: retryAfter 
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
      },
    }
  );
}

// Wrapper to add rate limit headers to any response
export function addRateLimitHeaders(
  response: Response,
  remaining: number,
  resetAt: number,
  limit: number
): Response {
  const headers = new Headers(response.headers);
  headers.set("X-RateLimit-Limit", String(limit));
  headers.set("X-RateLimit-Remaining", String(remaining));
  headers.set("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
