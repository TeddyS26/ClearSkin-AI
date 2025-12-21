// supabase/functions/billing-portal/index.ts
// @ts-ignore
import { createClient } from "npm:@supabase/supabase-js@2";
// @ts-ignore
import Stripe from "npm:stripe@14";
const sb = createClient(Deno.env.get("PROJECT_URL"), Deno.env.get("SERVICE_ROLE_KEY"));
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY_TEST"), {
  apiVersion: "2024-06-20"
});
function j(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
Deno.serve(async (req)=>{
  if (req.method !== "POST") return j({
    error: "Method not allowed"
  }, 405);
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return j({
      error: "Unauthorized"
    }, 401);
    const token = auth.split(" ")[1];
    const { data: { user } } = await sb.auth.getUser(token);
    if (!user) return j({
      error: "Unauthorized"
    }, 401);
    const { data: bc } = await sb.from("billing_customers").select("*").eq("user_id", user.id).maybeSingle();
    if (!bc?.stripe_customer_id) return j({
      error: "No Stripe customer"
    }, 400);
    const session = await stripe.billingPortal.sessions.create({
      customer: bc.stripe_customer_id,
      return_url: Deno.env.get("PORTAL_RETURN_URL")
    });
    return j({
      url: session.url
    });
  } catch (e) {
    return j({
      error: String(e)
    }, 500);
  }
});
