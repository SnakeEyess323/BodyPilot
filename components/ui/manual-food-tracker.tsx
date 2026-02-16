"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Plus, Trash2, Loader2, UtensilsCrossed, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { getUserStorageJSON, setUserStorageJSON } from "@/lib/user-storage";
import type { OgunTipi } from "@/lib/parseYemekProgram";

// Manuel eklenen yemek tipi
export interface ManuelYemek {
  id: string;
  baslik: string;
  kalori: number;
  protein: number;
  karbonhidrat: number;
  yag: number;
  saat: string; // ekleme saati
}

// Öğün bazlı manuel yemekler
export type ManuelOgunYemekleri = Record<OgunTipi, ManuelYemek[]>;

export const DEFAULT_MANUEL_OGUN: ManuelOgunYemekleri = {
  kahvalti: [],
  ogle: [],
  aksam: [],
  ara: [],
};

// Bugünün tarihini YYYY-MM-DD formatında al
function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

const STORAGE_KEY = "spor-asistan-manuel-ogun-yemekler";

// User-scoped localStorage'dan bugünkü öğün yemeklerini yükle
export function loadManuelOgunYemekler(userId: string): ManuelOgunYemekleri {
  if (!userId) return DEFAULT_MANUEL_OGUN;
  const parsed = getUserStorageJSON<{ tarih: string; ogunler: ManuelOgunYemekleri }>(STORAGE_KEY, userId);
  if (parsed && parsed.tarih === getTodayKey()) {
    return { ...DEFAULT_MANUEL_OGUN, ...parsed.ogunler };
  }
  return DEFAULT_MANUEL_OGUN;
}

// User-scoped localStorage'a kaydet
export function saveManuelOgunYemekler(userId: string, ogunler: ManuelOgunYemekleri) {
  if (!userId) return;
  setUserStorageJSON(STORAGE_KEY, userId, { tarih: getTodayKey(), ogunler });
}

// Öğün renkleri ve ikonları
const OGUN_BUTTON_STYLES: Record<OgunTipi, { bg: string; hover: string; icon: string }> = {
  kahvalti: {
    bg: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200",
    hover: "hover:bg-amber-200 dark:hover:bg-amber-800/60",
    icon: "🌅",
  },
  ogle: {
    bg: "bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200",
    hover: "hover:bg-orange-200 dark:hover:bg-orange-800/60",
    icon: "☀️",
  },
  aksam: {
    bg: "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200",
    hover: "hover:bg-purple-200 dark:hover:bg-purple-800/60",
    icon: "🌙",
  },
  ara: {
    bg: "bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200",
    hover: "hover:bg-teal-200 dark:hover:bg-teal-800/60",
    icon: "🍎",
  },
};

interface ManualFoodTrackerProps {
  embedded?: boolean;
  onAddToOgun?: (ogun: OgunTipi, yemek: ManuelYemek) => void;
}

export function ManualFoodTracker({ embedded = false, onAddToOgun }: ManualFoodTrackerProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingYemek, setPendingYemek] = useState<ManuelYemek | null>(null);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  // Standalone mode state
  const [ogunYemekleri, setOgunYemekleri] = useState<ManuelOgunYemekleri>(DEFAULT_MANUEL_OGUN);
  const [isLoaded, setIsLoaded] = useState(false);

  // User-scoped localStorage'dan yükle (sadece standalone mode)
  useEffect(() => {
    if (!embedded && userId) {
      setOgunYemekleri(loadManuelOgunYemekler(userId));
    } else if (!embedded) {
      setOgunYemekleri(DEFAULT_MANUEL_OGUN);
    }
    setIsLoaded(true);
  }, [embedded, userId]);

  // Öğün butonları için çeviri map'i
  const ogunLabels = useMemo(() => ({
    kahvalti: t.dashboard.addToBreakfast,
    ogle: t.dashboard.addToLunch,
    aksam: t.dashboard.addToDinner,
    ara: t.dashboard.addToSnack,
  }), [t]);

  // Yemek ekle - AI analizi
  const handleAnalyze = useCallback(async () => {
    if (!input.trim() || loading) return;

    setLoading(true);
    setError(null);
    setAddedMessage(null);

    try {
      const res = await fetch("/api/yemek-analiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yemek: input.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.dashboard.manualFoodError);
      }

      const data = await res.json();

      const yeniYemek: ManuelYemek = {
        id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        baslik: data.baslik || input.trim(),
        kalori: data.kalori || 0,
        protein: data.protein || 0,
        karbonhidrat: data.karbonhidrat || 0,
        yag: data.yag || 0,
        saat: new Date().toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setPendingYemek(yeniYemek);
      setInput("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.dashboard.manualFoodError
      );
    } finally {
      setLoading(false);
    }
  }, [input, loading, t]);

  // Enter tuşu
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleAnalyze();
      }
    },
    [handleAnalyze]
  );

  // Öğün seçildiğinde
  const handleOgunSelect = useCallback((ogun: OgunTipi) => {
    if (!pendingYemek) return;

    if (onAddToOgun) {
      // Embedded mode: callback ile parent'a bildir
      onAddToOgun(ogun, pendingYemek);
    } else {
      // Standalone mode: kendi state'ine ekle
      setOgunYemekleri((prev) => {
        const updated = { ...prev, [ogun]: [...prev[ogun], pendingYemek] };
        if (userId) saveManuelOgunYemekler(userId, updated);
        return updated;
      });
    }

    const ogunName = ogunLabels[ogun];
    setAddedMessage(`✓ ${pendingYemek.baslik} - ${ogunName.toLowerCase()} ${t.dashboard.manualFoodAdded}`);
    setPendingYemek(null);

    // Mesajı 3 saniye sonra kaldır
    setTimeout(() => setAddedMessage(null), 3000);
  }, [pendingYemek, onAddToOgun, ogunLabels, t, userId]);

  // Standalone mode: yemek silme
  const handleDeleteFromOgun = useCallback((ogun: OgunTipi, id: string) => {
    setOgunYemekleri((prev) => {
      const updated = { ...prev, [ogun]: prev[ogun].filter((y) => y.id !== id) };
      if (userId) saveManuelOgunYemekler(userId, updated);
      return updated;
    });
  }, [userId]);

  // Standalone mode: toplam besin değerleri
  const standaloneToplamlar = useMemo(() => {
    if (embedded) return { kalori: 0, protein: 0, karbonhidrat: 0, yag: 0 };
    const allYemekler = [
      ...ogunYemekleri.kahvalti,
      ...ogunYemekleri.ogle,
      ...ogunYemekleri.aksam,
      ...ogunYemekleri.ara,
    ];
    return allYemekler.reduce(
      (acc, y) => ({
        kalori: acc.kalori + y.kalori,
        protein: acc.protein + y.protein,
        karbonhidrat: acc.karbonhidrat + y.karbonhidrat,
        yag: acc.yag + y.yag,
      }),
      { kalori: 0, protein: 0, karbonhidrat: 0, yag: 0 }
    );
  }, [embedded, ogunYemekleri]);

  const standaloneHasAny = !embedded && (
    ogunYemekleri.kahvalti.length > 0 ||
    ogunYemekleri.ogle.length > 0 ||
    ogunYemekleri.aksam.length > 0 ||
    ogunYemekleri.ara.length > 0
  );

  if (!isLoaded) return null;

  const inputAndPending = (
    <>
      {/* Input alanı */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={t.dashboard.manualFoodPlaceholder}
          disabled={loading}
          className={cn(
            "flex-1 rounded-lg border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-red-300 dark:border-red-700"
              : "border-border"
          )}
        />
        <button
          onClick={handleAnalyze}
          disabled={!input.trim() || loading}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all",
            "bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">{t.dashboard.manualFoodAnalyzing}</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t.dashboard.manualFoodAdd}</span>
            </>
          )}
        </button>
      </div>

      {/* Hata mesajı */}
      {error && (
        <p className="mb-3 text-xs text-red-500">{error}</p>
      )}

      {/* Başarı mesajı */}
      {addedMessage && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-violet-100 px-3 py-2 text-sm font-medium text-violet-800 dark:bg-violet-900/50 dark:text-violet-300">
          <Check className="h-4 w-4" />
          {addedMessage}
        </div>
      )}

      {/* Bekleyen yemek - öğün seçimi */}
      {pendingYemek && (
        <div className="mb-4 rounded-lg border-2 border-violet-300 bg-violet-50 p-4 dark:border-violet-700 dark:bg-violet-950/50">
          {/* Analiz sonucu */}
          <div className="mb-3">
            <p className="font-semibold text-foreground">{pendingYemek.baslik}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center rounded-full bg-violet-200/80 px-2 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-800/50 dark:text-violet-200">
                🔥 {pendingYemek.kalori} {t.dashboard.manualFoodKcal}
              </span>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                P: {pendingYemek.protein}{t.dashboard.manualFoodGram}
              </span>
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                K: {pendingYemek.karbonhidrat}{t.dashboard.manualFoodGram}
              </span>
              <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                Y: {pendingYemek.yag}{t.dashboard.manualFoodGram}
              </span>
            </div>
          </div>

          {/* Öğün seçme sorusu */}
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            {t.dashboard.manualFoodSelectMeal}
          </p>

          {/* Öğün butonları */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["kahvalti", "ogle", "aksam", "ara"] as OgunTipi[]).map((ogun) => {
              const style = OGUN_BUTTON_STYLES[ogun];
              return (
                <button
                  key={ogun}
                  onClick={() => handleOgunSelect(ogun)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    style.bg,
                    style.hover
                  )}
                >
                  <span>{style.icon}</span>
                  <span className="truncate">{ogunLabels[ogun]}</span>
                </button>
              );
            })}
          </div>

          {/* İptal */}
          <button
            onClick={() => setPendingYemek(null)}
            className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground transition"
          >
            {t.dashboard.clear}
          </button>
        </div>
      )}

      {/* Boş durum (pending yoksa ve embedded modda) */}
      {!pendingYemek && !addedMessage && embedded && (
        <p className="text-center text-sm text-muted-foreground italic py-2">
          {t.dashboard.manualFoodEmpty}
        </p>
      )}
    </>
  );

  // Embedded mode: sadece input + öğün seçimi
  if (embedded) {
    return inputAndPending;
  }

  // Standalone mode: kendi container'ı + öğün bazlı yemek listesi
  return (
    <div className="mb-6 rounded-xl border-2 border-primary/30 bg-primary/5 p-5">
      {/* Başlık */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
          <span>🍽️</span>
          {t.dashboard.todaysMeals}
        </h3>
      </div>

      {inputAndPending}

      {/* Öğün bazlı yemek kartları */}
      {standaloneHasAny && (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(["kahvalti", "ogle", "aksam", "ara"] as OgunTipi[]).map((ogun) => {
              const items = ogunYemekleri[ogun];
              const style = OGUN_BUTTON_STYLES[ogun];
              if (items.length === 0) return null;

              return (
                <div
                  key={ogun}
                  className={cn(
                    "rounded-lg border-2 p-3 transition-all",
                    style.bg.replace("text-", "border-").replace("100", "200").replace("900/60", "800")
                  )}
                >
                  <span className="mb-2 block text-xs font-medium text-muted-foreground">
                    {style.icon} {ogunLabels[ogun]}
                  </span>
                  <div className="space-y-2">
                    {items.map((yemek) => (
                      <div key={yemek.id} className="relative">
                        <button
                          onClick={() => handleDeleteFromOgun(ogun, yemek.id)}
                          className="absolute -right-1 -top-1 rounded-full bg-card p-0.5 text-muted-foreground transition hover:text-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                        <p className="pr-4 text-sm font-medium text-foreground line-clamp-1">
                          {yemek.baslik}
                        </p>
                        <p className="text-xs text-foreground/70">
                          🔥 {yemek.kalori} {t.dashboard.manualFoodKcal}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Toplam */}
          <div className="mt-4 rounded-lg bg-card/70 py-3 px-4">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <div className="text-center">
                <span className="block text-xs text-muted-foreground">{t.dashboard.calories}</span>
                <span className="text-lg font-bold text-primary">
                  {standaloneToplamlar.kalori} {t.dashboard.manualFoodKcal}
                </span>
              </div>
              {standaloneToplamlar.protein > 0 && (
                <div className="text-center">
                  <span className="block text-xs text-muted-foreground">{t.dashboard.protein}</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {standaloneToplamlar.protein}{t.dashboard.manualFoodGram}
                  </span>
                </div>
              )}
              {standaloneToplamlar.karbonhidrat > 0 && (
                <div className="text-center">
                  <span className="block text-xs text-muted-foreground">{t.dashboard.carbs}</span>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {standaloneToplamlar.karbonhidrat}{t.dashboard.manualFoodGram}
                  </span>
                </div>
              )}
              {standaloneToplamlar.yag > 0 && (
                <div className="text-center">
                  <span className="block text-xs text-muted-foreground">{t.dashboard.fat}</span>
                  <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
                    {standaloneToplamlar.yag}{t.dashboard.manualFoodGram}
                  </span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Boş durum */}
      {!standaloneHasAny && !pendingYemek && !addedMessage && (
        <p className="text-center text-sm text-muted-foreground italic py-2">
          {t.dashboard.manualFoodEmpty}
        </p>
      )}
    </div>
  );
}
