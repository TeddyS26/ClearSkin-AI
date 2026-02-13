/**
 * =============================================================================
 * CLEARSKIN AI - BILLING PORTAL ENDPOINT
 * =============================================================================
 * 
 * Creates a Stripe billing portal session for subscription management.
 * Users can view/update payment methods, view invoices, and cancel subscriptions.
 * 
 * Security measures:
 * - Rate limiting (IP + user-based)
 * - JWT token validation
 * - CORS protection
 * - Environment variable validation
 * 
 * @version 2.0.0
 * =============================================================================
 */

// @ts-expect-error - npm specifier not recognized by tsc
import { createClient } from "npm:@supabase/supabase-js@2";
// @ts-expect-error - npm specifier not recognized by tsc
import Stripe from "npm:stripe@14";

// Import shared security utilities
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
  getCorsHeaders,
  handleCorsPreflightRequest,
  getClientIP,
  logSecurityEvent,
  validateContentLength,
  requireEnv,
  successResponse,
  errorResponse
} from "../_shared/security.ts";

// =============================================================================
// CONFIGURATION
// =============================================================================

// --- SECURITY: Fail fast if any required secret is missing (OWASP A05:2021) ---
const PROJECT_URL = requireEnv("PROJECT_URL");
const SERVICE_ROLE_KEY = requireEnv("SERVICE_ROLE_KEY");
const STRIPE_SECRET_KEY = requireEnv("STRIPE_SECRET_KEY_TEST");
const PORTAL_RETURN_URL = Deno.env.get("PORTAL_RETURN_URL");

// Initialize clients
const sb = createClient(PROJECT_URL, SERVICE_ROLE_KEY);
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20"
});

// =============================================================================
// MAIN HANDLER
// =============================================================================

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  // Only allow POST method
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405, "METHOD_NOT_ALLOWED", corsHeaders);
  }

  // --- SECURITY: Reject oversized payloads (max 10KB for this endpoint) ---
  const sizeCheck = validateContentLength(req, 10 * 1024, corsHeaders);
  if (sizeCheck) return sizeCheck;

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
    const rateLimit = checkRateLimit(user.id, RATE_LIMITS.standard, clientIP);
    
    if (rateLimit.limited) {
      logSecurityEvent('rate_limit_exceeded', { 
        userId: user.id, 
        ip: clientIP,
        endpoint: 'billing-portal'
      });
      return rateLimitResponse(rateLimit.resetIn, corsHeaders);
    }

    // --- BUSINESS LOGIC: Create Billing Portal Session ---

    // Get user's Stripe customer ID
    const { data: billingCustomer, error: bcError } = await sb
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (bcError) {
      console.error("Failed to fetch billing customer:", bcError);
      return errorResponse("Failed to retrieve billing information", 500, "DB_ERROR", corsHeaders);
    }

    if (!billingCustomer?.stripe_customer_id) {
      return errorResponse(
        "No billing account found. Please set up a subscription first.",
        400,
        "NO_STRIPE_CUSTOMER",
        corsHeaders
      );
    }

    // Create Stripe billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: billingCustomer.stripe_customer_id,
      return_url: PORTAL_RETURN_URL || "clearskinai://settings"
    });

    return successResponse({
      url: session.url
    }, 200, corsHeaders);

  } catch (error) {
    console.error("billing-portal error:", error);
    
    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      return errorResponse(
        "Payment service error. Please try again later.",
        502,
        "STRIPE_ERROR",
        corsHeaders
      );
    }

    return errorResponse(
      "An error occurred while creating the billing portal session",
      500,
      "INTERNAL_ERROR",
      corsHeaders
    );
  }
});
