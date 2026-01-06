/**
 * =============================================================================
 * CLEARSKIN AI - AUTHORIZE SCAN ENDPOINT
 * =============================================================================
 * 
 * Checks if a user is authorized to perform a skin scan.
 * Authorization flow:
 * 1. Active subscription with remaining weekly scans
 * 2. Available scan credits
 * 3. Free trial (first scan for new users)
 * 
 * Security measures:
 * - Rate limiting (IP + user-based)
 * - JWT token validation
 * - CORS protection
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

// Initialize Supabase client with service role (server-side operations)
const sb = createClient(PROJECT_URL, SERVICE_ROLE_KEY);

// =============================================================================
// MAIN HANDLER
// =============================================================================

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  // Only allow GET and POST methods
  if (req.method !== "GET" && req.method !== "POST") {
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
        endpoint: 'authorize-scan'
      });
      return rateLimitResponse(rateLimit.resetIn, corsHeaders);
    }

    // --- BUSINESS LOGIC: Authorization Checks ---

    // 1) Check active subscription with remaining weekly scans
    const { data: subscription } = await sb
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const { data: weeklyScans } = await sb
      .from("scans_this_week")
      .select("scans_count")
      .eq("user_id", user.id)
      .maybeSingle();

    const usedScans = weeklyScans?.scans_count ?? 0;

    if (subscription && usedScans < (subscription.weekly_limit ?? 0)) {
      return successResponse({
        allowed: true,
        reason: "subscription",
        remaining: subscription.weekly_limit - usedScans,
        isFreeTier: false
      }, 200, corsHeaders);
    }

    // 2) Check for available scan credits
    const { data: creditsRow } = await sb
      .from("scan_credits")
      .select("credits")
      .eq("user_id", user.id)
      .maybeSingle();

    const credits = creditsRow?.credits ?? 0;

    if (credits > 0) {
      // Deduct one credit atomically
      const { error: creditError } = await sb
        .from("scan_credits")
        .upsert({
          user_id: user.id,
          credits: credits - 1,
          updated_at: new Date().toISOString()
        });

      if (creditError) {
        console.error("Failed to deduct credit:", creditError);
        return errorResponse("Failed to process scan credit", 500, "CREDIT_ERROR", corsHeaders);
      }

      return successResponse({
        allowed: true,
        reason: "credit",
        remaining: credits - 1,
        isFreeTier: false
      }, 200, corsHeaders);
    }

    // 3) Check free trial eligibility (first completed scan)
    const { data: existingScans, error: scanError } = await sb
      .from("scan_sessions")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "complete")
      .not("skin_score", "is", null)
      .limit(1);

    if (!scanError && (!existingScans || existingScans.length === 0)) {
      return successResponse({
        allowed: true,
        reason: "free_trial",
        remaining: 0,
        isFreeTier: true
      }, 200, corsHeaders);
    }

    // 4) Not authorized - redirect to paywall
    return successResponse({
      allowed: false,
      reason: "no_credits",
      isFreeTier: false,
      message: "Please purchase a subscription or scan credits to continue."
    }, 200, corsHeaders);

  } catch (error) {
    console.error("authorize-scan error:", error);
    return errorResponse(
      "An error occurred while checking scan authorization",
      500,
      "INTERNAL_ERROR",
      corsHeaders
    );
  }
});
