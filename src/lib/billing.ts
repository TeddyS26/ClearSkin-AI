import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const FUNC = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`;
const FREE_SCAN_KEY = "@clearskin_free_scan_used";

export async function getJwt() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in");
  return token;
}

// Check if user has used their free scan
export async function hasUsedFreeScan(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return true; // No user = can't scan anyway
  
  const key = `${FREE_SCAN_KEY}_${user.id}`;
  const used = await AsyncStorage.getItem(key);
  return used === "true";
}

// Mark the free scan as used
export async function markFreeScanUsed(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  const key = `${FREE_SCAN_KEY}_${user.id}`;
  await AsyncStorage.setItem(key, "true");
}

// Check if this scan is a free scan (no subscription, first scan)
export async function isFreeScan(): Promise<boolean> {
  const hasSubscription = await hasActiveSubscription();
  if (hasSubscription) return false;
  
  const usedFree = await hasUsedFreeScan();
  return !usedFree;
}

// Check if user can start a scan (has subscription OR hasn't used free scan)
export async function canScan(): Promise<boolean> {
  const hasSubscription = await hasActiveSubscription();
  if (hasSubscription) return true;
  
  const usedFree = await hasUsedFreeScan();
  return !usedFree; // Can scan if free scan not used yet
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

