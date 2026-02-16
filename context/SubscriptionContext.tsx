"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { PLAN_LIMITS, type PlanType } from "@/lib/subscription/plans";

type PlanLimits = {
  dailyAiMessages: number;
  weeklyWorkoutCreation: number;
  weeklyMealCreation: number;
  advancedDiet: boolean;
  calendar: boolean;
  progressTracking: boolean;
};

export type AdBonusType = "ai_chat" | "workout" | "meal";

interface SubscriptionContextType {
  plan: PlanType;
  limits: PlanLimits;
  usage: {
    dailyAiMessages: number;
    weeklyWorkouts: number;
    weeklyMeals: number;
  };
  adBonuses: {
    ai: number;
    workout: number;
    meal: number;
  };
  canUseFeature: (feature: keyof PlanLimits) => boolean;
  remainingAiMessages: number;
  remainingWeeklyWorkouts: number;
  remainingWeeklyMeals: number;
  isPro: boolean;
  refreshUsage: () => Promise<void>;
  grantAdBonus: (type: AdBonusType) => Promise<boolean>;
  watchAdAvailable: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  plan: "free",
  limits: PLAN_LIMITS.free,
  usage: { dailyAiMessages: 0, weeklyWorkouts: 0, weeklyMeals: 0 },
  adBonuses: { ai: 0, workout: 0, meal: 0 },
  canUseFeature: () => true,
  remainingAiMessages: 3,
  remainingWeeklyWorkouts: 1,
  remainingWeeklyMeals: 1,
  isPro: false,
  refreshUsage: async () => {},
  grantAdBonus: async () => false,
  watchAdAvailable: true,
});

function getStartOfDay(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function getStartOfWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanType>("free");
  const [usage, setUsage] = useState({
    dailyAiMessages: 0,
    weeklyWorkouts: 0,
    weeklyMeals: 0,
  });
  const [adBonuses, setAdBonuses] = useState({
    ai: 0,
    workout: 0,
    meal: 0,
  });

  const supabase = createClient();

  // Fetch user's plan from profiles
  useEffect(() => {
    if (!user) {
      setPlan("free");
      return;
    }

    const fetchPlan = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();

      if (data?.plan) {
        setPlan(data.plan as PlanType);
      }
    };

    fetchPlan();
  }, [user, supabase]);

  // Fetch usage counts + ad bonus counts
  const refreshUsage = useCallback(async () => {
    if (!user) return;

    const todayStart = getStartOfDay();
    const weekStart = getStartOfWeek();

    // Fetch daily AI message count
    const { count: aiCount } = await supabase
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("action", "ai_chat")
      .gte("created_at", todayStart);

    // Fetch weekly workout creation count
    const { count: workoutCount } = await supabase
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("action", "create_workout")
      .gte("created_at", weekStart);

    // Fetch weekly meal creation count
    const { count: mealCount } = await supabase
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("action", "create_meal")
      .gte("created_at", weekStart);

    // Fetch ad bonus counts
    const { count: aiBonusCount } = await supabase
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("action", "ad_bonus_ai_chat")
      .gte("created_at", todayStart);

    const { count: workoutBonusCount } = await supabase
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("action", "ad_bonus_workout")
      .gte("created_at", weekStart);

    const { count: mealBonusCount } = await supabase
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("action", "ad_bonus_meal")
      .gte("created_at", weekStart);

    setUsage({
      dailyAiMessages: aiCount || 0,
      weeklyWorkouts: workoutCount || 0,
      weeklyMeals: mealCount || 0,
    });

    setAdBonuses({
      ai: aiBonusCount || 0,
      workout: workoutBonusCount || 0,
      meal: mealBonusCount || 0,
    });
  }, [user, supabase]);

  useEffect(() => {
    if (user) {
      refreshUsage();
    }
  }, [user, refreshUsage]);

  const limits = PLAN_LIMITS[plan] as PlanLimits;

  // Effective limits including ad bonuses
  const effectiveAiLimit = (limits.dailyAiMessages as number) + adBonuses.ai * 3;
  const effectiveWorkoutLimit = (limits.weeklyWorkoutCreation as number) + adBonuses.workout;
  const effectiveMealLimit = (limits.weeklyMealCreation as number) + adBonuses.meal;

  const canUseFeature = useCallback(
    (feature: keyof PlanLimits) => {
      const limit = limits[feature];
      if (typeof limit === "boolean") return limit;

      switch (feature) {
        case "dailyAiMessages":
          return usage.dailyAiMessages < effectiveAiLimit;
        case "weeklyWorkoutCreation":
          return usage.weeklyWorkouts < effectiveWorkoutLimit;
        case "weeklyMealCreation":
          return usage.weeklyMeals < effectiveMealLimit;
        default:
          return true;
      }
    },
    [limits, usage, effectiveAiLimit, effectiveWorkoutLimit, effectiveMealLimit]
  );

  const remainingAiMessages = Math.max(0, effectiveAiLimit - usage.dailyAiMessages);
  const remainingWeeklyWorkouts = Math.max(0, effectiveWorkoutLimit - usage.weeklyWorkouts);
  const remainingWeeklyMeals = Math.max(0, effectiveMealLimit - usage.weeklyMeals);

  const grantAdBonus = useCallback(
    async (type: AdBonusType): Promise<boolean> => {
      try {
        const res = await fetch("/api/ad-reward", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adType: type }),
        });
        if (res.ok) {
          await refreshUsage();
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [refreshUsage]
  );

  const watchAdAvailable = plan === "free";

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        limits,
        usage,
        adBonuses,
        canUseFeature,
        remainingAiMessages,
        remainingWeeklyWorkouts,
        remainingWeeklyMeals,
        isPro: plan === "pro",
        refreshUsage,
        grantAdBonus,
        watchAdAvailable,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
}
