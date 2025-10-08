import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Ctx = { user: any; loading: boolean; signOut: () => Promise<void> };
const AuthContext = createContext<Ctx>({ user: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setUser(data.user ?? null); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() { await supabase.auth.signOut(); }

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
