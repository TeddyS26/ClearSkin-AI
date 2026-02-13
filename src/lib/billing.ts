import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";

// --- SECURITY: Validate base URL at module load time ---
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
if (!SUPABASE_URL) {
  throw new Error("[SECURITY] EXPO_PUBLIC_SUPABASE_URL is not set");
}
const FUNC = `${SUPABASE_URL}/functions/v1`;

// Free scan: one-time per account (no cooldown/reset)

export async function getJwt() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in");
  return token;
}

/**
 * Check if user has already used their one-time free scan.
 * Returns true if the free scan has been used, false if still available.
 */
export async function hasUsedFreeTrial(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return true; // No user = can't scan anyway
  
  try {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("free_scan_used_at")
      .eq("user_id", user.id)
      .maybeSingle();
    
    // Free scan is used if free_scan_used_at has any value
    return !!(profile?.free_scan_used_at);
  } catch (error) {
    console.error("Error checking free trial status:", error);
    // Fail open - allow scan if we can't check
    return false;
  }
}

/**
 * Mark the one-time free scan as permanently used
 */
export async function markFreeTrialUsed(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("markFreeTrialUsed: No user found");
    return;
  }
  
  try {
    // First check if profile exists
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (existingProfile) {
      // Update existing profile
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          free_scan_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);
      
      if (updateError) {
        console.error("Error updating free scan used:", updateError);
      } else {
        console.log("Successfully marked free trial as used (update)");
      }
    } else {
      // Insert new profile
      const { error: insertError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: user.id,
          free_scan_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error("Error inserting free trial used:", insertError);
      } else {
        console.log("Successfully marked free trial as used (insert)");
      }
    }
  } catch (error) {
    console.error("Error marking free trial used:", error);
  }
}

/**
 * Check if this scan is a free scan (no subscription, hasn't used one-time free trial)
 */
export async function isFreeScan(): Promise<boolean> {
  const hasSubscription = await hasActiveSubscription();
  if (hasSubscription) return false;
  
  const usedFree = await hasUsedFreeTrial();
  return !usedFree;
}

/**
 * Check if user can start a scan (has subscription OR hasn't used one-time free trial)
 */
export async function canScan(): Promise<boolean> {
  const hasSubscription = await hasActiveSubscription();
  if (hasSubscription) return true;
  
  const usedFree = await hasUsedFreeTrial();
  return !usedFree; // Can scan only if free trial not used yet
}

// Legacy aliases for backwards compatibility
export const hasUsedFreeScan = hasUsedFreeTrial;
export const markFreeScanUsed = markFreeTrialUsed;
export const hasUsedMonthlyFreeScan = hasUsedFreeTrial;
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

