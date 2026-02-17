"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfil } from "@/context/ProfilContext";
import { useYemekProgram } from "@/context/YemekProgramContext";
import ProfileForm from "@/components/ProfileForm";
import { useLanguage } from "@/context/LanguageContext";
import { YemekStickyNotesSection } from "@/components/ui/yemek-program-section";
import { useSubscription } from "@/context/SubscriptionContext";
import { UpgradeModal } from "@/components/ui/upgrade-modal";

export default function YemekPage() {
  const { profil, setProfil, isLoaded } = useProfil();
  const { content: yemekContent, displayContent: yemekDisplayContent, setContent: setYemekProgram, setContentWithTranslations } = useYemekProgram();
  const { t, language } = useLanguage();
  const router = useRouter();
  const hasYemekProgram = yemekContent.trim().length > 0;
  const [kaloriHedefi, setKaloriHedefi] = useState("");
  const [kisitlar, setKisitlar] = useState("");
  const [gunSayisi, setGunSayisi] = useState(3);

  useEffect(() => {
    if (!isLoaded) return;
    if (profil.kisitlar) setKisitlar(profil.kisitlar);
    if (profil.gunSayisi) setGunSayisi(parseInt(profil.gunSayisi, 10) || 7);
  }, [isLoaded, profil.kisitlar, profil.gunSayisi]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { remainingWeeklyMeals, isPro, refreshUsage } = useSubscription();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Client-side limit check for free users
    if (!isPro && remainingWeeklyMeals <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/yemek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kaloriHedefi: kaloriHedefi ? Number(kaloriHedefi) : undefined,
          kisitlar: kisitlar.trim() || "yok",
          gunSayisi,
          profil,
          lang: language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 && data.limitReached) {
          setShowUpgradeModal(true);
          setLoading(false);
          return;
        }
        throw new Error(data.error || t.programs.meal.error);
      }
      const text = data.content || "";
      const srcLang = language as "tr" | "en" | "de" | "ru";
      setYemekProgram(text, srcLang);
      refreshUsage();
      router.push("/dashboard");

      // Translate to all other languages in background (fire & forget)
      const otherLangs = (["tr", "en", "de", "ru"] as const).filter((l) => l !== srcLang);
      fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "meal",
          sourceLang: srcLang,
          content: text,
          targetLangs: otherLangs,
        }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.translations) {
            setContentWithTranslations(text, srcLang, d.translations);
          }
        })
        .catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : t.programs.meal.error);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="create_meal"
      />

      <h1 className="mb-6 text-2xl font-bold text-foreground">
        {t.programs.meal.title}
      </h1>

      {/* Mevcut yemek programi */}
      {hasYemekProgram && (
        <div className="mb-10">
          <YemekStickyNotesSection content={yemekDisplayContent} />
        </div>
      )}

      {/* Yeni program olusturma formu */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            {t.programs.meal.goal}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {t.dashboard.calories}
              </label>
              <input
                type="number"
                min={1000}
                max={5000}
                placeholder="2000"
                value={kaloriHedefi}
                onChange={(e) => setKaloriHedefi(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-foreground"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {t.programs.meal.mealsPerDay}
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={gunSayisi}
                onChange={(e) => setGunSayisi(Number(e.target.value))}
                className="w-full rounded border border-input bg-background px-3 py-2 text-foreground"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-foreground">
                {t.programs.meal.allergies}
              </label>
              <input
                type="text"
                placeholder={t.programs.meal.allergiesPlaceholder}
                value={kisitlar}
                onChange={(e) => setKisitlar(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-foreground"
              />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            {t.nav.profile}
          </h2>
          <ProfileForm profil={profil} onChange={setProfil} compact />
        </div>
        {error && (
          <p className="rounded bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? t.programs.meal.creating : t.programs.meal.createButton}
        </button>
      </form>
    </div>
  );
}
