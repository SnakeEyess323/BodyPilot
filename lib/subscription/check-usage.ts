import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS, type PlanType } from "./plans";

function getStartOfDay(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function getStartOfWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function getUserPlan(userId: string): Promise<PlanType> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  return (data?.plan as PlanType) || "free";
}

async function getAdBonusCount(
  userId: string,
  action: string,
  since: string
): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", action)
    .gte("created_at", since);

  return count || 0;
}

export async function checkDailyAiLimit(
  userId: string
): Promise<{ allowed: boolean; remaining: number; plan: PlanType }> {
  const plan = await getUserPlan(userId);
  const baseLimit = PLAN_LIMITS[plan].dailyAiMessages;

  if (baseLimit === Infinity) {
    return { allowed: true, remaining: Infinity, plan };
  }

  const supabase = createClient();
  const todayStart = getStartOfDay();

  // Count actual usage
  const { count } = await supabase
    .from("usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", "ai_chat")
    .gte("created_at", todayStart);

  // Count ad bonuses for today: each gives +3 messages
  const adBonusCount = await getAdBonusCount(userId, "ad_bonus_ai_chat", todayStart);
  const effectiveLimit = baseLimit + adBonusCount * 3;

  const used = count || 0;
  const remaining = Math.max(0, effectiveLimit - used);

  return { allowed: remaining > 0, remaining, plan };
}

export async function checkWeeklyWorkoutLimit(
  userId: string
): Promise<{ allowed: boolean; remaining: number; plan: PlanType }> {
  const plan = await getUserPlan(userId);
  const baseLimit = PLAN_LIMITS[plan].weeklyWorkoutCreation;

  if (baseLimit === Infinity) {
    return { allowed: true, remaining: Infinity, plan };
  }

  const supabase = createClient();
  const weekStart = getStartOfWeek();

  const { count } = await supabase
    .from("usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", "create_workout")
    .gte("created_at", weekStart);

  // Count ad bonuses for this week: each gives +1 workout
  const adBonusCount = await getAdBonusCount(userId, "ad_bonus_workout", weekStart);
  const effectiveLimit = baseLimit + adBonusCount;

  const used = count || 0;
  const remaining = Math.max(0, effectiveLimit - used);

  return { allowed: remaining > 0, remaining, plan };
}

export async function checkWeeklyMealLimit(
  userId: string
): Promise<{ allowed: boolean; remaining: number; plan: PlanType }> {
  const plan = await getUserPlan(userId);
  const baseLimit = PLAN_LIMITS[plan].weeklyMealCreation;

  if (baseLimit === Infinity) {
    return { allowed: true, remaining: Infinity, plan };
  }

  const supabase = createClient();
  const weekStart = getStartOfWeek();

  const { count } = await supabase
    .from("usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", "create_meal")
    .gte("created_at", weekStart);

  // Count ad bonuses for this week: each gives +1 meal
  const adBonusCount = await getAdBonusCount(userId, "ad_bonus_meal", weekStart);
  const effectiveLimit = baseLimit + adBonusCount;

  const used = count || 0;
  const remaining = Math.max(0, effectiveLimit - used);

  return { allowed: remaining > 0, remaining, plan };
}

export async function logUsage(
  userId: string,
  action: string
): Promise<void> {
  const supabase = createClient();
  await supabase.from("usage_logs").insert({
    user_id: userId,
    action,
  });
}
