import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Ctx = { 
  user: any; 
  loading: boolean; 
  signOut: () => Promise<void>;
  profileComplete: boolean | null;
  checkProfileComplete: () => Promise<boolean>;
};

const AuthContext = createContext<Ctx>({ 
  user: null, 
  loading: true, 
  signOut: async () => {},
  profileComplete: null,
  checkProfileComplete: async () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);

  // Check if user's profile is complete (has gender and DOB set) OR is a legacy user
  async function checkProfileComplete(): Promise<boolean> {
    if (!user) return false;
    
    try {
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("profile_edited, gender, date_of_birth, is_legacy_user")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error checking profile:", error);
        return false;
      }

      // Profile is complete if:
      // 1. User is a legacy user (existed before mandatory profile was added)
      // 2. OR profile_edited is true 
      // 3. OR gender and DOB are set
      const isComplete = profile?.is_legacy_user === true ||
                         profile?.profile_edited === true || 
                         (profile?.gender !== null && profile?.date_of_birth !== null);
      
      setProfileComplete(isComplete);
      return isComplete;
    } catch (error) {
      console.error("Error checking profile:", error);
      return false;
    }
  }

  useEffect(() => {
    // First, try to restore the session from storage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // Reset profile complete when user changes
      if (!session?.user) {
        setProfileComplete(null);
      }
      // Only set loading false if it's still true (initial load)
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Check profile completion when user changes
  useEffect(() => {
    if (user) {
      checkProfileComplete();
    }
  }, [user?.id]);

  async function signOut() { 
    await supabase.auth.signOut(); 
    setUser(null);
    setProfileComplete(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, profileComplete, checkProfileComplete }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
