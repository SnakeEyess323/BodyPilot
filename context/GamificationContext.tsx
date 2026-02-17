"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import type {
  GamificationData,
  BadgeId,
  DailyTaskId,
} from "@/lib/types";
import {
  calculateLevel,
  getLevelTitle,
  getXPForNextLevel,
  XP_REWARDS,
  BADGES,
  checkBadgeUnlock,
} from "@/lib/gamification";
import { useAuth } from "@/context/AuthContext";
import { getUserData, setUserData } from "@/lib/supabase/data-service";
import {
  getUserStorageJSON,
  setUserStorageJSON,
} from "@/lib/user-storage";

const STORAGE_KEY = "bodypilot-gamification";

const DEFAULT_DATA: GamificationData = {
  currentStreak: 0,
  longestStreak: 0,
  lastVisitDate: null,
  totalXP: 0,
  unlockedBadges: [],
  dailyTasksDate: null,
  completedTasks: [],
  totalWorkouts: 0,
  totalMealDaysFollowed: 0,
  visitHistory: [],
  challengesCompleted: 0,
  challengesWon: 0,
  referralsCount: 0,
};

interface GamificationContextType {
  data: GamificationData;
  isLoaded: boolean;

  // Streak
  currentStreak: number;
  longestStreak: number;
  visitHistory: string[];

  // XP & Level
  totalXP: number;
  level: number;
  levelTitle: string;
  xpForNextLevel: number;
  xpProgress: number; // 0-100 percentage

  // Badges
  unlockedBadges: BadgeId[];
  newlyUnlockedBadge: BadgeId | null;
  clearNewBadge: () => void;

  // Daily Tasks
  completedTasks: DailyTaskId[];
  completeTask: (taskId: DailyTaskId) => void;
  isTaskCompleted: (taskId: DailyTaskId) => boolean;

  // Actions
  addXP: (amount: number, reason?: string) => void;
  completeWorkout: () => void;
  completeMealDay: () => void;

  // Stats
  totalWorkouts: number;
  totalMealDaysFollowed: number;
}

const GamificationContext = createContext<GamificationContextType | undefined>(
  undefined
);

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getToday(): string {
  return toLocalDateStr(new Date());
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalDateStr(d);
}

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<GamificationData>(DEFAULT_DATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<BadgeId | null>(null);

  // Keep a ref to user id for the persist effect
  const userIdRef = useRef<string | null>(null);
  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user]);

  // Load from user-scoped localStorage first, then Supabase
  useEffect(() => {
    // Reset state so old user's data is never visible
    setData(DEFAULT_DATA);
    setIsLoaded(false);

    if (!user) {
      setIsLoaded(true);
      return;
    }

    // Load from user-scoped localStorage (fast)
    const stored = getUserStorageJSON<GamificationData>(STORAGE_KEY, user.id);
    if (stored && typeof stored === "object") {
      setData({ ...DEFAULT_DATA, ...stored });
    }
    setIsLoaded(true);

    // Fetch fresh data from Supabase and merge carefully
    getUserData<GamificationData>(STORAGE_KEY).then((remoteData) => {
      if (remoteData && typeof remoteData === "object") {
        const remote = { ...DEFAULT_DATA, ...remoteData };
        setData((prev) => {
          const today = getToday();
          // If we already processed today's visit locally, keep our streak
          // but merge cumulative stats with max() so nothing is lost
          if (prev.lastVisitDate === today && remote.lastVisitDate !== today) {
            return {
              ...prev,
              totalXP: Math.max(prev.totalXP, remote.totalXP),
              totalWorkouts: Math.max(prev.totalWorkouts, remote.totalWorkouts),
              totalMealDaysFollowed: Math.max(prev.totalMealDaysFollowed, remote.totalMealDaysFollowed),
              longestStreak: Math.max(prev.longestStreak, remote.longestStreak),
              unlockedBadges: Array.from(new Set([...prev.unlockedBadges, ...remote.unlockedBadges])),
              challengesCompleted: Math.max(prev.challengesCompleted ?? 0, remote.challengesCompleted ?? 0),
              challengesWon: Math.max(prev.challengesWon ?? 0, remote.challengesWon ?? 0),
              referralsCount: Math.max(prev.referralsCount ?? 0, remote.referralsCount ?? 0),
            };
          }
          return remote;
        });
      }
    });
  }, [user]);

  // Persist whenever data changes
  useEffect(() => {
    if (isLoaded && userIdRef.current) {
      setUserStorageJSON(STORAGE_KEY, userIdRef.current, data);
      setUserData(STORAGE_KEY, data).catch(() => {});
    }
  }, [data, isLoaded]);

  // Check and update streak on load
  useEffect(() => {
    if (!isLoaded || !user) return;

    const today = getToday();
    const yesterday = getYesterday();

    // Already visited today
    if (data.lastVisitDate === today) {
      return;
    }

    setData((prev) => {
      let newStreak = prev.currentStreak;
      let newXP = prev.totalXP;
      const newVisitHistory = [...prev.visitHistory];

      // Calculate streak
      if (prev.lastVisitDate === yesterday) {
        // Consecutive day - increase streak
        newStreak = prev.currentStreak + 1;
      } else if (prev.lastVisitDate === null) {
        // First visit ever
        newStreak = 1;
      } else {
        // Streak broken
        newStreak = 1;
      }

      // Add daily login XP
      newXP += XP_REWARDS.dailyLogin;

      // Check streak bonuses
      if (newStreak === 7) {
        newXP += XP_REWARDS.streak7Bonus;
      } else if (newStreak === 30) {
        newXP += XP_REWARDS.streak30Bonus;
      }

      // Add to visit history
      if (!newVisitHistory.includes(today)) {
        newVisitHistory.push(today);
      }

      const newLongestStreak = Math.max(prev.longestStreak, newStreak);

      return {
        ...prev,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastVisitDate: today,
        totalXP: newXP,
        visitHistory: newVisitHistory,
        // Reset daily tasks for new day
        dailyTasksDate: today,
        completedTasks: ["daily_login"], // Auto-complete login task
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, data.lastVisitDate]);

  // Check for badge unlocks whenever data changes
  useEffect(() => {
    if (!isLoaded || !user) return;

    const badgesToCheck: BadgeId[] = [
      "first_step",
      "committed_7",
      "iron_will_30",
      "century_100",
      "first_workout",
      "fitness_guru_50",
      "nutrition_master",
      "challenge_completer",
      "challenge_winner",
      "referral_first",
    ];

    for (const badgeId of badgesToCheck) {
      if (!data.unlockedBadges.includes(badgeId)) {
        const shouldUnlock = checkBadgeUnlock(badgeId, data);
        if (shouldUnlock) {
          setData((prev) => ({
            ...prev,
            unlockedBadges: [...prev.unlockedBadges, badgeId],
            totalXP: prev.totalXP + (BADGES[badgeId]?.xpReward || 0),
          }));
          setNewlyUnlockedBadge(badgeId);
          break; // Only show one badge at a time
        }
      }
    }
  }, [isLoaded, user, data.currentStreak, data.totalWorkouts, data.totalMealDaysFollowed, data.visitHistory.length, data.challengesCompleted, data.challengesWon, data.referralsCount]);

  const clearNewBadge = useCallback(() => {
    setNewlyUnlockedBadge(null);
  }, []);

  const addXP = useCallback((amount: number) => {
    setData((prev) => ({
      ...prev,
      totalXP: prev.totalXP + amount,
    }));
  }, []);

  const completeTask = useCallback((taskId: DailyTaskId) => {
    const today = getToday();

    setData((prev) => {
      // Check if already completed
      if (prev.dailyTasksDate === today && prev.completedTasks.includes(taskId)) {
        return prev;
      }

      const newCompletedTasks =
        prev.dailyTasksDate === today
          ? [...prev.completedTasks, taskId]
          : [taskId];

      // Add XP for completing task
      let xpGain = 0;
      switch (taskId) {
        case "daily_login":
          xpGain = XP_REWARDS.dailyLogin;
          break;
        case "complete_workout":
          xpGain = XP_REWARDS.workoutComplete;
          break;
        case "follow_meal_plan":
          xpGain = XP_REWARDS.mealPlanFollow;
          break;
        case "drink_water":
        case "ask_bodypilot":
          xpGain = 5;
          break;
      }

      // Bonus for completing all tasks
      const allTasks: DailyTaskId[] = [
        "daily_login",
        "complete_workout",
        "follow_meal_plan",
        "drink_water",
        "ask_bodypilot",
      ];
      const willCompleteAll = allTasks.every(
        (t) => t === taskId || newCompletedTasks.includes(t)
      );
      if (willCompleteAll) {
        xpGain += 50; // All tasks bonus
      }

      return {
        ...prev,
        dailyTasksDate: today,
        completedTasks: newCompletedTasks,
        totalXP: prev.totalXP + xpGain,
      };
    });
  }, []);

  const isTaskCompleted = useCallback(
    (taskId: DailyTaskId) => {
      const today = getToday();
      return data.dailyTasksDate === today && data.completedTasks.includes(taskId);
    },
    [data.dailyTasksDate, data.completedTasks]
  );

  const completeWorkout = useCallback(() => {
    setData((prev) => ({
      ...prev,
      totalWorkouts: prev.totalWorkouts + 1,
      totalXP: prev.totalXP + XP_REWARDS.workoutComplete,
    }));
    completeTask("complete_workout");
  }, [completeTask]);

  const completeMealDay = useCallback(() => {
    setData((prev) => ({
      ...prev,
      totalMealDaysFollowed: prev.totalMealDaysFollowed + 1,
      totalXP: prev.totalXP + XP_REWARDS.mealPlanFollow,
    }));
    completeTask("follow_meal_plan");
  }, [completeTask]);

  // Computed values
  const level = calculateLevel(data.totalXP);
  const levelTitle = getLevelTitle(level);
  const xpForNextLevel = getXPForNextLevel(level);
  const currentLevelXP = getXPForNextLevel(level - 1);
  const xpProgress =
    xpForNextLevel > currentLevelXP
      ? Math.min(
          100,
          ((data.totalXP - currentLevelXP) / (xpForNextLevel - currentLevelXP)) * 100
        )
      : 100;

  const value: GamificationContextType = {
    data,
    isLoaded,
    currentStreak: data.currentStreak,
    longestStreak: data.longestStreak,
    visitHistory: data.visitHistory,
    totalXP: data.totalXP,
    level,
    levelTitle,
    xpForNextLevel,
    xpProgress,
    unlockedBadges: data.unlockedBadges,
    newlyUnlockedBadge,
    clearNewBadge,
    completedTasks: data.completedTasks,
    completeTask,
    isTaskCompleted,
    addXP,
    completeWorkout,
    completeMealDay,
    totalWorkouts: data.totalWorkouts,
    totalMealDaysFollowed: data.totalMealDaysFollowed,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error("useGamification must be used within a GamificationProvider");
  }
  return context;
}
