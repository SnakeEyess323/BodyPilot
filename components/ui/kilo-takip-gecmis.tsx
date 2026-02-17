"use client";

import { useState } from "react";
import { Trash2, Edit3, ChevronDown, ChevronUp, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import {
  type GunlukAntrenman,
  getToplamHacim,
  formatTarih,
} from "@/lib/kilo-takip";

interface KiloTakipGecmisProps {
  data: GunlukAntrenman[];
  onEdit: (workout: GunlukAntrenman) => void;
  onDelete: (id: string) => void;
}

export function KiloTakipGecmis({ data, onEdit, onDelete }: KiloTakipGecmisProps) {
  const { t, language } = useLanguage();
  const wt = t.weightTracking;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sorted = [...data].sort((a, b) => b.tarih.localeCompare(a.tarih)).slice(0, 15);

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Dumbbell className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">{wt.noWorkouts}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((workout) => {
        const isExpanded = expandedId === workout.id;
        const hacim = getToplamHacim(workout);
        const toplamSet = workout.hareketler.reduce((a, h) => a + h.setler.length, 0);

        return (
          <div
            key={workout.id}
            className={cn(
              "rounded-xl border transition-all",
              isExpanded ? "border-primary/30 bg-primary/5" : "border-border bg-card"
            )}
          >
            {/* Özet satırı */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : workout.id)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Dumbbell className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">
                    {formatTarih(workout.tarih, language)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {workout.hareketler.length} {wt.exercises} · {toplamSet} {wt.sets}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{hacim.toLocaleString()} kg</p>
                  <p className="text-[10px] text-muted-foreground">{wt.totalVolume}</p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Detay */}
            {isExpanded && (
              <div className="border-t border-border/50 px-3.5 pb-3.5 pt-2">
                {workout.hareketler.map((hareket) => {
                  const maxKilo = Math.max(...hareket.setler.map((s) => s.kilo), 0);

                  return (
                    <div key={hareket.id} className="mb-3 last:mb-0">
                      <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{hareket.hareketAdi}</span>
                        </div>
                        <span className="text-xs font-bold text-primary">{maxKilo}kg max</span>
                      </div>
                      <div className="ml-7 flex flex-wrap gap-1.5">
                        {hareket.setler.map((set, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-flex items-center rounded-md bg-muted/70 px-2 py-0.5 text-xs font-medium text-foreground"
                          >
                            {set.kilo}kg × {set.tekrar}
                          </span>
                        ))}
                      </div>
                      {hareket.notlar && (
                        <p className="ml-7 mt-1 text-xs text-muted-foreground italic">📝 {hareket.notlar}</p>
                      )}
                    </div>
                  );
                })}

                {/* Aksiyonlar */}
                <div className="mt-3 flex items-center gap-2 border-t border-border/50 pt-3">
                  <button
                    onClick={() => onEdit(workout)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    {wt.edit}
                  </button>
                  {confirmDeleteId === workout.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-500">{wt.confirmDelete}</span>
                      <button
                        onClick={() => { onDelete(workout.id); setConfirmDeleteId(null); setExpandedId(null); }}
                        className="rounded-lg bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600 transition"
                      >
                        {wt.delete}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs text-muted-foreground hover:text-foreground transition"
                      >
                        {wt.cancel}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(workout.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {wt.delete}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
