import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";

const FUNC = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`;

// Free scan cooldown period in days
const FREE_SCAN_COOLDOWN_DAYS = 30;

export async function getJwt() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in");
  return token;
}

/**
 * Check if user has used their free scan within the last 30 days
 * Returns true if free scan was used within cooldown period, false otherwise
 */
export async function hasUsedMonthlyFreeScan(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return true; // No user = can't scan anyway
  
  try {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("free_scan_used_at")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (!profile || !profile.free_scan_used_at) {
      // No free scan used yet
      return false;
    }
    
    // Check if 30 days have passed since the last free scan
    const lastUsed = new Date(profile.free_scan_used_at);
    const now = new Date();
    const diffTime = now.getTime() - lastUsed.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    // Return true if within cooldown period (scan was used recently)
    return diffDays < FREE_SCAN_COOLDOWN_DAYS;
  } catch (error) {
    console.error("Error checking monthly free scan:", error);
    // Fail open - allow scan if we can't check
    return false;
  }
}

/**
 * Mark the free scan as used (starts 30-day cooldown)
 */
export async function markMonthlyFreeScanUsed(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("markMonthlyFreeScanUsed: No user found");
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
        console.log("Successfully marked free scan as used (update)");
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
        console.error("Error inserting free scan used:", insertError);
      } else {
        console.log("Successfully marked free scan as used (insert)");
      }
    }
  } catch (error) {
    console.error("Error marking free scan used:", error);
  }
}

/**
 * Check if this scan is a free scan (no subscription, hasn't used monthly free scan)
 */
export async function isFreeScan(): Promise<boolean> {
  const hasSubscription = await hasActiveSubscription();
  if (hasSubscription) return false;
  
  const usedFree = await hasUsedMonthlyFreeScan();
  return !usedFree;
}

/**
 * Check if user can start a scan (has subscription OR hasn't used monthly free scan)
 */
export async function canScan(): Promise<boolean> {
  const hasSubscription = await hasActiveSubscription();
  if (hasSubscription) return true;
  
  const usedFree = await hasUsedMonthlyFreeScan();
  return !usedFree; // Can scan if monthly free scan not used yet
}

/**
 * Get the number of days until the next free scan is available (30-day countdown)
 * Returns null if user not found, 0 if free scan is available now
 */
export async function getDaysUntilFreeReset(): Promise<number | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  try {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("free_scan_used_at")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (!profile || !profile.free_scan_used_at) {
      return 0; // Free scan available now (never used)
    }
    
    // Calculate days since last free scan
    const lastUsed = new Date(profile.free_scan_used_at);
    const now = new Date();
    const diffTime = now.getTime() - lastUsed.getTime();
    const daysSinceUsed = diffTime / (1000 * 60 * 60 * 24);
    
    if (daysSinceUsed >= FREE_SCAN_COOLDOWN_DAYS) {
      return 0; // Cooldown expired, free scan available
    }
    
    // Calculate remaining days
    const daysRemaining = Math.ceil(FREE_SCAN_COOLDOWN_DAYS - daysSinceUsed);
    return daysRemaining;
  } catch (error) {
    console.error("Error getting days until free reset:", error);
    return null;
  }
}

// Legacy functions for backwards compatibility
export async function hasUsedFreeScan(): Promise<boolean> {
  return hasUsedMonthlyFreeScan();
}

export async function markFreeScanUsed(): Promise<void> {
  return markMonthlyFreeScanUsed();
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

