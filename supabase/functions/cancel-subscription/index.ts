import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.0.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    // Verify user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");
    // Get request body
    const { subscriptionId } = await req.json();
    if (!subscriptionId) throw new Error("No subscription ID provided");
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY_TEST") || "", {
      apiVersion: "2023-10-16"
    });
    // Cancel the subscription immediately
    const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);
    // Update the subscription status in the database
    await supabase.from("subscriptions").update({
      status: "canceled",
      updated_at: new Date().toISOString()
    }).eq("stripe_subscription_id", subscriptionId).eq("user_id", user.id); // Security: only cancel own subscriptions
    return new Response(JSON.stringify({
      success: true,
      message: "Subscription cancelled",
      subscription: canceledSubscription
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    console.error("Cancellation error:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 400
    });
  }
});
