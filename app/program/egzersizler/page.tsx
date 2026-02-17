"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Dumbbell, 
  Filter, 
  Grid3X3, 
  List, 
  Search,
  X,
  ArrowLeft,
  Sparkles,
  Loader2
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ExerciseCard, ExerciseCardCompact } from "@/components/ui/exercise-card";
import { 
  exercises, 
  getExercisesForMuscles,
  difficultyLabels,
  equipmentLabels,
  type Difficulty,
  type Equipment
} from "@/lib/exercises";
import { muscleGroups, type MuscleId } from "@/components/ui/muscle-map/muscle-data";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    </div>
  );
}

// Main content component that uses useSearchParams
function EgzersizlerContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  
  // Fallback translations for keys not in t.extra
  const fallbackTexts = {
    searchPlaceholder: language === "tr" ? "Egzersiz ara..." : language === "en" ? "Search exercises..." : language === "de" ? "Übungen suchen..." : "Поиск упражнений...",
    clearFilters: language === "tr" ? "Temizle" : language === "en" ? "Clear" : language === "de" ? "Löschen" : "Очистить",
    exercises: language === "tr" ? "egzersiz" : language === "en" ? "exercises" : language === "de" ? "Übungen" : "упражнений",
  };

  // Get muscles from URL params
  const musclesParam = searchParams.get("muscles");
  const initialMuscles = musclesParam 
    ? (musclesParam.split(",") as MuscleId[])
    : [];

  // State
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleId[]>(initialMuscles);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | "all">("all");
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Update muscles when URL changes
  useEffect(() => {
    if (musclesParam) {
      setSelectedMuscles(musclesParam.split(",") as MuscleId[]);
    }
  }, [musclesParam]);

  // Filter exercises
  const filteredExercises = useMemo(() => {
    let result = selectedMuscles.length > 0 
      ? getExercisesForMuscles(selectedMuscles)
      : exercises;

    // Filter by difficulty
    if (selectedDifficulty !== "all") {
      result = result.filter((e) => e.difficulty === selectedDifficulty);
    }

    // Filter by equipment
    if (selectedEquipment !== "all") {
      result = result.filter((e) => e.equipment.includes(selectedEquipment));
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.name[language].toLowerCase().includes(query) ||
          e.description[language].toLowerCase().includes(query)
      );
    }

    return result;
  }, [selectedMuscles, selectedDifficulty, selectedEquipment, searchQuery, language]);

  // Group exercises by muscle
  const groupedExercises = useMemo(() => {
    const groups: Record<MuscleId, typeof filteredExercises> = {} as Record<MuscleId, typeof filteredExercises>;
    
    filteredExercises.forEach((exercise) => {
      if (!groups[exercise.muscleId]) {
        groups[exercise.muscleId] = [];
      }
      groups[exercise.muscleId].push(exercise);
    });

    return groups;
  }, [filteredExercises]);

  // Get unique equipment from current exercises
  const availableEquipment = useMemo(() => {
    const equipment = new Set<Equipment>();
    exercises.forEach((e) => e.equipment.forEach((eq) => equipment.add(eq)));
    return Array.from(equipment);
  }, []);

  const clearFilters = () => {
    setSelectedDifficulty("all");
    setSelectedEquipment("all");
    setSearchQuery("");
  };

  const hasActiveFilters = selectedDifficulty !== "all" || selectedEquipment !== "all" || searchQuery.trim();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Back button */}
          <Link 
            href="/program/kas-secici"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.extra.backToMuscleSelector}
          </Link>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-5 border border-primary/20">
            <Sparkles className="w-4 h-4" />
            {t.extra.visualExercises}
          </div>
          
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">
            {t.extra.exerciseGallery}
          </h1>
          
          {/* Description */}
          <p className="text-muted-foreground max-w-2xl text-base sm:text-lg leading-relaxed">
            {t.extra.exerciseGalleryDesc}
          </p>

          {/* Selected muscles tags */}
          {selectedMuscles.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">{t.extra.selectedMuscles}:</span>
              {selectedMuscles.map((muscleId) => {
                const muscle = muscleGroups.find((m) => m.id === muscleId);
                return muscle ? (
                  <span
                    key={muscleId}
                    className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                  >
                    {muscle.name[language]}
                    <button
                      onClick={() => setSelectedMuscles((prev) => prev.filter((id) => id !== muscleId))}
                      className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          )}
        </motion.div>

        {/* Filters Bar */}
        <motion.div 
          className="mb-8 rounded-2xl border border-border bg-card p-4 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={fallbackTexts.searchPlaceholder}
                className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              {/* Difficulty filter */}
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as Difficulty | "all")}
                className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="all">{t.extra.allLevels}</option>
                {(["beginner", "intermediate", "advanced"] as Difficulty[]).map((diff) => (
                  <option key={diff} value={diff}>
                    {difficultyLabels[diff][language]}
                  </option>
                ))}
              </select>

              {/* Equipment filter */}
              <select
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value as Equipment | "all")}
                className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="all">{t.extra.allEquipment}</option>
                {availableEquipment.map((eq) => (
                  <option key={eq} value={eq}>
                    {equipmentLabels[eq][language]}
                  </option>
                ))}
              </select>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  {fallbackTexts.clearFilters}
                </button>
              )}

              {/* View mode toggle */}
              <div className="hidden sm:flex items-center gap-1 rounded-xl border border-input bg-background p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "rounded-lg p-2 transition-colors",
                    viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  )}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "rounded-lg p-2 transition-colors",
                    viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-muted-foreground">
            {filteredExercises.length} {fallbackTexts.exercises}
          </div>
        </motion.div>

        {/* Exercise Grid/List */}
        {filteredExercises.length > 0 ? (
          <div className="space-y-10">
            {Object.entries(groupedExercises).map(([muscleId, muscleExercises]) => {
              const muscle = muscleGroups.find((m) => m.id === muscleId);
              if (!muscle || muscleExercises.length === 0) return null;

              return (
                <motion.section
                  key={muscleId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Section header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <Dumbbell className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">
                        {muscle.name[language]}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {muscleExercises.length} {fallbackTexts.exercises}
                      </p>
                    </div>
                  </div>

                  {/* Exercise cards */}
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {muscleExercises.map((exercise) => (
                        <ExerciseCard
                          key={exercise.id}
                          exercise={exercise}
                          language={language}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {muscleExercises.map((exercise) => (
                        <ExerciseCardCompact
                          key={exercise.id}
                          exercise={exercise}
                          language={language}
                        />
                      ))}
                    </div>
                  )}
                </motion.section>
              );
            })}
          </div>
        ) : (
          /* No results */
          <motion.div 
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="rounded-full bg-muted p-6 mb-6">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {t.extra.noResults}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t.extra.tryDifferentFilters}
            </p>
            <button
              onClick={clearFilters}
              className="rounded-xl bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {fallbackTexts.clearFilters}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Main page component with Suspense wrapper
export default function EgzersizlerPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EgzersizlerContent />
    </Suspense>
  );
}
