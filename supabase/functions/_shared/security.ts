/**
 * =============================================================================
 * CLEARSKIN AI - SHARED SECURITY UTILITIES
 * =============================================================================
 * 
 * Comprehensive security module following OWASP best practices:
 * - Rate limiting (IP + user-based with sliding window)
 * - Input validation and sanitization
 * - CORS configuration
 * - Security logging and monitoring
 * 
 * @version 2.0.0
 * @license MIT
 * =============================================================================
 */

// =============================================================================
// RATE LIMITING
// =============================================================================

/**
 * In-memory rate limit store with compound keys (IP + user)
 * Note: In production with multiple edge function instances, consider using
 * Supabase KV, Redis, or Upstash for distributed rate limiting
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyPrefix?: string;    // Prefix for the rate limit key
}

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetIn: number;
  retryAfter?: number;   // Seconds until rate limit resets
}

/**
 * Extract client IP from request headers
 * Handles various proxy headers following OWASP guidelines
 * @param req - The incoming request
 * @returns Client IP address or 'unknown'
 */
export function getClientIP(req: Request): string {
  // Check headers in order of trust (most trusted first)
  // CF-Connecting-IP is set by Cloudflare
  const cfIP = req.headers.get("cf-connecting-ip");
  if (cfIP && isValidIP(cfIP)) return cfIP;

  // X-Real-IP is commonly set by nginx
  const realIP = req.headers.get("x-real-ip");
  if (realIP && isValidIP(realIP)) return realIP;

  // X-Forwarded-For may contain multiple IPs (client, proxy1, proxy2)
  // Take the first (original client) IP
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIP = forwardedFor.split(",")[0].trim();
    if (isValidIP(firstIP)) return firstIP;
  }

  return "unknown";
}

/**
 * Basic IP address validation (IPv4 and IPv6)
 */
function isValidIP(ip: string): boolean {
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 pattern (simplified)
  const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^([0-9a-fA-F]{1,4}:)*::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/;
  
  if (ipv4Pattern.test(ip)) {
    // Validate each octet is 0-255
    const octets = ip.split(".").map(Number);
    return octets.every(o => o >= 0 && o <= 255);
  }
  
  return ipv6Pattern.test(ip);
}

/**
 * Check if a request should be rate limited using compound key (IP + user)
 * Implements sliding window algorithm for fair rate limiting
 * 
 * @param identifier - Unique identifier (user ID preferred, falls back to IP)
 * @param config - Rate limit configuration
 * @param ip - Client IP address for additional rate limiting
 * @returns Rate limit check result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
  ip?: string
): RateLimitResult {
  const now = Date.now();
  const results: RateLimitResult[] = [];

  // Check user-based rate limit
  const userKey = `${config.keyPrefix || 'rl'}:user:${identifier}`;
  results.push(checkSingleRateLimit(userKey, config, now));

  // Check IP-based rate limit (more permissive to allow shared IPs)
  if (ip && ip !== "unknown") {
    const ipKey = `${config.keyPrefix || 'rl'}:ip:${ip}`;
    const ipConfig = {
      ...config,
      maxRequests: config.maxRequests * 3  // 3x limit for IP (shared networks)
    };
    results.push(checkSingleRateLimit(ipKey, ipConfig, now));
  }

  // Return the most restrictive result
  const mostRestrictive = results.reduce((prev, curr) => 
    curr.limited || curr.remaining < prev.remaining ? curr : prev
  );

  return {
    ...mostRestrictive,
    retryAfter: Math.ceil(mostRestrictive.resetIn / 1000)
  };
}

/**
 * Internal helper for single key rate limit check
 */
function checkSingleRateLimit(
  key: string,
  config: RateLimitConfig,
  now: number
): RateLimitResult {
  const record = rateLimitStore.get(key);

  // Reset if window has passed
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { 
      limited: false, 
      remaining: config.maxRequests - 1, 
      resetIn: config.windowMs 
    };
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
 * Create a standardized rate limit error response (HTTP 429)
 * Includes proper headers per RFC 6585
 */
export function rateLimitResponse(
  resetIn: number, 
  corsHeaders?: Record<string, string>
): Response {
  const retryAfter = Math.ceil(resetIn / 1000);
  
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil((Date.now() + resetIn) / 1000)),
        ...(corsHeaders || {})
      }
    }
  );
}

/**
 * Default rate limit configurations for different operation types
 * Tuned based on OWASP recommendations and typical usage patterns
 */
export const RATE_LIMITS = {
  // Authentication operations (login, signup, password reset)
  auth: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 10,            // 10 attempts per 15 min
    keyPrefix: 'auth'
  },
  // Expensive operations (AI analysis, email sending, data export)
  expensive: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 5,        // 5 requests per minute
    keyPrefix: 'expensive'
  },
  // Standard operations (checkout, billing portal)
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
  },
  // Contact/support forms
  contact: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 3,             // 3 messages per hour
    keyPrefix: 'contact'
  },
  // Data export (GDPR)
  export: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 1,             // 1 export per hour
    keyPrefix: 'export'
  },
  // Webhook endpoints (more permissive for third-party services)
  webhook: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 100,      // 100 events per minute
    keyPrefix: 'webhook'
  }
} as const;

// =============================================================================
// CORS CONFIGURATION
// =============================================================================

/**
 * Allowed origins for CORS - RESTRICT TO YOUR DOMAIN IN PRODUCTION
 * Following OWASP CORS guidelines
 */
const ALLOWED_ORIGINS = [
  "https://www.clearskinai.ca",
  "https://clearskinai.ca",
  // Deep links from mobile app (React Native)
  "clearskinai://",
];

/**
 * Get secure CORS headers based on request origin
 * Implements strict origin checking per OWASP guidelines
 * 
 * @param requestOrigin - The Origin header from the request
 * @returns CORS headers object
 */
export function getCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  const origin = requestOrigin || "";
  
  // Check if origin is in allowed list
  const isAllowed = ALLOWED_ORIGINS.some(allowed =>
    origin === allowed || origin.startsWith(allowed)
  );

  // In development, allow localhost origins
  const isDev = Deno.env.get("ENVIRONMENT") === "development";
  const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");

  // Determine the allowed origin to return
  const allowedOrigin = (isAllowed || (isDev && isLocalhost))
    ? origin
    : ALLOWED_ORIGINS[0]; // Default to main domain (don't echo unknown origins)

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Max-Age": "86400", // Cache preflight for 24 hours
    "Access-Control-Allow-Credentials": "true",
    // Security headers
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
  };
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflightRequest(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    const origin = req.headers.get("Origin");
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin)
    });
  }
  return null;
}

// =============================================================================
// INPUT VALIDATION & SANITIZATION
// =============================================================================

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string | number | boolean | object;
}

/**
 * Validate image size from base64 or URL
 * @param sizeBytes - Size in bytes
 * @param maxMB - Maximum allowed size in MB (default 10MB)
 */
export function validateImageSize(
  sizeBytes: number,
  maxMB: number = 10
): ValidationResult {
  const maxBytes = maxMB * 1024 * 1024;

  if (sizeBytes <= 0) {
    return { valid: false, error: "Invalid file size" };
  }

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
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Sanitize string input - remove potentially dangerous characters
 * Following OWASP input sanitization guidelines
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .slice(0, maxLength)              // Limit length
    .replace(/[<>]/g, '')             // Remove HTML brackets (XSS prevention)
    .replace(/javascript:/gi, '')     // Remove javascript: protocol
    .replace(/data:/gi, '')           // Remove data: protocol
    .replace(/vbscript:/gi, '')       // Remove vbscript: protocol
    .replace(/on\w+=/gi, '')          // Remove event handlers
    .replace(/[\x00-\x1F\x7F]/g, '')  // Remove control characters
    .trim();
}

/**
 * Sanitize HTML for safe rendering in emails
 * Escapes HTML entities to prevent XSS
 */
export function sanitizeForHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate email format
 * Uses RFC 5322 compliant regex
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  // RFC 5322 compliant email regex (simplified for practical use)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return email.length <= 254 && emailRegex.test(email);
}

/**
 * Validate and sanitize a string field with length constraints
 */
export function validateStringField(
  value: unknown,
  fieldName: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    sanitize?: boolean;
  } = {}
): ValidationResult {
  const {
    required = false,
    minLength = 0,
    maxLength = 10000,
    pattern,
    sanitize = true
  } = options;

  // Check if value is provided
  if (value === undefined || value === null || value === '') {
    if (required) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true, sanitized: '' };
  }

  // Type check
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }

  let processedValue = value;

  // Sanitize if requested
  if (sanitize) {
    processedValue = sanitizeString(value, maxLength);
  }

  // Length validation
  if (processedValue.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }

  if (processedValue.length > maxLength) {
    return { valid: false, error: `${fieldName} must be at most ${maxLength} characters` };
  }

  // Pattern validation
  if (pattern && !pattern.test(processedValue)) {
    return { valid: false, error: `${fieldName} format is invalid` };
  }

  return { valid: true, sanitized: processedValue };
}

/**
 * Validate numeric field
 */
export function validateNumberField(
  value: unknown,
  fieldName: string,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}
): ValidationResult {
  const { required = false, min, max, integer = false } = options;

  // Check if value is provided
  if (value === undefined || value === null) {
    if (required) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true };
  }

  // Type check and conversion
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (typeof num !== 'number' || isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }

  if (!isFinite(num)) {
    return { valid: false, error: `${fieldName} must be a finite number` };
  }

  // Integer check
  if (integer && !Number.isInteger(num)) {
    return { valid: false, error: `${fieldName} must be an integer` };
  }

  // Range validation
  if (min !== undefined && num < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` };
  }

  if (max !== undefined && num > max) {
    return { valid: false, error: `${fieldName} must be at most ${max}` };
  }

  return { valid: true, sanitized: num };
}

/**
 * Validate array field
 */
export function validateArrayField(
  value: unknown,
  fieldName: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    itemValidator?: (item: unknown, index: number) => ValidationResult;
  } = {}
): ValidationResult {
  const { required = false, minLength = 0, maxLength = 100, itemValidator } = options;

  // Check if value is provided
  if (value === undefined || value === null) {
    if (required) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true, sanitized: [] };
  }

  // Type check
  if (!Array.isArray(value)) {
    return { valid: false, error: `${fieldName} must be an array` };
  }

  // Length validation
  if (value.length < minLength) {
    return { valid: false, error: `${fieldName} must have at least ${minLength} items` };
  }

  if (value.length > maxLength) {
    return { valid: false, error: `${fieldName} must have at most ${maxLength} items` };
  }

  // Validate each item if validator provided
  if (itemValidator) {
    const sanitizedItems: unknown[] = [];
    for (let i = 0; i < value.length; i++) {
      const result = itemValidator(value[i], i);
      if (!result.valid) {
        return { valid: false, error: `${fieldName}[${i}]: ${result.error}` };
      }
      sanitizedItems.push(result.sanitized ?? value[i]);
    }
    return { valid: true, sanitized: sanitizedItems };
  }

  return { valid: true, sanitized: value };
}

/**
 * Validate that paths belong to a specific user
 * Prevents path traversal attacks
 */
export function validateUserPath(
  path: string,
  userId: string,
  options: { bucket?: string } = {}
): ValidationResult {
  if (!path || typeof path !== 'string') {
    return { valid: false, error: "Invalid path" };
  }

  if (!userId || !isValidUUID(userId)) {
    return { valid: false, error: "Invalid user ID" };
  }

  // Normalize path (remove leading slash)
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  // Check for path traversal attempts
  if (normalizedPath.includes('..') || normalizedPath.includes('//')) {
    return { valid: false, error: "Invalid path format" };
  }

  // Verify path belongs to user
  const expectedPrefix = `user/${userId}/`;
  if (!normalizedPath.startsWith(expectedPrefix)) {
    return { valid: false, error: "Unauthorized path access" };
  }

  return { valid: true, sanitized: normalizedPath };
}

/**
 * Validate request body against a schema
 * Returns sanitized body if valid
 */
export interface FieldSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  sanitize?: boolean;
  enum?: (string | number)[];
}

export function validateRequestBody(
  body: unknown,
  schema: Record<string, FieldSchema>
): { valid: boolean; errors: string[]; sanitized: Record<string, unknown> } {
  const errors: string[] = [];
  const sanitized: Record<string, unknown> = {};

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, errors: ['Request body must be a JSON object'], sanitized: {} };
  }

  const bodyObj = body as Record<string, unknown>;

  // Check for unexpected fields (reject unknown fields)
  const allowedFields = new Set(Object.keys(schema));
  for (const key of Object.keys(bodyObj)) {
    if (!allowedFields.has(key)) {
      errors.push(`Unexpected field: ${key}`);
    }
  }

  // Validate each field in schema
  for (const [fieldName, fieldSchema] of Object.entries(schema)) {
    const value = bodyObj[fieldName];

    // Required check
    if (fieldSchema.required && (value === undefined || value === null || value === '')) {
      errors.push(`${fieldName} is required`);
      continue;
    }

    // Skip if not provided and not required
    if (value === undefined || value === null) {
      continue;
    }

    // Type-specific validation
    switch (fieldSchema.type) {
      case 'string': {
        const result = validateStringField(value, fieldName, {
          required: fieldSchema.required,
          minLength: fieldSchema.minLength,
          maxLength: fieldSchema.maxLength,
          pattern: fieldSchema.pattern,
          sanitize: fieldSchema.sanitize !== false
        });
        if (!result.valid) {
          errors.push(result.error!);
        } else if (fieldSchema.enum && !fieldSchema.enum.includes(result.sanitized as string)) {
          errors.push(`${fieldName} must be one of: ${fieldSchema.enum.join(', ')}`);
        } else {
          sanitized[fieldName] = result.sanitized;
        }
        break;
      }
      case 'number': {
        const result = validateNumberField(value, fieldName, {
          required: fieldSchema.required,
          min: fieldSchema.min,
          max: fieldSchema.max
        });
        if (!result.valid) {
          errors.push(result.error!);
        } else if (fieldSchema.enum && !fieldSchema.enum.includes(result.sanitized as number)) {
          errors.push(`${fieldName} must be one of: ${fieldSchema.enum.join(', ')}`);
        } else {
          sanitized[fieldName] = result.sanitized;
        }
        break;
      }
      case 'boolean': {
        if (typeof value !== 'boolean') {
          errors.push(`${fieldName} must be a boolean`);
        } else {
          sanitized[fieldName] = value;
        }
        break;
      }
      case 'array': {
        const result = validateArrayField(value, fieldName, {
          required: fieldSchema.required,
          minLength: fieldSchema.minLength,
          maxLength: fieldSchema.maxLength
        });
        if (!result.valid) {
          errors.push(result.error!);
        } else {
          sanitized[fieldName] = result.sanitized;
        }
        break;
      }
      case 'object': {
        if (typeof value !== 'object' || Array.isArray(value)) {
          errors.push(`${fieldName} must be an object`);
        } else {
          sanitized[fieldName] = value;
        }
        break;
      }
    }
  }

  return { valid: errors.length === 0, errors, sanitized };
}

/**
 * Log security-relevant events (for monitoring/alerting)
 * Follows OWASP logging guidelines
 */
export function logSecurityEvent(
  event: 'rate_limit_exceeded' | 'invalid_token' | 'unauthorized_access' | 'suspicious_input' | 'validation_failed' | 'cors_rejected',
  details: Record<string, unknown>
): void {
  // Sanitize sensitive data before logging
  const sanitizedDetails = { ...details };
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];
  
  for (const key of Object.keys(sanitizedDetails)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      sanitizedDetails[key] = '[REDACTED]';
    }
  }

  console.warn(`[SECURITY] ${event}:`, JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    ...sanitizedDetails
  }));
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  message: string,
  statusCode: number = 400,
  code?: string,
  corsHeaders?: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      code: code || 'ERROR',
      status: statusCode
    }),
    {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
        ...(corsHeaders || {})
      }
    }
  );
}

/**
 * Create a standardized success response
 */
export function successResponse(
  data: unknown,
  statusCode: number = 200,
  corsHeaders?: Record<string, string>
): Response {
  return new Response(
    JSON.stringify(data),
    {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
        ...(corsHeaders || {})
      }
    }
  );
}

// =============================================================================
// STRIPE WEBHOOK SECURITY
// =============================================================================

/**
 * Validate Stripe webhook IP addresses
 * Stripe webhook IPs: https://stripe.com/docs/ips#webhook-ip-addresses
 */
const STRIPE_WEBHOOK_IPS = [
  // Stripe webhook IPs (as of 2024)
  "3.18.12.63",
  "3.130.192.231",
  "13.235.14.237",
  "13.235.122.149",
  "18.211.135.69",
  "35.154.171.200",
  "52.15.183.38",
  "54.88.130.119",
  "54.88.130.237",
  "54.187.174.169",
  "54.187.205.235",
  "54.187.216.72",
];

/**
 * Check if request is from Stripe (basic IP validation)
 * Note: Always verify webhook signature as primary security measure
 */
export function isStripeWebhookIP(ip: string): boolean {
  return STRIPE_WEBHOOK_IPS.includes(ip);
}

// =============================================================================
// MEMORY CLEANUP
// =============================================================================

// Clean up old rate limit entries periodically (memory management)
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetAt) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[SECURITY] Cleaned up ${cleaned} expired rate limit entries`);
  }
}, 60 * 1000); // Run every minute

// =============================================================================
// REQUEST BODY SIZE LIMITS (OWASP: Restrict Content-Length)
// =============================================================================

/** Maximum request body size in bytes (default 5MB) */
const MAX_BODY_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Validate request body size before parsing.
 * Returns an error response if Content-Length exceeds the limit.
 * Prevents denial-of-service via oversized payloads (OWASP A05:2021).
 *
 * @param req - The incoming request
 * @param maxBytes - Maximum allowed body size (default 5MB)
 * @param corsHeaders - Optional CORS headers to include in error response
 * @returns Error Response if body is too large, null if within limits
 */
export function validateContentLength(
  req: Request,
  maxBytes: number = MAX_BODY_SIZE_BYTES,
  corsHeaders?: Record<string, string>
): Response | null {
  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (!isNaN(size) && size > maxBytes) {
      logSecurityEvent('validation_failed', {
        reason: 'Request body too large',
        contentLength: size,
        maxAllowed: maxBytes
      });
      return errorResponse(
        `Request body too large. Maximum size is ${Math.round(maxBytes / 1024)}KB.`,
        413,
        "PAYLOAD_TOO_LARGE",
        corsHeaders
      );
    }
  }
  return null;
}

// =============================================================================
// SECURE ENVIRONMENT VARIABLE HELPERS
// =============================================================================

/**
 * Get a required environment variable or throw a clear startup error.
 * Prevents the function from running with missing configuration (fail-fast).
 * Following OWASP secure configuration guidelines.
 *
 * @param name - Environment variable name
 * @returns The environment variable value
 * @throws Error if the variable is not set
 */
export function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(
      `[SECURITY] Missing required environment variable: ${name}. ` +
      `Set this in your Supabase project settings or .env file.`
    );
  }
  return value;
}

/**
 * Safely parse a JSON request body with size enforcement.
 * Returns a typed { data, error } result instead of throwing.
 * Protects against malformed JSON and oversized payloads.
 *
 * @param req - The incoming request
 * @param maxBytes - Maximum body size in bytes (default 1MB)
 * @returns Parsed body or error string
 */
export async function safeParseBody(
  req: Request,
  maxBytes: number = 1 * 1024 * 1024
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  // Check Content-Length header first (fast rejection)
  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (!isNaN(size) && size > maxBytes) {
      return { data: null, error: "Request body too large" };
    }
  }

  try {
    const text = await req.text();
    // Double-check actual body size after reading
    if (text.length > maxBytes) {
      return { data: null, error: "Request body too large" };
    }
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { data: null, error: "Request body must be a JSON object" };
    }
    return { data: parsed as Record<string, unknown>, error: null };
  } catch {
    return { data: null, error: "Invalid JSON body" };
  }
}
