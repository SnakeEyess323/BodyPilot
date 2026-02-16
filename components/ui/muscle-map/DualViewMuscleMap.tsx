"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Info, Check, Pencil, Copy, Save } from "lucide-react";
import Image from "next/image";
import { getMuscleById, type MuscleId } from "./muscle-data";
import type { Language } from "@/lib/translations";
import { cn } from "@/lib/utils";

interface DualViewMuscleMapProps {
  selectedMuscles: MuscleId[];
  onSelectionChange: (muscles: MuscleId[]) => void;
  language: Language;
}

// =============================================================================
// SHAPES & TYPES
// =============================================================================

type CheckboxShape = "circle" | "square" | "wide" | "tall";
const ALL_SHAPES: CheckboxShape[] = ["circle", "square", "wide", "tall"];

const SHAPE_LABELS: Record<CheckboxShape, string> = {
  circle: "⬤",
  square: "■",
  wide: "▬",
  tall: "▮",
};

// Normal mode shape classes
function getShapeClasses(shape: CheckboxShape) {
  switch (shape) {
    case "square":
      return "w-[24px] h-[24px] sm:w-[28px] sm:h-[28px] md:w-[30px] md:h-[30px] rounded-lg";
    case "wide":
      return "w-[36px] h-[18px] sm:w-[42px] sm:h-[20px] md:w-[46px] md:h-[22px] rounded-full";
    case "tall":
      return "w-[18px] h-[36px] sm:w-[20px] sm:h-[42px] md:w-[22px] md:h-[46px] rounded-full";
    case "circle":
    default:
      return "w-[20px] h-[20px] sm:w-[24px] sm:h-[24px] md:w-[26px] md:h-[26px] rounded-full";
  }
}

// Edit mode shape classes
function getEditShapeClasses(shape: CheckboxShape) {
  switch (shape) {
    case "square":
      return "w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] rounded-lg";
    case "wide":
      return "w-[38px] h-[18px] sm:w-[44px] sm:h-[20px] rounded-full";
    case "tall":
      return "w-[18px] h-[38px] sm:w-[20px] sm:h-[44px] rounded-full";
    case "circle":
    default:
      return "w-[22px] h-[22px] sm:w-[26px] sm:h-[26px] rounded-full";
  }
}

// =============================================================================
// MUSCLE CHECKBOX POSITIONS
// =============================================================================

interface MuscleCheckbox {
  muscleId: MuscleId;
  x: number;
  y: number;
  side: "front" | "back";
  shape?: CheckboxShape;
}

const DEFAULT_MUSCLE_CHECKBOXES: MuscleCheckbox[] = [
  // ===================== FRONT VIEW =====================
  { muscleId: "shoulders", x: 16.9, y: 23.7, side: "front" },
  { muscleId: "shoulders", x: 33.8, y: 23.2, side: "front" },
  { muscleId: "chest", x: 21.8, y: 25, side: "front" },
  { muscleId: "chest", x: 28.6, y: 25, side: "front" },
  { muscleId: "biceps", x: 14.2, y: 31.7, side: "front" },
  { muscleId: "biceps", x: 36.6, y: 32.2, side: "front" },
  { muscleId: "abs", x: 25.3, y: 38.5, side: "front" },
  { muscleId: "obliques", x: 20.8, y: 37, side: "front", shape: "tall" },
  { muscleId: "obliques", x: 30.3, y: 37, side: "front", shape: "tall" },
  { muscleId: "forearms", x: 10.2, y: 40, side: "front" },
  { muscleId: "forearms", x: 41.5, y: 40.7, side: "front" },
  { muscleId: "quads", x: 20.3, y: 57, side: "front", shape: "tall" },
  { muscleId: "quads", x: 30.6, y: 57, side: "front", shape: "tall" },

  // ===================== BACK VIEW =====================
  { muscleId: "traps", x: 73.8, y: 19.7, side: "back", shape: "wide" },
  { muscleId: "shoulders", x: 65.8, y: 22.9, side: "back" },
  { muscleId: "shoulders", x: 82.6, y: 22.9, side: "back" },
  { muscleId: "triceps", x: 63.5, y: 30.6, side: "back" },
  { muscleId: "triceps", x: 85.2, y: 30.4, side: "back" },
  { muscleId: "lats", x: 69.8, y: 30.1, side: "back" },
  { muscleId: "lats", x: 79.3, y: 30.4, side: "back" },
  { muscleId: "lowerBack", x: 74, y: 38.4, side: "back" },
  { muscleId: "glutes", x: 70.8, y: 47.9, side: "back" },
  { muscleId: "glutes", x: 77, y: 47.7, side: "back" },
  { muscleId: "hamstrings", x: 68.8, y: 59.2, side: "back", shape: "tall" },
  { muscleId: "hamstrings", x: 79.2, y: 59.1, side: "back", shape: "tall" },
  { muscleId: "calves", x: 67.6, y: 76.3, side: "back", shape: "tall" },
  { muscleId: "calves", x: 80.6, y: 76.3, side: "back", shape: "tall" },
];

// =============================================================================
// DRAGGABLE CHECKBOX (edit mode)
// =============================================================================

interface DraggableCheckboxProps {
  cb: MuscleCheckbox;
  idx: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onDragEnd: (idx: number, x: number, y: number) => void;
  onShapeChange: (idx: number, shape: CheckboxShape) => void;
  language: Language;
}

function DraggableCheckbox({ cb, idx, containerRef, onDragEnd, onShapeChange, language }: DraggableCheckboxProps) {
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: cb.x, y: cb.y });
  const muscle = getMuscleById(cb.muscleId);
  const currentShape = cb.shape || "circle";

  useEffect(() => {
    setPos({ x: cb.x, y: cb.y });
  }, [cb.x, cb.y]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);

    const container = containerRef.current;
    if (!container) return;

    const onMouseMove = (ev: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const newX = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
      const newY = Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100));
      setPos({ x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 });
    };

    const onMouseUp = (ev: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const newX = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
      const newY = Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100));
      const finalX = Math.round(newX * 10) / 10;
      const finalY = Math.round(newY * 10) / 10;
      setPos({ x: finalX, y: finalY });
      onDragEnd(idx, finalX, finalY);
      setDragging(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [containerRef, idx, onDragEnd]);

  // Right-click to cycle shapes
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const currentIdx = ALL_SHAPES.indexOf(currentShape);
    const nextIdx = (currentIdx + 1) % ALL_SHAPES.length;
    onShapeChange(idx, ALL_SHAPES[nextIdx]);
  }, [currentShape, idx, onShapeChange]);

  return (
    <div
      className={cn(
        "absolute flex flex-col items-center z-20 -translate-x-1/2 -translate-y-1/2 cursor-grab select-none",
        dragging && "cursor-grabbing z-50"
      )}
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    >
      {/* The checkbox with current shape */}
      <div
        className={cn(
          "flex items-center justify-center border-2",
          getEditShapeClasses(currentShape),
          dragging
            ? "bg-yellow-400 border-yellow-600 shadow-xl scale-125"
            : "bg-blue-500 border-blue-700 text-white shadow-lg"
        )}
      >
        <span className="text-[8px] font-bold text-white">{idx + 1}</span>
      </div>
      {/* Info label: name, coords, shape */}
      <div className="mt-0.5 px-1.5 py-0.5 bg-black/80 text-white text-[9px] rounded whitespace-nowrap font-mono flex items-center gap-1">
        <span>{muscle?.name[language]?.substring(0, 6)}</span>
        <span className="opacity-60">({pos.x}, {pos.y})</span>
        <span className="text-yellow-300" title="Sağ tıkla şekil değiştir">{SHAPE_LABELS[currentShape]}</span>
      </div>
    </div>
  );
}

// =============================================================================
// NORMAL CHECKBOX (play mode)
// =============================================================================

interface MuscleCheckboxButtonProps {
  muscleId: MuscleId;
  x: number;
  y: number;
  shape: CheckboxShape;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (muscleId: MuscleId | null) => void;
  language: Language;
}

function MuscleCheckboxButton({ muscleId, x, y, shape, isSelected, isHovered, onClick, onHover, language }: MuscleCheckboxButtonProps) {
  const muscle = getMuscleById(muscleId);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => onHover(muscleId)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "absolute flex items-center justify-center border-2 transition-all duration-200 z-10",
        getShapeClasses(shape),
        "-translate-x-1/2 -translate-y-1/2",
        isSelected
          ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/40"
          : isHovered
            ? "bg-primary/20 border-primary opacity-100 shadow-md shadow-primary/20"
            : "bg-white/80 dark:bg-gray-900/80 border-gray-300 dark:border-gray-600 opacity-50 hover:opacity-100 hover:border-primary hover:bg-primary/20 hover:shadow-md hover:shadow-primary/20"
      )}
      style={{
        left: `${x}%`,
        top: `${y}%`,
      }}
      title={muscle?.name[language]}
    >
      {isSelected && (
        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" strokeWidth={3} />
      )}
    </button>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function DualViewMuscleMap({
  selectedMuscles,
  onSelectionChange,
  language,
}: DualViewMuscleMapProps) {
  const [hoveredMuscle, setHoveredMuscle] = useState<MuscleId | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editPositions, setEditPositions] = useState<MuscleCheckbox[]>(DEFAULT_MUSCLE_CHECKBOXES);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMuscleClick = useCallback((muscleId: MuscleId) => {
    if (selectedMuscles.includes(muscleId)) {
      onSelectionChange(selectedMuscles.filter((m) => m !== muscleId));
    } else {
      onSelectionChange([...selectedMuscles, muscleId]);
    }
  }, [selectedMuscles, onSelectionChange]);

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const handleDragEnd = useCallback((idx: number, x: number, y: number) => {
    setEditPositions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], x, y };
      return next;
    });
  }, []);

  const handleShapeChange = useCallback((idx: number, shape: CheckboxShape) => {
    setEditPositions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], shape };
      return next;
    });
  }, []);

  const handleCopyCode = useCallback(() => {
    const code = `const muscleCheckboxes: MuscleCheckbox[] = [\n` +
      editPositions.map((cb) => {
        const shapePart = cb.shape && cb.shape !== "circle" ? `, shape: "${cb.shape}"` : "";
        return `  { muscleId: "${cb.muscleId}", x: ${cb.x}, y: ${cb.y}, side: "${cb.side}"${shapePart} },`;
      }).join("\n") +
      "\n];";
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    console.log("=== UPDATED MUSCLE POSITIONS ===");
    console.log(code);
    console.log("================================");
  }, [editPositions]);

  const activePositions = editMode ? editPositions : DEFAULT_MUSCLE_CHECKBOXES;

  const texts = {
    tr: {
      front: "Ön",
      back: "Arka",
      selectedMuscles: "Seçilen Kaslar",
      clearAll: "Temizle",
      noSelection: "Çalıştırmak istediğiniz kas gruplarını seçin",
      clickToSelect: "Kas seçmek için kutucuklara tıklayın",
      editMode: "Düzenle",
      exitEdit: "Düzenlemeyi Bitir",
      copyCode: "Kodu Kopyala",
      copied: "Kopyalandı!",
      editHint: "Sürükle: taşı · Sağ tık: şekil değiştir (⬤ ■ ▬ ▮)",
    },
    en: {
      front: "Front",
      back: "Back",
      selectedMuscles: "Selected Muscles",
      clearAll: "Clear All",
      noSelection: "Select the muscle groups you want to train",
      clickToSelect: "Click on the checkboxes to select muscles",
      editMode: "Edit",
      exitEdit: "Done Editing",
      copyCode: "Copy Code",
      copied: "Copied!",
      editHint: "Drag: move · Right-click: change shape (⬤ ■ ▬ ▮)",
    },
    de: {
      front: "Vorne",
      back: "Hinten",
      selectedMuscles: "Ausgewählte Muskeln",
      clearAll: "Alle löschen",
      noSelection: "Wählen Sie die Muskelgruppen aus",
      clickToSelect: "Klicken Sie auf die Kontrollkästchen",
      editMode: "Bearbeiten",
      exitEdit: "Bearbeitung beenden",
      copyCode: "Code kopieren",
      copied: "Kopiert!",
      editHint: "Ziehen: verschieben · Rechtsklick: Form ändern (⬤ ■ ▬ ▮)",
    },
    ru: {
      front: "Спереди",
      back: "Сзади",
      selectedMuscles: "Выбранные мышцы",
      clearAll: "Очистить",
      noSelection: "Выберите группы мышц",
      clickToSelect: "Нажмите на флажки, чтобы выбрать мышцы",
      editMode: "Редактировать",
      exitEdit: "Завершить",
      copyCode: "Скопировать код",
      copied: "Скопировано!",
      editHint: "Перетащите: переместить · ПКМ: изменить форму (⬤ ■ ▬ ▮)",
    },
  };

  const t = texts[language];
  const hoveredMuscleName = hoveredMuscle ? getMuscleById(hoveredMuscle)?.name[language] : null;

  return (
    <div className="flex flex-col w-full">
      {/* Body Map Container */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">

        {/* Edit mode banner */}
        {editMode && (
          <div className="bg-yellow-100 dark:bg-yellow-900/50 border-b border-yellow-300 dark:border-yellow-700 px-4 py-2 flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
              <Pencil className="w-3.5 h-3.5 inline mr-1" />
              {t.editHint}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  copied
                    ? "bg-purple-500 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                )}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t.copied : t.copyCode}
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                {t.exitEdit}
              </button>
            </div>
          </div>
        )}

        {/* Hover tooltip (normal mode) */}
        {!editMode && (
          <AnimatePresence>
            {hoveredMuscleName && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute top-3 left-1/2 -translate-x-1/2 px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold shadow-xl z-30"
              >
                {hoveredMuscleName}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* View labels + Edit button */}
        <div className="flex items-center justify-between pt-3 pb-1 px-4">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex-1 text-center">
            {t.front}
          </span>
          {!editMode && (
            <button
              onClick={() => {
                setEditPositions([...DEFAULT_MUSCLE_CHECKBOXES]);
                setEditMode(true);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-white/10 transition-all"
              title={t.editMode}
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex-1 text-center">
            {t.back}
          </span>
        </div>

        {/* Image + Checkboxes container */}
        <div ref={containerRef} className="relative mx-auto" style={{ maxWidth: "700px" }}>
          <Image
            src="/muscle-map.png"
            alt="Muscle anatomy map"
            width={1024}
            height={820}
            className={cn(
              "w-full h-auto select-none pointer-events-none dark:invert dark:opacity-90",
              editMode && "opacity-60"
            )}
            priority
          />

          {/* Edit mode: draggable checkboxes */}
          {editMode &&
            editPositions.map((cb, idx) => (
              <DraggableCheckbox
                key={`edit-${idx}`}
                cb={cb}
                idx={idx}
                containerRef={containerRef}
                onDragEnd={handleDragEnd}
                onShapeChange={handleShapeChange}
                language={language}
              />
            ))}

          {/* Normal mode: clickable checkboxes */}
          {!editMode &&
            activePositions.map((cb, idx) => (
              <MuscleCheckboxButton
                key={`${cb.muscleId}-${cb.side}-${idx}`}
                muscleId={cb.muscleId}
                x={cb.x}
                y={cb.y}
                shape={cb.shape || "circle"}
                isSelected={selectedMuscles.includes(cb.muscleId)}
                isHovered={hoveredMuscle === cb.muscleId}
                onClick={() => handleMuscleClick(cb.muscleId)}
                onHover={setHoveredMuscle}
                language={language}
              />
            ))}
        </div>

        {/* Instruction (normal mode only) */}
        {!editMode && selectedMuscles.length === 0 && !hoveredMuscleName && (
          <motion.div
            className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Info className="w-4 h-4" />
            {t.clickToSelect}
          </motion.div>
        )}
      </div>

      {/* Selected Muscles Summary */}
      {!editMode && (
        <div className="mt-6 rounded-xl border border-border bg-card p-4">
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
                <RotateCcw className="w-3.5 h-3.5" />
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
      )}
    </div>
  );
}
