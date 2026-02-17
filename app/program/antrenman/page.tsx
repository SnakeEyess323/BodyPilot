"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useProfil } from "@/context/ProfilContext";
import { useHaftalikProgram } from "@/context/HaftalikProgramContext";
import { useAuth } from "@/context/AuthContext";
import { parseProgramToDays, saveKaloriler } from "@/lib/parseProgram";
import ProfileForm from "@/components/ProfileForm";
import { useLanguage } from "@/context/LanguageContext";
import { saveCurrentWeekToHistory } from "@/lib/antrenman-gecmis";
import type { HaftalikProgram } from "@/lib/types";
import { WorkoutStickyNotes } from "@/components/ui/workout-sticky-notes";
import { AntrenmanGecmis } from "@/components/ui/antrenman-gecmis";
import { DualViewMuscleMap, getMuscleById, type MuscleId } from "@/components/ui/muscle-map";
import { Target, ChevronDown, ChevronUp } from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";
import { UpgradeModal } from "@/components/ui/upgrade-modal";

const HEDEF_LABELS: Record<string, string> = {
  genel_fitness: "genel fitness",
  kilo_verme: "kilo verme",
  kas: "kas kütlesi",
  dayaniklilik: "dayanıklılık",
  yag_yakmak: "yağ yakmak",
  kas_yapmak: "kas yapmak",
  sikilasmak: "sıkılaşmak",
  kilo_almak: "kilo almak",
  postur_duzeltmek: "postür düzeltmek",
  kondisyon_artirmak: "kondisyon artırmak",
  genel_saglikli_yasam: "genel sağlıklı yaşam",
};

export default function AntrenmanPage() {
  const { profil, setProfil, isLoaded } = useProfil();
  const { program, setProgram } = useHaftalikProgram();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { t, language } = useLanguage();
  const router = useRouter();
  const [hedef, setHedef] = useState("genel fitness");
  const [seviye, setSeviye] = useState("orta");
  const [gunSayisi, setGunSayisi] = useState(3);
  const [ortam, setOrtam] = useState("salon");
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleId[]>([]);
  const [muscleMapOpen, setMuscleMapOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [showCopyConfirm, setShowCopyConfirm] = useState(false);
  const [pendingCopyProgram, setPendingCopyProgram] = useState<Record<string, string> | null>(null);
  const { remainingWeeklyWorkouts, isPro, refreshUsage } = useSubscription();

  const hasWorkoutProgram = useMemo(
    () => Object.values(program).some((v) => v && v.trim() !== ""),
    [program]
  );

  useEffect(() => {
    if (!isLoaded) return;
    if (profil.hedef && profil.hedef.length > 0) {
      const hedefListesi = profil.hedef.map((h) => HEDEF_LABELS[h] || h).join(", ");
      setHedef(hedefListesi);
    } else {
      setHedef("genel fitness");
    }
    setSeviye(profil.seviye ?? "orta");
    setGunSayisi(profil.gunSayisi ? parseInt(profil.gunSayisi, 10) || 3 : 3);
    setOrtam(profil.ortam ?? "salon");
  }, [isLoaded, profil.hedef, profil.seviye, profil.gunSayisi, profil.ortam]);

  const handleCopyWeek = useCallback((weekProgram: Record<string, string>) => {
    if (hasWorkoutProgram) {
      setPendingCopyProgram(weekProgram);
      setShowCopyConfirm(true);
    } else {
      setProgram(weekProgram as HaftalikProgram);
      setHistoryRefresh((c) => c + 1);
    }
  }, [hasWorkoutProgram, setProgram]);

  function applyCopyWeek() {
    if (pendingCopyProgram) {
      setProgram(pendingCopyProgram as HaftalikProgram);
      setHistoryRefresh((c) => c + 1);
    }
    setShowCopyConfirm(false);
    setPendingCopyProgram(null);
  }

  async function createProgram() {
    setError("");
    setLoading(true);
    try {
      const hedefKaslar = selectedMuscles.map((id) => {
        const muscle = getMuscleById(id);
        return muscle?.name.tr || id;
      });

      const res = await fetch("/api/antrenman", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hedef,
          seviye,
          gunSayisi,
          ortam,
          profil,
          hedefKaslar: hedefKaslar.length > 0 ? hedefKaslar : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 && data.limitReached) {
          setShowUpgradeModal(true);
          setLoading(false);
          return;
        }
        throw new Error(data.error || t.programs.workout.error);
      }
      const text = data.content || "";
      const { program: parsed, kaloriler } = parseProgramToDays(text);
      setProgram(parsed);
      if (userId) {
        saveKaloriler(userId, kaloriler);
        saveCurrentWeekToHistory(userId);
      }
      refreshUsage();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.programs.workout.error);
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Client-side limit check for free users
    if (!isPro && remainingWeeklyWorkouts <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    // If there's already a workout program, ask for confirmation
    if (hasWorkoutProgram) {
      setShowReplaceConfirm(true);
      return;
    }

    // No existing program, create directly
    await createProgram();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="create_workout"
      />

      {/* Mevcut programı değiştirme onay modalı */}
      {showReplaceConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Şu anki programı değiştirelim mi?
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Zaten bir haftalık antrenman programınız var. Yeni bir program oluşturursanız mevcut program değiştirilecek.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowReplaceConfirm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowReplaceConfirm(false);
                  await createProgram();
                }}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Evet, Değiştir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Geçmiş haftayı kopyalama onay modalı */}
      {showCopyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Şu anki programı değiştirelim mi?
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Zaten bir haftalık antrenman programınız var. Geçmiş haftanın programını kopyalarsanız mevcut program değiştirilecek.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCopyConfirm(false);
                  setPendingCopyProgram(null);
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={applyCopyWeek}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Evet, Kopyala
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="mb-6 text-2xl font-bold text-foreground">
        {t.programs.workout.title}
      </h1>

      {/* Mevcut program: Sticky Notes + Gecmis */}
      {hasWorkoutProgram && (
        <div className="mb-10 space-y-6">
          <WorkoutStickyNotes
            program={program}
            onComplete={() => setHistoryRefresh((c) => c + 1)}
          />
          <AntrenmanGecmis refreshTrigger={historyRefresh} onCopyWeek={handleCopyWeek} />
        </div>
      )}

      {/* Yeni program olusturma formu */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Antrenman ayarlari */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            {t.programs.workout.goal}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {t.programs.workout.goal}
              </label>
              <select
                value={hedef}
                onChange={(e) => setHedef(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-foreground"
              >
                <option value="genel fitness">{t.programs.workout.goalOptions.fitness}</option>
                <option value="kilo verme">{t.programs.workout.goalOptions.fatLoss}</option>
                <option value="kas kütlesi">{t.programs.workout.goalOptions.muscle}</option>
                <option value="dayanıklılık">{t.programs.workout.goalOptions.strength}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {t.programs.workout.level}
              </label>
              <select
                value={seviye}
                onChange={(e) => setSeviye(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-foreground"
              >
                <option value="baslangic">{t.programs.workout.levelOptions.beginner}</option>
                <option value="orta">{t.programs.workout.levelOptions.intermediate}</option>
                <option value="ileri">{t.programs.workout.levelOptions.advanced}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {t.programs.workout.daysPerWeek}
              </label>
              <input
                type="number"
                min={1}
                max={7}
                value={gunSayisi}
                onChange={(e) => setGunSayisi(Number(e.target.value))}
                className="w-full rounded border border-input bg-background px-3 py-2 text-foreground"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {t.programs.workout.environment}
              </label>
              <select
                value={ortam}
                onChange={(e) => setOrtam(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-foreground"
              >
                <option value="ev">{t.programs.workout.environmentOptions.home}</option>
                <option value="salon">{t.programs.workout.environmentOptions.gym}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Kas Secimi - Acilir/Kapanir DualViewMuscleMap */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setMuscleMapOpen(!muscleMapOpen)}
            className="w-full flex items-center justify-between gap-3 p-6 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-semibold text-foreground">
                  Hedef Kas Grupları
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedMuscles.length > 0
                    ? `${selectedMuscles.length} kas grubu seçildi`
                    : "Opsiyonel - Belirli kaslara odaklanmak için seçin"}
                </p>
              </div>
            </div>
            {muscleMapOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {muscleMapOpen && (
            <div className="px-6 pb-6 border-t border-border pt-4">
              <DualViewMuscleMap
                selectedMuscles={selectedMuscles}
                onSelectionChange={setSelectedMuscles}
                language={language}
              />
            </div>
          )}
        </div>

        {/* Profil */}
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
          {loading
            ? t.programs.workout.creating
            : selectedMuscles.length > 0
              ? `${t.programs.workout.createButton} (${selectedMuscles.length} kas grubu)`
              : t.programs.workout.createButton}
        </button>
      </form>
    </div>
  );
}
