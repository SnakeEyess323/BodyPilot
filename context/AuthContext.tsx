"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const signOut = useCallback(async () => {
    // Clean up any old unscoped localStorage keys before signing out
    // so the next user never inherits stale data
    const CLEANUP_KEYS = [
      "spor-asistan-profil",
      "spor-asistan-haftalik-program",
      "spor-asistan-yemek-programi",
      "bodypilot-gamification",
      "spor-asistan-favori-yemekler",
      "spor-asistan-antrenman-gecmisi",
      "spor-asistan-yemek-gecmisi",
      "spor-asistan-manual-food",
    ];
    for (const key of CLEANUP_KEYS) {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    }

    try {
      await supabase.auth.signOut();
    } catch {
      // Even if Supabase signOut fails, clear local state
    }
    setUser(null);
    window.location.href = "/giris";
  }, [supabase.auth]);

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
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
