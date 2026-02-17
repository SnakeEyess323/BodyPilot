"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfil } from "@/context/ProfilContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { updateProfile } from "@/lib/supabase/data-service";
import { createClient } from "@/lib/supabase/client";
import ProfileForm from "@/components/ProfileForm";
import { Crown, CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profil } from "@/lib/types";

export default function ProfilPage() {
  const router = useRouter();
  const { profil, setProfil } = useProfil();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isPro, plan } = useSubscription();
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  // Load existing full_name from Auth if not already in profil
  useEffect(() => {
    if (user && !profil.adSoyad) {
      const authName =
        user.user_metadata?.full_name || user.email?.split("@")[0] || "";
      if (authName) {
        setProfil({ ...profil, adSoyad: authName });
      }
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfil(profil);

    // Sync full_name to Supabase profiles table and Auth user metadata
    if (profil.adSoyad && user) {
      try {
        await updateProfile({ full_name: profil.adSoyad });
        const supabase = createClient();
        await supabase.auth.updateUser({
          data: { full_name: profil.adSoyad },
        });
      } catch {
        // Continue even if sync fails
      }
    }

    router.push("/dashboard");
  };

  const hasMinimum = Boolean(
    profil.yas != null &&
      profil.kilo != null &&
      profil.boy != null &&
      profil.hedef &&
      profil.seviye &&
      profil.gunSayisi != null &&
      profil.ortam
  );

  async function handleManageSubscription() {
    setIsPortalLoading(true);
    try {
      const res = await fetch("/api/polar/portal", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.profile.portalError);
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Portal error:", error);
      alert(t.profile.portalError);
    } finally {
      setIsPortalLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          {t.profile.title}
        </h1>
        <p className="text-muted-foreground">
          {t.onboarding.welcomeDesc}
        </p>
      </div>

      {/* Subscription Section */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              isPro 
                ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
            )}>
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {isPro ? t.profile.proPlan : t.profile.freePlan}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isPro 
                  ? t.profile.proDesc 
                  : t.profile.freeDesc}
              </p>
            </div>
          </div>

          {isPro ? (
            <button
              onClick={handleManageSubscription}
              disabled={isPortalLoading}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
                "border border-border bg-background hover:bg-accent",
                "text-foreground"
              )}
            >
              {isPortalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {t.profile.manageSubscription}
              <ExternalLink className="h-3 w-3" />
            </button>
          ) : (
            <button
              onClick={() => router.push("/fiyatlandirma")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
                "bg-violet-600 hover:bg-violet-700 text-white"
              )}
            >
              <Crown className="h-4 w-4" />
              {t.profile.upgradeToPro}
            </button>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        <ProfileForm
          profil={profil}
          onChange={(p: Profil) => setProfil(p)}
          compact
        />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="submit"
            disabled={!hasMinimum}
            className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.profile.saveButton}
          </button>
        </div>
      </form>
    </div>
  );
}
