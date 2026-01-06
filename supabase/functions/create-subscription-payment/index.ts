/**
 * =============================================================================
 * CLEARSKIN AI - CREATE SUBSCRIPTION PAYMENT ENDPOINT
 * =============================================================================
 * 
 * Creates a Stripe subscription with payment collection using Payment Intents.
 * Returns client secret for in-app payment sheet integration.
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

// @ts-ignore
import { createClient } from "npm:@supabase/supabase-js@2";
// @ts-ignore
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
  successResponse,
  errorResponse
} from "../_shared/security.ts";

// =============================================================================
// CONFIGURATION
// =============================================================================

// Validate required environment variables at startup
const PROJECT_URL = Deno.env.get("PROJECT_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY_TEST");
const STRIPE_PRICE_ID = Deno.env.get("STRIPE_PRICE_UNLIMITED_TEST");

if (!PROJECT_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing required environment variables: PROJECT_URL or SERVICE_ROLE_KEY");
}

if (!STRIPE_SECRET_KEY) {
  throw new Error("Missing required environment variable: STRIPE_SECRET_KEY_TEST");
}

if (!STRIPE_PRICE_ID) {
  throw new Error("Missing required environment variable: STRIPE_PRICE_UNLIMITED_TEST");
}

// Initialize clients
const sb = createClient(PROJECT_URL, SERVICE_ROLE_KEY);
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20"
});

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
    const rateLimit = checkRateLimit(user.id, RATE_LIMITS.standard, clientIP);
    
    if (rateLimit.limited) {
      logSecurityEvent('rate_limit_exceeded', { 
        userId: user.id, 
        ip: clientIP,
        endpoint: 'create-subscription-payment'
      });
      return rateLimitResponse(rateLimit.resetIn, corsHeaders);
    }

    // --- BUSINESS LOGIC: Create Subscription with Payment Intent ---

    // Get or create Stripe customer
    let { data: billingCustomer } = await sb
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = billingCustomer?.stripe_customer_id;

    // Create new Stripe customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          supabase_user_id: user.id
        }
      });
      
      customerId = customer.id;

      // Store customer mapping
      const { error: upsertError } = await sb
        .from("billing_customers")
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          created_at: new Date().toISOString()
        });

      if (upsertError) {
        console.error("Failed to store billing customer:", upsertError);
        // Continue - customer was created in Stripe
      }
    }

    // Create subscription with incomplete payment (collects payment method first)
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: STRIPE_PRICE_ID }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        supabase_user_id: user.id
      }
    });

    // Extract payment intent from subscription
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    // Create ephemeral key for Stripe SDK
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2024-06-20' }
    );

    return successResponse({
      paymentIntent: paymentIntent.client_secret,
      subscriptionId: subscription.id,
      customerId: customerId,
      ephemeralKey: ephemeralKey.secret
    }, 200, corsHeaders);

  } catch (error) {
    console.error("create-subscription-payment error:", error);
    
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
      "An error occurred while creating the subscription",
      500,
      "INTERNAL_ERROR",
      corsHeaders
    );
  }
});
