/**
 * =============================================================================
 * CLEARSKIN AI - SIGN STORAGE URLS ENDPOINT
 * =============================================================================
 * 
 * Creates signed URLs for private storage bucket access.
 * Users can only access files in their own folder (user/{user_id}/...).
 * 
 * Security measures:
 * - Rate limiting (IP + user-based)
 * - JWT token validation
 * - CORS protection
 * - Path traversal prevention
 * - User folder isolation
 * - Input validation
 * 
 * @version 2.0.0
 * =============================================================================
 */

// @ts-ignore errors about "npm:" imports in Supabase editor
import { createClient } from "npm:@supabase/supabase-js@2";

// Import shared security utilities
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
  getCorsHeaders,
  handleCorsPreflightRequest,
  getClientIP,
  logSecurityEvent,
  validateRequestBody,
  validateUserPath,
  successResponse,
  errorResponse
} from "../_shared/security.ts";

// =============================================================================
// CONFIGURATION
// =============================================================================

// Validate required environment variables at startup
const PROJECT_URL = Deno.env.get("PROJECT_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

if (!PROJECT_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing required environment variables: PROJECT_URL or SERVICE_ROLE_KEY");
}

// Initialize Supabase client with service role
const sb = createClient(PROJECT_URL, SERVICE_ROLE_KEY);

// Signed URL expiration time (5 minutes)
const SIGNED_URL_EXPIRY_SECONDS = 60 * 5;

// Maximum paths per request
const MAX_PATHS_PER_REQUEST = 10;

// =============================================================================
// REQUEST BODY SCHEMA
// =============================================================================

const requestSchema = {
  paths: {
    type: 'array' as const,
    required: true,
    minLength: 1,
    maxLength: MAX_PATHS_PER_REQUEST
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Normalize storage path (remove leading slash)
 */
function normalizePath(path: string): string {
  return path.startsWith("/") ? path.slice(1) : path;
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  // Only allow POST method
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405, "METHOD_NOT_ALLOWED", corsHeaders);
  }

  try {
    // --- SECURITY: Authentication ---
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      logSecurityEvent('invalid_token', { reason: 'Missing or malformed Authorization header' });
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED", corsHeaders);
    }

    const token = auth.split(" ")[1];
    const { data: { user }, error: authError } = await sb.auth.getUser(token);
    
    if (authError || !user) {
      logSecurityEvent('invalid_token', { reason: 'Invalid JWT token', error: authError?.message });
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED", corsHeaders);
    }

    // --- SECURITY: Rate Limiting (IP + User) ---
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(user.id, RATE_LIMITS.read, clientIP);
    
    if (rateLimit.limited) {
      logSecurityEvent('rate_limit_exceeded', { 
        userId: user.id, 
        ip: clientIP,
        endpoint: 'sign-storage-urls'
      });
      return rateLimitResponse(rateLimit.resetIn, corsHeaders);
    }

    // --- SECURITY: Parse and Validate Request Body ---
    let body;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid JSON body", 400, "INVALID_JSON", corsHeaders);
    }

    const validation = validateRequestBody(body, requestSchema);
    if (!validation.valid) {
      logSecurityEvent('validation_failed', { 
        userId: user.id, 
        errors: validation.errors,
        endpoint: 'sign-storage-urls'
      });
      return errorResponse(
        `Validation failed: ${validation.errors.join(', ')}`,
        400,
        "VALIDATION_ERROR",
        corsHeaders
      );
    }

    const paths = validation.sanitized.paths as string[];

    // Validate each path is a string
    if (!paths.every(p => typeof p === 'string' && p.length > 0 && p.length < 500)) {
      return errorResponse(
        "Invalid path format in request",
        400,
        "INVALID_PATHS",
        corsHeaders
      );
    }

    // --- BUSINESS LOGIC: Sign URLs ---
    const results = await Promise.all(
      paths.map(async (rawPath) => {
        const normalizedPath = normalizePath(rawPath);

        // --- SECURITY: Validate path belongs to user ---
        const pathValidation = validateUserPath(normalizedPath, user.id);
        
        if (!pathValidation.valid) {
          logSecurityEvent('unauthorized_access', {
            userId: user.id,
            path: rawPath,
            reason: pathValidation.error
          });
          return { path: rawPath, url: null, error: "Access denied" };
        }

        // Create signed URL
        try {
          const { data, error } = await sb.storage
            .from("scan")
            .createSignedUrl(pathValidation.sanitized as string, SIGNED_URL_EXPIRY_SECONDS);

          if (error || !data?.signedUrl) {
            console.error(`Failed to sign URL for path ${rawPath}:`, error);
            return { path: rawPath, url: null, error: "Failed to sign URL" };
          }

          return { path: rawPath, url: data.signedUrl };
        } catch (error) {
          console.error(`Error signing URL for path ${rawPath}:`, error);
          return { path: rawPath, url: null, error: "Internal error" };
        }
      })
    );

    return successResponse({ results }, 200, corsHeaders);

  } catch (error) {
    console.error("sign-storage-urls error:", error);
    return errorResponse(
      "An error occurred while signing storage URLs",
      500,
      "INTERNAL_ERROR",
      corsHeaders
    );
  }
});
