// supabase/functions/create-subscription-payment/index.ts
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
    // Ensure we have/make a Stripe customer
    let { data: bc } = await sb.from("billing_customers").select("*").eq("user_id", user.id).maybeSingle();
    let customerId = bc?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          supabase_user_id: user.id
        }
      });
      customerId = customer.id;
      await sb.from("billing_customers").upsert({
        user_id: user.id,
        stripe_customer_id: customerId
      });
    }
    const price = Deno.env.get("STRIPE_PRICE_UNLIMITED_TEST");
    // Create a subscription with payment behavior to collect payment method first
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price
        }
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: [
          'card'
        ],
        save_default_payment_method: 'on_subscription'
      },
      expand: [
        'latest_invoice.payment_intent'
      ],
      metadata: {
        supabase_user_id: user.id
      }
    });
    const invoice = subscription.latest_invoice;
    const paymentIntent = invoice.payment_intent;
    return j({
      paymentIntent: paymentIntent.client_secret,
      subscriptionId: subscription.id,
      customerId: customerId,
      ephemeralKey: (await stripe.ephemeralKeys.create({
        customer: customerId
      }, {
        apiVersion: '2024-06-20'
      })).secret
    });
  } catch (e) {
    console.error("Error:", e);
    return j({
      error: String(e)
    }, 500);
  }
});
