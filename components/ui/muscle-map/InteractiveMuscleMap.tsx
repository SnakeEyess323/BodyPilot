"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, RotateCcw, User, Users } from "lucide-react";
import { muscleGroups, getMuscleById, type MuscleId, type BodyView } from "./muscle-data";
import type { Language } from "@/lib/translations";

interface InteractiveMuscleMapProps {
  selectedMuscles: MuscleId[];
  onSelectionChange: (muscles: MuscleId[]) => void;
  language: Language;
}

// SVG Path data for each muscle group - Male Front View
const maleFrontPaths: Record<string, { paths: string[]; muscleId: MuscleId }> = {
  // Chest - left and right pec
  chestLeft: {
    paths: [
      "M 145 95 Q 130 100 120 115 Q 115 130 118 145 Q 125 155 140 155 Q 155 155 165 148 Q 170 135 168 115 Q 165 100 155 95 Q 150 93 145 95 Z"
    ],
    muscleId: "chest"
  },
  chestRight: {
    paths: [
      "M 195 95 Q 210 100 220 115 Q 225 130 222 145 Q 215 155 200 155 Q 185 155 175 148 Q 170 135 172 115 Q 175 100 185 95 Q 190 93 195 95 Z"
    ],
    muscleId: "chest"
  },
  // Shoulders - deltoids
  shoulderLeft: {
    paths: [
      "M 105 75 Q 95 80 90 95 Q 88 110 95 120 Q 105 125 115 120 Q 122 110 120 95 Q 118 80 110 75 Q 107 74 105 75 Z"
    ],
    muscleId: "shoulders"
  },
  shoulderRight: {
    paths: [
      "M 235 75 Q 245 80 250 95 Q 252 110 245 120 Q 235 125 225 120 Q 218 110 220 95 Q 222 80 230 75 Q 233 74 235 75 Z"
    ],
    muscleId: "shoulders"
  },
  // Biceps
  bicepLeft: {
    paths: [
      "M 95 125 Q 85 135 82 155 Q 80 175 85 190 Q 95 195 105 190 Q 115 180 115 160 Q 115 140 108 130 Q 102 125 95 125 Z"
    ],
    muscleId: "biceps"
  },
  bicepRight: {
    paths: [
      "M 245 125 Q 255 135 258 155 Q 260 175 255 190 Q 245 195 235 190 Q 225 180 225 160 Q 225 140 232 130 Q 238 125 245 125 Z"
    ],
    muscleId: "biceps"
  },
  // Forearms
  forearmLeft: {
    paths: [
      "M 85 195 Q 75 210 70 235 Q 68 255 72 275 Q 80 280 90 275 Q 100 260 102 235 Q 103 215 98 200 Q 92 195 85 195 Z"
    ],
    muscleId: "forearms"
  },
  forearmRight: {
    paths: [
      "M 255 195 Q 265 210 270 235 Q 272 255 268 275 Q 260 280 250 275 Q 240 260 238 235 Q 237 215 242 200 Q 248 195 255 195 Z"
    ],
    muscleId: "forearms"
  },
  // Abs
  abs: {
    paths: [
      "M 150 160 Q 145 165 145 180 L 145 240 Q 145 255 155 260 L 170 265 L 185 260 Q 195 255 195 240 L 195 180 Q 195 165 190 160 Q 180 155 170 155 Q 160 155 150 160 Z",
      // Abs definition lines
      "M 155 175 L 185 175 M 155 195 L 185 195 M 155 215 L 185 215 M 155 235 L 185 235 M 170 160 L 170 260"
    ],
    muscleId: "abs"
  },
  // Obliques
  obliqueLeft: {
    paths: [
      "M 125 155 Q 118 165 118 185 Q 120 210 125 235 Q 130 250 140 260 Q 145 255 145 240 L 145 180 Q 145 165 140 160 Q 132 155 125 155 Z"
    ],
    muscleId: "obliques"
  },
  obliqueRight: {
    paths: [
      "M 215 155 Q 222 165 222 185 Q 220 210 215 235 Q 210 250 200 260 Q 195 255 195 240 L 195 180 Q 195 165 200 160 Q 208 155 215 155 Z"
    ],
    muscleId: "obliques"
  },
  // Quadriceps
  quadLeft: {
    paths: [
      "M 130 275 Q 118 290 115 320 Q 112 350 115 385 Q 120 410 130 420 Q 145 425 155 415 Q 165 400 165 370 L 165 320 Q 165 290 158 280 Q 150 272 140 272 Q 135 273 130 275 Z"
    ],
    muscleId: "quads"
  },
  quadRight: {
    paths: [
      "M 210 275 Q 222 290 225 320 Q 228 350 225 385 Q 220 410 210 420 Q 195 425 185 415 Q 175 400 175 370 L 175 320 Q 175 290 182 280 Q 190 272 200 272 Q 205 273 210 275 Z"
    ],
    muscleId: "quads"
  },
  // Calves
  calfLeft: {
    paths: [
      "M 120 430 Q 112 450 110 480 Q 108 510 115 535 Q 125 545 135 540 Q 150 530 152 500 Q 153 470 148 445 Q 142 430 130 428 Q 125 428 120 430 Z"
    ],
    muscleId: "calves"
  },
  calfRight: {
    paths: [
      "M 220 430 Q 228 450 230 480 Q 232 510 225 535 Q 215 545 205 540 Q 190 530 188 500 Q 187 470 192 445 Q 198 430 210 428 Q 215 428 220 430 Z"
    ],
    muscleId: "calves"
  },
};

// SVG Path data for each muscle group - Male Back View
const maleBackPaths: Record<string, { paths: string[]; muscleId: MuscleId }> = {
  // Trapezius
  trapsLeft: {
    paths: [
      "M 170 55 Q 155 60 145 75 Q 140 90 145 105 Q 155 115 170 110 Q 170 85 170 55 Z"
    ],
    muscleId: "traps"
  },
  trapsRight: {
    paths: [
      "M 170 55 Q 185 60 195 75 Q 200 90 195 105 Q 185 115 170 110 Q 170 85 170 55 Z"
    ],
    muscleId: "traps"
  },
  // Rear Shoulders
  rearShoulderLeft: {
    paths: [
      "M 105 75 Q 95 85 92 100 Q 90 115 100 125 Q 115 130 125 120 Q 130 105 125 90 Q 120 78 110 75 Q 107 74 105 75 Z"
    ],
    muscleId: "shoulders"
  },
  rearShoulderRight: {
    paths: [
      "M 235 75 Q 245 85 248 100 Q 250 115 240 125 Q 225 130 215 120 Q 210 105 215 90 Q 220 78 230 75 Q 233 74 235 75 Z"
    ],
    muscleId: "shoulders"
  },
  // Lats
  latLeft: {
    paths: [
      "M 125 115 Q 115 125 110 145 Q 108 170 115 195 Q 125 215 140 220 Q 150 215 155 195 Q 160 170 155 145 Q 150 125 140 115 Q 132 112 125 115 Z"
    ],
    muscleId: "lats"
  },
  latRight: {
    paths: [
      "M 215 115 Q 225 125 230 145 Q 232 170 225 195 Q 215 215 200 220 Q 190 215 185 195 Q 180 170 185 145 Q 190 125 200 115 Q 208 112 215 115 Z"
    ],
    muscleId: "lats"
  },
  // Triceps
  tricepLeft: {
    paths: [
      "M 100 125 Q 88 140 85 165 Q 82 185 88 200 Q 98 210 110 200 Q 120 185 120 160 Q 120 140 112 130 Q 106 125 100 125 Z"
    ],
    muscleId: "triceps"
  },
  tricepRight: {
    paths: [
      "M 240 125 Q 252 140 255 165 Q 258 185 252 200 Q 242 210 230 200 Q 220 185 220 160 Q 220 140 228 130 Q 234 125 240 125 Z"
    ],
    muscleId: "triceps"
  },
  // Lower Back
  lowerBack: {
    paths: [
      "M 145 195 Q 140 210 142 235 Q 145 255 155 265 L 170 270 L 185 265 Q 195 255 198 235 Q 200 210 195 195 Q 185 190 170 188 Q 155 190 145 195 Z"
    ],
    muscleId: "lowerBack"
  },
  // Glutes
  gluteLeft: {
    paths: [
      "M 130 265 Q 118 280 115 305 Q 115 330 125 345 Q 140 355 155 345 Q 165 330 165 305 Q 165 280 158 270 Q 150 262 140 263 Q 135 264 130 265 Z"
    ],
    muscleId: "glutes"
  },
  gluteRight: {
    paths: [
      "M 210 265 Q 222 280 225 305 Q 225 330 215 345 Q 200 355 185 345 Q 175 330 175 305 Q 175 280 182 270 Q 190 262 200 263 Q 205 264 210 265 Z"
    ],
    muscleId: "glutes"
  },
  // Hamstrings
  hamstringLeft: {
    paths: [
      "M 125 350 Q 115 370 112 400 Q 110 430 118 455 Q 130 465 145 455 Q 160 440 160 405 Q 160 375 152 358 Q 145 350 135 350 Q 130 350 125 350 Z"
    ],
    muscleId: "hamstrings"
  },
  hamstringRight: {
    paths: [
      "M 215 350 Q 225 370 228 400 Q 230 430 222 455 Q 210 465 195 455 Q 180 440 180 405 Q 180 375 188 358 Q 195 350 205 350 Q 210 350 215 350 Z"
    ],
    muscleId: "hamstrings"
  },
  // Back Calves
  calfBackLeft: {
    paths: [
      "M 118 465 Q 108 485 105 515 Q 103 545 112 565 Q 125 575 138 565 Q 152 550 152 515 Q 152 485 145 468 Q 138 462 128 463 Q 123 464 118 465 Z"
    ],
    muscleId: "calves"
  },
  calfBackRight: {
    paths: [
      "M 222 465 Q 232 485 235 515 Q 237 545 228 565 Q 215 575 202 565 Q 188 550 188 515 Q 188 485 195 468 Q 202 462 212 463 Q 217 464 222 465 Z"
    ],
    muscleId: "calves"
  },
  // Back Forearms
  forearmBackLeft: {
    paths: [
      "M 88 205 Q 78 225 72 255 Q 68 280 75 300 Q 85 308 98 298 Q 108 280 110 250 Q 110 225 102 210 Q 95 205 88 205 Z"
    ],
    muscleId: "forearms"
  },
  forearmBackRight: {
    paths: [
      "M 252 205 Q 262 225 268 255 Q 272 280 265 300 Q 255 308 242 298 Q 232 280 230 250 Q 230 225 238 210 Q 245 205 252 205 Z"
    ],
    muscleId: "forearms"
  },
};

// Body outline paths
const bodyOutlineFront = `
  M 170 15 
  Q 145 15 135 35 Q 125 55 130 70 Q 110 75 95 95 Q 80 115 78 140 
  Q 75 165 80 190 Q 70 210 65 240 Q 60 270 65 295 Q 55 300 55 310
  Q 115 275 130 275 Q 115 300 110 340 Q 105 380 110 420 
  Q 100 440 95 480 Q 90 520 100 555 Q 115 570 135 555 
  Q 140 575 145 590 L 170 590 L 195 590 Q 200 575 205 555 
  Q 225 570 240 555 Q 250 520 245 480 Q 240 440 230 420 
  Q 235 380 230 340 Q 225 300 210 275 Q 225 275 285 310 
  Q 285 300 275 295 Q 280 270 275 240 Q 270 210 260 190 
  Q 265 165 262 140 Q 260 115 245 95 Q 230 75 210 70 
  Q 215 55 205 35 Q 195 15 170 15 Z
`;

const bodyOutlineBack = `
  M 170 15 
  Q 145 15 135 35 Q 125 55 130 70 Q 110 75 95 95 Q 80 115 78 140 
  Q 75 165 80 190 Q 70 210 65 240 Q 60 270 65 295 Q 55 300 55 310
  Q 115 275 130 275 Q 115 300 110 340 Q 105 380 110 420 
  Q 100 440 95 480 Q 90 520 100 555 Q 115 570 135 555 
  Q 140 575 145 590 L 170 590 L 195 590 Q 200 575 205 555 
  Q 225 570 240 555 Q 250 520 245 480 Q 240 440 230 420 
  Q 235 380 230 340 Q 225 300 210 275 Q 225 275 285 310 
  Q 285 300 275 295 Q 280 270 275 240 Q 270 210 260 190 
  Q 265 165 262 140 Q 260 115 245 95 Q 230 75 210 70 
  Q 215 55 205 35 Q 195 15 170 15 Z
`;

interface MusclePathProps {
  id: string;
  paths: string[];
  muscleId: MuscleId;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (id: string | null) => void;
}

function MusclePath({ id, paths, muscleId, isSelected, isHovered, onClick, onHover }: MusclePathProps) {
  const baseColor = isSelected 
    ? "hsl(var(--primary))" 
    : isHovered 
      ? "hsl(var(--primary) / 0.4)"
      : "hsl(var(--muted) / 0.3)";
  
  const strokeColor = isSelected || isHovered
    ? "hsl(var(--primary))"
    : "hsl(var(--border))";

  return (
    <g
      className="cursor-pointer transition-all duration-200"
      onClick={onClick}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
    >
      {paths.map((path, index) => (
        <path
          key={`${id}-${index}`}
          d={path}
          fill={index === 0 ? baseColor : "none"}
          stroke={strokeColor}
          strokeWidth={index === 0 ? 1.5 : 0.8}
          className="transition-all duration-200"
          style={{
            filter: isSelected ? "drop-shadow(0 0 8px hsl(var(--primary) / 0.5))" : "none",
          }}
        />
      ))}
    </g>
  );
}

export default function InteractiveMuscleMap({
  selectedMuscles,
  onSelectionChange,
  language,
}: InteractiveMuscleMapProps) {
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<BodyView>("front");

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

  const getHoveredMuscleName = () => {
    if (!hoveredMuscle) return null;
    const paths = activeView === "front" ? maleFrontPaths : maleBackPaths;
    const muscleData = paths[hoveredMuscle];
    if (!muscleData) return null;
    const muscle = getMuscleById(muscleData.muscleId);
    return muscle?.name[language] || null;
  };

  // Text translations
  const texts = {
    tr: {
      frontView: "Ön Görünüm",
      backView: "Arka Görünüm",
      selectedMuscles: "Seçilen Kaslar",
      clearAll: "Temizle",
      noSelection: "Henüz kas grubu seçilmedi",
      clickToSelect: "Kas seçmek için tıklayın",
      male: "Erkek",
      female: "Kadın",
    },
    en: {
      frontView: "Front View",
      backView: "Back View",
      selectedMuscles: "Selected Muscles",
      clearAll: "Clear All",
      noSelection: "No muscle groups selected yet",
      clickToSelect: "Click to select muscles",
      male: "Male",
      female: "Female",
    },
    de: {
      frontView: "Vorderansicht",
      backView: "Rückansicht",
      selectedMuscles: "Ausgewählte Muskeln",
      clearAll: "Alle löschen",
      noSelection: "Noch keine Muskelgruppen ausgewählt",
      clickToSelect: "Zum Auswählen klicken",
      male: "Männlich",
      female: "Weiblich",
    },
    ru: {
      frontView: "Вид спереди",
      backView: "Вид сзади",
      selectedMuscles: "Выбранные мышцы",
      clearAll: "Очистить",
      noSelection: "Группы мышц еще не выбраны",
      clickToSelect: "Нажмите для выбора мышц",
      male: "Мужчина",
      female: "Женщина",
    },
  };

  const t = texts[language];

  const currentPaths = activeView === "front" ? maleFrontPaths : maleBackPaths;
  const currentOutline = activeView === "front" ? bodyOutlineFront : bodyOutlineBack;

  return (
    <div className="flex flex-col w-full">
      {/* View Toggle */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => setActiveView("front")}
          className={`
            px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
            ${activeView === "front"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }
          `}
        >
          {t.frontView}
        </button>
        <button
          type="button"
          onClick={() => setActiveView("back")}
          className={`
            px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
            ${activeView === "back"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }
          `}
        >
          {t.backView}
        </button>
      </div>

      {/* SVG Body Map */}
      <div className="relative flex justify-center items-center bg-gradient-to-b from-muted/30 to-muted/10 rounded-2xl p-8 min-h-[500px]">
        {/* Hovered Muscle Label */}
        <AnimatePresence>
          {hoveredMuscle && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium shadow-lg z-10"
            >
              {getHoveredMuscleName()}
            </motion.div>
          )}
        </AnimatePresence>

        <svg
          viewBox="0 0 340 600"
          className="w-full max-w-[340px] h-auto"
          style={{ maxHeight: "600px" }}
        >
          {/* Background Body Outline */}
          <path
            d={currentOutline}
            fill="hsl(var(--card))"
            stroke="hsl(var(--border))"
            strokeWidth="2"
          />

          {/* Muscle Groups */}
          {Object.entries(currentPaths).map(([id, data]) => (
            <MusclePath
              key={id}
              id={id}
              paths={data.paths}
              muscleId={data.muscleId}
              isSelected={selectedMuscles.includes(data.muscleId)}
              isHovered={hoveredMuscle === id}
              onClick={() => handleMuscleClick(data.muscleId)}
              onHover={setHoveredMuscle}
            />
          ))}

          {/* Head silhouette */}
          <ellipse
            cx="170"
            cy="35"
            rx="25"
            ry="30"
            fill="hsl(var(--card))"
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
          />

          {/* Neck */}
          <rect
            x="160"
            y="60"
            width="20"
            height="15"
            fill="hsl(var(--card))"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            rx="5"
          />
        </svg>

        {/* Instruction text */}
        {selectedMuscles.length === 0 && !hoveredMuscle && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-muted-foreground">
            {t.clickToSelect}
          </div>
        )}
      </div>

      {/* Selected Muscles Summary */}
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
    </div>
  );
}
