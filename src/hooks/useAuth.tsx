import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

  useEffect(() => {
    let sessionTimer: ReturnType<typeof setTimeout> | null = null;

    const startSessionTimer = () => {
      if (sessionTimer) clearTimeout(sessionTimer);
      sessionTimer = setTimeout(async () => {
        await supabase.auth.signOut();
        toast.info("Session expired. Please sign in again.");
        navigate("/login");
      }, SESSION_TIMEOUT_MS);
    };

    const clearSessionTimer = () => {
      if (sessionTimer) {
        clearTimeout(sessionTimer);
        sessionTimer = null;
      }
    };

    // Check if existing session has exceeded 1 hour
    const checkSessionAge = (session: Session | null) => {
      if (!session) return false;
      const signedInAt = new Date(session.user.last_sign_in_at || session.user.created_at).getTime();
      const elapsed = Date.now() - signedInAt;
      return elapsed >= SESSION_TIMEOUT_MS;
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session) {
          if (checkSessionAge(session)) {
            await supabase.auth.signOut();
            toast.info("Session expired. Please sign in again.");
            navigate("/login");
          } else {
            const signedInAt = new Date(session.user.last_sign_in_at || session.user.created_at).getTime();
            const remaining = SESSION_TIMEOUT_MS - (Date.now() - signedInAt);
            if (sessionTimer) clearTimeout(sessionTimer);
            sessionTimer = setTimeout(async () => {
              await supabase.auth.signOut();
              toast.info("Session expired. Please sign in again.");
              navigate("/login");
            }, remaining);
          }
        } else {
          clearSessionTimer();
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session && checkSessionAge(session)) {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setLoading(false);
        toast.info("Session expired. Please sign in again.");
        navigate("/login");
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session) {
          const signedInAt = new Date(session.user.last_sign_in_at || session.user.created_at).getTime();
          const remaining = SESSION_TIMEOUT_MS - (Date.now() - signedInAt);
          sessionTimer = setTimeout(async () => {
            await supabase.auth.signOut();
            toast.info("Session expired. Please sign in again.");
            navigate("/login");
          }, remaining);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      clearSessionTimer();
    };
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      toast.error(error.message);
      throw error;
    }
    toast.success("Welcome back!");
    navigate("/admin");
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      toast.error(error.message);
      throw error;
    }
    toast.success("Account created! You can now sign in.");
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      throw error;
    }
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
