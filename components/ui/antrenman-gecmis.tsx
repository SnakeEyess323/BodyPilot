"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Calendar,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Trophy,
  History,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type AntrenmanGecmisHafta,
  getHistoryWithCurrentWeek,
  getWeekLabel,
  getCurrentWeekKey,
} from "@/lib/antrenman-gecmis";
import type { GunAdi } from "@/lib/types";

// =============================================================================
// CONSTANTS
// =============================================================================

const GUN_SIRASI: GunAdi[] = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

const GUN_KISA: Record<GunAdi, string> = {
  Pazartesi: "Pzt",
  Salı: "Sal",
  Çarşamba: "Çar",
  Perşembe: "Per",
  Cuma: "Cum",
  Cumartesi: "Cmt",
  Pazar: "Paz",
};

// =============================================================================
// HELPERS
// =============================================================================

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

/** Icerik ozetini cikarir. Ornegin "Gogus + Triceps" */
function getContentSummary(content: string): string {
  if (!content || content.trim() === "") return "Dinlenme";
  if (isRestDay(content)) return "Dinlenme";

  // Satir baslarindaki ana kas gruplarini veya ilk satiri al
  const lines = content.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return content.substring(0, 30);

  // Ilk satir genellikle baslik olur
  const firstLine = lines[0].replace(/^[#*\-•]+\s*/, "").trim();

  if (firstLine.length <= 35) return firstLine;
  return firstLine.substring(0, 32) + "...";
}

// =============================================================================
// COMPONENT: DayCell
// =============================================================================

interface DayCellProps {
  content: string;
  completed: boolean;
  isCurrentWeek: boolean;
  onClick: () => void;
}

function DayCell({ content, completed, isCurrentWeek, onClick }: DayCellProps) {
  const rest = isRestDay(content);
  const summary = getContentSummary(content);
  const hasContent = content && content.trim() !== "";

  return (
    <button
      onClick={onClick}
      disabled={!hasContent || rest}
      className={cn(
        "relative w-full rounded-lg p-2 text-left transition-all duration-150 min-h-[52px]",
        "border text-xs leading-tight",
        rest
          ? "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-default"
          : completed
            ? "bg-violet-50 dark:bg-violet-950/40 border-violet-300 dark:border-violet-800 cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-950/60"
            : isCurrentWeek
              ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/50"
              : "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800/60 cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/50"
      )}
    >
      {/* Status icon */}
      {!rest && (
        <div className="absolute top-1 right-1">
          {completed ? (
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-white">
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
            </div>
          ) : (
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-red-400/80 dark:bg-red-500/60 text-white">
              <X className="h-2.5 w-2.5" strokeWidth={3} />
            </div>
          )}
        </div>
      )}

      <span
        className={cn(
          "block pr-5 font-medium",
          rest
            ? "text-slate-400 dark:text-slate-600"
            : completed
              ? "text-violet-700 dark:text-violet-400"
              : "text-foreground/80"
        )}
      >
        {rest ? "😴 Dinlenme" : summary}
      </span>
    </button>
  );
}

// =============================================================================
// COMPONENT: WeekRow
// =============================================================================

interface WeekRowProps {
  week: AntrenmanGecmisHafta;
  isCurrentWeek: boolean;
  onCellClick: (week: AntrenmanGecmisHafta, gun: GunAdi) => void;
  onCopyWeek?: (program: Record<string, string>) => void;
}

function WeekRow({ week, isCurrentWeek, onCellClick, onCopyWeek }: WeekRowProps) {
  const label = getWeekLabel(week.weekKey, week.startDate);
  const workoutDays = GUN_SIRASI.filter(
    (g) => !isRestDay(week.program[g] || "")
  );
  const completedCount = workoutDays.filter((g) =>
    week.completed.includes(g)
  ).length;
  const totalDays = workoutDays.length;
  const ratio = totalDays > 0 ? completedCount / totalDays : 0;

  return (
    <tr
      className={cn(
        "group transition-colors",
        isCurrentWeek
          ? "bg-sky-50/50 dark:bg-sky-950/20"
          : "hover:bg-muted/30"
      )}
    >
      {/* Hafta Label */}
      <td className="py-2 px-2 sm:px-3 align-middle">
        <div className="flex flex-col gap-0.5">
          <span
            className={cn(
              "text-xs sm:text-sm font-semibold whitespace-nowrap",
              isCurrentWeek
                ? "text-sky-600 dark:text-sky-400"
                : "text-foreground"
            )}
          >
            {isCurrentWeek && (
              <span className="inline-block w-2 h-2 rounded-full bg-sky-500 mr-1.5 animate-pulse" />
            )}
            {label}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {week.weekKey}
          </span>
          {!isCurrentWeek && onCopyWeek && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCopyWeek(week.program);
              }}
              className="mt-1 inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
              title="Bu haftanın programını tekrar kullan"
            >
              <Copy className="h-3 w-3" />
              <span className="hidden sm:inline">Aynısını Ekle</span>
              <span className="sm:hidden">Ekle</span>
            </button>
          )}
        </div>
      </td>

      {/* Gun hucreleri */}
      {GUN_SIRASI.map((gun) => (
        <td key={gun} className="py-2 px-0.5 sm:px-1 align-middle">
          <DayCell
            content={week.program[gun] || ""}
            completed={week.completed.includes(gun)}
            isCurrentWeek={isCurrentWeek}
            onClick={() => onCellClick(week, gun)}
          />
        </td>
      ))}

      {/* Ozet */}
      <td className="py-2 px-2 sm:px-3 align-middle text-center">
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "text-sm font-bold",
              ratio === 1 && totalDays > 0
                ? "text-violet-600 dark:text-violet-400"
                : ratio >= 0.5
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-red-500 dark:text-red-400"
            )}
          >
            {completedCount}/{totalDays}
          </div>
          {/* Progress bar */}
          <div className="w-full max-w-[50px] h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                ratio === 1 && totalDays > 0
                  ? "bg-violet-500"
                  : ratio >= 0.5
                    ? "bg-amber-500"
                    : "bg-red-400"
              )}
              style={{ width: `${ratio * 100}%` }}
            />
          </div>
          {ratio === 1 && totalDays > 0 && (
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
          )}
        </div>
      </td>
    </tr>
  );
}

// =============================================================================
// COMPONENT: AntrenmanGecmis (Main Export)
// =============================================================================

interface AntrenmanGecmisProps {
  className?: string;
  /** Disaridan tetiklenecek refresh sayaci */
  refreshTrigger?: number;
  /** Gecmis bir haftanin programini kopyalamak icin callback */
  onCopyWeek?: (program: Record<string, string>) => void;
}

export function AntrenmanGecmis({ className, refreshTrigger, onCopyWeek }: AntrenmanGecmisProps) {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [history, setHistory] = useState<AntrenmanGecmisHafta[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState<{
    week: AntrenmanGecmisHafta;
    gun: GunAdi;
  } | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Gecmisi yukle (user-scoped)
  useEffect(() => {
    if (userId) {
      const data = getHistoryWithCurrentWeek(userId);
      setHistory(data);
    } else {
      setHistory([]);
    }
  }, [refreshTrigger, userId]);

  const currentWeekKey = useMemo(() => getCurrentWeekKey(), []);

  const handleCellClick = useCallback(
    (week: AntrenmanGecmisHafta, gun: GunAdi) => {
      const content = week.program[gun] || "";
      if (!content || content.trim() === "" || isRestDay(content)) return;
      setSelectedDetail({ week, gun });
      setIsDetailOpen(true);
    },
    []
  );

  // Bos gecmis
  if (history.length === 0) {
    return (
      <div className={cn("rounded-xl border border-border bg-card p-6", className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-400 to-slate-500 shadow-md">
            <History className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Antrenman Geçmişi</h3>
            <p className="text-xs text-muted-foreground">
              Haftalık antrenman geçmişiniz burada görüntülenir
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">Henüz antrenman geçmişi yok</p>
          <p className="text-xs mt-1">
            Program oluşturup antrenmanlarınızı tamamladıkça burada görünecek
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border bg-card shadow-sm", className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded((p) => !p)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-muted/30 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-md">
            <History className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-foreground">
              Antrenman Geçmişi
            </h3>
            <p className="text-xs text-muted-foreground">
              Son {history.length} hafta
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick stats */}
          <div className="hidden sm:flex items-center gap-3 mr-3">
            {(() => {
              const totalWorkouts = history.reduce(
                (acc, w) =>
                  acc +
                  GUN_SIRASI.filter((g) => !isRestDay(w.program[g] || "")).filter(
                    (g) => w.completed.includes(g)
                  ).length,
                0
              );
              return (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Dumbbell className="h-3.5 w-3.5" />
                  {totalWorkouts} antrenman
                </span>
              );
            })()}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Table */}
      {isExpanded && (
        <div className="px-2 sm:px-4 pb-4 overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="border-b border-border/60">
                <th className="py-2 px-2 sm:px-3 text-left text-xs font-semibold text-muted-foreground w-[100px]">
                  <Clock className="h-3.5 w-3.5 inline mr-1" />
                  Hafta
                </th>
                {GUN_SIRASI.map((gun) => (
                  <th
                    key={gun}
                    className="py-2 px-0.5 sm:px-1 text-center text-xs font-semibold text-muted-foreground"
                  >
                    {GUN_KISA[gun]}
                  </th>
                ))}
                <th className="py-2 px-2 sm:px-3 text-center text-xs font-semibold text-muted-foreground w-[60px]">
                  Durum
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {history.map((week) => (
                <WeekRow
                  key={week.weekKey}
                  week={week}
                  isCurrentWeek={week.weekKey === currentWeekKey}
                  onCellClick={handleCellClick}
                  onCopyWeek={onCopyWeek}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          {selectedDetail && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-3 h-3 rounded-full",
                      selectedDetail.week.completed.includes(selectedDetail.gun)
                        ? "bg-violet-500"
                        : "bg-red-400"
                    )}
                  />
                  <span className="text-xs text-muted-foreground">
                    {getWeekLabel(
                      selectedDetail.week.weekKey,
                      selectedDetail.week.startDate
                    )}{" "}
                    - {selectedDetail.gun}
                  </span>
                  {selectedDetail.week.completed.includes(
                    selectedDetail.gun
                  ) && (
                    <span className="text-xs bg-violet-500/20 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">
                      ✓ Tamamlandı
                    </span>
                  )}
                </div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-violet-500" />
                  {selectedDetail.gun} Antrenmanı
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="rounded-xl bg-violet-50 dark:bg-violet-950/30 p-4 border border-violet-200 dark:border-violet-800">
                  <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-violet-500" />
                    Antrenman Detayları
                  </h4>
                  <div className="text-foreground/90 text-sm whitespace-pre-line leading-relaxed max-h-[400px] overflow-y-auto">
                    {selectedDetail.week.program[selectedDetail.gun]}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AntrenmanGecmis;
