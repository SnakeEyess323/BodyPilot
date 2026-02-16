"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ChevronDown, ChevronUp } from "lucide-react";
import { muscleGroups, getMuscleById, type MuscleId } from "./muscle-data";
import type { Language } from "@/lib/translations";

interface MuscleMapProps {
  selectedMuscles: MuscleId[];
  onSelectionChange: (muscles: MuscleId[]) => void;
  language: Language;
}

export default function MuscleMap({
  selectedMuscles,
  onSelectionChange,
  language,
}: MuscleMapProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["upper", "core", "lower"]);

  const handleMuscleClick = (muscleId: MuscleId) => {
    if (selectedMuscles.includes(muscleId)) {
      onSelectionChange(selectedMuscles.filter((m) => m !== muscleId));
    } else {
      onSelectionChange([...selectedMuscles, muscleId]);
    }
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const toggleCategory = (category: string) => {
    if (expandedCategories.includes(category)) {
      setExpandedCategories(expandedCategories.filter(c => c !== category));
    } else {
      setExpandedCategories([...expandedCategories, category]);
    }
  };

  const selectAllInCategory = (category: "upper" | "core" | "lower") => {
    const categoryMuscles = muscleGroups
      .filter((m) => m.category === category)
      .map((m) => m.id);
    const allSelected = categoryMuscles.every(m => selectedMuscles.includes(m));
    
    if (allSelected) {
      onSelectionChange(selectedMuscles.filter((m) => !categoryMuscles.includes(m)));
    } else {
      const newSelection = new Set([...selectedMuscles, ...categoryMuscles]);
      onSelectionChange(Array.from(newSelection));
    }
  };

  // Text translations
  const texts = {
    tr: {
      selectMuscles: "Kas Gruplarını Seçin",
      selectedMuscles: "Seçilen Kaslar",
      clearAll: "Temizle",
      noSelection: "Henüz kas grubu seçilmedi",
      selectAll: "Tümünü Seç",
      deselectAll: "Seçimi Kaldır",
    },
    en: {
      selectMuscles: "Select Muscle Groups",
      selectedMuscles: "Selected Muscles",
      clearAll: "Clear All",
      noSelection: "No muscle groups selected yet",
      selectAll: "Select All",
      deselectAll: "Deselect All",
    },
    de: {
      selectMuscles: "Muskelgruppen auswählen",
      selectedMuscles: "Ausgewählte Muskeln",
      clearAll: "Alle löschen",
      noSelection: "Noch keine Muskelgruppen ausgewählt",
      selectAll: "Alle auswählen",
      deselectAll: "Auswahl aufheben",
    },
    ru: {
      selectMuscles: "Выберите группы мышц",
      selectedMuscles: "Выбранные мышцы",
      clearAll: "Очистить",
      noSelection: "Группы мышц еще не выбраны",
      selectAll: "Выбрать все",
      deselectAll: "Снять выбор",
    },
  };

  const t = texts[language];

  const categoryLabels = {
    upper: { tr: "Üst Vücut", en: "Upper Body", de: "Oberkörper", ru: "Верх тела" },
    core: { tr: "Gövde / Core", en: "Core / Torso", de: "Rumpf / Core", ru: "Кор / Торс" },
    lower: { tr: "Alt Vücut", en: "Lower Body", de: "Unterkörper", ru: "Низ тела" },
  };

  const categoryIcons = {
    upper: "💪",
    core: "🎯",
    lower: "🦵",
  };

  const categories: ("upper" | "core" | "lower")[] = ["upper", "core", "lower"];

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Muscle Selection by Category */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">{t.selectMuscles}</h3>
        
        {categories.map((category) => {
          const categoryMuscles = muscleGroups.filter((m) => m.category === category);
          const selectedCount = categoryMuscles.filter((m) => selectedMuscles.includes(m.id)).length;
          const allSelected = selectedCount === categoryMuscles.length;
          const isExpanded = expandedCategories.includes(category);

          return (
            <div 
              key={category} 
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{categoryIcons[category]}</span>
                  <span className="font-medium text-foreground">
                    {categoryLabels[category][language]}
                  </span>
                  {selectedCount > 0 && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-primary/15 text-primary font-semibold">
                      {selectedCount}/{categoryMuscles.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectAllInCategory(category);
                    }}
                    className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                      allSelected 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    {allSelected ? t.deselectAll : t.selectAll}
                  </button>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Muscle Chips */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 flex flex-wrap gap-2">
                      {categoryMuscles.map((muscle) => {
                        const isSelected = selectedMuscles.includes(muscle.id);
                        return (
                          <motion.button
                            key={muscle.id}
                            type="button"
                            onClick={() => handleMuscleClick(muscle.id)}
                            className={`
                              inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                              transition-all duration-200 border-2
                              ${isSelected
                                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                                : "bg-background hover:bg-muted border-border hover:border-primary/50"
                              }
                            `}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {isSelected && <Check className="w-4 h-4" />}
                            <span>{muscle.name[language]}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Selected Muscles Summary */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            {t.selectedMuscles}
            {selectedMuscles.length > 0 && (
              <span className="px-2.5 py-1 text-xs rounded-full bg-primary/15 text-primary font-bold">
                {selectedMuscles.length}
              </span>
            )}
          </h3>
          {selectedMuscles.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-destructive/10"
            >
              <X className="w-3.5 h-3.5" />
              {t.clearAll}
            </button>
          )}
        </div>

        <div className="min-h-[50px]">
          {selectedMuscles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              {t.noSelection}
            </p>
          ) : (
            <motion.div layout className="flex flex-wrap gap-2">
              <AnimatePresence mode="popLayout">
                {selectedMuscles.map((muscleId) => {
                  const muscle = getMuscleById(muscleId);
                  if (!muscle) return null;

                  return (
                    <motion.span
                      key={muscleId}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
                    >
                      {muscle.name[language]}
                      <button
                        type="button"
                        onClick={() => handleMuscleClick(muscleId)}
                        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.span>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
