/**
 * =============================================================================
 * CLEARSKIN AI - CANCEL SUBSCRIPTION ENDPOINT
 * =============================================================================
 * 
 * Cancels a user's Stripe subscription immediately.
 * Updates both Stripe and local database records.
 * 
 * Security measures:
 * - Rate limiting (IP + user-based)
 * - JWT token validation
 * - CORS protection (no wildcards)
 * - Input validation (subscription ID format)
 * - Authorization check (users can only cancel their own subscriptions)
 * 
 * @version 2.0.0
 * =============================================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.0.0";

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
  validateContentLength,
  successResponse,
  errorResponse
} from "../_shared/security.ts";

// =============================================================================
// CONFIGURATION
// =============================================================================

// Validate required environment variables at startup
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY_TEST");

if (!STRIPE_SECRET_KEY) {
  throw new Error("Missing required environment variable: STRIPE_SECRET_KEY_TEST");
}

// Initialize Stripe client
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16"
});

// =============================================================================
// REQUEST BODY SCHEMA
// =============================================================================

const requestSchema = {
  subscriptionId: {
    type: 'string' as const,
    required: true,
    minLength: 10,
    maxLength: 100,
    pattern: /^sub_[a-zA-Z0-9]+$/  // Stripe subscription ID format
  }
};

// =============================================================================
// MAIN HANDLER
// =============================================================================

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  // Only allow POST method
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405, "METHOD_NOT_ALLOWED", corsHeaders);
  }

  // --- SECURITY: Reject oversized payloads (max 10KB for cancel request) ---
  const sizeCheck = validateContentLength(req, 10 * 1024, corsHeaders);
  if (sizeCheck) return sizeCheck;

  try {
    // --- SECURITY: Authentication ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      logSecurityEvent('invalid_token', { reason: 'Missing or malformed Authorization header' });
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED", corsHeaders);
    }

    // Create Supabase client with user's auth context
    const supabase = createClient(
      SUPABASE_URL ?? "",
      SUPABASE_ANON_KEY ?? "",
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      logSecurityEvent('invalid_token', { reason: 'Invalid JWT token', error: userError?.message });
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED", corsHeaders);
    }

    // --- SECURITY: Rate Limiting (IP + User) ---
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(user.id, RATE_LIMITS.standard, clientIP);
    
    if (rateLimit.limited) {
      logSecurityEvent('rate_limit_exceeded', { 
        userId: user.id, 
        ip: clientIP,
        endpoint: 'cancel-subscription'
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
        endpoint: 'cancel-subscription'
      });
      return errorResponse(
        `Validation failed: ${validation.errors.join(', ')}`,
        400,
        "VALIDATION_ERROR",
        corsHeaders
      );
    }

    const { subscriptionId } = validation.sanitized as { subscriptionId: string };

    // --- SECURITY: Verify ownership before cancellation ---
    // User can only cancel their own subscription
    const { data: subscriptionRecord, error: subError } = await supabase
      .from("subscriptions")
      .select("id, stripe_subscription_id, user_id")
      .eq("stripe_subscription_id", subscriptionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (subError) {
      console.error("Subscription lookup error:", subError);
      return errorResponse("Failed to verify subscription", 500, "DB_ERROR", corsHeaders);
    }

    if (!subscriptionRecord) {
      logSecurityEvent('unauthorized_access', { 
        userId: user.id, 
        subscriptionId,
        reason: 'Subscription not found or not owned by user'
      });
      return errorResponse(
        "Subscription not found or you don't have permission to cancel it",
        403,
        "FORBIDDEN",
        corsHeaders
      );
    }

    // --- BUSINESS LOGIC: Cancel Subscription ---
    
    // Cancel the subscription in Stripe
    const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);

    // Update local database record
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        updated_at: new Date().toISOString()
      })
      .eq("stripe_subscription_id", subscriptionId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to update subscription status:", updateError);
      // Don't fail the request - Stripe cancellation succeeded
    }

    console.log(`Subscription ${subscriptionId} cancelled for user ${user.id}`);

    return successResponse({
      success: true,
      message: "Subscription cancelled successfully",
      subscription: {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        canceledAt: canceledSubscription.canceled_at
      }
    }, 200, corsHeaders);

  } catch (error) {
    console.error("cancel-subscription error:", error);
    
    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      if (error.code === 'resource_missing') {
        return errorResponse(
          "Subscription not found in payment system",
          404,
          "SUBSCRIPTION_NOT_FOUND",
          corsHeaders
        );
      }
      return errorResponse(
        "Payment service error. Please try again later.",
        502,
        "STRIPE_ERROR",
        corsHeaders
      );
    }

    return errorResponse(
      "An error occurred while cancelling the subscription",
      500,
      "INTERNAL_ERROR",
      corsHeaders
    );
  }
});
