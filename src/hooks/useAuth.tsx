import { useState, useEffect, useRef, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        // Only set loading to false on first init; after that, skip to avoid flash
        if (!initialized.current) {
          initialized.current = true;
          setLoading(false);
        }
      }
    );

    // THEN check for existing session with error handling
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (error) {
        console.warn("Session error, clearing state:", error.message);
        setSession(null);
        setUser(null);
      } else {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
      initialized.current = true;
      setLoading(false);
    }).catch((err) => {
      console.warn("Failed to get session:", err);
      setSession(null);
      setUser(null);
      initialized.current = true;
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
