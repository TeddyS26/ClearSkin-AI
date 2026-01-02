// Shared security utilities for Edge Functions
// Import this in your edge functions for consistent security

// Rate limiting using a simple in-memory store
// Note: In production with multiple edge function instances, use Redis/KV store
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyPrefix?: string;    // Prefix for the rate limit key
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., user ID, IP address)
 * @param config - Rate limit configuration
 * @returns { limited: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { limited: boolean; remaining: number; resetIn: number } {
  const key = `${config.keyPrefix || 'rl'}:${identifier}`;
  const now = Date.now();
  
  const record = rateLimitStore.get(key);
  
  // Reset if window has passed
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { limited: false, remaining: config.maxRequests - 1, resetIn: config.windowMs };
  }
  
  // Increment count
  record.count++;
  
  if (record.count > config.maxRequests) {
    return { 
      limited: true, 
      remaining: 0, 
      resetIn: record.resetAt - now 
    };
  }
  
  return { 
    limited: false, 
    remaining: config.maxRequests - record.count, 
    resetIn: record.resetAt - now 
  };
}

/**
 * Create a rate limit error response
 */
export function rateLimitResponse(resetIn: number): Response {
  return new Response(
    JSON.stringify({ 
      error: "Too many requests. Please try again later.",
      retryAfter: Math.ceil(resetIn / 1000)
    }),
    { 
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil(resetIn / 1000)),
        "X-RateLimit-Remaining": "0"
      }
    }
  );
}

// Default rate limit configs for different operation types
export const RATE_LIMITS = {
  // Expensive operations (AI analysis, email sending)
  expensive: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 5,        // 5 requests per minute
    keyPrefix: 'expensive'
  },
  // Standard operations (checkout, portal)
  standard: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 20,       // 20 requests per minute
    keyPrefix: 'standard'
  },
  // Read-heavy operations (authorize-scan, sign-urls)
  read: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 60,       // 60 requests per minute
    keyPrefix: 'read'
  }
} as const;

// CORS configuration - RESTRICT TO YOUR DOMAIN IN PRODUCTION
const ALLOWED_ORIGINS = [
  "https://www.clearskinai.ca",
  "https://clearskinai.ca",
  // Deep links from mobile app
  "clearskinai://",
];

/**
 * Get secure CORS headers
 * @param requestOrigin - The Origin header from the request
 * @returns CORS headers object
 */
export function getCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  // Check if origin is allowed
  const origin = requestOrigin || "";
  const isAllowed = ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.startsWith(allowed)
  );
  
  // In development, allow localhost
  const isDev = Deno.env.get("ENVIRONMENT") === "development";
  const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");
  
  const allowedOrigin = (isAllowed || (isDev && isLocalhost)) 
    ? origin 
    : ALLOWED_ORIGINS[0]; // Default to main domain
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400", // Cache preflight for 24 hours
  };
}

/**
 * Validate image size from base64 or URL
 * @param sizeBytes - Size in bytes
 * @param maxMB - Maximum allowed size in MB (default 10MB)
 * @returns { valid: boolean, error?: string }
 */
export function validateImageSize(
  sizeBytes: number, 
  maxMB: number = 10
): { valid: boolean; error?: string } {
  const maxBytes = maxMB * 1024 * 1024;
  
  if (sizeBytes > maxBytes) {
    return { 
      valid: false, 
      error: `Image too large. Maximum size is ${maxMB}MB.` 
    };
  }
  
  return { valid: true };
}

/**
 * Validate that a scan_session_id is a valid UUID
 * Prevents NoSQL injection and malformed requests
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Sanitize string input - remove potentially dangerous characters
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input
    .slice(0, maxLength)           // Limit length
    .replace(/[<>]/g, '')          // Remove HTML brackets
    .replace(/javascript:/gi, '')  // Remove javascript: protocol
    .trim();
}

/**
 * Log security-relevant events (for monitoring/alerting)
 */
export function logSecurityEvent(
  event: 'rate_limit_exceeded' | 'invalid_token' | 'unauthorized_access' | 'suspicious_input',
  details: Record<string, unknown>
): void {
  console.warn(`[SECURITY] ${event}:`, JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    ...details
  }));
}

// Clean up old rate limit entries periodically (memory management)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Run every minute
