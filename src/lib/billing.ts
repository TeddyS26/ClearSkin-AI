import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";

const FUNC = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`;

export async function getJwt() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in");
  return token;
}

// Get payment sheet parameters for native checkout
export async function createSubscriptionPayment() {
  const token = await getJwt();
  const res = await fetch(`${FUNC}/create-subscription-payment`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to create payment");
  return {
    paymentIntent: json.paymentIntent,
    ephemeralKey: json.ephemeralKey,
    customer: json.customerId,
    subscriptionId: json.subscriptionId,
  };
}

export async function openBillingPortal() {
  const token = await getJwt();
  const res = await fetch(`${FUNC}/billing-portal`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Portal failed");
  if (json?.url) {
    await WebBrowser.openBrowserAsync(json.url);
  }
}

// optional: handle deep links like clearskinai://checkout/success
export function configureLinking() {
  const scheme = Linking.createURL("/");
  return scheme;
}

// Check if user has an active subscription
export async function hasActiveSubscription() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  
  return !!sub;
}

// Get user's subscription status details
export async function getSubscriptionStatus() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  
  return sub;
}

