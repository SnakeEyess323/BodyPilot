"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Dumbbell, Check } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  type GunlukAntrenman,
  loadKiloTakip,
  addAntrenman,
  updateAntrenman,
  deleteAntrenman,
} from "@/lib/kilo-takip";
import { KiloTakipForm } from "@/components/ui/kilo-takip-form";
import { KiloTakipGecmis } from "@/components/ui/kilo-takip-gecmis";
import { KiloTakipIlerleme } from "@/components/ui/kilo-takip-ilerleme";
import { AnimateIn } from "@/components/ui/animate-in";

export default function KiloTakipPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const wt = t.weightTracking;

  const [data, setData] = useState<GunlukAntrenman[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<GunlukAntrenman | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    if (userId) {
      setData(loadKiloTakip(userId));
    }
    setIsLoaded(true);
  }, [userId]);

  const handleSave = useCallback(
    (workout: GunlukAntrenman) => {
      if (editingWorkout) {
        updateAntrenman(userId, workout);
      } else {
        addAntrenman(userId, workout);
      }
      setData(loadKiloTakip(userId));
      setShowForm(false);
      setEditingWorkout(null);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2500);
    },
    [userId, editingWorkout]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteAntrenman(userId, id);
      setData(loadKiloTakip(userId));
    },
    [userId]
  );

  const handleEdit = useCallback((workout: GunlukAntrenman) => {
    setEditingWorkout(workout);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleCancel = useCallback(() => {
    setShowForm(false);
    setEditingWorkout(null);
  }, []);

  if (!isLoaded) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Başlık */}
      <AnimateIn type="fade-down" duration={0.5}>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground">
              <Dumbbell className="h-7 w-7 text-primary" />
              {wt.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{wt.subtitle}</p>
          </div>
          {!showForm && (
            <button
              onClick={() => { setShowForm(true); setEditingWorkout(null); }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              {wt.newWorkout}
            </button>
          )}
        </div>
      </AnimateIn>

      {/* Kaydedildi mesajı */}
      {savedMessage && (
        <AnimateIn type="scale-in" duration={0.3}>
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2.5 text-sm font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
            <Check className="h-4 w-4" />
            {wt.saved}
          </div>
        </AnimateIn>
      )}

      {/* Form */}
      {showForm && (
        <AnimateIn type="fade-up" duration={0.4} className="mb-8">
          <KiloTakipForm
            allData={data}
            editingWorkout={editingWorkout}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </AnimateIn>
      )}

      {/* Son Antrenmanlar */}
      <AnimateIn type="fade-up" delay={0.15}>
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">{wt.recentWorkouts}</h2>
          <KiloTakipGecmis data={data} onEdit={handleEdit} onDelete={handleDelete} />
        </div>
      </AnimateIn>

      {/* İlerleme & PR */}
      {data.length > 0 && (
        <AnimateIn type="fade-up" delay={0.25}>
          <KiloTakipIlerleme data={data} />
        </AnimateIn>
      )}
    </div>
  );
}
