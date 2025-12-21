// supabase/functions/stripe-webhook/index.ts
// @ts-ignore
import { createClient } from "npm:@supabase/supabase-js@2";
// @ts-ignore
import Stripe from "npm:stripe@14";
const sb = createClient(Deno.env.get("PROJECT_URL"), Deno.env.get("SERVICE_ROLE_KEY"));
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY_TEST"), {
  apiVersion: "2024-06-20"
});
const WH_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET_TEST");
function j(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
Deno.serve(async (req)=>{
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, WH_SECRET);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    return j({
      error: `Webhook signature verification failed: ${err}`
    }, 400);
  }
  console.log(`📨 Received event: ${event.type}`);
  try {
    switch(event.type){
      case "checkout.session.completed":
        {
          const s = event.data.object;
          console.log("✓ Checkout completed:", {
            session_id: s.id,
            customer: s.customer,
            metadata: s.metadata
          });
          // Ensure we store the customer mapping
          if (s.customer && s.metadata?.supabase_user_id) {
            await sb.from("billing_customers").upsert({
              user_id: s.metadata.supabase_user_id,
              stripe_customer_id: typeof s.customer === "string" ? s.customer : s.customer.id
            });
            console.log("✓ Billing customer upserted for user:", s.metadata.supabase_user_id);
          } else {
            console.warn("⚠️ No metadata in checkout session");
          }
          break;
        }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        {
          const sub = event.data.object;
          console.log(`📋 Processing ${event.type}:`, {
            subscription_id: sub.id,
            status: sub.status,
            customer: sub.customer,
            metadata: sub.metadata
          });
          // find our user by metadata or use billing_customers
          let userId = sub.metadata?.supabase_user_id || null;
          console.log("🔍 User ID from subscription metadata:", userId);
          if (!userId && typeof sub.customer === "string") {
            console.log("🔍 Looking up user from billing_customers for customer:", sub.customer);
            const { data: bc, error: bcError } = await sb.from("billing_customers").select("user_id").eq("stripe_customer_id", sub.customer).maybeSingle();
            if (bcError) {
              console.error("❌ Error querying billing_customers:", bcError);
            } else if (bc) {
              userId = bc.user_id;
              console.log("✓ Found user ID from billing_customers:", userId);
            } else {
              console.error("❌ No billing_customers record found for customer:", sub.customer);
            }
          }
          if (!userId) {
            console.error("❌ CRITICAL: No user_id found! Cannot process subscription:", sub.id);
            console.error("   - Subscription metadata:", sub.metadata);
            console.error("   - Customer ID:", sub.customer);
            return j({
              error: "No user_id found for subscription",
              subscription_id: sub.id,
              customer_id: sub.customer
            }, 400);
          }
          console.log("✓ Processing subscription for user:", userId);
          const statusMap = {
            active: "active",
            trialing: "active",
            past_due: "past_due",
            canceled: "canceled",
            unpaid: "past_due",
            incomplete: "incomplete",
            incomplete_expired: "incomplete",
            paused: "paused"
          };
          const plan_code = "unlimited";
          const weekly_limit = 100000;
          const periodStart = new Date((sub.current_period_start ?? 0) * 1000).toISOString();
          const periodEnd = new Date((sub.current_period_end ?? 0) * 1000).toISOString();
          const mappedStatus = event.type === "customer.subscription.deleted" ? "canceled" : statusMap[sub.status] ?? "incomplete";
          console.log("💾 Upserting subscription with status:", mappedStatus);
          const { error: upsertError } = await sb.from("subscriptions").upsert({
            user_id: userId,
            stripe_subscription_id: sub.id,
            plan_code,
            weekly_limit,
            status: mappedStatus,
            current_period_start: periodStart,
            current_period_end: periodEnd
          }, {
            onConflict: 'stripe_subscription_id' // ← THE FIX!
          });
          if (upsertError) {
            console.error("❌ Error upserting subscription:", upsertError);
            return j({
              error: "Failed to upsert subscription",
              details: upsertError
            }, 500);
          }
          console.log("✅ Subscription upserted successfully!");
          break;
        }
    }
    return j({
      received: true
    });
  } catch (e) {
    console.error("❌ Webhook processing error:", e);
    return j({
      error: String(e)
    }, 500);
  }
});
