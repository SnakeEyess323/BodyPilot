"use client";

import { useState, useMemo } from "react";
import { Trophy, TrendingUp, ChevronDown, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import {
  type GunlukAntrenman,
  type KisiselRekor,
  type KasGrubu,
  KAS_GRUBU_LABELS,
  KAS_GRUBU_ICONS,
  getKisiselRekorlar,
  getHareketGecmis,
  getTumHareketAdlari,
  formatTarih,
} from "@/lib/kilo-takip";

interface KiloTakipIlerlemeProps {
  data: GunlukAntrenman[];
}

export function KiloTakipIlerleme({ data }: KiloTakipIlerlemeProps) {
  const { t, language } = useLanguage();
  const wt = t.weightTracking;
  const kasGrubuLabels = KAS_GRUBU_LABELS[language] || KAS_GRUBU_LABELS.tr;

  const [selectedExercise, setSelectedExercise] = useState<string>("");

  const prs = useMemo(() => getKisiselRekorlar(data), [data]);
  const allExerciseNames = useMemo(() => getTumHareketAdlari(data), [data]);

  const progressData = useMemo(() => {
    if (!selectedExercise) return [];
    return getHareketGecmis(data, selectedExercise);
  }, [data, selectedExercise]);

  const maxInProgress = useMemo(() => {
    if (progressData.length === 0) return 0;
    return Math.max(...progressData.map((d) => d.maxKilo));
  }, [progressData]);

  return (
    <div className="space-y-6">
      {/* Kişisel Rekorlar */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
          <Trophy className="h-5 w-5 text-amber-500" />
          {wt.personalRecords}
        </h3>
        {prs.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <Trophy className="mx-auto mb-2 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{wt.noPRs}</p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {prs.slice(0, 9).map((pr, idx) => {
              const icon = KAS_GRUBU_ICONS[pr.kasGrubu as KasGrubu] || "⚡";
              const label = kasGrubuLabels[pr.kasGrubu as KasGrubu] || pr.kasGrubu;
              return (
                <div
                  key={idx}
                  className={cn(
                    "rounded-xl border p-3 transition-all",
                    idx === 0
                      ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30"
                      : "border-border bg-card"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground line-clamp-1">{pr.hareketAdi}</p>
                        <p className="text-[10px] text-muted-foreground">{label}</p>
                      </div>
                    </div>
                    {idx === 0 && <span className="text-lg">🥇</span>}
                    {idx === 1 && <span className="text-lg">🥈</span>}
                    {idx === 2 && <span className="text-lg">🥉</span>}
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-primary">{pr.maxKilo}</span>
                    <span className="text-sm text-muted-foreground">kg</span>
                    <span className="ml-1 text-xs text-muted-foreground">× {pr.tekrar}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">{formatTarih(pr.tarih, language)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* İlerleme Grafiği */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
          <TrendingUp className="h-5 w-5 text-primary" />
          {wt.progress}
        </h3>

        {allExerciseNames.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <BarChart3 className="mx-auto mb-2 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{wt.noProgressData}</p>
          </div>
        ) : (
          <>
            {/* Hareket seçici */}
            <div className="relative mb-4">
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="w-full appearance-none rounded-lg border border-border bg-card px-4 py-2.5 pr-10 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">{wt.selectExercise}</option>
                {allExerciseNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* Basit bar chart */}
            {selectedExercise && progressData.length > 0 ? (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="mb-3 text-sm font-medium text-muted-foreground">
                  {wt.maxWeight} - {selectedExercise}
                </p>
                <div className="space-y-2">
                  {progressData.slice(-10).map((entry, idx) => {
                    const pct = maxInProgress > 0 ? (entry.maxKilo / maxInProgress) * 100 : 0;
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-16 flex-shrink-0 text-right text-xs text-muted-foreground">
                          {formatTarih(entry.tarih, language)}
                        </span>
                        <div className="flex-1 h-7 rounded-lg bg-muted/50 overflow-hidden relative">
                          <div
                            className="h-full rounded-lg bg-gradient-to-r from-primary/80 to-primary transition-all"
                            style={{ width: `${Math.max(pct, 5)}%` }}
                          />
                          <span className="absolute inset-0 flex items-center px-3 text-xs font-bold text-foreground">
                            {entry.maxKilo} kg
                          </span>
                        </div>
                        <span className="w-20 flex-shrink-0 text-right text-[10px] text-muted-foreground">
                          {entry.toplamHacim.toLocaleString()} kg vol
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : selectedExercise ? (
              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <p className="text-sm text-muted-foreground">{wt.noProgressData}</p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
