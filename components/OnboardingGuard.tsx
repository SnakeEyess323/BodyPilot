"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useProfil } from "@/context/ProfilContext";
import { useAuth } from "@/context/AuthContext";
import { profilTamamlandi } from "@/lib/onboarding";
import { migrateLocalStorageToSupabase } from "@/lib/supabase/data-service";

const AUTH_PATHS = ["/giris", "/kayit", "/auth/callback"];

export default function OnboardingGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profil, isLoaded } = useProfil();
  const { user, loading: authLoading } = useAuth();

  // Run migration when user first logs in
  useEffect(() => {
    if (user && isLoaded) {
      migrateLocalStorageToSupabase().catch(() => {});
    }
  }, [user, isLoaded]);

  useEffect(() => {
    // Wait for both auth and profil to load
    if (authLoading || !isLoaded) return;

    // Don't redirect on auth pages or landing page
    if (AUTH_PATHS.some((p) => pathname?.startsWith(p))) return;
    if (pathname === "/") return;

    // If not logged in, redirect to login
    if (!user) {
      router.replace("/giris");
      return;
    }

    const completed = profilTamamlandi(profil);

    // If onboarding is completed but user is on /onboarding, send to dashboard
    if (completed && pathname === "/onboarding") {
      router.replace("/dashboard");
      return;
    }

    // If logged in but onboarding not completed, redirect to onboarding
    if (!completed && pathname !== "/onboarding") {
      router.replace("/onboarding");
      return;
    }
  }, [authLoading, isLoaded, pathname, profil, router, user]);

  return <>{children}</>;
}
