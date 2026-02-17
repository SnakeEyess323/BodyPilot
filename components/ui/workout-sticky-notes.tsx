"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Check, Dumbbell, Flame, ChevronRight, Plus, Trash2, Zap, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useGamification } from "@/context/GamificationContext";
import { useHaftalikProgram } from "@/context/HaftalikProgramContext";
import { useProfil } from "@/context/ProfilContext";
import { useAuth } from "@/context/AuthContext";
import { saveCurrentWeekToHistory, updateHistoryCompletion } from "@/lib/antrenman-gecmis";
import { loadKaloriler, saveKaloriler, estimateKalori, type KaloriMap } from "@/lib/parseProgram";
import { getUserStorageJSON, setUserStorageJSON } from "@/lib/user-storage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { GunAdi } from "@/lib/types";

interface WorkoutDay {
  gun: GunAdi;
  content: string;
  completed: boolean;
  kalori?: number;
}

interface WorkoutStickyNotesProps {
  program: Record<GunAdi, string>;
  onComplete?: (gun: GunAdi) => void;
  className?: string;
}

// Mavi/Cyan renk teması - fitness için
const DAY_COLORS = {
  default: {
    bg: "bg-sky-50 dark:bg-sky-950/50",
    border: "border-sky-200 dark:border-sky-800",
    header: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200",
    accent: "bg-sky-500",
  },
  rest: {
    bg: "bg-slate-50 dark:bg-slate-950/50",
    border: "border-slate-200 dark:border-slate-700",
    header: "bg-slate-100 text-slate-600 dark:bg-slate-900/50 dark:text-slate-300",
    accent: "bg-slate-400",
  },
  completed: {
    bg: "bg-violet-50 dark:bg-violet-950/50",
    border: "border-violet-300 dark:border-violet-700",
    header: "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200",
    accent: "bg-violet-500",
  },
  today: {
    bg: "bg-cyan-50 dark:bg-cyan-950/50",
    border: "border-cyan-300 dark:border-cyan-700",
    header: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200",
    accent: "bg-cyan-500",
  },
};

// Gün emojileri
const DAY_EMOJIS: Record<string, string> = {
  Pazartesi: "💪",
  Salı: "🏋️",
  Çarşamba: "🔥",
  Perşembe: "⚡",
  Cuma: "🎯",
  Cumartesi: "🏃",
  Pazar: "😴",
  Monday: "💪",
  Tuesday: "🏋️",
  Wednesday: "🔥",
  Thursday: "⚡",
  Friday: "🎯",
  Saturday: "🏃",
  Sunday: "😴",
  Montag: "💪",
  Dienstag: "🏋️",
  Mittwoch: "🔥",
  Donnerstag: "⚡",
  Freitag: "🎯",
  Samstag: "🏃",
  Sonntag: "😴",
  Понедельник: "💪",
  Вторник: "🏋️",
  Среда: "🔥",
  Четверг: "⚡",
  Пятница: "🎯",
  Суббота: "🏃",
  Воскресенье: "😴",
};

// Dinlenme günü kontrolü
function isRestDay(content: string): boolean {
  if (!content || content.trim() === "") return true;
  const lower = content.toLowerCase();
  return (
    lower.includes("dinlen") ||
    lower.includes("rest") ||
    lower.includes("ruhe") ||
    lower.includes("отдых") ||
    lower === "-" ||
    lower === "yok"
  );
}

// Türkçe gün sırası (dahili anahtar olarak her zaman kullanılır)
// Note: This will be replaced with t.extra.dayNames in the component
const TURKISH_DAYS: GunAdi[] = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

// Bugünün gününü Türkçe GunAdi olarak al
// Note: This function will use t.extra.dayNames in the component
function getTodayGunAdi(dayNames: readonly string[]): GunAdi {
  // getDay() returns 0=Sunday, 1=Monday, etc.
  // dayNames is [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
  // We need [Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday]
  const reorderedDays = [dayNames[6], ...dayNames.slice(0, 6)];
  const dayIndex = new Date().getDay();
  // Map translated name back to Turkish GunAdi
  const turkishDays: GunAdi[] = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  return turkishDays[dayIndex];
}

// User-scoped localStorage key
const COMPLETED_WORKOUTS_KEY = "bodypilot-completed-workouts";

function loadCompletedWorkouts(userId: string): Record<string, string[]> {
  if (!userId) return {};
  return getUserStorageJSON<Record<string, string[]>>(COMPLETED_WORKOUTS_KEY, userId) ?? {};
}

function saveCompletedWorkouts(userId: string, data: Record<string, string[]>) {
  if (!userId) return;
  setUserStorageJSON(COMPLETED_WORKOUTS_KEY, userId, data);
}

// Bu haftanın key'ini al
function getWeekKey(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNumber}`;
}

export function WorkoutStickyNotes({ program, onComplete: onCompleteProp, className }: WorkoutStickyNotesProps) {
  const { t, language } = useLanguage();
  const { completeWorkout } = useGamification();
  const { setGun } = useHaftalikProgram();
  const { profil } = useProfil();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [kaloriler, setKaloriler] = useState<KaloriMap>({});
  const [newExercise, setNewExercise] = useState("");
  const newExerciseRef = useRef<HTMLInputElement>(null);

  // Load completed workouts & kalori from user-scoped storage
  useEffect(() => {
    if (!userId) {
      setCompletedDays([]);
      setKaloriler({});
      return;
    }
    const stored = loadCompletedWorkouts(userId);
    setCompletedDays(stored[getWeekKey()] || []);
    setKaloriler(loadKaloriler(userId));
  }, [userId]);

  // Gün sırası her zaman Türkçe key olarak kalır (GunAdi type)
  const gunSirasi = TURKISH_DAYS;
  
  // Gün görüntüleme isimlerini al (dile göre) - Türkçe key → çevrilmiş isim
  const dayDisplayNames = useMemo(() => {
    const dayNames = t.extra.dayNames;
    return {
      Pazartesi: dayNames[0], // Monday
      Salı: dayNames[1], // Tuesday
      Çarşamba: dayNames[2], // Wednesday
      Perşembe: dayNames[3], // Thursday
      Cuma: dayNames[4], // Friday
      Cumartesi: dayNames[5], // Saturday
      Pazar: dayNames[6], // Sunday
    } as Record<GunAdi, string>;
  }, [t.extra.dayNames]);

  const todayGun = useMemo(() => getTodayGunAdi(t.extra.dayNames), [t.extra.dayNames]);

  // Antrenman günlerini hazırla
  const workoutDays = useMemo((): WorkoutDay[] => {
    return gunSirasi.map((gun) => ({
      gun,
      content: program[gun] || "",
      completed: completedDays.includes(gun),
      kalori: kaloriler[gun],
    }));
  }, [gunSirasi, program, completedDays, kaloriler]);

  // Tamamlanan antrenman sayısı
  const completedCount = useMemo(
    () => workoutDays.filter((d) => d.completed && !isRestDay(d.content)).length,
    [workoutDays]
  );

  // Toplam antrenman günü (dinlenme hariç)
  const totalWorkoutDays = useMemo(
    () => workoutDays.filter((d) => !isRestDay(d.content)).length,
    [workoutDays]
  );

  // Haftalık toplam kalori
  const totalKalori = useMemo(
    () => workoutDays.reduce((sum, d) => sum + (d.kalori || 0), 0),
    [workoutDays]
  );

  // Kalori guncelle ve kaydet (profildeki kiloyu kullanarak)
  const updateKalori = useCallback((gun: GunAdi, content: string) => {
    const estimated = estimateKalori(content, profil.kilo);
    setKaloriler((prev) => {
      const next = { ...prev };
      if (estimated > 0) {
        next[gun] = estimated;
      } else {
        delete next[gun];
      }
      if (userId) saveKaloriler(userId, next);
      return next;
    });
    // selectedDay'in kalorisini de guncelle
    setSelectedDay((prev) => prev ? { ...prev, kalori: estimated > 0 ? estimated : undefined } : null);
  }, [profil.kilo, userId]);

  // Satır silme
  const handleDeleteLine = useCallback((gun: GunAdi, lineIndex: number) => {
    const currentContent = program[gun] || "";
    const lines = currentContent.split("\n").filter((l) => l.trim() !== "");
    lines.splice(lineIndex, 1);
    const newContent = lines.join("\n");
    setGun(gun, newContent);
    setSelectedDay((prev) => prev ? { ...prev, content: newContent } : null);
    // Kaloriyi yeniden hesapla
    updateKalori(gun, newContent);
  }, [program, setGun, updateKalori]);

  // Satır ekleme
  const handleAddLine = useCallback((gun: GunAdi, text: string) => {
    if (!text.trim()) return;
    const currentContent = program[gun] || "";
    // Eger icerik "Dinlenme", "rest" vs. ise once temizle
    const cleanedCurrent = isRestDay(currentContent) ? "" : currentContent;
    const newContent = cleanedCurrent ? `${cleanedCurrent}\n${text.trim()}` : text.trim();
    setGun(gun, newContent);
    setSelectedDay((prev) => prev ? { ...prev, content: newContent } : null);
    setNewExercise("");
    // Kaloriyi yeniden hesapla
    updateKalori(gun, newContent);
  }, [program, setGun, updateKalori]);

  // Antrenmanı tamamla
  const handleComplete = useCallback((gun: GunAdi) => {
    if (!userId) return;
    setCompletedDays((prev) => {
      const next = prev.includes(gun) ? prev.filter((g) => g !== gun) : [...prev, gun];
      const weekKey = getWeekKey();
      const stored = loadCompletedWorkouts(userId);
      stored[weekKey] = next;
      saveCompletedWorkouts(userId, stored);
      
      // Gamification - sadece yeni tamamlanıyorsa XP ver
      if (!prev.includes(gun)) {
        completeWorkout();
      }

      // Gecmise kaydet
      saveCurrentWeekToHistory(userId);
      updateHistoryCompletion(userId, weekKey, next as GunAdi[]);
      
      return next;
    });

    // Parent'a bildir (state updater disinda)
    onCompleteProp?.(gun);
  }, [userId, completeWorkout, onCompleteProp]);

  // Program boşsa
  const hasProgram = useMemo(
    () => Object.values(program).some((v) => v && v.trim() !== ""),
    [program]
  );

  // Program yuklendiginde mevcut haftayi gecmise kaydet
  useEffect(() => {
    if (hasProgram && userId) {
      saveCurrentWeekToHistory(userId);
    }
  }, [hasProgram, userId]);

  if (!hasProgram) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Haftalık özet */}
      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-sky-500/10 via-cyan-500/10 to-teal-500/10 border border-sky-500/20 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 shadow-md">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t.dashboard.weeklyWorkout || "Haftalık Antrenman"}</h3>
            <p className="text-sm text-muted-foreground">
              {completedCount}/{totalWorkoutDays} {t.extra.workoutsCompleted}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {totalKalori > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-orange-500/15 px-3 py-1.5 text-orange-600 dark:text-orange-400">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">~{totalKalori} kcal</span>
            </div>
          )}
          {completedCount === totalWorkoutDays && totalWorkoutDays > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-violet-500/20 px-3 py-1.5 text-violet-600 dark:text-violet-400">
              <Flame className="h-4 w-4" />
              <span className="text-sm font-medium">{t.extra.perfectWeek}</span>
            </div>
          )}
        </div>
      </div>

      {/* Günler */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {workoutDays.map((day) => {
          const { gun, content, completed } = day;
          const rest = isRestDay(content);
          const isToday = gun === todayGun;
          
          // Renk seçimi
          let colors = DAY_COLORS.default;
          if (completed && !rest) {
            colors = DAY_COLORS.completed;
          } else if (rest) {
            colors = DAY_COLORS.rest;
          } else if (isToday) {
            colors = DAY_COLORS.today;
          }

          const handleCardClick = (e: React.MouseEvent) => {
            // Butonlara tıklanınca modal açılmasın
            if ((e.target as HTMLElement).closest("button")) return;
            // Tum gunler tiklanabilir (dinlenme dahil)
            setSelectedDay(day);
            setIsDetailOpen(true);
          };

          return (
            <div
              key={gun}
              onClick={handleCardClick}
              className={cn(
                "relative rounded-xl border-2 p-3 transition-all duration-200",
                "hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
                colors.bg,
                colors.border,
                isToday && "ring-2 ring-cyan-500/30",
                "transform",
                !rest && !completed && "hover:border-sky-400",
                rest && "hover:border-slate-400"
              )}
            >
              {/* Üst kıvrık köşe efekti */}
              <div
                className={cn(
                  "absolute -top-1 -right-1 w-5 h-5 rounded-bl-lg shadow-sm",
                  colors.header
                )}
                style={{
                  clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
                }}
              />

              {/* Tamamlandı badge */}
              {completed && !rest && (
                <div className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-white shadow-md">
                  <Check className="h-4 w-4" />
                </div>
              )}

              {/* Gün başlığı */}
              <div className="mb-2 flex items-center justify-between">
                <span className={cn(
                  "text-xs font-semibold",
                  isToday ? "text-cyan-600 dark:text-cyan-400" : "text-muted-foreground"
                )}>
                  {DAY_EMOJIS[dayDisplayNames[gun]] || DAY_EMOJIS[gun] || "🏋️"} {dayDisplayNames[gun]}
                </span>
                {isToday && (
                  <span className="text-[10px] font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                    {t.calendar?.today || "Bugün"}
                  </span>
                )}
              </div>

              {/* Kalori rozeti */}
              {day.kalori && !rest && (
                <div className="mb-1.5 flex items-center gap-1 text-[10px] font-medium text-orange-600 dark:text-orange-400">
                  <Zap className="h-3 w-3" />
                  ~{day.kalori} kcal
                </div>
              )}

              {/* İçerik */}
              <div className="min-h-[60px]">
                {rest ? (
                  <div className="flex flex-col items-center justify-center h-full py-2">
                    <span className="text-2xl mb-1">😴</span>
                    <span className="text-xs text-muted-foreground">{t.extra.rest}</span>
                    <span className="mt-1 text-[10px] text-muted-foreground/60 flex items-center gap-1">
                      <PlusCircle className="h-3 w-3" />
                      {t.common.edit}
                    </span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-foreground line-clamp-3 whitespace-pre-line">
                      {content}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground text-center">
                      {t.dashboard.clickForDetails || "Detay için tıkla"}
                    </p>
                  </>
                )}
              </div>

              {/* Tamamla butonu */}
              {!rest && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleComplete(gun);
                  }}
                  className={cn(
                    "mt-2 w-full rounded-lg py-1.5 text-xs font-medium transition-all flex items-center justify-center gap-1",
                    completed
                      ? "bg-violet-500 text-white hover:bg-violet-600"
                      : "bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 border border-sky-500/30"
                  )}
                >
                  {completed ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      {t.dashboard.done || "Tamamlandı"}
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-3.5 w-3.5" />
                      {t.dashboard.markComplete || "Tamamla"}
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Detay & Düzenleme Modal */}
      <Dialog open={isDetailOpen} onOpenChange={(open) => {
        setIsDetailOpen(open);
        if (!open) setNewExercise("");
      }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedDay && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sky-500" />
                  <span className="text-xs text-muted-foreground">
                    {selectedDay.gun === todayGun ? (t.calendar?.today || "Bugün") : dayDisplayNames[selectedDay.gun]}
                  </span>
                  {selectedDay.completed && !isRestDay(selectedDay.content) && (
                    <span className="text-xs bg-violet-500/20 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">
                      ✓ {t.dashboard.done || "Tamamlandı"}
                    </span>
                  )}
                  {selectedDay.kalori && selectedDay.kalori > 0 && (
                    <span className="text-xs bg-orange-500/15 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      ~{selectedDay.kalori} kcal
                    </span>
                  )}
                </div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  {DAY_EMOJIS[dayDisplayNames[selectedDay.gun]] || DAY_EMOJIS[selectedDay.gun] || "🏋️"} {dayDisplayNames[selectedDay.gun]} {isRestDay(selectedDay.content)
                    ? `- ${t.common.edit}`
                    : t.dashboard.workout}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Egzersiz satırları - düzenlenebilir */}
                <div className="rounded-xl bg-sky-50 dark:bg-sky-950/50 p-4 border border-sky-200 dark:border-sky-800">
                  <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-sky-500" />
                    {isRestDay(selectedDay.content)
                      ? t.extra.restDayMessage
                      : t.dashboard.workoutDetails}
                  </h4>
                  
                  {/* Mevcut egzersizler (dinlenme degilse) */}
                  {!isRestDay(selectedDay.content) && (
                    <div className="space-y-1.5">
                      {selectedDay.content
                        .split("\n")
                        .filter((line) => line.trim() !== "")
                        .map((line, idx) => (
                          <div
                            key={idx}
                            className="group flex items-start gap-2 rounded-lg px-3 py-2 bg-white/60 dark:bg-white/5 border border-transparent hover:border-red-300/50 dark:hover:border-red-700/50 transition-colors"
                          >
                            <span className="flex-1 text-sm text-foreground/90 leading-relaxed">
                              {line}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteLine(selectedDay.gun, idx)}
                              className="flex-shrink-0 mt-0.5 p-1 rounded-md opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/10 transition-all"
                              title="Sil"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Dinlenme gunu ise bilgi mesaji */}
                  {isRestDay(selectedDay.content) && (
                    <div className="mb-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 p-3 text-center">
                      <p className="text-sm text-muted-foreground">
                        {t.extra.restDayMessage}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {t.extra.autoCalorie}
                      </p>
                    </div>
                  )}

                  {/* Yeni egzersiz ekleme */}
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      ref={newExerciseRef}
                      type="text"
                      value={newExercise}
                      onChange={(e) => setNewExercise(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddLine(selectedDay.gun, newExercise);
                        }
                      }}
                      placeholder={t.extra.extraExercisePlaceholder}
                      className="flex-1 rounded-lg border border-sky-200 dark:border-sky-800 bg-white dark:bg-sky-950/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddLine(selectedDay.gun, newExercise)}
                      disabled={!newExercise.trim()}
                      className="flex-shrink-0 rounded-lg bg-sky-500 p-2 text-white hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Aksiyonlar */}
                <div className="flex gap-2 pt-2">
                  {!isRestDay(selectedDay.content) && (
                    <Button
                      variant={selectedDay.completed ? "default" : "outline"}
                      onClick={() => {
                        handleComplete(selectedDay.gun);
                        setSelectedDay({
                          ...selectedDay,
                          completed: !selectedDay.completed,
                        });
                      }}
                      className={cn(
                        "flex-1 gap-2",
                        selectedDay.completed && "bg-violet-500 hover:bg-violet-600"
                      )}
                    >
                      <Check className="h-4 w-4" />
                      {selectedDay.completed
                        ? (t.dashboard.done || "Tamamlandı")
                        : (t.dashboard.markComplete || "Tamamla")}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailOpen(false)}
                    className={isRestDay(selectedDay.content) ? "flex-1" : ""}
                  >
                    {t.common?.close || "Kapat"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WorkoutStickyNotes;
