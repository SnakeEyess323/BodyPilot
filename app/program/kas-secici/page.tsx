"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { DualViewMuscleMap, getMuscleById, type MuscleId } from "@/components/ui/muscle-map";
import { getExercisesForMuscles, type Exercise } from "@/lib/exercises";
import { ExerciseCard } from "@/components/ui/exercise-card";
import { Sparkles, Target, Dumbbell, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function KasSeciciPage() {
  const { t, language } = useLanguage();

  const [selectedMuscles, setSelectedMuscles] = useState<MuscleId[]>([]);
  const [muscleMapOpen, setMuscleMapOpen] = useState(true);

  // Get exercises for selected muscles, grouped by muscle
  const exercisesByMuscle = useMemo(() => {
    if (selectedMuscles.length === 0) return {};
    const grouped: Record<string, { muscle: ReturnType<typeof getMuscleById>; exercises: Exercise[] }> = {};
    for (const muscleId of selectedMuscles) {
      const muscle = getMuscleById(muscleId);
      const muscleExercises = getExercisesForMuscles([muscleId]);
      if (muscleExercises.length > 0) {
        grouped[muscleId] = { muscle, exercises: muscleExercises };
      }
    }
    return grouped;
  }, [selectedMuscles]);

  const totalExercises = useMemo(
    () => Object.values(exercisesByMuscle).reduce((sum, g) => sum + g.exercises.length, 0),
    [exercisesByMuscle]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {/* Header Section */}
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-5 border border-primary/20">
            <Sparkles className="w-4 h-4" />
            {t.extra.personalizedExercises}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">
            {t.extra.targetMuscleSelector}
          </h1>

          {/* Description */}
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            {t.extra.muscleSelectorDesc}
          </p>
        </motion.div>

        {/* Muscle Map Section - Collapsible */}
        <motion.div
          className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <button
            type="button"
            onClick={() => setMuscleMapOpen(!muscleMapOpen)}
            className="w-full flex items-center justify-between gap-3 p-6 sm:p-8 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-semibold text-foreground">{language === "tr" ? "Hedef Kaslar" : language === "en" ? "Target Muscles" : language === "de" ? "Zielmuskeln" : "Целевые мышцы"}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedMuscles.length > 0
                    ? `${selectedMuscles.length} ${t.extra.muscleGroupsSelected} · ${totalExercises}`
                    : t.extra.selectMusclesFirst}
                </p>
              </div>
            </div>
            {muscleMapOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          <AnimatePresence>
            {muscleMapOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 sm:px-8 pb-6 sm:pb-8 border-t border-border pt-4">
                  <DualViewMuscleMap
                    selectedMuscles={selectedMuscles}
                    onSelectionChange={setSelectedMuscles}
                    language={language}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Selected muscle names chips */}
        {selectedMuscles.length > 0 && (
          <motion.div
            className="flex flex-wrap gap-2 mb-8 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {selectedMuscles.map((muscleId) => {
              const muscle = getMuscleById(muscleId);
              return (
                <span
                  key={muscleId}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 text-sm font-medium text-primary"
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                  {muscle?.name[language] || muscleId}
                </span>
              );
            })}
          </motion.div>
        )}

        {/* Exercise Results */}
        {selectedMuscles.length > 0 ? (
          <motion.div
            className="space-y-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {t.extra.suggestedExercises}
              </h2>
              <p className="text-muted-foreground">
                {totalExercises} · {selectedMuscles.length} {t.extra.muscleGroupsSelected}
              </p>
            </div>

            {/* Action Buttons - top */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href={`/program/egzersizler?muscles=${selectedMuscles.join(",")}`}
                className="group inline-flex items-center justify-center gap-3 rounded-2xl border-2 border-primary bg-transparent px-8 py-4 font-semibold text-primary transition-all duration-300 hover:bg-primary/10 hover:shadow-lg"
              >
                <Dumbbell className="w-5 h-5" />
                {t.extra.seeAllExercises}
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href={`/program/antrenman`}
                className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-primary px-10 py-4 font-semibold text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25"
              >
                <Sparkles className="w-5 h-5" />
                {t.extra.createProgramWithMuscles}
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {Object.entries(exercisesByMuscle).map(([muscleId, { muscle, exercises }]) => (
              <div key={muscleId}>
                {/* Muscle group header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
                    {muscle?.name[language] || muscleId}
                    <span className="text-primary/60">({exercises.length})</span>
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Exercise cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {exercises.map((exercise) => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      language={language}
                    />
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Dumbbell className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">{t.extra.selectMusclesMessage}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
