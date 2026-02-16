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
    // Clean up localStorage
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

    // Clear all Supabase-related items from localStorage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch { /* ignore */ }

    // Clear all cookies related to Supabase
    try {
      document.cookie.split(";").forEach((c) => {
        const name = c.trim().split("=")[0];
        if (name.startsWith("sb-") || name.includes("supabase")) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      });
    } catch { /* ignore */ }

    // Call server-side signout to clear server cookies
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch { /* ignore */ }

    // Use local scope so it works even if the token is expired
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Even if Supabase signOut fails, we still redirect
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
