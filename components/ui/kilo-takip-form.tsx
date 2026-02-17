"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, Trash2, Save, X, History } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  type GunlukAntrenman,
  type HareketKayit,
  type SetKayit,
  generateId,
  getSonAntrenmanBilgisi,
} from "@/lib/kilo-takip";
import { exercises } from "@/lib/exercises";

interface KiloTakipFormProps {
  allData: GunlukAntrenman[];
  editingWorkout?: GunlukAntrenman | null;
  onSave: (workout: GunlukAntrenman) => void;
  onCancel: () => void;
}

function getDefaultSet(setNum: number): SetKayit {
  return { set: setNum, tekrar: 10, kilo: 0 };
}

function getDefaultHareket(): HareketKayit {
  return {
    id: generateId(),
    hareketAdi: "",
    kasGrubu: "chest",
    setler: [getDefaultSet(1), getDefaultSet(2), getDefaultSet(3)],
  };
}

export function KiloTakipForm({ allData, editingWorkout, onSave, onCancel }: KiloTakipFormProps) {
  const { t, language } = useLanguage();
  const wt = t.weightTracking;

  const [tarih, setTarih] = useState(
    editingWorkout?.tarih || new Date().toISOString().slice(0, 10)
  );
  const [hareketler, setHareketler] = useState<HareketKayit[]>(
    editingWorkout?.hareketler.length ? editingWorkout.hareketler : [getDefaultHareket()]
  );

  const exerciseSuggestions = useMemo(() => {
    const langKey = language as "tr" | "en" | "de" | "ru";
    return exercises.map((e) => ({
      name: e.name[langKey] || e.name.tr,
      muscleId: e.muscleId,
    }));
  }, [language]);

  const addHareket = useCallback(() => {
    setHareketler((prev) => [...prev, getDefaultHareket()]);
  }, []);

  const removeHareket = useCallback((id: string) => {
    setHareketler((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const updateHareket = useCallback((id: string, updates: Partial<HareketKayit>) => {
    setHareketler((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updates } : h))
    );
  }, []);

  const addSet = useCallback((hareketId: string) => {
    setHareketler((prev) =>
      prev.map((h) => {
        if (h.id !== hareketId) return h;
        const newSetNum = h.setler.length + 1;
        const lastSet = h.setler[h.setler.length - 1];
        return {
          ...h,
          setler: [...h.setler, { set: newSetNum, tekrar: lastSet?.tekrar || 10, kilo: lastSet?.kilo || 0 }],
        };
      })
    );
  }, []);

  const removeSet = useCallback((hareketId: string, setIndex: number) => {
    setHareketler((prev) =>
      prev.map((h) => {
        if (h.id !== hareketId) return h;
        const newSetler = h.setler.filter((_, i) => i !== setIndex).map((s, i) => ({ ...s, set: i + 1 }));
        return { ...h, setler: newSetler };
      })
    );
  }, []);

  const updateSet = useCallback((hareketId: string, setIndex: number, updates: Partial<SetKayit>) => {
    setHareketler((prev) =>
      prev.map((h) => {
        if (h.id !== hareketId) return h;
        const newSetler = [...h.setler];
        newSetler[setIndex] = { ...newSetler[setIndex], ...updates };
        return { ...h, setler: newSetler };
      })
    );
  }, []);

  const handleSave = useCallback(() => {
    const validHareketler = hareketler.filter(
      (h) => h.hareketAdi.trim() && h.setler.length > 0
    );
    if (validHareketler.length === 0) return;

    const workout: GunlukAntrenman = {
      id: editingWorkout?.id || generateId(),
      tarih,
      hareketler: validHareketler,
    };
    onSave(workout);
  }, [hareketler, tarih, editingWorkout, onSave]);

  const canSave = hareketler.some((h) => h.hareketAdi.trim() && h.setler.length > 0);

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary">
          🏋️ {editingWorkout ? wt.edit : wt.newWorkout}
        </h3>
        <button onClick={onCancel} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tarih */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-muted-foreground">{wt.date}</label>
        <input
          type="date"
          value={tarih}
          onChange={(e) => setTarih(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Hareketler */}
      <div className="space-y-4">
        {hareketler.map((hareket, hIdx) => {
          const sonBilgi = hareket.hareketAdi.trim()
            ? getSonAntrenmanBilgisi(allData, hareket.hareketAdi, editingWorkout?.id)
            : null;

          return (
            <div key={hareket.id} className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  {/* Hareket Adı + Autocomplete */}
                  <div className="relative">
                    <input
                      type="text"
                      value={hareket.hareketAdi}
                      onChange={(e) => updateHareket(hareket.id, { hareketAdi: e.target.value })}
                      placeholder={wt.exerciseNamePlaceholder}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      list={`suggestions-${hareket.id}`}
                    />
                    <datalist id={`suggestions-${hareket.id}`}>
                      {exerciseSuggestions.map((s, i) => (
                        <option key={i} value={s.name} />
                      ))}
                    </datalist>
                  </div>

                </div>

                {hareketler.length > 1 && (
                  <button
                    onClick={() => removeHareket(hareket.id)}
                    className="mt-1 rounded-lg p-1.5 text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Son antrenman bilgisi */}
              {sonBilgi && (
                <div className="mb-3 flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
                  <History className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{wt.lastTime}: {sonBilgi.maxKilo}kg · {sonBilgi.setler.map((s) => `${s.kilo}kg×${s.tekrar}`).join(", ")}</span>
                </div>
              )}

              {/* Set tablosu */}
              <div className="mb-2">
                <div className="mb-1 grid grid-cols-[40px_1fr_1fr_36px] gap-2 text-xs font-medium text-muted-foreground">
                  <span>{wt.set}</span>
                  <span>{wt.weight}</span>
                  <span>{wt.reps}</span>
                  <span></span>
                </div>
                {hareket.setler.map((set, sIdx) => (
                  <div key={sIdx} className="mb-1.5 grid grid-cols-[40px_1fr_1fr_36px] items-center gap-2">
                    <span className="text-center text-sm font-bold text-muted-foreground">{set.set}</span>
                    <input
                      type="number"
                      value={set.kilo || ""}
                      onChange={(e) => updateSet(hareket.id, sIdx, { kilo: parseFloat(e.target.value) || 0 })}
                      placeholder="kg"
                      className="rounded-lg border border-border bg-background px-2.5 py-2 text-center text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      min="0"
                      step="0.5"
                    />
                    <input
                      type="number"
                      value={set.tekrar || ""}
                      onChange={(e) => updateSet(hareket.id, sIdx, { tekrar: parseInt(e.target.value) || 0 })}
                      placeholder="×"
                      className="rounded-lg border border-border bg-background px-2.5 py-2 text-center text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      min="0"
                    />
                    {hareket.setler.length > 1 && (
                      <button
                        onClick={() => removeSet(hareket.id, sIdx)}
                        className="flex items-center justify-center rounded p-1 text-muted-foreground hover:text-red-500 transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => addSet(hareket.id)}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                {wt.addSet}
              </button>

              {/* Not */}
              <div className="mt-2">
                <input
                  type="text"
                  value={hareket.notlar || ""}
                  onChange={(e) => updateHareket(hareket.id, { notlar: e.target.value })}
                  placeholder={wt.notesPlaceholder}
                  className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Hareket Ekle */}
      <button
        onClick={addHareket}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 py-3 text-sm font-medium text-primary hover:bg-primary/5 transition"
      >
        <Plus className="h-4 w-4" />
        {wt.addExercise}
      </button>

      {/* Kaydet / İptal */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {wt.save}
        </button>
        <button
          onClick={onCancel}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition"
        >
          {wt.cancel}
        </button>
      </div>
    </div>
  );
}
