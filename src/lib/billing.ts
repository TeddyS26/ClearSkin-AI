import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";

// --- SECURITY: Validate base URL at module load time ---
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
if (!SUPABASE_URL) {
  throw new Error("[SECURITY] EXPO_PUBLIC_SUPABASE_URL is not set");
}
const FUNC = `${SUPABASE_URL}/functions/v1`;

// Free scan: up to 3 free scans per account
const FREE_SCAN_LIMIT = 3;

export async function getJwt() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in");
  return token;
}

/**
 * Get count of completed free scans (no subscription).
 * Used to determine how many of the free trial scans remain.
 */
async function getCompletedScanCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return FREE_SCAN_LIMIT; // No user = treat as exhausted

  try {
    const { count, error } = await supabase
      .from("scan_sessions")
      .select("id", { count: 'exact', head: true })
      .eq("user_id", user.id)
      .eq("status", "complete")
      .not("skin_score", "is", null);

    if (error) {
      console.error("Error counting completed scans:", error);
      return 0;
    }
    return count ?? 0;
  } catch (error) {
    console.error("Error counting completed scans:", error);
    return 0;
  }
}

/**
 * Get the number of remaining free scans for the user.
 * Returns 0 if all free scans have been used.
 */
export async function getRemainingFreeScans(): Promise<number> {
  const count = await getCompletedScanCount();
  return Math.max(0, FREE_SCAN_LIMIT - count);
}

/**
 * Check if user has used all their free trial scans.
 * Returns true if all 3 free scans have been used, false if any remain.
 */
export async function hasUsedFreeTrial(): Promise<boolean> {
  const remaining = await getRemainingFreeScans();
  return remaining <= 0;
}

/**
 * Check if this scan is a free scan (no subscription, has remaining free scans)
 */
export async function isFreeScan(): Promise<boolean> {
  const hasSubscription = await hasActiveSubscription();
  if (hasSubscription) return false;

  const remaining = await getRemainingFreeScans();
  return remaining > 0;
}

/**
 * Check if user can start a scan (has subscription OR has remaining free scans)
 */
export async function canScan(): Promise<boolean> {
  const hasSubscription = await hasActiveSubscription();
  if (hasSubscription) return true;

  const remaining = await getRemainingFreeScans();
  return remaining > 0;
}

// Legacy aliases for backwards compatibility
export const hasUsedFreeScan = hasUsedFreeTrial;
export const hasUsedMonthlyFreeScan = hasUsedFreeTrial;
// markFreeTrialUsed is no longer needed (free trial tracked by scan count)
// Kept as no-ops for backward compatibility
export async function markFreeTrialUsed(): Promise<void> { /* no-op */ }
export const markFreeScanUsed = markFreeTrialUsed;
export const markMonthlyFreeScanUsed = markFreeTrialUsed;

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
// Trusts the subscription status field, which is kept in sync by the Stripe webhook.
// When Stripe renews/cancels/pauses a subscription, the webhook updates the status accordingly.
export async function hasActiveSubscription() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  // Use .limit(1) + order instead of .maybeSingle() to avoid silent errors
  // when multiple subscription records exist for the same user
  const { data: subs, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("current_period_end", { ascending: false })
    .limit(1);
  
  if (error) {
    console.error("Error checking subscription:", error);
    return false;
  }

  const sub = subs?.[0];
  return !!sub;
}

// Get user's subscription status details
// Returns the most relevant subscription (prioritizes active/trialing, then most recent)
export async function getSubscriptionStatus() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  // Fetch all subscriptions for the user to avoid .maybeSingle() errors
  // when multiple records exist (e.g., past canceled + current active)
  const { data: subs, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("current_period_end", { ascending: false });
  
  if (error) {
    console.error("Error fetching subscription status:", error);
    return null;
  }

  if (!subs || subs.length === 0) return null;

  // Prioritize active or trialing subscriptions
  const activeSub = subs.find(s => s.status === "active" || s.status === "trialing");
  return activeSub || subs[0];
}

