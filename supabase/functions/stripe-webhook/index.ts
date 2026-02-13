/**
 * =============================================================================
 * CLEARSKIN AI - STRIPE WEBHOOK ENDPOINT
 * =============================================================================
 * 
 * Handles incoming Stripe webhook events for subscription lifecycle management.
 * Processes checkout completions and subscription create/update/delete events.
 * 
 * Security measures:
 * - Stripe signature verification (primary security)
 * - Rate limiting for webhook events
 * - Event replay protection (idempotency)
 * - IP validation (optional, for defense in depth)
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
  getClientIP,
  logSecurityEvent,
  isValidUUID,
  validateContentLength,
  requireEnv
} from "../_shared/security.ts";

// =============================================================================
// CONFIGURATION
// =============================================================================

// --- SECURITY: Fail fast if required secrets are missing (OWASP A05:2021) ---
const PROJECT_URL = requireEnv("PROJECT_URL");
const SERVICE_ROLE_KEY = requireEnv("SERVICE_ROLE_KEY");
const STRIPE_SECRET_KEY = requireEnv("STRIPE_SECRET_KEY_TEST");
const WEBHOOK_SECRET = requireEnv("STRIPE_WEBHOOK_SECRET_TEST");

// Initialize clients
const sb = createClient(PROJECT_URL, SERVICE_ROLE_KEY);
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20"
});

// =============================================================================
// IDEMPOTENCY: Track processed events to prevent replay attacks
// =============================================================================

// In-memory cache for processed event IDs (for single instance)
// For multi-instance deployments, use Redis/KV store
const processedEvents = new Map<string, number>();
const EVENT_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Check if an event has already been processed
 */
function isEventProcessed(eventId: string): boolean {
  const processedAt = processedEvents.get(eventId);
  if (!processedAt) return false;
  
  // Check if cache entry has expired
  if (Date.now() - processedAt > EVENT_CACHE_TTL_MS) {
    processedEvents.delete(eventId);
    return false;
  }
  
  return true;
}

/**
 * Mark an event as processed
 */
function markEventProcessed(eventId: string): void {
  processedEvents.set(eventId, Date.now());
}

// Clean up old event entries periodically
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [eventId, processedAt] of processedEvents.entries()) {
    if (now - processedAt > EVENT_CACHE_TTL_MS) {
      processedEvents.delete(eventId);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[WEBHOOK] Cleaned up ${cleaned} old event entries`);
  }
}, 10 * 60 * 1000); // Run every 10 minutes

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create JSON response with proper headers
 */
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      // Webhook endpoints don't need CORS since they're called by Stripe servers
    }
  });
}

/**
 * Map Stripe subscription status to internal status
 */
function mapSubscriptionStatus(stripeStatus: string, eventType: string): string {
  if (eventType === "customer.subscription.deleted") {
    return "canceled";
  }
  
  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "active",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "past_due",
    incomplete: "incomplete",
    incomplete_expired: "incomplete",
    paused: "paused"
  };
  
  return statusMap[stripeStatus] ?? "incomplete";
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

Deno.serve(async (req: Request) => {
  // Only allow POST method for webhooks
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // --- SECURITY: Reject oversized webhook payloads (max 1MB) ---
  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (!isNaN(size) && size > 1 * 1024 * 1024) {
      logSecurityEvent('validation_failed', { reason: 'Webhook payload too large', size });
      return jsonResponse({ error: "Payload too large" }, 413);
    }
  }

  // --- SECURITY: Rate Limiting by IP ---
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit(clientIP, RATE_LIMITS.webhook, clientIP);
  
  if (rateLimit.limited) {
    logSecurityEvent('rate_limit_exceeded', { 
      ip: clientIP,
      endpoint: 'stripe-webhook'
    });
    return rateLimitResponse(rateLimit.resetIn);
  }

  // --- SECURITY: Signature Verification (Primary Security) ---
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    logSecurityEvent('invalid_token', { 
      reason: 'Missing stripe-signature header',
      ip: clientIP
    });
    return jsonResponse({ error: "Missing signature" }, 400);
  }

  // Read raw body for signature verification
  const rawBody = await req.text();
  
  let event: Stripe.Event;
  try {
    // Verify webhook signature (this is the primary security measure)
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, WEBHOOK_SECRET);
  } catch (err) {
    logSecurityEvent('invalid_token', { 
      reason: 'Webhook signature verification failed',
      error: String(err),
      ip: clientIP
    });
    console.error("❌ Webhook signature verification failed:", err);
    return jsonResponse({ error: "Invalid signature" }, 400);
  }

  // --- SECURITY: Idempotency Check (Prevent Replay) ---
  if (isEventProcessed(event.id)) {
    console.log(`⏭️ Skipping already processed event: ${event.id}`);
    return jsonResponse({ received: true, skipped: true });
  }

  console.log(`📨 Processing webhook event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("✓ Checkout completed:", {
          session_id: session.id,
          customer: session.customer,
          metadata: session.metadata
        });

        // Validate and store customer mapping
        const customerId = typeof session.customer === "string" 
          ? session.customer 
          : session.customer?.id;
        const userId = session.metadata?.supabase_user_id;

        if (customerId && userId) {
          // Validate user ID format
          if (!isValidUUID(userId)) {
            console.error("❌ Invalid user_id format in metadata:", userId);
            return jsonResponse({ error: "Invalid user_id format" }, 400);
          }

          const { error: upsertError } = await sb
            .from("billing_customers")
            .upsert({
              user_id: userId,
              stripe_customer_id: customerId,
              updated_at: new Date().toISOString()
            });

          if (upsertError) {
            console.error("❌ Error upserting billing customer:", upsertError);
          } else {
            console.log("✓ Billing customer upserted for user:", userId);
          }
        } else {
          console.warn("⚠️ Missing customer or user_id in checkout session metadata");
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`📋 Processing ${event.type}:`, {
          subscription_id: subscription.id,
          status: subscription.status,
          customer: subscription.customer,
          metadata: subscription.metadata
        });

        // Find user ID from metadata or billing_customers
        let userId = subscription.metadata?.supabase_user_id || null;

        if (!userId && typeof subscription.customer === "string") {
          console.log("🔍 Looking up user from billing_customers");
          const { data: billingCustomer, error: bcError } = await sb
            .from("billing_customers")
            .select("user_id")
            .eq("stripe_customer_id", subscription.customer)
            .maybeSingle();

          if (bcError) {
            console.error("❌ Error querying billing_customers:", bcError);
          } else if (billingCustomer) {
            userId = billingCustomer.user_id;
            console.log("✓ Found user ID:", userId);
          }
        }

        if (!userId) {
          console.error("❌ CRITICAL: No user_id found for subscription:", subscription.id);
          return jsonResponse({
            error: "No user_id found for subscription",
            subscription_id: subscription.id
          }, 400);
        }

        // Validate user ID format
        if (!isValidUUID(userId)) {
          console.error("❌ Invalid user_id format:", userId);
          return jsonResponse({ error: "Invalid user_id format" }, 400);
        }

        // Prepare subscription data
        const mappedStatus = mapSubscriptionStatus(subscription.status, event.type);
        const periodStart = new Date((subscription.current_period_start ?? 0) * 1000).toISOString();
        const periodEnd = new Date((subscription.current_period_end ?? 0) * 1000).toISOString();

        // Upsert subscription
        const { error: upsertError } = await sb
          .from("subscriptions")
          .upsert({
            user_id: userId,
            stripe_subscription_id: subscription.id,
            plan_code: "unlimited",
            weekly_limit: 100000,
            status: mappedStatus,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'stripe_subscription_id'
          });

        if (upsertError) {
          console.error("❌ Error upserting subscription:", upsertError);
          return jsonResponse({
            error: "Failed to upsert subscription",
            details: upsertError.message
          }, 500);
        }

        console.log("✅ Subscription upserted successfully!");
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    // Mark event as processed (idempotency)
    markEventProcessed(event.id);

    return jsonResponse({ received: true });

  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    return jsonResponse({ error: "Internal processing error" }, 500);
  }
});
