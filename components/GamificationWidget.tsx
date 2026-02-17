"use client";

import { useMemo } from "react";
import { Flame, Star, Trophy, CheckCircle2, Circle, Lock, Sparkles } from "lucide-react";
import { useGamification } from "@/context/GamificationContext";
import { useLanguage } from "@/context/LanguageContext";
import { getDailyQuote, BADGES, DAILY_TASKS, type LevelTitle } from "@/lib/gamification";
import type { BadgeId, DailyTaskId } from "@/lib/types";
import { cn } from "@/lib/utils";

// ============ Streak Widget (Compact with 7-day streak view) ============
export function StreakWidget() {
  const { currentStreak, longestStreak, visitHistory, isLoaded } = useGamification();
  const { t } = useLanguage();

  // Get last 7 days (including today) using local dates
  const last7Days = useMemo(() => {
    const today = new Date();
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    }
    return dates;
  }, []);

  // Check which of the last 7 days are visited
  const visitedDays = useMemo(() => {
    return last7Days.map(date => visitHistory.includes(date));
  }, [last7Days, visitHistory]);

  if (!isLoaded) {
    return (
      <div className="animate-pulse rounded-xl bg-card border border-border p-3 h-20" />
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500/10 via-red-500/10 to-yellow-500/10 border border-orange-500/20 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 shadow-md">
          <Flame className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">{currentStreak}</span>
            <span className="text-xs text-muted-foreground">{t.gamification.streakDays}</span>
            {currentStreak >= 7 && <span className="text-base">🔥</span>}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {t.gamification.longestStreak}: {longestStreak} {t.gamification.days}
          </p>
        </div>
        
        {/* 7-day streak dots */}
        <div className="flex items-center gap-1">
          {visitedDays.map((visited, idx) => (
            <div
              key={idx}
              className={cn(
                "h-4 w-4 rounded-full flex items-center justify-center text-[8px] transition-all",
                visited
                  ? "bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-sm"
                  : idx === 6
                    ? "border-2 border-orange-500/50 bg-transparent"
                    : "bg-muted/40"
              )}
            >
              {visited && "✓"}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ XP & Level Widget (Compact) ============
export function XPLevelWidget() {
  const { totalXP, level, levelTitle, xpProgress, xpForNextLevel, isLoaded } = useGamification();
  const { t } = useLanguage();

  const translatedTitle = t.gamification.levels[levelTitle as LevelTitle] || levelTitle;
  const xpRemaining = xpForNextLevel - totalXP;

  if (!isLoaded) {
    return (
      <div className="animate-pulse rounded-xl bg-card border border-border p-3 h-24" />
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 border border-purple-500/20 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 shadow-md">
          <Star className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-foreground">{t.gamification.level} {level}</span>
            <span className="rounded-full bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-medium text-purple-600 dark:text-purple-400 truncate">
              {translatedTitle}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(xpProgress, 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{Math.round(xpProgress)}%</span>
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {totalXP} XP • {xpRemaining > 0 ? `${xpRemaining} ${t.gamification.xpToGo}` : "Max!"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============ Daily Tasks Widget (Compact) ============
export function DailyTasksWidget() {
  const { completedTasks, completeTask, isTaskCompleted, isLoaded } = useGamification();
  const { t } = useLanguage();

  const tasks = DAILY_TASKS.map((task) => ({
    ...task,
    name: t.gamification.tasks[task.id as DailyTaskId],
    completed: isTaskCompleted(task.id),
  }));

  const completedCount = tasks.filter((t) => t.completed).length;
  const allComplete = completedCount === tasks.length;

  if (!isLoaded) {
    return (
      <div className="animate-pulse rounded-xl bg-card border border-border p-3 h-32" />
    );
  }

  return (
    <div className="rounded-xl bg-card border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <CheckCircle2 className="h-4 w-4 text-purple-500" />
          {t.gamification.dailyTasks}
        </h3>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{tasks.length}
        </span>
      </div>

      {allComplete && (
        <div className="mb-2 rounded-md bg-purple-500/10 border border-purple-500/20 px-2 py-1 text-center">
          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
            🎉 {t.gamification.allTasksComplete}
          </span>
        </div>
      )}

      <div className="space-y-1">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => !task.completed && completeTask(task.id)}
            disabled={task.completed}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left transition-all",
              task.completed
                ? "bg-purple-500/10"
                : "hover:bg-muted/50"
            )}
          >
            {task.completed ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            )}
            <span className={cn(
              "flex-1 text-xs",
              task.completed ? "text-purple-600 dark:text-purple-400 line-through" : "text-foreground"
            )}>
              {task.icon} {task.name}
            </span>
            <span className="text-[10px] text-muted-foreground">+{task.xpReward}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ Badges Widget (Compact) ============
export function BadgesWidget() {
  const { unlockedBadges, isLoaded } = useGamification();
  const { t } = useLanguage();

  const allBadges = Object.values(BADGES).map((badge) => ({
    ...badge,
    name: t.gamification.badgeNames[badge.id as BadgeId],
    description: t.gamification.badgeDescriptions[badge.id as BadgeId],
    unlocked: unlockedBadges.includes(badge.id),
  }));

  if (!isLoaded) {
    return (
      <div className="animate-pulse rounded-xl bg-card border border-border p-2" />
    );
  }

  return (
    <div className="rounded-xl bg-card border border-border p-3">
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Trophy className="h-4 w-4 text-yellow-500" />
        {t.gamification.badges}
        <span className="text-xs font-normal text-muted-foreground">
          ({unlockedBadges.length}/{allBadges.length})
        </span>
      </h3>

      <div className="grid grid-cols-5 gap-1.5">
        {allBadges.map((badge) => (
          <div
            key={badge.id}
            className={cn(
              "flex flex-col items-center rounded-lg p-1.5",
              badge.unlocked
                ? "bg-yellow-500/10"
                : "bg-muted/30 opacity-50"
            )}
            title={badge.unlocked ? badge.description : t.gamification.locked}
          >
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full text-lg",
              badge.unlocked
                ? "bg-gradient-to-br from-yellow-400 to-orange-500 shadow-sm"
                : "bg-muted"
            )}>
              {badge.unlocked ? badge.icon : <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
            <span className="text-[9px] text-center font-medium text-muted-foreground truncate w-full leading-tight mt-1">
              {badge.name.split(" ")[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Motivation Quote Widget ============
export function MotivationQuoteWidget() {
  const { t, language } = useLanguage();
  
  const quote = useMemo(
    () => getDailyQuote(language),
    [language]
  );

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border border-violet-500/20 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-500 shadow-md flex-shrink-0">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <p className="text-sm italic text-muted-foreground flex-1">&ldquo;{quote}&rdquo;</p>
      </div>
    </div>
  );
}

// ============ Combined Gamification Section ============
export function GamificationSection() {
  return (
    <div className="space-y-3">
      {/* Motivation Quote */}
      <MotivationQuoteWidget />
      
      {/* Top row: Streak + XP */}
      <div className="grid gap-3 sm:grid-cols-2">
        <StreakWidget />
        <XPLevelWidget />
      </div>
      
      {/* Bottom row: Daily Tasks + Badges (side by side) */}
      <div className="grid gap-3 sm:grid-cols-2 items-start">
        <DailyTasksWidget />
        <BadgesWidget />
      </div>
    </div>
  );
}
