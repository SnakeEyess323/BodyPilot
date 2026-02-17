"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useHaftalikProgram } from "@/context/HaftalikProgramContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { parseYemekProgram, gruplaYemekler, type YemekItem, type OgunTipi } from "@/lib/parseYemekProgram";
import { MealSection, OGUN_COLORS, useOgunTitles } from "@/components/ui/meal-sticky-note";
import { type ManuelYemek, type ManuelOgunYemekleri, type PorsiyonBirim, DEFAULT_MANUEL_OGUN, loadManuelOgunYemekler, saveManuelOgunYemekler, BIRIM_KATEGORILERI, BIRIM_TRANSLATION_KEYS } from "@/components/ui/manual-food-tracker";
import { Trash2, Plus, Loader2, Check, X, TableProperties, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type YemekGecmisGun,
  type YemekGecmisGunlukOgun,
  getYemekGecmis,
  saveTodayToYemekGecmis,
  formatDateLabel,
} from "@/lib/yemek-gecmis";
import { getUserStorageJSON, setUserStorageJSON } from "@/lib/user-storage";
import type { GunAdi } from "@/lib/types";

// =============================================================================
// HELPERS
// =============================================================================

const DELETED_MEALS_KEY = "spor-asistan-silinen-yemekler";
const SELECTED_MEALS_KEY = "spor-asistan-bugun-yemekler";

type SeciliYemekler = Record<OgunTipi, string[]>;

const DEFAULT_SECILI: SeciliYemekler = {
  kahvalti: [],
  ogle: [],
  aksam: [],
  ara: [],
};

function loadDeletedMeals(userId: string): string[] {
  if (!userId) return [];
  const raw = getUserStorageJSON<{ tarih: string; ids: string[] } | string[]>(DELETED_MEALS_KEY, userId);
  // Backward compat: old format was just string[]
  if (Array.isArray(raw)) return [];
  if (raw && raw.tarih === getTodayKey()) {
    return raw.ids ?? [];
  }
  return [];
}

function saveDeletedMeals(userId: string, ids: string[]) {
  if (!userId) return;
  setUserStorageJSON(DELETED_MEALS_KEY, userId, { tarih: getTodayKey(), ids });
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadSelectedMeals(userId: string): SeciliYemekler {
  if (!userId) return DEFAULT_SECILI;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = getUserStorageJSON<any>(SELECTED_MEALS_KEY, userId);
  if (!raw) return DEFAULT_SECILI;
  if ("tarih" in raw && "secili" in raw) {
    if (raw.tarih === getTodayKey()) {
      const s = raw.secili;
      // Backward compat: old format had string|null, convert to string[]
      const result: SeciliYemekler = { ...DEFAULT_SECILI };
      for (const ogun of ["kahvalti", "ogle", "aksam", "ara"] as OgunTipi[]) {
        const val = s[ogun];
        if (Array.isArray(val)) {
          result[ogun] = val;
        } else if (typeof val === "string") {
          result[ogun] = [val];
        }
      }
      return result;
    }
    return DEFAULT_SECILI;
  }
  return DEFAULT_SECILI;
}

function saveSelectedMeals(userId: string, selected: SeciliYemekler) {
  if (!userId) return;
  setUserStorageJSON(SELECTED_MEALS_KEY, userId, { tarih: getTodayKey(), secili: selected });
}

function parseMakrolar(makrolarStr?: string): { protein: number; karbonhidrat: number; yag: number } {
  const result = { protein: 0, karbonhidrat: 0, yag: 0 };
  if (!makrolarStr) return result;
  
  const proteinMatch = makrolarStr.match(/protein[:\s]*(\d+)/i);
  const karbMatch = makrolarStr.match(/karbonhidrat[:\s]*(\d+)/i);
  const yagMatch = makrolarStr.match(/ya[ğg][:\s]*(\d+)/i);
  
  if (proteinMatch) result.protein = parseInt(proteinMatch[1], 10);
  if (karbMatch) result.karbonhidrat = parseInt(karbMatch[1], 10);
  if (yagMatch) result.yag = parseInt(yagMatch[1], 10);
  
  return result;
}

// =============================================================================
// YemekGecmisDialog
// =============================================================================

function YemekGecmisDialog({
  open,
  onOpenChange,
  userId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
}) {
  const { t } = useLanguage();
  const [history, setHistory] = useState<YemekGecmisGun[]>([]);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const OGUN_LABELS: Record<OgunTipi, { label: string; icon: string }> = useMemo(() => ({
    kahvalti: { label: t.meals.breakfast, icon: "🌅" },
    ogle: { label: t.meals.lunch, icon: "☀️" },
    aksam: { label: t.meals.dinner, icon: "🌙" },
    ara: { label: t.meals.snack, icon: "🍎" },
  }), [t]);

  useEffect(() => {
    if (open && userId) {
      setHistory(getYemekGecmis(userId));
    }
  }, [open, userId]);

  // Ortalama hesapla
  const averages = useMemo(() => {
    if (history.length === 0) return null;
    const sum = history.reduce(
      (acc, d) => ({
        kalori: acc.kalori + d.toplamlar.kalori,
        protein: acc.protein + d.toplamlar.protein,
        karbonhidrat: acc.karbonhidrat + d.toplamlar.karbonhidrat,
        yag: acc.yag + d.toplamlar.yag,
      }),
      { kalori: 0, protein: 0, karbonhidrat: 0, yag: 0 }
    );
    const n = history.length;
    return {
      kalori: Math.round(sum.kalori / n),
      protein: Math.round(sum.protein / n),
      karbonhidrat: Math.round(sum.karbonhidrat / n),
      yag: Math.round(sum.yag / n),
    };
  }, [history]);

  // Trend ikonu: bugunku deger vs ortalama
  function getTrendIcon(current: number, avg: number) {
    if (avg === 0) return null;
    const diff = ((current - avg) / avg) * 100;
    if (diff > 10) return <TrendingUp className="h-3 w-3 text-red-500" />;
    if (diff < -10) return <TrendingDown className="h-3 w-3 text-violet-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TableProperties className="h-5 w-5 text-primary" />
            {t.extra.nutritionHistory}
          </DialogTitle>
        </DialogHeader>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <TableProperties className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Henüz beslenme geçmişi yok</p>
            <p className="text-xs mt-1">Yemek ekledikçe burada görünecek</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {/* Ortalama ozet */}
            {averages && (
              <div className="mb-4 rounded-xl bg-gradient-to-r from-primary/5 via-blue-500/5 to-violet-500/5 border border-primary/20 p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Son {history.length} Gün Ortalaması
                </p>
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center">
                    <span className="block text-lg font-bold text-primary">{averages.kalori}</span>
                    <span className="text-[10px] text-muted-foreground">kcal</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-lg font-bold text-blue-600 dark:text-blue-400">{averages.protein}g</span>
                    <span className="text-[10px] text-muted-foreground">Protein</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-lg font-bold text-amber-600 dark:text-amber-400">{averages.karbonhidrat}g</span>
                    <span className="text-[10px] text-muted-foreground">Karb</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-lg font-bold text-rose-600 dark:text-rose-400">{averages.yag}g</span>
                    <span className="text-[10px] text-muted-foreground">Yağ</span>
                  </div>
                </div>
              </div>
            )}

            {/* Gunluk tablo */}
            <div className="space-y-2">
              {history.map((day) => {
                const isExpanded = expandedDay === day.tarih;
                const isToday = day.tarih === new Date().toISOString().slice(0, 10);

                return (
                  <div
                    key={day.tarih}
                    className={cn(
                      "rounded-xl border transition-all",
                      isToday
                        ? "border-primary/30 bg-primary/5"
                        : "border-border bg-card"
                    )}
                  >
                    {/* Gun baslik satiri */}
                    <button
                      onClick={() => setExpandedDay(isExpanded ? null : day.tarih)}
                      className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors rounded-xl"
                    >
                      <div className="flex items-center gap-2">
                        {isToday && (
                          <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                        )}
                        <span className={cn(
                          "text-sm font-semibold",
                          isToday ? "text-primary" : "text-foreground"
                        )}>
                          {formatDateLabel(day.tarih)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Makro degerleri */}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-foreground flex items-center gap-0.5">
                            {day.toplamlar.kalori} <span className="text-muted-foreground font-normal">kcal</span>
                            {averages && getTrendIcon(day.toplamlar.kalori, averages.kalori)}
                          </span>
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            P:{day.toplamlar.protein}g
                          </span>
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            K:{day.toplamlar.karbonhidrat}g
                          </span>
                          <span className="text-rose-600 dark:text-rose-400 font-medium">
                            Y:{day.toplamlar.yag}g
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Detay: ogun bazli yemekler */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-border/50">
                        {(["kahvalti", "ogle", "aksam", "ara"] as OgunTipi[]).map((ogun) => {
                          const items = day.ogunler[ogun];
                          if (!items || items.length === 0) return null;
                          const lbl = OGUN_LABELS[ogun];
                          return (
                            <div key={ogun} className="mb-2 last:mb-0">
                              <p className="text-xs font-semibold text-muted-foreground mb-1">
                                {lbl.icon} {lbl.label}
                              </p>
                              {items.map((item, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between py-1 pl-4 text-xs"
                                >
                                  <span className="text-foreground truncate max-w-[200px]">
                                    {item.baslik}
                                  </span>
                                  <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
                                    <span>{item.kalori} kcal</span>
                                    <span className="text-blue-600 dark:text-blue-400">P:{item.protein}g</span>
                                    <span className="text-amber-600 dark:text-amber-400">K:{item.karbonhidrat}g</span>
                                    <span className="text-rose-600 dark:text-rose-400">Y:{item.yag}g</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// BugunYiyeceklerimSection
// =============================================================================

function BugunYiyeceklerimSection({
  seciliYemekler,
  allYemekler,
  onClear,
  onRemove,
  userId,
}: {
  seciliYemekler: SeciliYemekler;
  allYemekler: YemekItem[];
  onClear: () => void;
  onRemove: (ogun: OgunTipi, id: string) => void;
  userId: string;
}) {
  const { t } = useLanguage();

  const [addFormOpen, setAddFormOpen] = useState(false);
  const [addInput, setAddInput] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [pendingYemek, setPendingYemek] = useState<ManuelYemek | null>(null);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);
  const [gecmisOpen, setGecmisOpen] = useState(false);
  const [portionAmount, setPortionAmount] = useState<number>(1);
  const [portionUnit, setPortionUnit] = useState<PorsiyonBirim>("porsiyon");
  const [showAllUnits, setShowAllUnits] = useState(false);

  const [manuelOgunYemekleri, setManuelOgunYemekleri] = useState<ManuelOgunYemekleri>(DEFAULT_MANUEL_OGUN);
  const [manuelLoaded, setManuelLoaded] = useState(false);

  useEffect(() => {
    if (userId) {
      setManuelOgunYemekleri(loadManuelOgunYemekler(userId));
    } else {
      setManuelOgunYemekleri(DEFAULT_MANUEL_OGUN);
    }
    setManuelLoaded(true);
  }, [userId]);

  const handleAddManuelToOgun = useCallback((ogun: OgunTipi) => {
    if (!pendingYemek) return;
    setManuelOgunYemekleri((prev) => {
      const updated = { ...prev, [ogun]: [...prev[ogun], pendingYemek] };
      if (userId) saveManuelOgunYemekler(userId, updated);
      return updated;
    });
    const ogunNames: Record<OgunTipi, string> = {
      kahvalti: t.meals.breakfast,
      ogle: t.meals.lunch,
      aksam: t.meals.dinner,
      ara: t.meals.snack,
    };
    setAddedMessage(`✓ ${pendingYemek.baslik} → ${ogunNames[ogun]}`);
    setPendingYemek(null);
    setTimeout(() => setAddedMessage(null), 3000);
  }, [pendingYemek, t, userId]);

  const handleDeleteManuel = useCallback((ogun: OgunTipi, id: string) => {
    setManuelOgunYemekleri((prev) => {
      const updated = { ...prev, [ogun]: prev[ogun].filter((y) => y.id !== id) };
      if (userId) saveManuelOgunYemekler(userId, updated);
      return updated;
    });
  }, [userId]);

  const handleAnalyze = useCallback(async () => {
    if (!addInput.trim() || addLoading) return;
    setAddLoading(true);
    setAddError(null);
    setAddedMessage(null);
    try {
      const res = await fetch("/api/yemek-analiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yemek: addInput.trim(), miktar: portionAmount, birim: portionUnit }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.dashboard.manualFoodError);
      }
      const data = await res.json();
      setPendingYemek({
        id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        baslik: data.baslik || addInput.trim(),
        kalori: data.kalori || 0,
        protein: data.protein || 0,
        karbonhidrat: data.karbonhidrat || 0,
        yag: data.yag || 0,
        saat: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        miktar: portionAmount,
        birim: portionUnit,
      });
      setAddInput("");
    } catch (err) {
      setAddError(err instanceof Error ? err.message : t.dashboard.manualFoodError);
    } finally {
      setAddLoading(false);
    }
  }, [addInput, addLoading, t, portionAmount, portionUnit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAnalyze(); }
  }, [handleAnalyze]);

  const seciliItems = useMemo(() => {
    const result: Record<OgunTipi, YemekItem[]> = { kahvalti: [], ogle: [], aksam: [], ara: [] };
    for (const ogun of ["kahvalti", "ogle", "aksam", "ara"] as OgunTipi[]) {
      const ids = seciliYemekler[ogun];
      result[ogun] = ids.map((id) => allYemekler.find((y) => y.id === id)).filter(Boolean) as YemekItem[];
    }
    return result;
  }, [seciliYemekler, allYemekler]);

  const toplamlar = useMemo(() => {
    let kalori = 0, protein = 0, karbonhidrat = 0, yag = 0;
    for (const ogun of ["kahvalti", "ogle", "aksam", "ara"] as OgunTipi[]) {
      for (const item of seciliItems[ogun]) {
        if (item.kalori) { const m = item.kalori.match(/(\d+)/); if (m) kalori += parseInt(m[1], 10); }
        if (item.makrolar) { const mk = parseMakrolar(item.makrolar); protein += mk.protein; karbonhidrat += mk.karbonhidrat; yag += mk.yag; }
      }
      for (const my of manuelOgunYemekleri[ogun]) { kalori += my.kalori; protein += my.protein; karbonhidrat += my.karbonhidrat; yag += my.yag; }
    }
    return { kalori, protein, karbonhidrat, yag };
  }, [seciliItems, manuelOgunYemekleri]);

  const hasAnySelection = Object.values(seciliYemekler).some((arr) => arr.length > 0);
  const hasAnyManuel = Object.values(manuelOgunYemekleri).some((arr) => arr.length > 0);
  const hasAnything = hasAnySelection || hasAnyManuel;

  // Gecmise kaydet (toplamlar degistiginde)
  useEffect(() => {
    if (!hasAnything) return;
    // Ogunleri gecmis formatina cevir
    const ogunlerForHistory: Record<OgunTipi, YemekGecmisGunlukOgun[]> = {
      kahvalti: [], ogle: [], aksam: [], ara: [],
    };
    for (const ogun of ["kahvalti", "ogle", "aksam", "ara"] as OgunTipi[]) {
      for (const aiItem of seciliItems[ogun]) {
        const mk = aiItem.makrolar ? parseMakrolar(aiItem.makrolar) : { protein: 0, karbonhidrat: 0, yag: 0 };
        const kal = aiItem.kalori ? parseInt(aiItem.kalori.match(/(\d+)/)?.[1] || "0", 10) : 0;
        ogunlerForHistory[ogun].push({
          baslik: aiItem.baslik,
          kalori: kal,
          protein: mk.protein,
          karbonhidrat: mk.karbonhidrat,
          yag: mk.yag,
        });
      }
      for (const my of manuelOgunYemekleri[ogun]) {
        ogunlerForHistory[ogun].push({
          baslik: my.baslik,
          kalori: my.kalori,
          protein: my.protein,
          karbonhidrat: my.karbonhidrat,
          yag: my.yag,
        });
      }
    }
    if (userId) saveTodayToYemekGecmis(userId, ogunlerForHistory, toplamlar);
  }, [userId, toplamlar, hasAnything, seciliItems, manuelOgunYemekleri]);

  const ogunler: { key: OgunTipi; label: string; icon: string }[] = [
    { key: "kahvalti", label: t.meals.breakfast, icon: "🌅" },
    { key: "ogle", label: t.meals.lunch, icon: "☀️" },
    { key: "aksam", label: t.meals.dinner, icon: "🌙" },
    { key: "ara", label: t.meals.snack, icon: "🍎" },
  ];

  const OGUN_BTN: Record<OgunTipi, { bg: string; hover: string }> = {
    kahvalti: { bg: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200", hover: "hover:bg-amber-200 dark:hover:bg-amber-800/60" },
    ogle: { bg: "bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200", hover: "hover:bg-orange-200 dark:hover:bg-orange-800/60" },
    aksam: { bg: "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200", hover: "hover:bg-purple-200 dark:hover:bg-purple-800/60" },
    ara: { bg: "bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200", hover: "hover:bg-teal-200 dark:hover:bg-teal-800/60" },
  };

  return (
    <div className="mb-6 rounded-xl border-2 border-primary/30 bg-primary/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
          <span>🍽️</span>
          {t.dashboard.todaysMeals}
        </h3>
        <div className="flex items-center gap-2">
          {(hasAnySelection || hasAnyManuel) && (
            <button
              onClick={() => { onClear(); setManuelOgunYemekleri(DEFAULT_MANUEL_OGUN); if (userId) saveManuelOgunYemekler(userId, DEFAULT_MANUEL_OGUN); }}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-card hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t.dashboard.clear}
            </button>
          )}
          <button
            onClick={() => { setAddFormOpen(!addFormOpen); setPendingYemek(null); setAddError(null); setAddedMessage(null); }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              addFormOpen
                ? "bg-muted text-foreground"
                : "bg-violet-600 text-white hover:bg-violet-700"
            )}
          >
            {addFormOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {addFormOpen ? t.dashboard.clear : t.dashboard.manualFoodAdd}
          </button>
          <button
            onClick={() => setGecmisOpen(true)}
            className="inline-flex items-center justify-center rounded-lg p-1.5 text-muted-foreground transition hover:bg-card hover:text-primary"
            title="Beslenme Geçmişi"
          >
            <TableProperties className="h-4 w-4" />
          </button>
        </div>
      </div>

      {addFormOpen && (
        <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-800 dark:bg-violet-950/30">
          {/* Yemek adı girişi */}
          <div className="flex gap-2">
            <input
              type="text"
              value={addInput}
              onChange={(e) => { setAddInput(e.target.value); if (addError) setAddError(null); }}
              onKeyDown={handleKeyDown}
              placeholder={t.dashboard.manualFoodPlaceholder}
              disabled={addLoading}
              className={cn(
                "flex-1 rounded-lg border bg-background px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400",
                "disabled:cursor-not-allowed disabled:opacity-50",
                addError ? "border-red-300 dark:border-red-700" : "border-border"
              )}
            />
            <button
              onClick={handleAnalyze}
              disabled={!addInput.trim() || addLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span className="hidden sm:inline">{addLoading ? t.dashboard.manualFoodAnalyzing : t.dashboard.manualFoodAdd}</span>
            </button>
          </div>

          {/* Porsiyon seçimi */}
          <div className="mt-3 rounded-lg border border-violet-100 bg-white/60 p-3 dark:border-violet-900 dark:bg-violet-950/20">
            <p className="mb-2 text-sm font-semibold text-muted-foreground">📏 {t.dashboard.portionLabel}</p>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="flex items-center rounded-lg border border-border bg-background">
                <button
                  onClick={() => setPortionAmount(Math.max(0.5, portionAmount - 0.5))}
                  className="px-3 py-2 text-base font-bold text-muted-foreground hover:text-foreground transition rounded-l-lg hover:bg-muted"
                  disabled={portionAmount <= 0.5}
                >
                  −
                </button>
                <input
                  type="number"
                  value={portionAmount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) setPortionAmount(val);
                  }}
                  className="w-16 border-x border-border bg-transparent px-1 py-2 text-center text-base font-semibold text-foreground focus:outline-none"
                  min="0.5"
                  step="0.5"
                />
                <button
                  onClick={() => setPortionAmount(portionAmount + 0.5)}
                  className="px-3 py-2 text-base font-bold text-muted-foreground hover:text-foreground transition rounded-r-lg hover:bg-muted"
                >
                  +
                </button>
              </div>
              <div className="flex gap-1">
                {[0.5, 1, 1.5, 2, 3].map((val) => (
                  <button
                    key={val}
                    onClick={() => setPortionAmount(val)}
                    className={cn(
                      "rounded-md px-2.5 py-2 text-sm font-medium transition-all",
                      portionAmount === val
                        ? "bg-violet-600 text-white shadow-sm"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(showAllUnits ? BIRIM_KATEGORILERI : BIRIM_KATEGORILERI.slice(0, 8)).map(({ key, icon }) => {
                const translationKey = BIRIM_TRANSLATION_KEYS[key] as keyof typeof t.dashboard;
                const label = t.dashboard[translationKey] || key;
                return (
                  <button
                    key={key}
                    onClick={() => setPortionUnit(key)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                      portionUnit === key
                        ? "bg-violet-600 text-white shadow-sm ring-2 ring-violet-300 dark:ring-violet-700"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span>{icon}</span>
                    {label}
                  </button>
                );
              })}
              <button
                onClick={() => setShowAllUnits(!showAllUnits)}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-violet-600 hover:bg-violet-100 dark:text-violet-400 dark:hover:bg-violet-900/30 transition-all"
              >
                {showAllUnits ? "▲ Daha az" : `▼ +${BIRIM_KATEGORILERI.length - 8}`}
              </button>
            </div>
          </div>

          {addError && <p className="mt-2 text-xs text-red-500">{addError}</p>}

          {addedMessage && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-violet-100 px-3 py-2 text-sm font-medium text-violet-800 dark:bg-violet-900/50 dark:text-violet-300">
              <Check className="h-4 w-4 flex-shrink-0" />
              {addedMessage}
            </div>
          )}

          {pendingYemek && (
            <div className="mt-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{pendingYemek.baslik}</span>
                {pendingYemek.miktar && pendingYemek.birim && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
                    📏 {pendingYemek.miktar} {t.dashboard[BIRIM_TRANSLATION_KEYS[pendingYemek.birim] as keyof typeof t.dashboard]}
                  </span>
                )}
                <span className="rounded-full bg-violet-200/80 px-2 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-800/50 dark:text-violet-200">
                  🔥 {pendingYemek.kalori} kcal
                </span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  P: {pendingYemek.protein}g
                </span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  K: {pendingYemek.karbonhidrat}g
                </span>
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                  Y: {pendingYemek.yag}g
                </span>
              </div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {t.dashboard.manualFoodSelectMeal}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ogunler.map(({ key, icon }) => (
                  <button
                    key={key}
                    onClick={() => handleAddManuelToOgun(key)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                      OGUN_BTN[key].bg, OGUN_BTN[key].hover
                    )}
                  >
                    <span>{icon}</span>
                    {t.dashboard[`addTo${key === "kahvalti" ? "Breakfast" : key === "ogle" ? "Lunch" : key === "aksam" ? "Dinner" : "Snack"}` as keyof typeof t.dashboard]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ogunler.map(({ key, label, icon }) => {
          const aiItems = seciliItems[key];
          const manuelItems = manuelLoaded ? manuelOgunYemekleri[key] : [];
          const colors = OGUN_COLORS[key];
          const hasContent = aiItems.length > 0 || manuelItems.length > 0;

          return (
            <div
              key={key}
              className={cn(
                "relative rounded-lg border-2 p-3 transition-all",
                hasContent
                  ? `${colors.bg} ${colors.border}`
                  : "border-dashed border-border bg-card/50"
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {icon} {label}
                </span>
              </div>

              {aiItems.length > 0 && (
                <div className="space-y-1 mb-1">
                  {aiItems.map((aiItem) => (
                    <div key={aiItem.id} className="group flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground line-clamp-1">{aiItem.baslik}</p>
                        {aiItem.kalori && <p className="text-xs text-foreground/80">🔥 {aiItem.kalori}</p>}
                      </div>
                      <button
                        onClick={() => onRemove(key, aiItem.id)}
                        className="mt-0.5 flex-shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {manuelItems.length > 0 && (
                <div className={cn(aiItems.length > 0 ? "mt-2 border-t border-current/10 pt-2" : "")}>
                  {manuelItems.map((my) => (
                    <div key={my.id} className="group flex items-start justify-between gap-1 mb-1 last:mb-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground line-clamp-1">{my.baslik}</p>
                        <p className="text-xs text-foreground/70">
                          {my.miktar && my.birim && (
                            <span className="mr-1">📏 {my.miktar} {t.dashboard[BIRIM_TRANSLATION_KEYS[my.birim] as keyof typeof t.dashboard]} ·</span>
                          )}
                          🔥 {my.kalori} kcal · P:{my.protein}g · K:{my.karbonhidrat}g
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteManuel(key, my.id)}
                        className="mt-0.5 flex-shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!hasContent && (
                <p className="text-sm text-muted-foreground italic">{t.dashboard.selectFromBelow}</p>
              )}
            </div>
          );
        })}
      </div>

      {toplamlar.kalori > 0 && (
        <div className="mt-4 rounded-lg bg-card/70 py-3 px-4">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <div className="text-center">
              <span className="block text-xs text-muted-foreground">{t.dashboard.calories}</span>
              <span className="text-lg font-bold text-primary">~{toplamlar.kalori} kcal</span>
            </div>
            {toplamlar.protein > 0 && (
              <div className="text-center">
                <span className="block text-xs text-muted-foreground">{t.dashboard.protein}</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{toplamlar.protein}g</span>
              </div>
            )}
            {toplamlar.karbonhidrat > 0 && (
              <div className="text-center">
                <span className="block text-xs text-muted-foreground">{t.dashboard.carbs}</span>
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{toplamlar.karbonhidrat}g</span>
              </div>
            )}
            {toplamlar.yag > 0 && (
              <div className="text-center">
                <span className="block text-xs text-muted-foreground">{t.dashboard.fat}</span>
                <span className="text-lg font-bold text-rose-600 dark:text-rose-400">{toplamlar.yag}g</span>
              </div>
            )}
          </div>
        </div>
      )}

      {!hasAnything && (
        <p className="mt-3 text-center text-xs text-muted-foreground">{t.dashboard.selectMealsNote}</p>
      )}

      {/* Gecmis Dialog */}
      <YemekGecmisDialog open={gecmisOpen} onOpenChange={setGecmisOpen} userId={userId} />
    </div>
  );
}

// =============================================================================
// YemekStickyNotesSection (Main Export)
// =============================================================================

export function YemekStickyNotesSection({ content }: { content: string }) {
  const { program, setGun } = useHaftalikProgram();
  const { t } = useLanguage();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const ogunTitles = useOgunTitles();
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [seciliYemekler, setSeciliYemekler] = useState<SeciliYemekler>(DEFAULT_SECILI);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (userId) {
      setDeletedIds(loadDeletedMeals(userId));
      setSeciliYemekler(loadSelectedMeals(userId));
    } else {
      setDeletedIds([]);
      setSeciliYemekler(DEFAULT_SECILI);
    }
    setIsLoaded(true);
  }, [userId]);

  useEffect(() => {
    if (isLoaded && userId) {
      setDeletedIds([]);
      saveDeletedMeals(userId, []);
      setSeciliYemekler(DEFAULT_SECILI);
      saveSelectedMeals(userId, DEFAULT_SECILI);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const allYemekler = useMemo(() => parseYemekProgram(content), [content]);
  
  const yemekler = useMemo(
    () => allYemekler.filter((y) => !deletedIds.includes(y.id)),
    [allYemekler, deletedIds]
  );
  
  const gruplar = useMemo(() => gruplaYemekler(yemekler), [yemekler]);

  const handleDelete = useCallback((id: string) => {
    setDeletedIds((prev) => {
      const next = [...prev, id];
      if (userId) saveDeletedMeals(userId, next);
      return next;
    });
    setSeciliYemekler((prev) => {
      const updated = { ...prev };
      for (const ogun of ["kahvalti", "ogle", "aksam", "ara"] as OgunTipi[]) {
        updated[ogun] = prev[ogun].filter((sid) => sid !== id);
      }
      if (userId) saveSelectedMeals(userId, updated);
      return updated;
    });
  }, [userId]);

  const handleAddToCalendar = useCallback((item: YemekItem, gun: GunAdi) => {
    const mevcutIcerik = program[gun] || "";
    const yeniIcerik = mevcutIcerik
      ? `${mevcutIcerik}\n\n🍽️ ${item.baslik}${item.kalori ? ` (${item.kalori})` : ""}`
      : `🍽️ ${item.baslik}${item.kalori ? ` (${item.kalori})` : ""}`;
    setGun(gun, yeniIcerik);
  }, [program, setGun]);

  const handleSelect = useCallback((item: YemekItem) => {
    setSeciliYemekler((prev) => {
      const current = prev[item.ogun];
      const isAlreadySelected = current.includes(item.id);
      const updated = {
        ...prev,
        [item.ogun]: isAlreadySelected
          ? current.filter((id) => id !== item.id)
          : [...current, item.id],
      };
      if (userId) saveSelectedMeals(userId, updated);
      return updated;
    });
  }, [userId]);

  const handleRemoveSelection = useCallback((ogun: OgunTipi, id: string) => {
    setSeciliYemekler((prev) => {
      const updated = { ...prev, [ogun]: prev[ogun].filter((sid) => sid !== id) };
      if (userId) saveSelectedMeals(userId, updated);
      return updated;
    });
  }, [userId]);

  const handleClearAll = useCallback(() => {
    setSeciliYemekler(DEFAULT_SECILI);
    if (userId) saveSelectedMeals(userId, DEFAULT_SECILI);
  }, [userId]);

  if (allYemekler.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <div className="mb-4 text-4xl">🍽️</div>
        <p className="mb-4 text-muted-foreground">
          {t.dashboard.noMealProgram}
        </p>
        <Link
          href="/program/yemek"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          {t.dashboard.createMealProgram}
        </Link>
      </div>
    );
  }

  if (yemekler.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <div className="mb-4 text-4xl">🗑️</div>
        <p className="mb-4 text-muted-foreground">
          {t.dashboard.allDeleted}
        </p>
        <Link
          href="/program/yemek"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          {t.dashboard.createMealProgram}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BugunYiyeceklerimSection
        seciliYemekler={seciliYemekler}
        allYemekler={allYemekler}
        onClear={handleClearAll}
        onRemove={handleRemoveSelection}
        userId={userId}
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MealSection
            title={ogunTitles.kahvalti}
            items={gruplar.kahvalti}
            ogun="kahvalti"
            onDelete={handleDelete}
            onAddToCalendar={handleAddToCalendar}
            onSelect={handleSelect}
            selectedIds={seciliYemekler.kahvalti}
          />
          <MealSection
            title={ogunTitles.ogle}
            items={gruplar.ogle}
            ogun="ogle"
            onDelete={handleDelete}
            onAddToCalendar={handleAddToCalendar}
            onSelect={handleSelect}
            selectedIds={seciliYemekler.ogle}
          />
          <MealSection
            title={ogunTitles.aksam}
            items={gruplar.aksam}
            ogun="aksam"
            onDelete={handleDelete}
            onAddToCalendar={handleAddToCalendar}
            onSelect={handleSelect}
            selectedIds={seciliYemekler.aksam}
          />
          <MealSection
            title={ogunTitles.ara}
            items={gruplar.ara}
            ogun="ara"
            onDelete={handleDelete}
            onAddToCalendar={handleAddToCalendar}
            onSelect={handleSelect}
            selectedIds={seciliYemekler.ara}
          />
        </div>
        <p className="mt-6 text-xs text-muted-foreground text-center">
          {t.dashboard.mealSelectNote}
        </p>
      </div>
    </div>
  );
}
