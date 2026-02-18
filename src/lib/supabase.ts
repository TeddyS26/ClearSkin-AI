import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- SECURITY: Validate required environment variables at startup ---
// These are public keys (EXPO_PUBLIC_*) designed for client-side use.
// The anon key is safe to expose — it only grants access that RLS policies allow.
// Secret keys (SERVICE_ROLE_KEY, STRIPE_SECRET_KEY) must NEVER appear here.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "[SECURITY] Missing required environment variables: " +
    "EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be set. " +
    "Create a .env file in the project root with these values."
  );
}

// --- SECURITY: Sanity-check that no secret keys leaked into client bundle ---
// Service role keys grant full database access and must never be in client code.
if (supabaseAnonKey.length > 500) {
  console.warn(
    "[SECURITY] EXPO_PUBLIC_SUPABASE_ANON_KEY appears unusually long. " +
    "Verify this is the anon key, not the service_role key."
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  { 
    auth: { 
      storage: AsyncStorage,
      persistSession: true, 
      autoRefreshToken: true,
      detectSessionInUrl: false,
    } 
  }
);
